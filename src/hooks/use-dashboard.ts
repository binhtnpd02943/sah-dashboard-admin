'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ActiveScreen,
  LoadingAction,
  Session,
  AccountForm,
  UpLevelForm,
  SieuBaHoForm,
  DatKhongNguoiForm,
  HistoryItem,
  LogItem,
  UpLevelStatus,
  SieuBaHoStatus,
  DatKhongNguoiStatus,
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
const SBH_LOG_FEATURE = 'sieu-ba-ho';
const DKN_LOG_FEATURE = 'dat-khong-nguoi';

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
  const [sieuBaHoForm, setSieuBaHoForm] = useState<SieuBaHoForm>({
    configIds: '',
    delay: 1000,
    concurrency: 3,
    maxAuto: 3,
    buyItems: false,
    runMode: 'play',
    buyShopIndex: '',
    buyShopSlot: '',
    buyQuantity: 1,
    logFull: true,
    proxyMode: 'off',
  });
  const [datKhongNguoiForm, setDatKhongNguoiForm] = useState<DatKhongNguoiForm>({
    configIds: '',
    delay: 1400,
    concurrency: 3,
    loaiHatGiong: '39',
    tromNroMode: false,
    autoCanBinh: true,
    mode: 'trom',
    logFull: true,
    proxyMode: 'off',
    forceStart: true,
  });

  const [loading, setLoading] = useState<LoadingAction>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logConnected, setLogConnected] = useState(false);
  const [logError, setLogError] = useState('');

  const [upLevelStatus, setUpLevelStatus] = useState<UpLevelStatus | null>(null);
  const [sieuBaHoStatus, setSieuBaHoStatus] = useState<SieuBaHoStatus | null>(null);
  const [datKhongNguoiStatus, setDatKhongNguoiStatus] = useState<DatKhongNguoiStatus | null>(null);
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
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
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

  const appendLogs = useCallback((payload: unknown, featureFilter = LOG_FEATURE) => {
    const payloads = collectLogPayloads(payload);
    const normalized = payloads
      .map((item, index) => normalizeLog(item, index, featureFilter))
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

  const fetchSieuBaHoStatus = useCallback(async () => {
    if (!session?.token) return;
    try {
      const response = await callInternalApi('/api/sieu-ba-ho/status', { workerUrl }, session.token);
      const data = response.data as any;
      if (response.ok && data?.status) {
        setSieuBaHoStatus(data.status);
      }
    } catch {
      // Silent error
    }
  }, [session, workerUrl]);

  useEffect(() => {
    if (!session || !['overview', 'sieu-ba-ho'].includes(activeScreen)) {
      setSieuBaHoStatus(null);
      return;
    }

    fetchSieuBaHoStatus();
    const timer = setInterval(fetchSieuBaHoStatus, 5000);
    return () => clearInterval(timer);
  }, [activeScreen, session, fetchSieuBaHoStatus]);

  const fetchDatKhongNguoiStatus = useCallback(async () => {
    if (!session?.token) return;
    try {
      const response = await callInternalApi('/api/dat-khong-nguoi/status', { workerUrl }, session.token);
      const data = response.data as any;
      if (response.ok && data?.status) {
        setDatKhongNguoiStatus(data.status);
      }
    } catch {
      // Silent error
    }
  }, [session, workerUrl]);

  useEffect(() => {
    if (!session || !['overview', 'dat-khong-nguoi'].includes(activeScreen)) {
      setDatKhongNguoiStatus(null);
      return;
    }

    fetchDatKhongNguoiStatus();
    const timer = setInterval(fetchDatKhongNguoiStatus, 5000);
    return () => clearInterval(timer);
  }, [activeScreen, session, fetchDatKhongNguoiStatus]);

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
    if (!session || !['up-level', 'sieu-ba-ho', 'dat-khong-nguoi', 'logs'].includes(activeScreen)) return;
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

  const handleStartSieuBaHo = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading('sieu-ba-ho');

    const configIds = sieuBaHoForm.configIds.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);

    try {
      const response = await callInternalApi(
        '/api/sieu-ba-ho/start',
        { ...sieuBaHoForm, configIds, workerUrl },
        session.token
      );
      setLastResult(response.data);
      pushHistory({
        title: `Siêu Bá Hộ (${configIds.length} config)`,
        status: response.status,
        data: response.data,
      });
      setActiveScreen('sieu-ba-ho');
      openLogStream();

      // Quick status snapshot
      void (async () => {
        try {
          const statusResp = await callInternalApi('/api/sieu-ba-ho/status', { workerUrl }, session.token);
          const st = (statusResp.data as any)?.status;
          if (st) {
            appendLogs({
              logs: [{
                id: `sbh-status-init-${Date.now()}`,
                kind: st.isRunning ? 'start' : 'stop',
                message: `Siêu Bá Hộ: ${st.isRunning ? 'Đang chạy' : 'Đang chờ'} (Hoàn thành: ${st.completedCount ?? 0}/${st.totalCount ?? 0})`,
                timestamp: new Date().toISOString(),
                featureName: SBH_LOG_FEATURE,
              }]
            }, SBH_LOG_FEATURE);
          }
        } catch {
          // Silent fail
        }
      })();
    } catch (error) {
      setLastResult({ success: false, message: error instanceof Error ? error.message : 'Lỗi không xác định' });
    } finally {
      setLoading(null);
    }
  }, [sieuBaHoForm, session, workerUrl, pushHistory, openLogStream, appendLogs]);

  const handleStopSieuBaHo = useCallback(async () => {
    if (!session) return;
    setLoading('sieu-ba-ho');
    try {
      const response = await callInternalApi(
        '/api/sieu-ba-ho/stop',
        { workerUrl },
        session.token
      );
      setLastResult(response.data);
      pushHistory({
        title: 'Stop Siêu Bá Hộ',
        status: response.status,
        data: response.data,
      });
      appendLogs({
        logs: [{
          id: `sbh-stop-req-${Date.now()}`,
          kind: 'stop',
          message: 'Siêu Bá Hộ: Gửi yêu cầu dừng...',
          timestamp: new Date().toISOString(),
          featureName: SBH_LOG_FEATURE,
        }]
      }, SBH_LOG_FEATURE);
    } catch (error) {
      setLastResult({ success: false, message: error instanceof Error ? error.message : 'Lỗi không xác định' });
    } finally {
      setLoading(null);
    }
  }, [session, workerUrl, pushHistory, appendLogs]);

  const handleStartDatKhongNguoi = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading('dat-khong-nguoi');

    const configIds = datKhongNguoiForm.configIds.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);

    try {
      const response = await callInternalApi(
        '/api/dat-khong-nguoi/start',
        { ...datKhongNguoiForm, configIds, workerUrl },
        session.token
      );
      setLastResult(response.data);
      pushHistory({
        title: `Đất Không Người (${configIds.length} config)`,
        status: response.status,
        data: response.data,
      });
      setActiveScreen('dat-khong-nguoi');
      openLogStream();

      void (async () => {
        try {
          const statusResp = await callInternalApi('/api/dat-khong-nguoi/status', { workerUrl }, session.token);
          const st = (statusResp.data as any)?.status;
          if (st) {
            appendLogs({
              logs: [{
                id: `dkn-status-init-${Date.now()}`,
                kind: st.isRunning ? 'start' : 'stop',
                message: `Đất Không Người: ${st.isRunning ? 'Đang chạy' : 'Đang chờ'} (Hoàn thành: ${st.completedCount ?? 0}/${st.totalCount ?? 0})`,
                timestamp: new Date().toISOString(),
                featureName: DKN_LOG_FEATURE,
              }]
            }, DKN_LOG_FEATURE);
          }
        } catch {
          // Silent fail
        }
      })();
    } catch (error) {
      setLastResult({ success: false, message: error instanceof Error ? error.message : 'Lỗi không xác định' });
    } finally {
      setLoading(null);
    }
  }, [datKhongNguoiForm, session, workerUrl, pushHistory, openLogStream, appendLogs]);

  const handleStopDatKhongNguoi = useCallback(async () => {
    if (!session) return;
    setLoading('dat-khong-nguoi');
    try {
      const response = await callInternalApi(
        '/api/dat-khong-nguoi/stop',
        { workerUrl },
        session.token
      );
      setLastResult(response.data);
      pushHistory({
        title: 'Stop Đất Không Người',
        status: response.status,
        data: response.data,
      });
      appendLogs({
        logs: [{
          id: `dkn-stop-req-${Date.now()}`,
          kind: 'stop',
          message: 'Đất Không Người: Gửi yêu cầu dừng...',
          timestamp: new Date().toISOString(),
          featureName: DKN_LOG_FEATURE,
        }]
      }, DKN_LOG_FEATURE);
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
    sieuBaHoForm,
    setSieuBaHoForm,
    datKhongNguoiForm,
    setDatKhongNguoiForm,
    loading,
    lastResult,
    history,
    logs,
    setLogs,
    logConnected,
    logError,
    upLevelStatus,
    sieuBaHoStatus,
    datKhongNguoiStatus,
    handleLogin,
    handleAddAccount,
    handleStartUpLevel,
    handleStopUpLevel,
    handleStartSieuBaHo,
    handleStopSieuBaHo,
    handleStartDatKhongNguoi,
    handleStopDatKhongNguoi,
    loadLogHistory,
    logout,
  };
}
