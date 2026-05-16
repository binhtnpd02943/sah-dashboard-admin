import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from "@/lib/sah-api";

type DatKhongNguoiBody = {
  configIds?: unknown;
  delay?: unknown;
  concurrency?: unknown;
  loaiHatGiong?: unknown;
  tromNroMode?: unknown;
  autoCanBinh?: unknown;
  mode?: unknown;
  logFull?: unknown;
  proxyMode?: unknown;
  forceStart?: unknown;
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

  let body: DatKhongNguoiBody;

  try {
    body = (await request.json()) as DatKhongNguoiBody;
  } catch {
    return jsonResponse({ success: false, message: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const configIds = normalizeConfigIds(body.configIds);

  if (configIds.length === 0) {
    return jsonResponse(
      { success: false, message: "Cần ít nhất một configId để chạy Đất Không Người." },
      { status: 400 },
    );
  }

  const rawMode = String(body.mode ?? "trom").trim().toLowerCase();
  const mode = rawMode === "trong" ? "trong" : "trom";

  const payload = {
    configIds,
    delay: normalizePositiveNumber(body.delay, 1400),
    concurrency: normalizePositiveNumber(body.concurrency, 3),
    loaiHatGiong: String(body.loaiHatGiong ?? "39").trim(),
    tromNroMode: String(body.tromNroMode ?? "false"),
    autoCanBinh: String(body.autoCanBinh ?? "true"),
    mode,
    logFull: body.logFull !== false,
    proxyMode: String(body.proxyMode || "off").trim().toLowerCase(),
    forceStart: Boolean(body.forceStart),
  };

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ""));
    const result = await postJson(`${workerBase}/dat-khong-nguoi/start`, payload, token);

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
