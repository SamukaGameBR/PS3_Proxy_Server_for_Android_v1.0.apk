import React, { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  AppSettings,
  DEFAULT_SETTINGS,
  getSubscriptionState,
  ScreenName,
  ServerStatus,
  SubscriptionPlan,
  UpdateInfo,
  UserSubscription,
} from './types';
import { STRINGS } from './strings';
import {
  auth,
  db,
  generateSalt,
  handleFirestoreError,
  hashPassword,
  OperationType,
} from './firebase';
import { MainScreen } from './screens/MainScreen';
import { RulesScreen } from './screens/RulesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RealtimeLogsScreen } from './screens/RealtimeLogsScreen';
import { InstructionsScreen } from './screens/InstructionsScreen';
import { CreditsScreen } from './screens/CreditsScreen';
import { UpdateFoundScreen } from './screens/UpdateFoundScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AccessGateScreen } from './screens/AccessGateScreen';
import { AccountScreen } from './screens/AccountScreen';
import { AdminScreen } from './screens/AdminScreen';
import { Toolbar } from './components/Toolbar';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY = 'ppsfa_app_settings';

function loadSavedSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function validatePort(portStr: string): number | null {
  if (!portStr.trim()) return null;
  const num = Number(portStr);
  if (!Number.isInteger(num) || num < 1024 || num > 65535) return null;
  return num;
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export const App: React.FC = () => {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [credentialUnlocked, setCredentialUnlocked] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<UserSubscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<UserSubscription[]>([]);
  const [subLoaded, setSubLoaded] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(loadSavedSettings);
  const [screen, setScreen] = useState<ScreenName>('main');
  const [ipInput, setIpInput] = useState<string>(settings.ip);
  const [portInput, setPortInput] = useState<string>(
    settings.autoSavePort ? settings.port : '8080'
  );
  const [errorIp, setErrorIp] = useState('');
  const [errorPort, setErrorPort] = useState('');
  const [busy, setBusy] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [status, setStatus] = useState<ServerStatus>({
    running: false,
    ip: settings.ip,
    port: Number(settings.port) || 8080,
    sessionId: 0,
    error: '',
    logsCount: 0,
  });

  const isAdmin = Boolean(
    currentUser?.emailVerified &&
      currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const persistLocalSettings = useCallback((next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistRemoteSettings = useCallback(
    async (uid: string, next: AppSettings) => {
      const path = `userSettings/${uid}`;
      try {
        await setDoc(doc(db, 'userSettings', uid), {
          uid,
          ip: next.ip.slice(0, 64),
          port: next.port.slice(0, 10),
          autoStartBoot: next.autoStartBoot,
          autoSavePort: next.autoSavePort,
          autoSaveIp: next.autoSaveIp,
          seeRequests: next.seeRequests,
          disableAutoUpdater: next.disableAutoUpdater,
          ignoreUpdateDay: next.ignoreUpdateDay.slice(0, 16),
          customPs3Updatelist: next.customPs3Updatelist,
          manualPs3Updatelist: next.manualPs3Updatelist,
          pathPs3Updatelist: next.pathPs3Updatelist.slice(0, 512),
          customRulesUrls: next.customRulesUrls.slice(0, 8192),
          whatsNewPsxPlaceNews: next.whatsNewPsxPlaceNews,
          whatsNewRssFeed: next.whatsNewRssFeed,
          whatsNewRssFeedUrl: next.whatsNewRssFeedUrl.slice(0, 1024),
          psStorePsxPlaceNews: next.psStorePsxPlaceNews,
          psStoreRssFeed: next.psStoreRssFeed,
          psStoreRssFeedUrl: next.psStoreRssFeedUrl.slice(0, 1024),
          tvVideoServicesPsxPlaceNews: next.tvVideoServicesPsxPlaceNews,
          tvVideoServicesRssFeed: next.tvVideoServicesRssFeed,
          tvVideoServicesRssFeedUrl: next.tvVideoServicesRssFeedUrl.slice(0, 1024),
          psxPlaceXmlUrl: next.psxPlaceXmlUrl.slice(0, 1024),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    []
  );

  const buildProxyPayload = (s: AppSettings, ip: string, portNum: number) => ({
    ip,
    port: portNum,
    customPs3Updatelist: s.customPs3Updatelist,
    manualPs3Updatelist: s.manualPs3Updatelist,
    pathPs3Updatelist: s.pathPs3Updatelist,
    customRulesUrls: s.customRulesUrls,
    whatsNewPsxPlaceNews: s.whatsNewPsxPlaceNews,
    whatsNewRssFeed: s.whatsNewRssFeed,
    whatsNewRssFeedUrl: s.whatsNewRssFeedUrl,
    psStorePsxPlaceNews: s.psStorePsxPlaceNews,
    psStoreRssFeed: s.psStoreRssFeed,
    psStoreRssFeedUrl: s.psStoreRssFeedUrl,
    tvVideoServicesPsxPlaceNews: s.tvVideoServicesPsxPlaceNews,
    tvVideoServicesRssFeed: s.tvVideoServicesRssFeed,
    tvVideoServicesRssFeedUrl: s.tvVideoServicesRssFeedUrl,
    psxPlaceXmlUrl: s.psxPlaceXmlUrl,
  });

  // Timer for automatic expiration & lock enforcement
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setCredentialUnlocked(false);
      setSubLoaded(false);

      if (user && user.emailVerified && user.email) {
        const userRef = doc(db, 'users', user.uid);
        const userPath = `users/${user.uid}`;
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const defaultUsername = sanitizeId(user.email.split('@')[0] || 'usuario').slice(0, 40);
            const finalUsername = defaultUsername.length >= 3 ? defaultUsername : `user_${user.uid.slice(0, 6)}`;
            const role =
              user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email.toLowerCase().slice(0, 254),
              displayName: (user.displayName || finalUsername).slice(0, 100),
              username: finalUsername,
              passwordHash: '',
              passwordSalt: '',
              role,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        }
      }

      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore listeners (ONLY when authReady && currentUser)
  useEffect(() => {
    if (!authReady || !currentUser || !currentUser.emailVerified || !currentUser.email) {
      setPlans([]);
      setMySubscription(null);
      setAllSubscriptions([]);
      return;
    }

    const uid = currentUser.uid;
    const emailLower = currentUser.email.toLowerCase();
    const adminUser = emailLower === ADMIN_EMAIL.toLowerCase();

    // 1. User proxy settings listener
    const settingsUnsub = onSnapshot(
      doc(db, 'userSettings', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<AppSettings>;
          setSettings((prev) => {
            const merged = { ...prev, ...data };
            persistLocalSettings(merged);
            if (merged.autoSaveIp && merged.ip) setIpInput(merged.ip);
            if (merged.autoSavePort && merged.port) setPortInput(merged.port);
            return merged;
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `userSettings/${uid}`)
    );

    // 2. Plans listener
    const plansQuery = adminUser
      ? collection(db, 'plans')
      : query(collection(db, 'plans'), where('active', '==', true));
    const plansUnsub = onSnapshot(
      plansQuery,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as SubscriptionPlan)
          .sort((a, b) => a.daysOfUse - b.daysOfUse);
        setPlans(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'plans')
    );

    // 3. Subscriptions listener
    let subUnsub: () => void;
    if (adminUser) {
      subUnsub = onSnapshot(
        collection(db, 'subscriptions'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as UserSubscription);
          setAllSubscriptions(list);
          const own = list.find(
            (s) => s.ownerUid === uid || s.userEmail.toLowerCase() === emailLower
          );
          setMySubscription(own || null);
          setSubLoaded(true);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions')
      );
    } else {
      const mySubQuery = query(
        collection(db, 'subscriptions'),
        where('userEmail', '==', emailLower)
      );
      subUnsub = onSnapshot(
        mySubQuery,
        async (snap) => {
          const docSnap = snap.docs[0];
          if (docSnap) {
            const subData = docSnap.data() as UserSubscription;
            setMySubscription(subData);
            if (subData.ownerUid === 'unclaimed') {
              try {
                await updateDoc(doc(db, 'subscriptions', subData.id), {
                  ownerUid: uid,
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `subscriptions/${subData.id}`);
              }
            }
          } else {
            setMySubscription(null);
          }
          setSubLoaded(true);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions')
      );
    }

    return () => {
      settingsUnsub();
      plansUnsub();
      subUnsub();
    };
  }, [authReady, currentUser, persistLocalSettings]);

  // Automatic expiration check & proxy shutoff
  useEffect(() => {
    if (!currentUser || isAdmin || !subLoaded || !mySubscription) return;
    const subState = getSubscriptionState(mySubscription, nowMs);

    if (subState.isExpired || subState.isBlocked) {
      setCredentialUnlocked(false);

      if (status.running) {
        fetch('/api/stop', { method: 'POST' })
          .then((r) => r.json())
          .then((data: { status?: ServerStatus }) => {
            if (data.status) setStatus(data.status);
          })
          .catch(() => {
            // ignore stop failure
          });
      }

      if (mySubscription.status === 'active' && subState.isExpired) {
        updateDoc(doc(db, 'subscriptions', mySubscription.id), {
          status: 'expired',
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `subscriptions/${mySubscription.id}`);
        });
      }
    }
  }, [currentUser, isAdmin, subLoaded, mySubscription, nowMs, status.running]);

  // Initial IP, status & update checker
  useEffect(() => {
    let active = true;

    async function init() {
      const [ipRes, statusRes] = await Promise.all([
        fetch('/api/ip').catch(() => null),
        fetch('/api/status').catch(() => null),
      ]);

      let detectedIp = 'localhost';
      if (ipRes && ipRes.ok) {
        const ipData = (await ipRes.json()) as { ip: string };
        detectedIp = ipData.ip || 'localhost';
      }

      if (active) {
        setSettings((prev) => {
          const initialIp = prev.autoSaveIp ? prev.ip : detectedIp;
          const initialPort = prev.autoSavePort ? prev.port : '8080';
          setIpInput(initialIp);
          setPortInput(initialPort);
          const next = { ...prev, ip: initialIp, port: initialPort };
          persistLocalSettings(next);
          return next;
        });
      }

      if (statusRes && statusRes.ok && active) {
        const sData = (await statusRes.json()) as ServerStatus;
        setStatus(sData);
      }

      if (!settings.disableAutoUpdater) {
        const today = String(new Date().getDate()).padStart(2, '0');
        if (today !== settings.ignoreUpdateDay) {
          try {
            const updRes = await fetch('/api/check-updates');
            if (updRes.ok && active) {
              const updData = (await updRes.json()) as UpdateInfo;
              if (updData.psxPlaceXmlUrl) {
                setSettings((prev) => {
                  const next = { ...prev, psxPlaceXmlUrl: updData.psxPlaceXmlUrl };
                  persistLocalSettings(next);
                  return next;
                });
              }
              if (updData.updateFound) {
                setUpdateInfo(updData);
                setScreen('update_found');
              }
            }
          } catch {
            // ignore update check failure on startup
          }
        }
      }
    }

    init();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateSettings = async (
    patch: Partial<AppSettings>,
    restartIfRunning = false
  ) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    persistLocalSettings(next);
    if (currentUser) {
      await persistRemoteSettings(currentUser.uid, next);
    }

    if (restartIfRunning && status.running) {
      const validPort = validatePort(portInput) ?? status.port;
      setBusy(true);
      try {
        const res = await fetch('/api/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildProxyPayload(next, ipInput.trim() || status.ip, validPort)),
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          status: ServerStatus;
        };
        if (data.status) setStatus(data.status);
        if (!data.ok && data.error) {
          setErrorIp(`${STRINGS.errorIp} (${ipInput})`);
        }
      } finally {
        setBusy(false);
      }
    }
  };

  const handleToggleServer = async () => {
    setErrorIp('');
    if (status.running) {
      setBusy(true);
      try {
        const res = await fetch('/api/stop', { method: 'POST' });
        const data = (await res.json()) as { status: ServerStatus };
        if (data.status) setStatus(data.status);
      } finally {
        setBusy(false);
      }
      return;
    }

    const validPort = validatePort(portInput);
    if (validPort === null) {
      setErrorPort(STRINGS.invalidPort);
      return;
    }
    setErrorPort('');

    const targetIp = ipInput.trim() || 'localhost';
    const nextSettings = { ...settings, ip: targetIp, port: String(validPort) };
    setSettings(nextSettings);
    persistLocalSettings(nextSettings);
    if (currentUser) {
      await persistRemoteSettings(currentUser.uid, nextSettings);
    }

    setBusy(true);
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildProxyPayload(nextSettings, targetIp, validPort)),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        status: ServerStatus;
      };
      if (data.status) setStatus(data.status);
      if (!data.ok) {
        setErrorIp(`${STRINGS.errorIp} (${targetIp})`);
      }
    } catch {
      setErrorIp(`${STRINGS.errorIp} (${targetIp})`);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateIp = async () => {
    setErrorIp('');
    try {
      const res = await fetch('/api/ip');
      const data = (await res.json()) as { ip: string };
      const detectedIp = data.ip || 'localhost';
      setIpInput(detectedIp);

      if (detectedIp !== settings.ip && status.running) {
        const validPort = validatePort(portInput) ?? status.port;
        const nextSettings = { ...settings, ip: detectedIp, port: String(validPort) };
        setSettings(nextSettings);
        persistLocalSettings(nextSettings);
        if (currentUser) {
          await persistRemoteSettings(currentUser.uid, nextSettings);
        }

        setBusy(true);
        const restartRes = await fetch('/api/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildProxyPayload(nextSettings, detectedIp, validPort)),
        });
        const restartData = (await restartRes.json()) as {
          ok: boolean;
          status: ServerStatus;
        };
        if (restartData.status) setStatus(restartData.status);
        if (!restartData.ok) {
          setErrorIp(`${STRINGS.errorIp} (${detectedIp})`);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUpdatePort = async () => {
    if (!status.running) return;
    const validPort = validatePort(portInput);
    if (validPort === null) {
      setErrorPort(STRINGS.invalidPort);
      return;
    }
    setErrorPort('');

    if (String(validPort) === String(status.port)) return;

    const targetIp = ipInput.trim() || status.ip;
    const nextSettings = { ...settings, ip: targetIp, port: String(validPort) };
    setSettings(nextSettings);
    persistLocalSettings(nextSettings);
    if (currentUser) {
      await persistRemoteSettings(currentUser.uid, nextSettings);
    }

    setBusy(true);
    try {
      const res = await fetch('/api/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildProxyPayload(nextSettings, targetIp, validPort)),
      });
      const data = (await res.json()) as { ok: boolean; status: ServerStatus };
      if (data.status) setStatus(data.status);
      if (!data.ok) {
        setErrorIp(`${STRINGS.errorIp} (${targetIp})`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleIgnoreDay = () => {
    const today = String(new Date().getDate()).padStart(2, '0');
    handleUpdateSettings({ ignoreUpdateDay: today });
    setScreen('main');
  };

  const handleSignOut = async () => {
    if (status.running) {
      await fetch('/api/stop', { method: 'POST' }).catch(() => null);
      setStatus((prev) => ({ ...prev, running: false }));
    }
    setCredentialUnlocked(false);
    setScreen('main');
    await signOut(auth);
  };

  // --- Firebase CRUD Actions for Trial, Credentials & Admin ---
  const handleCreateTrial = async (username: string, password: string) => {
    if (!currentUser || !currentUser.email) return;
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const expiresMillis = Date.now() + 3 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000;
    const subId = currentUser.uid;
    const path = `subscriptions/${subId}`;
    try {
      await setDoc(doc(db, 'subscriptions', subId), {
        id: subId,
        ownerUid: currentUser.uid,
        userEmail: currentUser.email.toLowerCase(),
        username,
        passwordHash,
        passwordSalt: salt,
        planName: 'Teste 3 dias',
        daysOfUse: 3,
        monthlyPriceBrl: 29.9,
        totalPriceBrl: 0,
        status: 'active',
        startsAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(expiresMillis),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleUpdateOwnCredentials = async (username: string, newPassword: string) => {
    if (!currentUser || !mySubscription) return;
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    const path = `subscriptions/${mySubscription.id}`;
    try {
      await updateDoc(doc(db, 'subscriptions', mySubscription.id), {
        username,
        passwordHash,
        passwordSalt: salt,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAdminCreateSubscription = async (data: {
    userEmail: string;
    username: string;
    password: string;
    planName: string;
    daysOfUse: number;
    monthlyPriceBrl: number;
    totalPriceBrl: number;
  }) => {
    if (!currentUser) return;
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const subId = sanitizeId(`sub_${Date.now()}_${data.username}`);
    const now = Date.now();
    const expiresAt = Timestamp.fromMillis(now + data.daysOfUse * 24 * 60 * 60 * 1000);
    const path = `subscriptions/${subId}`;
    try {
      await setDoc(doc(db, 'subscriptions', subId), {
        id: subId,
        ownerUid: 'unclaimed',
        userEmail: data.userEmail.toLowerCase(),
        username: data.username,
        passwordHash,
        passwordSalt: salt,
        planName: data.planName,
        daysOfUse: data.daysOfUse,
        monthlyPriceBrl: data.monthlyPriceBrl,
        totalPriceBrl: data.totalPriceBrl,
        status: 'active',
        startsAt: Timestamp.fromMillis(now),
        expiresAt,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleAdminRenewSubscription = async (sub: UserSubscription, addDays: number) => {
    const baseMs = Math.max(Date.now(), sub.expiresAt ? sub.expiresAt.toMillis() : Date.now());
    const nextExpires = Timestamp.fromMillis(baseMs + addDays * 24 * 60 * 60 * 1000);
    const path = `subscriptions/${sub.id}`;
    try {
      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: 'active',
        expiresAt: nextExpires,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAdminToggleBlock = async (sub: UserSubscription) => {
    const state = getSubscriptionState(sub, nowMs);
    const nextStatus = state.isBlocked ? (state.isExpired ? 'expired' : 'active') : 'blocked';
    const path = `subscriptions/${sub.id}`;
    try {
      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAdminResetPassword = async (sub: UserSubscription, newPass: string) => {
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPass, salt);
    const path = `subscriptions/${sub.id}`;
    try {
      await updateDoc(doc(db, 'subscriptions', sub.id), {
        passwordHash,
        passwordSalt: salt,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAdminDeleteSubscription = async (subId: string) => {
    const path = `subscriptions/${subId}`;
    try {
      await deleteDoc(doc(db, 'subscriptions', subId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAdminCreatePlan = async (data: {
    name: string;
    daysOfUse: number;
    monthlyPriceBrl: number;
    totalPriceBrl: number;
  }) => {
    const planId = sanitizeId(`plan_${Date.now()}_${data.name}`);
    const path = `plans/${planId}`;
    try {
      await setDoc(doc(db, 'plans', planId), {
        id: planId,
        name: data.name,
        daysOfUse: data.daysOfUse,
        monthlyPriceBrl: data.monthlyPriceBrl,
        totalPriceBrl: data.totalPriceBrl,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleSeedDefaultPlans = async () => {
    const defaults = [
      { id: 'plan_mensal_30', name: 'Mensal', daysOfUse: 30, monthlyPriceBrl: 29.9, totalPriceBrl: 29.9 },
      { id: 'plan_trimestral_90', name: 'Trimestral', daysOfUse: 90, monthlyPriceBrl: 24.9, totalPriceBrl: 74.7 },
      { id: 'plan_semestral_180', name: 'Semestral', daysOfUse: 180, monthlyPriceBrl: 21.9, totalPriceBrl: 131.4 },
      { id: 'plan_anual_365', name: 'Anual', daysOfUse: 365, monthlyPriceBrl: 19.9, totalPriceBrl: 238.8 },
    ];
    for (const p of defaults) {
      try {
        await setDoc(doc(db, 'plans', p.id), {
          ...p,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `plans/${p.id}`);
      }
    }
  };

  const handleAdminDeletePlan = async (planId: string) => {
    try {
      await deleteDoc(doc(db, 'plans', planId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `plans/${planId}`);
    }
  };

  const subState = getSubscriptionState(mySubscription, nowMs);
  const needsGate =
    Boolean(currentUser) &&
    !isAdmin &&
    (!subLoaded ||
      !mySubscription ||
      subState.isBlocked ||
      subState.isExpired ||
      !credentialUnlocked);

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#ececec]">
      <main className="flex min-h-screen w-full max-w-[460px] flex-col bg-[#FAFAFA] shadow-lg sm:my-4 sm:min-h-[760px] sm:overflow-hidden sm:rounded">
        {!authReady && (
          <div className="flex flex-1 flex-col">
            <Toolbar title={STRINGS.appName} />
            <div className="flex flex-1 items-center justify-center p-6 text-[15px] text-neutral-600">
              Carregando autenticação...
            </div>
          </div>
        )}

        {authReady && !currentUser && <LoginScreen />}

        {authReady && currentUser && needsGate && !subLoaded && (
          <div className="flex flex-1 flex-col">
            <Toolbar title={STRINGS.appName} />
            <div className="flex flex-1 items-center justify-center p-6 text-[15px] text-neutral-600">
              Verificando assinatura e vencimento...
            </div>
          </div>
        )}

        {authReady && currentUser && needsGate && subLoaded && (
          <AccessGateScreen
            userEmail={currentUser.email || ''}
            subscription={mySubscription}
            plans={plans}
            nowMs={nowMs}
            onCreateTrial={handleCreateTrial}
            onUnlockSuccess={() => setCredentialUnlocked(true)}
            onSignOut={handleSignOut}
          />
        )}

        {authReady && currentUser && !needsGate && (
          <>
            {screen === 'main' && (
              <MainScreen
                status={status}
                ipInput={ipInput}
                portInput={portInput}
                errorIp={errorIp}
                errorPort={errorPort}
                busy={busy}
                isAdmin={isAdmin}
                subscription={mySubscription}
                nowMs={nowMs}
                onIpInputChange={setIpInput}
                onPortInputChange={setPortInput}
                onUpdateIp={handleUpdateIp}
                onUpdatePort={handleUpdatePort}
                onToggleServer={handleToggleServer}
                onNavigate={setScreen}
              />
            )}

            {screen === 'rules' && (
              <RulesScreen
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onBack={() => setScreen('main')}
              />
            )}

            {screen === 'settings' && (
              <SettingsScreen
                settings={settings}
                onUpdateSettings={(patch) => handleUpdateSettings(patch, false)}
                onUpdateFound={(info) => {
                  setUpdateInfo(info);
                  setScreen('update_found');
                }}
                onBack={() => setScreen('main')}
              />
            )}

            {screen === 'logs' && (
              <RealtimeLogsScreen
                seeRequests={settings.seeRequests}
                onBack={() => setScreen('main')}
              />
            )}

            {screen === 'instructions' && (
              <InstructionsScreen onBack={() => setScreen('main')} />
            )}

            {screen === 'credits' && <CreditsScreen onBack={() => setScreen('main')} />}

            {screen === 'update_found' && updateInfo && (
              <UpdateFoundScreen
                updateInfo={updateInfo}
                onIgnoreDay={handleIgnoreDay}
                onBack={() => setScreen('main')}
              />
            )}

            {screen === 'account' && (
              <AccountScreen
                userEmail={currentUser.email || ''}
                isAdmin={isAdmin}
                subscription={mySubscription}
                nowMs={nowMs}
                onUpdateCredentials={handleUpdateOwnCredentials}
                onSignOut={handleSignOut}
                onBack={() => setScreen('main')}
              />
            )}

            {screen === 'admin' && isAdmin && (
              <AdminScreen
                plans={plans}
                subscriptions={allSubscriptions}
                nowMs={nowMs}
                onCreateSubscription={handleAdminCreateSubscription}
                onRenewSubscription={handleAdminRenewSubscription}
                onToggleBlockSubscription={handleAdminToggleBlock}
                onResetSubscriptionPassword={handleAdminResetPassword}
                onDeleteSubscription={handleAdminDeleteSubscription}
                onCreatePlan={handleAdminCreatePlan}
                onSeedDefaultPlans={handleSeedDefaultPlans}
                onDeletePlan={handleAdminDeletePlan}
                onBack={() => setScreen('main')}
              />
            )}
          </>
        )}
      </main>
      <OfflineIndicator />
    </div>
  );
};

export default App;
