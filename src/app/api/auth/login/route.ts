import { getAuthApiBase, jsonResponse, postJson, upstreamStatus } from "@/lib/sah-api";

type LoginBody = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return jsonResponse({ success: false, message: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return jsonResponse(
      { success: false, message: "Username và mật khẩu là bắt buộc." },
      { status: 400 },
    );
  }

  try {
    const result = await postJson(`${getAuthApiBase()}/auth/login`, {
      username,
      password,
    });

    return jsonResponse(
      { success: result.ok, status: result.status, data: result.data },
      { status: upstreamStatus(result) },
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Không gọi được Auth API.",
      },
      { status: 502 },
    );
  }
}
