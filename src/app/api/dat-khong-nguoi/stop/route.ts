import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from "@/lib/sah-api";

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonResponse({ success: false, message: "Thiếu Bearer token." }, { status: 401 });
  }

  let body: { workerUrl?: unknown } = {};

  try {
    body = (await request.json()) as { workerUrl?: unknown };
  } catch {
    // allow empty body
  }

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ""));
    const result = await postJson(`${workerBase}/dat-khong-nguoi/stop`, {}, token);

    return jsonResponse(
      { success: result.ok, status: result.status, data: result.data },
      { status: upstreamStatus(result) },
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Không gọi được Worker API.",
      },
      { status: 502 },
    );
  }
}
