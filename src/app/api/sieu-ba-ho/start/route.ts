import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from "@/lib/sah-api";

type SieuBaHoBody = {
  configIds?: unknown;
  delay?: unknown;
  concurrency?: unknown;
  maxAuto?: unknown;
  buyItems?: unknown;
  runMode?: unknown;
  buyShopIndex?: unknown;
  buyShopSlot?: unknown;
  buyQuantity?: unknown;
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

  let body: SieuBaHoBody;

  try {
    body = (await request.json()) as SieuBaHoBody;
  } catch {
    return jsonResponse({ success: false, message: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const configIds = normalizeConfigIds(body.configIds);

  if (configIds.length === 0) {
    return jsonResponse(
      { success: false, message: "Cần ít nhất một configId để chạy Siêu Bá Hộ." },
      { status: 400 },
    );
  }

  const payload = {
    configIds,
    delay: normalizePositiveNumber(body.delay, 1000),
    concurrency: normalizePositiveNumber(body.concurrency, 3),
    maxAuto: normalizePositiveNumber(body.maxAuto, 3),
    buyItems: Boolean(body.buyItems),
    runMode: ["play", "auto"].includes(String(body.runMode)) ? String(body.runMode) : "play",
    buyShopIndex: String(body.buyShopIndex ?? "").trim(),
    buyShopSlot: String(body.buyShopSlot ?? "").trim(),
    buyQuantity: normalizePositiveNumber(body.buyQuantity, 1),
    logFull: body.logFull !== false,
    proxyMode: String(body.proxyMode || "off").trim().toLowerCase(),
  };

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ""));
    const result = await postJson(`${workerBase}/sieu-ba-ho/start`, payload, token);

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
