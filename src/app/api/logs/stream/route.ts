import { jsonResponse, normalizeWorkerApiBase } from "@/lib/sah-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim() || "";
  const streamToken = url.searchParams.get("streamToken")?.trim() || "";
  const workerUrl = url.searchParams.get("workerUrl")?.trim() || "";

  if (!userId || !streamToken) {
    return jsonResponse(
      { success: false, message: "Thiếu userId hoặc streamToken." },
      { status: 400 },
    );
  }

  try {
    const workerBase = normalizeWorkerApiBase(workerUrl);
    const upstream = await fetch(
      `${workerBase.replace(/\/api\/features$/i, "")}/api/features/logs?userId=${encodeURIComponent(
        userId,
      )}&streamToken=${encodeURIComponent(streamToken)}`,
      {
        headers: {
          Accept: "text/event-stream",
        },
        cache: "no-store",
      },
    );

    if (!upstream.ok || !upstream.body) {
      return jsonResponse(
        { success: false, message: "Không mở được SSE từ worker.", status: upstream.status },
        { status: upstream.status || 502 },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Không mở được log stream.",
      },
      { status: 502 },
    );
  }
}
