import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from '@/lib/sah-api';

type StopBody = {
  workerUrl?: unknown;
};

const UP_LEVEL_STOP_PATH = '/features/up-level/stop';

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonResponse(
      { success: false, message: 'Thiếu Bearer token.' },
      { status: 401 },
    );
  }

  let body: StopBody;
  try {
    body = (await request.json()) as StopBody;
  } catch {
    body = {};
  }

  try {
    const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ''));
    // workerBase: https://worker4-2.tool-sah.pro.vn/api/features
    const url = `${workerBase}${UP_LEVEL_STOP_PATH.replace(/^\/features/, '')}`;

    const result = await postJson(url, {}, token);

    return jsonResponse(
      {
        success: result.ok,
        status: result.status,
        data: result.data,
      },
      { status: upstreamStatus(result) },
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Không gọi được Worker stop API.',
      },
      { status: 502 },
    );
  }
}
