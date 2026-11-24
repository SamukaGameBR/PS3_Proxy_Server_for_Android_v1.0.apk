import type { Timestamp } from 'firebase/firestore';

export type ScreenName =
  | 'main'
  | 'rules'
  | 'settings'
  | 'logs'
  | 'instructions'
  | 'credits'
  | 'update_found'
  | 'account'
  | 'admin';

export interface AppSettings {
  ip: string;
  port: string;
  autoStartBoot: boolean;
  autoSavePort: boolean;
  autoSaveIp: boolean;
  seeRequests: boolean;
  disableAutoUpdater: boolean;
  ignoreUpdateDay: string;
  customPs3Updatelist: boolean;
  manualPs3Updatelist: boolean;
  pathPs3Updatelist: string;
  customRulesUrls: string;
  whatsNewPsxPlaceNews: boolean;
  whatsNewRssFeed: boolean;
  whatsNewRssFeedUrl: string;
  psStorePsxPlaceNews: boolean;
  psStoreRssFeed: boolean;
  psStoreRssFeedUrl: string;
  tvVideoServicesPsxPlaceNews: boolean;
  tvVideoServicesRssFeed: boolean;
  tvVideoServicesRssFeedUrl: string;
  psxPlaceXmlUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ip: 'localhost',
  port: '8080',
  autoStartBoot: false,
  autoSavePort: false,
  autoSaveIp: false,
  seeRequests: false,
  disableAutoUpdater: false,
  ignoreUpdateDay: 'false',
  customPs3Updatelist: true,
  manualPs3Updatelist: false,
  pathPs3Updatelist: 'NONE',
  customRulesUrls: '',
  whatsNewPsxPlaceNews: false,
  whatsNewRssFeed: false,
  whatsNewRssFeedUrl: '',
  psStorePsxPlaceNews: false,
  psStoreRssFeed: false,
  psStoreRssFeedUrl: '',
  tvVideoServicesPsxPlaceNews: false,
  tvVideoServicesRssFeed: false,
  tvVideoServicesRssFeedUrl: '',
  psxPlaceXmlUrl:
    'https://raw.githubusercontent.com/Edw590/PS3-Proxy-Server-for-Android/master/Whats_New_XML/whats_new.xml',
};

export interface LogEntry {
  ln: number;
  sessionId: number;
  isRequest: boolean;
  timestamp: string;
  tag: string;
  message: string;
  detail?: string;
}

export interface ServerStatus {
  running: boolean;
  ip: string;
  port: number;
  sessionId: number;
  error: string;
  logsCount: number;
}

export interface UpdateInfo {
  updateFound: boolean;
  downloadLink: string;
  psxPlaceXmlUrl: string;
  updatesTxt: string;
  currentVersion: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'user' | 'admin';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  daysOfUse: number;
  monthlyPriceBrl: number;
  totalPriceBrl: number;
  active: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserSubscription {
  id: string;
  ownerUid: string;
  userEmail: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  planName: string;
  daysOfUse: number;
  monthlyPriceBrl: number;
  totalPriceBrl: number;
  status: SubscriptionStatus;
  startsAt?: Timestamp;
  expiresAt?: Timestamp;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Validation constants synchronized with firebase-blueprint.json & firestore.rules
export const BLUEPRINT_LIMITS = {
  usernameMin: 3,
  usernameMax: 40,
  usernamePattern: /^[a-zA-Z0-9_.-]+$/,
  planNameMin: 2,
  planNameMax: 60,
  daysMin: 1,
  daysMax: 3650,
  monthlyPriceMax: 100000,
  totalPriceMax: 1000000,
  emailMax: 254,
} as const;

export const ADMIN_EMAIL = 'samucac3@gmail.com';

export function formatBrl(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getSubscriptionState(sub: UserSubscription | null, nowMs: number) {
  if (!sub) {
    return {
      isExpired: true,
      isBlocked: true,
      effectiveStatus: 'blocked' as SubscriptionStatus,
      remainingDays: 0,
      expiresAtMs: 0,
    };
  }
  const expiresAtMs = sub.expiresAt ? sub.expiresAt.toMillis() : 0;
  const diffMs = expiresAtMs - nowMs;
  const remainingDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
  const timeExpired = expiresAtMs > 0 && nowMs >= expiresAtMs;
  const isBlocked = sub.status === 'blocked';
  const isExpired = sub.status === 'expired' || timeExpired;
  const effectiveStatus: SubscriptionStatus = isBlocked
    ? 'blocked'
    : isExpired
      ? 'expired'
      : 'active';

  return {
    isExpired,
    isBlocked,
    effectiveStatus,
    remainingDays,
    expiresAtMs,
  };
}
