import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from "@/lib/sah-api";

type UpLevelBody = {
  configIds?: unknown;
  delay?: unknown;
  type?: unknown;
  concurrency?: unknown;
  autoBuyStamina?: unknown;
  autoDeleteTrash?: unknown;
  logFull?: unknown;
  proxyMode?: unknown;
  workerUrl?: unknown;
};

function normalizeConfigIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePositiveNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonResponse({ success: false, message: "Thiếu Bearer token." }, { status: 401 });
  }

  let body: UpLevelBody;

  try {
    body = (await request.json()) as UpLevelBody;
  } catch {
    return jsonResponse({ success: false, message: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const configIds = normalizeConfigIds(body.configIds);

  if (configIds.length === 0) {
    return jsonResponse(
      { success: false, message: "Cần ít nhất một configId để chạy up-level." },
      { status: 400 },
    );
  }

  const payload = {
    configIds,
    delay: normalizePositiveNumber(body.delay, 1111),
    type: normalizePositiveNumber(body.type, 2),
    concurrency: normalizePositiveNumber(body.concurrency, 3),
    autoBuyStamina: Boolean(body.autoBuyStamina),
    autoDeleteTrash: Boolean(body.autoDeleteTrash),
    logFull: body.logFull !== false,
    proxyMode: String(body.proxyMode || "off").trim().toLowerCase(),
  };

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ""));
    const result = await postJson(`${workerBase}/up-level/start`, payload, token);

    return jsonResponse(
      { success: result.ok, status: result.status, data: result.data, payload },
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
