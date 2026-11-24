export type ScreenName =
  | 'main'
  | 'rules'
  | 'settings'
  | 'logs'
  | 'instructions'
  | 'credits'
  | 'update_found';

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
