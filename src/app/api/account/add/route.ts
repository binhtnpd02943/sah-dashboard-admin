import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from "@/lib/sah-api";

type AccountBody = {
  phoneNumber?: unknown;
  password?: unknown;
  platform?: unknown;
  workerUrl?: unknown;
};

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonResponse({ success: false, message: "Thiếu Bearer token." }, { status: 401 });
  }

  let body: AccountBody;

  try {
    body = (await request.json()) as AccountBody;
  } catch {
    return jsonResponse({ success: false, message: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const phoneNumber = String(body.phoneNumber || "").trim();
  const password = String(body.password || "");
  const platform = String(body.platform || "ios").trim().toLowerCase();

  if (!phoneNumber || !password) {
    return jsonResponse(
      { success: false, message: "Số điện thoại và mật khẩu là bắt buộc." },
      { status: 400 },
    );
  }

  if (!["ios", "android"].includes(platform)) {
    return jsonResponse(
      { success: false, message: "Platform chỉ hỗ trợ ios hoặc android." },
      { status: 400 },
    );
  }

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ""));
    const result = await postJson(
      `${workerBase}/account/add`,
      { phoneNumber, password, platform },
      token,
    );

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
