import { createRemoteJWKSet, jwtVerify } from "jose";

function ensureEnv() {
  if (
    !process.env.IMAGEKIT_PRIVATE_KEY ||
    (!process.env.NEON_AUTH_URL && !process.env.VITE_NEON_AUTH_URL) ||
    (!process.env.NEON_DATA_API_URL && !process.env.VITE_NEON_DATA_API_URL)
  ) {
    if (typeof process.loadEnvFile === "function") {
      const candidates = [
        ".env.local",
        ".env",
        ".vercel/.env.development.local",
      ];
      for (const file of candidates) {
        try {
          process.loadEnvFile(file);
        } catch {
          // File not present or already loaded; continue
        }
      }
    }
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksUrl: string | undefined;

function getJwks(authUrl: string) {
  const targetUrl = `${authUrl}/.well-known/jwks.json`;
  if (!jwks || jwksUrl !== targetUrl) {
    jwksUrl = targetUrl;
    jwks = createRemoteJWKSet(new URL(targetUrl));
  }
  return jwks;
}

async function verifyAuth(token: string, authUrl: string): Promise<string> {
  if (!token || token.length > 8192) {
    throw new Error("INVALID_TOKEN");
  }

  let authOrigin: string;
  try {
    authOrigin = new URL(authUrl).origin;
  } catch {
    authOrigin = authUrl;
  }

  const allowedIssuers = Array.from(
    new Set([authOrigin, `${authOrigin}/`, authUrl, `${authUrl}/`]),
  );

  const { payload } = await jwtVerify(token, getJwks(authUrl), {
    issuer: allowedIssuers,
    algorithms: ["EdDSA"],
  });

  if (
    typeof payload.sub !== "string" ||
    !payload.sub.trim() ||
    payload.sub === "anonymous" ||
    payload.role === "anonymous"
  ) {
    throw new Error("UNAUTHORIZED_ANONYMOUS");
  }

  return payload.sub;
}

function isValidFileId(fileId: unknown): fileId is string {
  if (typeof fileId !== "string") return false;
  const trimmed = fileId.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(trimmed)
  );
}

interface ShowRecord {
  id: string;
  user_id: string;
  poster_file_id: string | null;
  backdrop_file_id: string | null;
}

async function deleteFromImageKit(
  fileId: string,
  privateKey: string,
): Promise<{ fileId: string; status: "deleted" | "not_found" }> {
  const encodedAuth = Buffer.from(`${privateKey}:`).toString("base64");
  const response = await fetch(
    `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${encodedAuth}`,
      },
    },
  );

  if (response.status === 204 || response.status === 200) {
    return { fileId, status: "deleted" };
  }

  if (response.status === 404) {
    return { fileId, status: "not_found" };
  }

  let responseBody = "";
  try {
    responseBody = await response.text();
  } catch {
    // ignore
  }

  console.error(
    `[api/imagekit-delete] ImageKit delete failed for fileId ${fileId}: HTTP ${response.status} - ${responseBody}`,
  );
  throw new Error(`ImageKit API returned HTTP ${response.status}`);
}

/**
 * Executes trusted check_file_in_use RPC in PostgreSQL via Neon Data API.
 * Uses SECURITY DEFINER to check across all shows, ignoring user RLS restrictions.
 * Fail-safe: returns true (assumes in-use) on any network or execution failure.
 */
async function checkFileInUseRpc(
  dataApiUrl: string,
  token: string,
  fileId: string,
  excludeShowId: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${dataApiUrl}/rpc/check_file_in_use`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        target_file_id: fileId,
        exclude_show_id: excludeShowId,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[api/imagekit-delete] check_file_in_use RPC returned HTTP ${response.status} for fileId "${fileId}". Failing safe (skipping delete).`,
      );
      return true; // Fail-safe
    }

    const inUse: unknown = await response.json();

    if (typeof inUse !== "boolean") {
      console.warn(
        "[api/imagekit-delete] Invalid RPC response. Failing safe (skipping delete).",
      );
      return true;
    }

    return inUse;
  } catch (err) {
    console.warn(
      `[api/imagekit-delete] check_file_in_use exception for fileId "${fileId}":`,
      err,
    );
    return true; // Fail-safe
  }
}

