'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ActiveScreen,
  LoadingAction,
  Session,
  AccountForm,
  UpLevelForm,
  HistoryItem,
  LogItem,
  UpLevelStatus,
} from '@/types/dashboard';
import {
  callInternalApi,
  collectLogPayloads,
  normalizeLog,
  mergeLogs,
  extractToken,
  extractUser,
  extractUserId,
  extractWorkerUrl,
  extractStreamToken,
} from '@/services/api-client';

const SESSION_KEY = 'sah-next-session:v1';
const DEFAULT_WORKER_URL = 'https://worker4-2.tool-sah.pro.vn';
const LOG_FEATURE = 'up-level';

export function useDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('overview');
  const [workerUrl, setWorkerUrl] = useState(DEFAULT_WORKER_URL);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [accountForm, setAccountForm] = useState<AccountForm>({
    phoneNumber: '',
    password: '',
    platform: 'ios',
  });
  const [upLevelForm, setUpLevelForm] = useState<UpLevelForm>({
    configIds: '',
    delay: 1111,
    type: 2,
    concurrency: 3,
    autoBuyStamina: false,
    autoDeleteTrash: false,
    logFull: true,
    proxyMode: 'off',
  });

  const [loading, setLoading] = useState<LoadingAction>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logConnected, setLogConnected] = useState(false);
  const [logError, setLogError] = useState('');

  const [upLevelStatus, setUpLevelStatus] = useState<UpLevelStatus | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamKeyRef = useRef('');

  // Persistence
  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Session;
      if (parsed?.token) {
        setSession(parsed);
        setWorkerUrl(parsed.workerUrl || DEFAULT_WORKER_URL);
      }
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const persistSession = useCallback((nextSession: Session) => {
    setSession(nextSession);
    setWorkerUrl(nextSession.workerUrl);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }, []);

  const pushHistory = useCallback((item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
    setHistory((current) =>
      [
        {
          ...item,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 8)
    );
  }, []);

  const logout = useCallback(() => {
    eventSourceRef.current?.close();
    streamKeyRef.current = '';
    setLogConnected(false);
    setSession(null);
    setLastResult(null);
    setHistory([]);
    setLogs([]);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const appendLogs = useCallback((payload: unknown) => {
    const payloads = collectLogPayloads(payload);
    const normalized = payloads
      .map((item, index) => normalizeLog(item, index, LOG_FEATURE))
      .filter((item): item is LogItem => Boolean(item));

    if (normalized.length) {
      setLogs((current) => mergeLogs(current, normalized));
    }
  }, []);

  const openLogStream = useCallback(async () => {
    if (!session?.token || !session.userId) {
      setLogError('Không xác định được userId để mở log stream.');
      return;
    }

    const streamKey = `${workerUrl}::${session.userId}`;
    if (eventSourceRef.current && streamKeyRef.current === streamKey) return;

    eventSourceRef.current?.close();
    setLogConnected(false);
    setLogError('');

    try {
      const sessionResponse = await callInternalApi(
        '/api/logs/session',
        { workerUrl },
        session.token
      );
      const streamToken = extractStreamToken(sessionResponse.data);

      if (!sessionResponse.ok || !streamToken) {
        throw new Error('Worker không trả streamToken.');
      }

      const params = new URLSearchParams({
        workerUrl,
        userId: session.userId,
        streamToken,
      });
      const eventSource = new EventSource(`/api/logs/stream?${params.toString()}`);

      streamKeyRef.current = streamKey;
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        setLogConnected(true);
        setLogError('');
      };
      
      eventSource.onmessage = (event) => {
        try {
          appendLogs(JSON.parse(event.data) as unknown);
        } catch (error) {
          console.error('Log parse error:', error);
        }
      };
      
      eventSource.onerror = () => {
        setLogConnected(false);
        setLogError('Log stream bị ngắt hoặc worker không phản hồi.');
      };
    } catch (error) {
      setLogError(error instanceof Error ? error.message : 'Không mở được log stream.');
    }
  }, [session, workerUrl, appendLogs]);

  const fetchStatus = useCallback(async () => {
    if (!session?.token) return;
    try {
      const response = await callInternalApi('/api/up-level/status', { workerUrl }, session.token);
      const data = response.data as any;
      if (response.ok && data?.status) {
        setUpLevelStatus(data.status);
      }
    } catch (e) {
      // Silent error
    }
  }, [session, workerUrl]);

  useEffect(() => {
    if (!session || !['overview', 'up-level'].includes(activeScreen)) {
      setUpLevelStatus(null);
      return;
    }

    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, [activeScreen, session, fetchStatus]);

  const loadLogHistory = useCallback(async () => {
    if (!session) return;
    setLoading('history');
    try {
      const response = await callInternalApi(
        '/api/logs/history',
        { featureName: LOG_FEATURE, workerUrl, limit: 300 },
        session.token
      );
      const rawLogs = collectLogPayloads(response.data);
      const normalized = rawLogs
        .map((item, index) => normalizeLog(item, index, LOG_FEATURE))
        .filter((item): item is LogItem => Boolean(item));
      setLogs(normalized.slice(-300));
    } catch (error) {
      setLogError('Không tải được lịch sử log.');
    } finally {
      setLoading(null);
    }
  }, [session, workerUrl]);

  useEffect(() => {
    if (!session || !['up-level', 'logs'].includes(activeScreen)) return;
    openLogStream();
  }, [activeScreen, openLogStream, session]);

  // Handlers
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('login');
    try {
      const response = await callInternalApi('/api/auth/login', loginForm);
      setLastResult(response.data);

      if (!response.ok) {
        pushHistory({ title: 'Login failed', status: response.status, data: response.data });
        return;
      }

      const token = extractToken(response.data);
      const user = extractUser(response.data);
      if (!token) throw new Error('Login thiếu token');

      const nextSession: Session = {
        token,
        username: loginForm.username.trim(),
        workerUrl: extractWorkerUrl(response.data, workerUrl),
        user,
        userId: extractUserId(user, token),
        loggedAt: new Date().toISOString(),
      };

      persistSession(nextSession);
      setActiveScreen('overview');
      pushHistory({ title: 'Login thành công', status: response.status, data: response.data });
    } catch (error) {
      setLastResult({ success: false, message: error instanceof Error ? error.message : 'Lỗi không xác định' });
    } finally {
      setLoading(null);
    }
  }, [loginForm, workerUrl, persistSession, pushHistory]);

  const handleAddAccount = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading('account');
    try {
      const response = await callInternalApi(
        '/api/account/add',
        { ...accountForm, workerUrl },
        session.token
      );
      setLastResult(response.data);
      pushHistory({
        title: `Tạo account ${accountForm.phoneNumber}`,
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      setLastResult({ success: false, message: error instanceof Error ? error.message : 'Lỗi không xác định' });
    } finally {
      setLoading(null);
    }
  }, [accountForm, session, workerUrl, pushHistory]);

  const handleStartUpLevel = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading('up-level');

    const configIds = upLevelForm.configIds.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);

    try {
      const response = await callInternalApi(
        '/api/up-level/start',
        { ...upLevelForm, configIds, workerUrl },
        session.token
      );
      setLastResult(response.data);
      pushHistory({
        title: `Up Level (${configIds.length} config)`,
        status: response.status,
        data: response.data,
      });
      setActiveScreen('up-level');
      
      // Mở stream và check status ngay lập tức để có feedback sớm
      openLogStream();
      
      // One-time status check
      void (async () => {
        try {
          const statusResp = await callInternalApi('/api/up-level/status', { workerUrl }, session.token);
          const st = (statusResp.data as any)?.status;
          if (st) {
            const isRunning = !!st.isRunning;
            const completed = st.completedCount ?? 0;
            const total = st.totalCount ?? 0;
            const queueLen = Array.isArray(st.currentQueue) ? st.currentQueue.length : 0;
            
            appendLogs({
              logs: [{
                id: `status-init-${Date.now()}`,
                kind: isRunning ? 'start' : 'stop',
                message: `Hệ thống: ${isRunning ? 'Đang chạy' : 'Đang chờ'} (Hoàn thành: ${completed}/${total}, Đang chờ: ${queueLen})`,
                timestamp: new Date().toISOString(),
                featureName: LOG_FEATURE
              }]
            });
          }
        } catch (e) {
          // Silent fail
        }
      })();
    } catch (error) {
      setLastResult({ success: false, message: error instanceof Error ? error.message : 'Lỗi không xác định' });
    } finally {
      setLoading(null);
    }
  }, [upLevelForm, session, workerUrl, pushHistory, openLogStream]);

  const handleStopUpLevel = useCallback(async () => {
    if (!session) return;
    setLoading('up-level');
    try {
      const response = await callInternalApi(
        '/api/up-level/stop',
        { workerUrl },
        session.token
      );
      setLastResult(response.data);
      pushHistory({
        title: 'Stop Up Level',
        status: response.status,
        data: response.data,
      });
      
      appendLogs({
        logs: [{
          id: `stop-req-${Date.now()}`,
          kind: 'stop',
          message: 'Hệ thống: Gửi yêu cầu dừng Up Level...',
          timestamp: new Date().toISOString(),
          featureName: LOG_FEATURE
        }]
      });
    } catch (error) {
      setLastResult({ success: false, message: error instanceof Error ? error.message : 'Lỗi không xác định' });
    } finally {
      setLoading(null);
    }
  }, [session, workerUrl, pushHistory, appendLogs]);

  return {
    session,
    activeScreen,
    setActiveScreen,
    workerUrl,
    setWorkerUrl: (url: string) => {
      setWorkerUrl(url);
      if (session) {
        const next = { ...session, workerUrl: url };
        setSession(next);
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      }
      eventSourceRef.current?.close();
      setLogConnected(false);
    },
    loginForm,
    setLoginForm,
    accountForm,
    setAccountForm,
    upLevelForm,
    setUpLevelForm,
    loading,
    lastResult,
    history,
    logs,
    setLogs,
    logConnected,
    logError,
    upLevelStatus,
    handleLogin,
    handleAddAccount,
    handleStartUpLevel,
    handleStopUpLevel,
    loadLogHistory,
    logout,
  };
}
