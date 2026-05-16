'use client';

import {
  Gauge,
  UserPlus,
  Zap,
  Terminal,
  Settings,
  ShieldCheck,
  Radio,
  Server,
  Crown,
  Sprout,
} from 'lucide-react';
import { useDashboard } from '@/hooks/use-dashboard';
import { NavItem } from '@/types/dashboard';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { LoginSection } from '@/components/dashboard/LoginSection';
import { OverviewSection } from '@/components/dashboard/OverviewSection';
import { AccountSection } from '@/components/dashboard/AccountSection';
import { UpLevelSection } from '@/components/dashboard/UpLevelSection';
import { SieuBaHoSection } from '@/components/dashboard/SieuBaHoSection';
import { DatKhongNguoiSection } from '@/components/dashboard/DatKhongNguoiSection';
import { SettingsSection } from '@/components/dashboard/SettingsSection';
import { LogViewer } from '@/components/dashboard/LogViewer';
import { StatusPill } from '@/components/ui/StatusPill';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Trang chủ', icon: <Gauge size={18} /> },
  { key: 'account', label: 'Tạo account', icon: <UserPlus size={18} /> },
  { key: 'up-level', label: 'Up Level Clone', icon: <Zap size={18} /> },
  { key: 'sieu-ba-ho', label: 'Siêu Bá Hộ', icon: <Crown size={18} /> },
  { key: 'dat-khong-nguoi', label: 'Đất Không Người', icon: <Sprout size={18} /> },
  { key: 'logs', label: 'Logs', icon: <Terminal size={18} /> },
  { key: 'settings', label: 'Cài đặt', icon: <Settings size={18} /> },
];

export default function DashboardClient() {
  const {
    session,
    activeScreen,
    setActiveScreen,
    workerUrl,
    setWorkerUrl,
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
  } = useDashboard();

  const isLoggedIn = !!session;

  const renderScreen = () => {
    if (!session) {
      return (
        <LoginSection
          loginForm={loginForm as any}
          setLoginForm={setLoginForm}
          onLogin={handleLogin}
          loading={loading}
          lastResult={lastResult}
        />
      );
    }

    switch (activeScreen) {
      case 'account':
        return (
          <AccountSection
            accountForm={accountForm}
            setAccountForm={setAccountForm}
            onSubmit={handleAddAccount}
            loading={loading}
            lastResult={lastResult}
          />
        );
      case 'up-level':
        return (
          <UpLevelSection
            upLevelForm={upLevelForm}
            setUpLevelForm={setUpLevelForm}
            onSubmit={handleStartUpLevel}
            onStop={handleStopUpLevel}
            loading={loading}
            logs={logs}
            logConnected={logConnected}
            logError={logError}
            onRefreshLogs={() => loadLogHistory()}
            onClearLogs={() => setLogs([])}
            status={upLevelStatus}
          />
        );
      case 'sieu-ba-ho':
        return (
          <SieuBaHoSection
            form={sieuBaHoForm}
            setForm={setSieuBaHoForm}
            onSubmit={handleStartSieuBaHo}
            onStop={handleStopSieuBaHo}
            loading={loading}
            logs={logs}
            logConnected={logConnected}
            logError={logError}
            onRefreshLogs={() => loadLogHistory()}
            onClearLogs={() => setLogs([])}
            status={sieuBaHoStatus}
          />
        );
      case 'dat-khong-nguoi':
        return (
          <DatKhongNguoiSection
            form={datKhongNguoiForm}
            setForm={setDatKhongNguoiForm}
            onSubmit={handleStartDatKhongNguoi}
            onStop={handleStopDatKhongNguoi}
            loading={loading}
            logs={logs}
            logConnected={logConnected}
            logError={logError}
            onRefreshLogs={() => loadLogHistory()}
            onClearLogs={() => setLogs([])}
            status={datKhongNguoiStatus}
          />
        );
      case 'logs':
        return (
          <LogViewer
            logs={logs}
            connected={logConnected}
            error={logError}
            onRefresh={() => loadLogHistory()}
            onClear={() => setLogs([])}
            tall
          />
        );
      case 'settings':
        return (
          <SettingsSection
            workerUrl={workerUrl}
            setWorkerUrl={setWorkerUrl}
            session={session}
            lastResult={lastResult}
          />
        );
      default:
        return (
          <OverviewSection
            logs={logs}
            history={history}
            lastResult={lastResult}
            status={upLevelStatus}
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-base text-main selection:bg-accent/30">
      <div className="mx-auto grid w-full max-w-[1560px] gap-6 px-4 py-5 md:px-6 lg:grid-cols-[292px_minmax(0,1fr)]">
        <Sidebar
          session={session}
          activeScreen={activeScreen}
          onScreenChange={setActiveScreen}
          navItems={NAV_ITEMS}
          workerUrl={workerUrl}
          logConnected={logConnected}
          onLogout={logout}
        />

        <section className="min-w-0 space-y-6">
          <header className="card-panel rounded-[30px] p-6 md:p-7 overflow-hidden relative">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap items-start justify-between gap-5 relative z-10"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-muted">
                  {session ? `/${activeScreen}` : '/login'}
                </p>
                <h2 className="mt-3 text-3xl font-black text-main md:text-4xl">
                  {session
                    ? NAV_ITEMS.find((item) => item.key === activeScreen)?.label
                    : 'Hệ thống Quản trị'}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="accent">
                  <ShieldCheck size={14} />
                  Root Secure
                </StatusPill>
                <StatusPill tone={logConnected ? 'success' : 'neutral'}>
                  <Radio size={14} className={logConnected ? 'animate-pulse' : ''} />
                  {logConnected ? 'Log Live' : 'Log Offline'}
                </StatusPill>
                <StatusPill tone={isLoggedIn ? 'success' : 'neutral'}>
                  <Server size={14} />
                  Worker Ready
                </StatusPill>
              </div>
            </motion.div>
            
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={session ? activeScreen : 'login'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
