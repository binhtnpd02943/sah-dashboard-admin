import { ReactNode } from 'react';

export type ActiveScreen = 'overview' | 'account' | 'up-level' | 'sieu-ba-ho' | 'dat-khong-nguoi' | 'logs' | 'settings';

export type LoadingAction =
  | 'login'
  | 'account'
  | 'up-level'
  | 'sieu-ba-ho'
  | 'dat-khong-nguoi'
  | 'history'
  | 'stream'
  | null;

export type ApiEnvelope = {
  success?: boolean;
  status?: number;
  data?: any;
  message?: string;
  payload?: any;
};

export type Session = {
  token: string;
  username: string;
  workerUrl: string;
  user: Record<string, any> | null;
  userId: string;
  loggedAt: string;
};

export type AccountForm = {
  phoneNumber: string;
  password: string;
  platform: 'ios' | 'android';
};

export type UpLevelForm = {
  configIds: string;
  delay: number;
  type: number;
  concurrency: number;
  autoBuyStamina: boolean;
  autoDeleteTrash: boolean;
  logFull: boolean;
  proxyMode: 'off' | 'dedicated';
};

export type HistoryItem = {
  id: string;
  title: string;
  status: number | null;
  data: any;
  createdAt: string;
};

export type LogKind = 'start' | 'step' | 'success' | 'error' | 'stop';

export type LogItem = {
  id: string;
  kind: LogKind;
  message: string;
  time: string;
  timestamp: string;
  configName: string;
  configId: string;
  userToken: string;
  featureName: string;
};

export type UpLevelStatus = {
  isRunning: boolean;
  startedAt: string | null;
  currentQueue: any[];
  completedCount: number;
  totalCount: number;
};

export type SieuBaHoForm = {
  configIds: string;
  delay: number;
  concurrency: number;
  maxAuto: number;
  buyItems: boolean;
  runMode: 'play' | 'auto';
  buyShopIndex: string;
  buyShopSlot: string;
  buyQuantity: number;
  logFull: boolean;
  proxyMode: 'off' | 'dedicated';
};

export type SieuBaHoStatus = {
  isRunning: boolean;
  startedAt: string | null;
  currentQueue: any[];
  completedCount: number;
  totalCount: number;
};

export type DatKhongNguoiForm = {
  configIds: string;
  delay: number;
  concurrency: number;
  loaiHatGiong: string;
  tromNroMode: boolean;
  autoCanBinh: boolean;
  mode: 'trom' | 'trong';
  logFull: boolean;
  proxyMode: 'off' | 'dedicated';
  forceStart: boolean;
};

export type DatKhongNguoiStatus = {
  isRunning: boolean;
  startedAt: string | null;
  currentQueue: any[];
  completedCount: number;
  totalCount: number;
};

export interface NavItem {
  key: ActiveScreen;
  label: string;
  icon: ReactNode;
}