async function handleDeleteRequest(request: Request) {
  ensureEnv();

  const authUrl = (
    process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL
  )?.replace(/\/+$/, "");
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const dataApiUrl = (
    process.env.NEON_DATA_API_URL || process.env.VITE_NEON_DATA_API_URL
  )?.replace(/\/+$/, "");

  if (!authUrl || !privateKey || !dataApiUrl) {
    console.error("ImageKit delete configuration missing:", {
      hasAuthUrl: Boolean(authUrl),
      hasPrivateKey: Boolean(privateKey),
      hasDataApiUrl: Boolean(dataApiUrl),
    });
    return Response.json(
      { error: "Server configuration error" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json(
      { error: "Unauthorized: valid authenticated session required" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const token = authorization.slice(7).trim();
  let userId: string;
  try {
    userId = await verifyAuth(token, authUrl);
  } catch (authErr) {
    const message = authErr instanceof Error ? authErr.message : "UNAUTHORIZED";
    console.error("ImageKit delete auth error:", message);
    return Response.json(
      { error: "Unauthorized: valid authenticated session required" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  let body: { showId?: unknown; fileId?: unknown; fileIds?: unknown };
  try {
    const rawBody: unknown = await request.json();
    body =
      rawBody && typeof rawBody === "object"
        ? (rawBody as { showId?: unknown; fileId?: unknown; fileIds?: unknown })
        : {};
  } catch {
    return Response.json(
      {
        error:
          "Invalid JSON body. Expected { showId: string, fileId?: string }.",
      },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const showId = typeof body.showId === "string" ? body.showId.trim() : "";
  if (!showId) {
    return Response.json(
      {
        error:
          "Missing required parameter: showId. Deletion requires verified show ownership.",
      },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  let show: ShowRecord | null = null;
  try {
    const showResponse = await fetch(
      `${dataApiUrl}/shows?id=eq.${encodeURIComponent(showId)}&select=id,user_id,poster_file_id,backdrop_file_id`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );

    if (!showResponse.ok) {
      console.error(
        `[api/imagekit-delete] Data API returned HTTP ${showResponse.status}`,
      );
      return Response.json(
        { error: "Failed to verify show ownership" },
        {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const records = (await showResponse.json()) as ShowRecord[];
    if (Array.isArray(records) && records.length > 0) {
      show = records[0];
    }
  } catch (err) {
    console.error("[api/imagekit-delete] Error querying Neon Data API:", err);
    return Response.json(
      { error: "Internal server error during authorization verification" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  if (!show) {
    return Response.json(
      { error: "Show not found" },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  if (show.user_id !== userId) {
    return Response.json(
      { error: "Forbidden: user does not own this show" },
      {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const authorizedFileIds = new Set<string>();
  if (show.poster_file_id) authorizedFileIds.add(show.poster_file_id);
  if (show.backdrop_file_id) authorizedFileIds.add(show.backdrop_file_id);

  const rawFileIds: unknown[] = [];
  if (body.fileId) {
    rawFileIds.push(body.fileId);
  }
  if (Array.isArray(body.fileIds)) {
    rawFileIds.push(...body.fileIds);
  }

  let fileIdsToProcess: string[] = [];
  if (rawFileIds.length === 0) {
    fileIdsToProcess = Array.from(authorizedFileIds);
  } else {
    for (const rawId of rawFileIds) {
      if (typeof rawId !== "string" || !rawId.trim()) continue;
      const id = rawId.trim();
      if (!authorizedFileIds.has(id)) {
        return Response.json(
          {
            error:
              "Forbidden: requested file does not belong to the specified show",
          },
          {
            status: 403,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }
      fileIdsToProcess.push(id);
    }
  }

  if (fileIdsToProcess.length === 0) {
    return Response.json(
      { success: true, deleted: [] },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  for (const id of fileIdsToProcess) {
    if (!isValidFileId(id)) {
      return Response.json(
        {
          error: `Invalid fileId format: "${id}". Must be non-empty alphanumeric.`,
        },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  }

  const results: { fileId: string; status: "deleted" | "not_found" }[] = [];
  const skipped: { fileId: string; status: "skipped"; reason: "in_use" }[] = [];
  const errors: { fileId: string; error: string }[] = [];

  for (const fileId of fileIdsToProcess) {
    // Trusted server-side reference check via SECURITY DEFINER RPC
    const inUse = await checkFileInUseRpc(dataApiUrl, token, fileId, showId);
    if (inUse) {
      skipped.push({ fileId, status: "skipped", reason: "in_use" });
      continue;
    }

    try {
      const result = await deleteFromImageKit(fileId, privateKey);
      results.push(result);
    } catch (err) {
      errors.push({
        fileId,
        error: err instanceof Error ? err.message : "Unknown delete error",
      });
    }
  }

  if (errors.length > 0 && results.length === 0 && skipped.length === 0) {
    return Response.json(
      {
        success: false,
        error: "Failed to delete image(s) from ImageKit",
        details: errors,
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return Response.json(
    {
      success: true,
      deleted: results,
      skipped: skipped.length > 0 ? skipped : undefined,
      errors: errors.length > 0 ? errors : undefined,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: Request) {
  return handleDeleteRequest(request);
}

export async function DELETE(request: Request) {
  return handleDeleteRequest(request);
}

export function GET() {
  return Response.json(
    { error: "Method not allowed. Use POST or DELETE." },
    {
      status: 405,
      headers: {
        Allow: "POST, DELETE",
        "Cache-Control": "no-store",
      },
    },
  );
}
