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

interface ClaimedItem {
  queue_id: string;
  target_file_id: string;
  assigned_token: string;
}

async function deleteFromImageKit(
  fileId: string,
  privateKey: string,
): Promise<{ status: "deleted" | "not_found" }> {
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
    return { status: "deleted" };
  }

  if (response.status === 404) {
    // Idempotent success: file already removed from ImageKit
    return { status: "not_found" };
  }

  let responseBody = "";
  try {
    responseBody = await response.text();
  } catch {
    // ignore
  }

  throw new Error(`ImageKit API returned HTTP ${response.status}: ${responseBody.slice(0, 200)}`);
}

/**
 * Execute direct SQL over Neon Serverless SQL HTTP Proxy.
 * Used exclusively for server-side background/cron jobs with DATABASE_URL.
 */
async function executeServerSql<T = unknown>(
  dbUrl: string,
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  const url = new URL(dbUrl);
  const sqlEndpoint = `https://${url.hostname}/sql`;

  const response = await fetch(sqlEndpoint, {
    method: "POST",
    headers: {
      "neon-connection-string": dbUrl,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, params }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Neon SQL error HTTP ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const result = (await response.json()) as { rows?: T[] } | T[];
  if (Array.isArray(result)) {
    return result;
  }
  return result.rows || [];
}

export async function POST(request: Request) {
  ensureEnv();

  const authUrl = (
    process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL
  )?.replace(/\/+$/, "");
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const dataApiUrl = (
    process.env.NEON_DATA_API_URL || process.env.VITE_NEON_DATA_API_URL
  )?.replace(/\/+$/, "");
  const cronSecret = process.env.CRON_SECRET;

  if (!authUrl || !privateKey) {
    return Response.json(
      { error: "Server configuration missing (authUrl or privateKey)" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json(
      { error: "Unauthorized: authentication token required" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = authorization.slice(7).trim();

  // Validate authentication: either verified server CRON_SECRET or valid user JWT
  const isCron = Boolean(cronSecret && token === cronSecret);
  let userId: string | null = null;

  if (!isCron) {
    try {
      userId = await verifyAuth(token, authUrl);
    } catch {
      return Response.json(
        { error: "Unauthorized: invalid session or token" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  // BRANCH A: Vercel Cron Background Execution (Cross-User)
  if (isCron) {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) {
      console.error("[api/imagekit-cleanup] Cron invoked but DATABASE_URL/POSTGRES_URL is not configured.");
      return Response.json(
        {
          error: "DATABASE_URL or POSTGRES_URL is required for cross-user Cron execution",
          mode: "cron",
          details: "Neon Data API cannot be used with CRON_SECRET because Data API requires user-scoped JWTs. Configure DATABASE_URL in server environment variables to enable cross-user cron processing.",
        },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    let claimedItems: ClaimedItem[];
    try {
      claimedItems = await executeServerSql<ClaimedItem>(
        dbUrl,
        "SELECT * FROM public.claim_cleanup_queue_items_admin($1, $2)",
        [10, 60],
      );
    } catch (err) {
      console.error("[api/imagekit-cleanup] Failed to claim items via server SQL:", err);
      return Response.json(
        {
          error: "Failed to claim cleanup items via server SQL",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!Array.isArray(claimedItems) || claimedItems.length === 0) {
      return Response.json(
        { success: true, mode: "cron", processed: 0, items: [] },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    const results: Array<{
      queueId: string;
      fileId: string;
      status: "processed" | "failed";
      action: "deleted" | "not_found" | "error";
      error?: string;
    }> = [];

    for (const item of claimedItems) {
      let success: boolean;
      let action: "deleted" | "not_found" | "error";
      let errorMsg: string | undefined;

      try {
        const ikResult = await deleteFromImageKit(item.target_file_id, privateKey);
        action = ikResult.status;
        success = true;
      } catch (err) {
        action = "error";
        success = false;
        errorMsg = err instanceof Error ? err.message : "Unknown error deleting image";
        console.error(`[api/imagekit-cleanup] Error deleting file ${item.target_file_id}:`, errorMsg);
      }

      // Finalize item in PostgreSQL via Server SQL admin function
      try {
        await executeServerSql(
          dbUrl,
          "SELECT public.finalize_cleanup_item_admin($1, $2, $3, $4)",
          [item.queue_id, item.assigned_token, success, errorMsg || null],
        );
      } catch (err) {
        console.error(`[api/imagekit-cleanup] Failed to finalize item ${item.queue_id} via server SQL:`, err);
      }

      results.push({
        queueId: item.queue_id,
        fileId: item.target_file_id,
        status: success ? "processed" : "failed",
        action,
        error: errorMsg,
      });
    }

    return Response.json(
      {
        success: true,
        mode: "cron",
        processed: results.length,
        results,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  // BRANCH B: Opportunistic User Execution (Scoped to caller's own items via Data API)
  if (!dataApiUrl) {
    return Response.json(
      { error: "Server configuration missing (dataApiUrl)" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  let claimedItems: ClaimedItem[];
  try {
    const claimRes = await fetch(`${dataApiUrl}/rpc/claim_cleanup_queue_items`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Verified user JWT
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        batch_size: 10,
        lease_seconds: 60,
      }),
    });

    if (!claimRes.ok) {
      const errText = await claimRes.text();
      console.error("[api/imagekit-cleanup] claim RPC error:", claimRes.status, errText);
      return Response.json(
        { error: "Failed to claim cleanup items", details: errText },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    claimedItems = (await claimRes.json()) as ClaimedItem[];
  } catch (err) {
    console.error("[api/imagekit-cleanup] Failed to connect to Data API claim RPC:", err);
    return Response.json(
      { error: "Internal error claiming cleanup queue" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!Array.isArray(claimedItems) || claimedItems.length === 0) {
    return Response.json(
      { success: true, mode: "user", userId, processed: 0, items: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  const results: Array<{
    queueId: string;
    fileId: string;
    status: "processed" | "failed";
    action: "deleted" | "not_found" | "error";
    error?: string;
  }> = [];

  for (const item of claimedItems) {
    let success: boolean;
    let action: "deleted" | "not_found" | "error";
    let errorMsg: string | undefined;

    try {
      const ikResult = await deleteFromImageKit(item.target_file_id, privateKey);
      action = ikResult.status;
      success = true;
    } catch (err) {
      action = "error";
      success = false;
      errorMsg = err instanceof Error ? err.message : "Unknown error deleting image";
      console.error(`[api/imagekit-cleanup] Error deleting file ${item.target_file_id}:`, errorMsg);
    }

    // Atomically finalize the item status in PostgreSQL via user RPC
    try {
      const finalizeRes = await fetch(`${dataApiUrl}/rpc/finalize_cleanup_item`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Verified user JWT
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          p_queue_id: item.queue_id,
          p_claim_token: item.assigned_token,
          p_success: success,
          p_error: errorMsg || null,
        }),
      });

      if (!finalizeRes.ok) {
        console.warn(`[api/imagekit-cleanup] Finalize RPC HTTP ${finalizeRes.status} for queue item ${item.queue_id}`);
      }
    } catch (err) {
      console.error(`[api/imagekit-cleanup] Failed to finalize item ${item.queue_id}:`, err);
    }

    results.push({
      queueId: item.queue_id,
      fileId: item.target_file_id,
      status: success ? "processed" : "failed",
      action,
      error: errorMsg,
    });
  }

  return Response.json(
    {
      success: true,
      mode: "user",
      userId,
      processed: results.length,
      results,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function GET(request: Request) {
  // Support Vercel Cron invocation via GET or manual health check
  return POST(request);
}
