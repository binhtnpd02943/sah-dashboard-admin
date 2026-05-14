const DEFAULT_AUTH_API = "https://root.tool-sah.pro.vn/api";
const DEFAULT_WORKER_API = "https://worker4-2.tool-sah.pro.vn/api/features";

type JsonRecord = Record<string, unknown>;

export type UpstreamResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function ensureApiSuffix(value: string, suffix: string) {
  const base = trimTrailingSlash(value.trim());
  return base.endsWith(suffix) ? base : `${base}${suffix}`;
}

function parseAllowedWorkerHosts() {
  const raw = process.env.SAH_ALLOWED_WORKER_HOSTS || "";
  return raw
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export function getAuthApiBase() {
  return trimTrailingSlash(process.env.SAH_AUTH_API_BASE || DEFAULT_AUTH_API);
}

export function getDefaultWorkerApiBase() {
  return trimTrailingSlash(
    process.env.SAH_WORKER_API_BASE || DEFAULT_WORKER_API,
  );
}

export function normalizeWorkerApiBase(workerUrl?: string) {
  const requestedUrl = String(workerUrl || "").trim();
  const target = requestedUrl
    ? ensureApiSuffix(requestedUrl, "/api/features")
    : getDefaultWorkerApiBase();

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error("Worker URL không hợp lệ.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Worker URL chỉ hỗ trợ http hoặc https.");
  }

  const host = parsed.hostname.toLowerCase();
  const allowedHosts = parseAllowedWorkerHosts();
  const isToolSahHost =
    host === "tool-sah.pro.vn" || host.endsWith(".tool-sah.pro.vn");
  const isExplicitlyAllowed = allowedHosts.includes(host);

  if (!isToolSahHost && !isExplicitlyAllowed) {
    throw new Error(
      "Worker host chưa được cho phép. Thêm host vào SAH_ALLOWED_WORKER_HOSTS nếu cần.",
    );
  }

  return trimTrailingSlash(parsed.toString());
}

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function jsonResponse(
  payload: JsonRecord,
  init: ResponseInit = {},
) {
  return Response.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

async function readUpstreamBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export async function postJson(
  url: string,
  body: unknown,
  token?: string,
): Promise<UpstreamResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000), // 60s timeout
    });

    return {
      ok: response.ok,
      status: response.status,
      data: await readUpstreamBody(response),
    };
  } catch (error) {
    console.error(`[API Error] Failed to fetch ${url}:`, error);
    return {
      ok: false,
      status: 502,
      data: { message: error instanceof Error ? error.message : "Connection failed" },
    };
  }
}

export function upstreamStatus(result: UpstreamResult) {
  return result.ok ? 200 : result.status || 502;
}
