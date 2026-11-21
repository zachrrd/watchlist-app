import { createHmac, randomUUID } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

function ensureEnv() {
  if (
    !process.env.IMAGEKIT_PRIVATE_KEY ||
    (!process.env.NEON_AUTH_URL && !process.env.VITE_NEON_AUTH_URL)
  ) {
    if (typeof process.loadEnvFile === "function") {
      const candidates = [".env.local", ".env", ".vercel/.env.development.local"];
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

export async function POST(request: Request) {
  ensureEnv();

  const authUrl = (
    process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL
  )?.replace(/\/+$/, "");
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY || process.env.VITE_IMAGEKIT_PUBLIC_KEY;

  if (!authUrl || !privateKey || !publicKey) {
    console.error("ImageKit configuration missing:", {
      hasAuthUrl: Boolean(authUrl),
      hasPrivateKey: Boolean(privateKey),
      hasPublicKey: Boolean(publicKey),
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
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const token = authorization.slice(7).trim();

  if (!token || token.length > 8192) {
    return Response.json(
      { error: "Invalid token" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  try {
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
      return Response.json(
        { error: "Unauthorized: authenticated user session required" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  } catch (err) {
    console.error(
      "JWT verification failed:",
      err instanceof Error ? err.message : "Unknown verification error",
    );
    return Response.json(
      { error: "Invalid or expired session" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const uploadToken = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800;

  const signature = createHmac("sha1", privateKey)
    .update(uploadToken + expire)
    .digest("hex");

  return Response.json(
    {
      token: uploadToken,
      expire,
      signature,
      publicKey,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export function GET() {
  return Response.json(
    { error: "Method not allowed. Use POST." },
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Cache-Control": "no-store",
      },
    },
  );
}

export function PUT() {
  return GET();
}

export function DELETE() {
  return GET();
}

export function PATCH() {
  return GET();
}
