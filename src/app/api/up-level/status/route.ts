import {
  getBearerToken,
  jsonResponse,
  normalizeWorkerApiBase,
  postJson,
  upstreamStatus,
} from '@/lib/sah-api';

type StatusBody = {
  workerUrl?: unknown;
};

// worker status endpoint (the one you provided)
const UP_LEVEL_STATUS_PATH = '/features/up-level/status';

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonResponse(
      { success: false, message: 'Thiếu Bearer token.' },
      { status: 401 },
    );
  }

  let body: StatusBody;
  try {
    body = (await request.json()) as StatusBody;
  } catch {
    body = {};
  }

  // Reuse the same workerUrl normalization logic as other routes.
  const workerBase = normalizeWorkerApiBase(String(body.workerUrl || ''));

  try {
    // normalizeWorkerApiBase returns something ending with /api/features
    // so we must strip the prefix and call the correct path.
    // workerBase example: https://worker4-2.tool-sah.pro.vn/api/features
    const url = `${workerBase}${UP_LEVEL_STATUS_PATH.replace(/^\/features/, '')}`;

    // The worker might accept GET only. If it doesn't, fallback to POST.
    // Our proxy uses fetch, so we try GET first.
    const getResp = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    const text = await getResp.text();
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!getResp.ok) {
      // fallback to POST
      const postResult = await postJson(url, {}, token);
      return jsonResponse(
        {
          success: postResult.ok,
          status: postResult.status,
          data: postResult.data,
        },
        { status: upstreamStatus(postResult) },
      );
    }

    return jsonResponse(
      {
        success: true,
        status: getResp.status,
        data,
      },
      { status: getResp.status },
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Không gọi được Worker status API.',
      },
      { status: 502 },
    );
  }
}
