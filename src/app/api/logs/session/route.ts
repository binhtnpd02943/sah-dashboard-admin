import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from "@/lib/sah-api";

type LogsSessionBody = {
  workerUrl?: unknown;
};

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonResponse({ success: false, message: "Thiếu Bearer token." }, { status: 401 });
  }

  let body: LogsSessionBody = {};

  try {
    body = (await request.json()) as LogsSessionBody;
  } catch {
    body = {};
  }

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ""));
    const result = await postJson(`${workerBase}/logs/session`, {}, token);

    return jsonResponse(
      { success: result.ok, status: result.status, data: result.data },
      { status: upstreamStatus(result) },
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Không tạo được logs session.",
      },
      { status: 502 },
    );
  }
}
