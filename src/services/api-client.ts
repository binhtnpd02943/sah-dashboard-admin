import { ApiEnvelope, LogItem, LogKind } from '@/types/dashboard';

export async function callInternalApi(
  path: string,
  body: Record<string, unknown>,
  token?: string,
) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as ApiEnvelope) : {};

  return { ok: response.ok, status: response.status, data };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatTime(value: unknown) {
  const date = new Date(String(value || new Date().toISOString()));
  return Number.isNaN(date.getTime())
    ? new Date().toLocaleTimeString('vi-VN', { hour12: false })
    : date.toLocaleTimeString('vi-VN', { hour12: false });
}

export function collectLogPayloads(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  for (const key of ['logs', 'lines', 'data', 'result']) {
    const nested = value[key];
    const logs = collectLogPayloads(nested);
    if (logs.length) return logs;
  }

  return [];
}

export function inferLogKind(value: Record<string, unknown>): LogKind {
  const rawKind = String(
    value.kind || value.type || value.level || '',
  ).toLowerCase();
  if (['start', 'step', 'success', 'error', 'stop'].includes(rawKind)) {
    return rawKind as LogKind;
  }

  const message = String(value.msg || value.message || '').toLowerCase();
  if (message.includes('khoi dong') || message.includes('khởi động'))
    return 'start';
  if (message.includes('thanh cong') || message.includes('success'))
    return 'success';
  if (
    message.includes('loi') ||
    message.includes('lỗi') ||
    message.includes('error')
  ) {
    return 'error';
  }
  if (
    message.includes('dung') ||
    message.includes('dừng') ||
    message.includes('stop')
  ) {
    return 'stop';
  }

  return 'step';
}

export function normalizeLog(
  value: unknown,
  index: number,
  featureFilter: string,
): LogItem | null {
  if (!isRecord(value)) return null;
  const message = String(value.msg || value.message || '').trim();
  if (!message) return null;

  const timestamp = String(value.timestamp || new Date().toISOString());
  const featureName = String(value.featureName || '').trim();
  if (featureName && featureName !== featureFilter) return null;

  return {
    id: String(
      value.id || value.updateKey || `${Date.now().toString(36)}-${index}`,
    ),
    kind: inferLogKind(value),
    message,
    time: String(value.time || formatTime(timestamp)),
    timestamp,
    configName: String(
      value.configName || value.cloneName || value.title || '',
    ).trim(),
    configId: String(value.configId || '').trim(),
    userToken: String(value.userToken || '').trim(),
    featureName,
  };
}

export function mergeLogs(current: LogItem[], incoming: LogItem[]) {
  const byId = new Map<string, LogItem>();
  for (const log of current) byId.set(log.id, log);
  for (const log of incoming) byId.set(log.id, { ...byId.get(log.id), ...log });
  return Array.from(byId.values()).slice(-300);
}

export function findStringValue(value: unknown, keys: string[]): string {
  if (!isRecord(value)) return '';

  for (const key of keys) {
    const raw = value[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }

  for (const nestedKey of ['data', 'user', 'result']) {
    const found = findStringValue((value as any)[nestedKey], keys);
    if (found) return found;
  }

  return '';
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(
      normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    );
    const parsed = JSON.parse(json) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function extractToken(envelope: ApiEnvelope) {
  return findStringValue(envelope.data, ['token', 'accessToken', 'jwt']);
}

export function extractUser(envelope: ApiEnvelope) {
  if (!isRecord(envelope.data)) return null;

  const candidates = [
    envelope.data.user,
    envelope.data.data,
    envelope.data.result,
  ];
  for (const candidate of candidates) {
    if (isRecord(candidate)) {
      if (isRecord(candidate.user)) return candidate.user;
      if (
        typeof candidate.username === 'string' ||
        typeof candidate.role === 'string'
      ) {
        return candidate;
      }
    }
  }

  return envelope.data;
}

export function extractUserId(user: Record<string, unknown> | null, token: string) {
  const userId =
    (typeof user?.id === 'string' && user.id) ||
    (typeof user?._id === 'string' && user._id) ||
    '';
  const jwtPayload = decodeJwtPayload(token);
  const jwtId =
    (typeof jwtPayload?.id === 'string' && jwtPayload.id) ||
    (typeof jwtPayload?._id === 'string' && jwtPayload._id) ||
    '';

  return userId || jwtId;
}

export function extractWorkerUrl(envelope: ApiEnvelope, fallback: string) {
  return (
    findStringValue(envelope.data, [
      'vpsUrl',
      'workerUrl',
      'featureWorkerUrl',
    ]) || fallback
  );
}

export function extractStreamToken(envelope: ApiEnvelope) {
  return findStringValue(envelope.data, ['streamToken']);
}
