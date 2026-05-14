import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  upstreamStatus,
} from "@/lib/sah-api";

type LogsHistoryBody = {
  featureName?: unknown;
  limit?: unknown;
  workerUrl?: unknown;
};

async function readUpstreamBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonResponse({ success: false, message: "Thiếu Bearer token." }, { status: 401 });
  }

  let body: LogsHistoryBody;

  try {
    body = (await request.json()) as LogsHistoryBody;
  } catch {
    return jsonResponse({ success: false, message: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const featureName = String(body.featureName || "up-level").trim();
  const limit = Math.min(Math.max(Number(body.limit) || 300, 1), 500);

  if (!/^[a-z0-9-]+$/i.test(featureName)) {
    return jsonResponse({ success: false, message: "Feature name không hợp lệ." }, { status: 400 });
  }

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ""));
    const response = await fetch(
      `${workerBase}/${featureName}/log-history?limit=${encodeURIComponent(limit)}`,
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );
    const result = {
      ok: response.ok,
      status: response.status,
      data: await readUpstreamBody(response),
    };

    return jsonResponse(
      { success: result.ok, status: result.status, data: result.data },
      { status: upstreamStatus(result) },
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Không tải được log history.",
      },
      { status: 502 },
    );
  }
}
