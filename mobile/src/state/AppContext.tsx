import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  cancelTransfer,
  confirmRecipientTap,
  startTransfer,
  TRANSFER_WINDOW_SECONDS,
  type TransferRecord
} from '../api/transfer';
import { fetchLiveSlabs } from '../api/verify';
import {
  loadSavedGoogleUser,
  MOCK_GOOGLE_ACCOUNTS,
  saveGoogleUser,
  type User
} from '../auth/mockGoogle';
import {
  type ActivityEvent,
  DEMO_RECIPIENT,
  DEMO_WALLET_ADDRESS,
  SEED_EVENTS,
  SLABS,
  type SlabItem
} from '../data/demo';
import type { ParsedSunUrl } from '../nfc/sunReader';
import { truncateMiddle } from '../theme/tokens';
import {
  type ConnectedWalletState,
  loadSavedWalletState,
  saveWalletState
} from '../web3/wallet';
import { loadJson, saveJson } from './storage';

export type ScreenName =
  | 'SignIn'
  | 'Home'
  | 'Collection'
  | 'Scan'
  | 'SlabDetail'
  | 'Transfer'
  | 'Activity'
  | 'Profile';

export type CollectionFilter = 'All' | 'Sealed' | 'In transit';

export type ViewportMode = 'responsive' | 'mobile';

export interface SelectedSlabState {
  slab: SlabItem;
  fresh: boolean;
}

const TRANSFERS_STORAGE_KEY = 'slablock-transfers';
const DEMO_STORAGE_KEY = 'slablock-demo-mode';

/** Seeded pending transfer so the demo shows one ongoing transaction. */
function buildDemoTransfers(): TransferRecord[] {
  const startedAt = Date.now() - 18_000;
  const illustrator = SLABS.find((s) => s.key === 'illustrator')!;
  return [
    {
      id: 'demo_trf_illustrator',
      slabKey: illustrator.key,
      from: illustrator.ownerAddress || DEMO_WALLET_ADDRESS,
      to: DEMO_RECIPIENT,
      startedAt,
      deadline: startedAt + TRANSFER_WINDOW_SECONDS * 1000,
      status: 'PENDING',
      slabShort: illustrator.short,
      tagUid: illustrator.tagUid
    }
  ];
}

function isDemoId(id: string): boolean {
  return id.startsWith('demo_');
}

interface InitialDeepLinkState {
  user: User | null;
  screen: ScreenName;
  lastScan: SelectedSlabState | null;
  transferSlabKey: string | null;
  initialReplayError: string | null;
  isComparisonDemo: boolean;
}

function getInitialDeepLinkState(): InitialDeepLinkState {
  const savedUser = loadSavedGoogleUser();
  const defaultState: InitialDeepLinkState = {
    user: savedUser,
    screen: savedUser ? 'Home' : 'SignIn',
    lastScan: null,
    transferSlabKey: null,
    initialReplayError: null,
    isComparisonDemo: false
  };

  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return defaultState;
  }

  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  const screenParam = (params.get('screen') || '').toLowerCase();

  if (demo !== '1' && !screenParam) {
    return defaultState;
  }

  const alex = MOCK_GOOGLE_ACCOUNTS[0];
  const signedIn = { ...defaultState, user: alex, isComparisonDemo: true };

  switch (screenParam) {
    case 'signin':
      return {
        ...defaultState,
        user: null,
        screen: 'SignIn',
        isComparisonDemo: true
      };
    case 'collection':
      return { ...signedIn, screen: 'Collection' };
    case 'scan':
      return { ...signedIn, screen: 'Scan' };
    case 'activity':
      return { ...signedIn, screen: 'Activity' };
    case 'profile':
      return { ...signedIn, screen: 'Profile' };
    case 'detail-charizard':
      return {
        ...signedIn,
        screen: 'SlabDetail',
        lastScan: {
          slab: { ...SLABS[0], readCounter: 12, checked: 'Just now' },
          fresh: true
        }
      };
    case 'detail-pikachu':
      return {
        ...signedIn,
        screen: 'SlabDetail',
        lastScan: {
          slab: { ...SLABS[1], readCounter: 22, checked: 'Just now' },
          fresh: true
        }
      };
    case 'transfer':
      return {
        ...signedIn,
        screen: 'Transfer',
        lastScan: { slab: SLABS[3], fresh: false },
        transferSlabKey: SLABS[3].key
      };
    case 'replay':
      return {
        ...signedIn,
        screen: 'Scan',
        initialReplayError:
          'Read counter 1 is less than or equal to last authenticated counter (5).'
      };
    case 'home':
    default:
      return { ...signedIn, screen: 'Home' };
  }
}

interface AppContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  screen: ScreenName;
  navigate: (screen: ScreenName) => void;
  liveApi: boolean;
  setLiveApi: (live: boolean) => void;
  backendOnline: boolean;
  refreshLiveSlabs: () => Promise<void>;
  filter: CollectionFilter;
  setFilter: (filter: CollectionFilter) => void;
  events: ActivityEvent[];
  addEvent: (event: Omit<ActivityEvent, 'id'>) => void;
  /** Only slabs scanned or added this session (plus demo seeds when demo is on). */
  slabs: SlabItem[];
  upsertSlab: (slab: SlabItem) => void;
  lastScan: SelectedSlabState | null;
  openSlabDetail: (slab: SlabItem, fresh?: boolean) => void;
  /** Resolves a slab by key from the live collection, falling back to lastScan. */
  findSlab: (key: string) => SlabItem | undefined;
  toast: string | null;
  showToast: (message: string) => void;
  reduceMotion: boolean;
  initialReplayError: string | null;
  wallet: ConnectedWalletState | null;
  setWallet: (wallet: ConnectedWalletState | null) => void;
  connectMockWallet: () => void;
  walletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  isComparisonDemo: boolean;
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;
  transfers: TransferRecord[];
  transferSlabKey: string | null;
  openTransfer: (slabKey: string) => void;
  beginTransfer: (slab: SlabItem, to: string) => Promise<TransferRecord>;
  completeTransfer: (transferId: string, payload: ParsedSunUrl) => Promise<void>;
  cancelPendingTransfer: (transferId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const init = useMemo(() => getInitialDeepLinkState(), []);
  const initialDemo = init.isComparisonDemo;

  const [user, setUserState] = useState<User | null>(init.user);
  const [screen, setScreen] = useState<ScreenName>(init.screen);
  const [liveApi, setLiveApi] = useState<boolean>(!init.isComparisonDemo);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [filter, setFilter] = useState<CollectionFilter>('All');
  const [demoMode, setDemoModeState] = useState<boolean>(initialDemo);
  const [events, setEvents] = useState<ActivityEvent[]>(
    initialDemo ? SEED_EVENTS : []
  );
  const [slabs, setSlabs] = useState<SlabItem[]>(initialDemo ? SLABS : []);
  const [transfers, setTransfers] = useState<TransferRecord[]>(() =>
    initialDemo ? buildDemoTransfers() : []
  );
  const [transferSlabKey, setTransferSlabKey] = useState<string | null>(
    init.transferSlabKey
  );
  const [lastScan, setLastScan] = useState<SelectedSlabState | null>(
    init.lastScan
  );
  const [toast, setToast] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [wallet, setWalletState] = useState<ConnectedWalletState | null>(() =>
    init.isComparisonDemo ? null : loadSavedWalletState()
  );
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transfersRef = useRef<TransferRecord[]>(transfers);
  const slabsRef = useRef<SlabItem[]>(slabs);
  const storageLoaded = useRef<boolean>(false);

  transfersRef.current = transfers;
  slabsRef.current = slabs;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => undefined);

    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      }
    );

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const addEvent = useCallback((event: Omit<ActivityEvent, 'id'>) => {
    setEvents((prev) => [
      {
        ...event,
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      },
      ...prev
    ]);
  }, []);

  const upsertSlab = useCallback((updated: SlabItem) => {
    setSlabs((prev) => {
      const idx = prev.findIndex(
        (s) =>
          s.key === updated.key ||
          s.tagUid.toUpperCase() === updated.tagUid.toUpperCase()
      );
      if (idx === -1) {
        return [updated, ...prev];
      }
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    setLastScan((prev) =>
      prev && prev.slab.key === updated.key ? { ...prev, slab: updated } : prev
    );
  }, []);

  /** Updates a slab only if it is already known (collection or open detail). */
  const patchSlab = useCallback((key: string, patch: Partial<SlabItem>) => {
    setSlabs((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
    setLastScan((prev) =>
      prev && prev.slab.key === key
        ? { ...prev, slab: { ...prev.slab, ...patch } }
        : prev
    );
  }, []);

  const findSlab = useCallback(
    (key: string) =>
      slabs.find((s) => s.key === key) ??
      (lastScan?.slab.key === key ? lastScan.slab : undefined),
    [slabs, lastScan]
  );

  // ----- Demo flag -------------------------------------------------------

  const applyDemoMode = useCallback((on: boolean) => {
    setDemoModeState(on);
    if (on) {
      setSlabs((prev) => [
        ...prev,
        ...SLABS.filter((seed) => !prev.some((s) => s.key === seed.key))
      ]);
      setEvents((prev) => [
        ...prev,
        ...SEED_EVENTS.filter((seed) => !prev.some((e) => e.id === seed.id))
      ]);
      setTransfers((prev) =>
        prev.some((t) => isDemoId(t.id))
          ? prev
          : [...buildDemoTransfers(), ...prev]
      );
    } else {
      setSlabs((prev) => prev.filter((s) => !s.demo));
      setEvents((prev) => prev.filter((e) => !isDemoId(e.id)));
      setTransfers((prev) => prev.filter((t) => !isDemoId(t.id)));
    }
  }, []);

  const setDemoMode = useCallback(
    (on: boolean) => {
      applyDemoMode(on);
      if (!init.isComparisonDemo) {
        saveJson(DEMO_STORAGE_KEY, on).catch(() => undefined);
      }
    },
    [applyDemoMode, init.isComparisonDemo]
  );

  // ----- Persistence -------------------------------------------------------

  useEffect(() => {
    if (init.isComparisonDemo) {
      storageLoaded.current = true;
      return;
    }
    let cancelled = false;
    Promise.all([
      loadJson<TransferRecord[]>(TRANSFERS_STORAGE_KEY),
      loadJson<boolean>(DEMO_STORAGE_KEY)
    ]).then(([savedTransfers, savedDemo]) => {
      if (cancelled) return;
      if (Array.isArray(savedTransfers) && savedTransfers.length > 0) {
        setTransfers((prev) => [
          ...prev,
          ...savedTransfers.filter(
            (t) => !isDemoId(t.id) && !prev.some((p) => p.id === t.id)
          )
        ]);
      }
      if (savedDemo === true) {
        applyDemoMode(true);
      }
      storageLoaded.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [init.isComparisonDemo, applyDemoMode]);

  useEffect(() => {
    if (!storageLoaded.current || init.isComparisonDemo) return;
    saveJson(
      TRANSFERS_STORAGE_KEY,
      transfers.filter((t) => !isDemoId(t.id))
    ).catch(() => undefined);
  }, [transfers, init.isComparisonDemo]);

  // ----- Live relay ----------------------------------------------------------

  const refreshLiveSlabs = useCallback(async () => {
    if (init.isComparisonDemo) return;
    const res = await fetchLiveSlabs(slabsRef.current);
    setBackendOnline(res.online);
    if (res.online) {
      setSlabs(res.slabs);
    }
  }, [init.isComparisonDemo]);

  useEffect(() => {
    if (!init.isComparisonDemo && liveApi) {
      refreshLiveSlabs().catch(() => undefined);
    }
  }, [init.isComparisonDemo, liveApi, refreshLiveSlabs]);

  // ----- Session / wallet ---------------------------------------------------

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    saveGoogleUser(nextUser);
    if (!nextUser) {
      setScreen('SignIn');
    }
  }, []);

  const setWallet = useCallback(
    (nextWallet: ConnectedWalletState | null) => {
      setWalletState(nextWallet);
      saveWalletState(nextWallet);
      if (nextWallet && user) {
        const updatedUser: User = {
          ...user,
          walletAddress: nextWallet.address
        };
        setUserState(updatedUser);
        saveGoogleUser(updatedUser);
      }
    },
    [user]
  );

  const connectMockWallet = useCallback(() => {
    const mock: ConnectedWalletState = {
      address: DEMO_WALLET_ADDRESS,
      providerName: 'Demo wallet',
      chainId: 80002,
      chainName: 'Polygon Amoy testnet',
      kind: 'custom'
    };
    setWallet(mock);
    showToast(`Wallet connected (${truncateMiddle(mock.address, 6, 4)})`);
  }, [setWallet, showToast]);

  const openWalletModal = useCallback(() => {
    setWalletModalOpen(true);
  }, []);

  const closeWalletModal = useCallback(() => {
    setWalletModalOpen(false);
  }, []);

  const navigate = useCallback((nextScreen: ScreenName) => {
    setScreen(nextScreen);
  }, []);

  const openSlabDetail = useCallback((slab: SlabItem, fresh = false) => {
    setLastScan({ slab, fresh });
    setScreen('SlabDetail');
  }, []);

  // ----- Transfers ---------------------------------------------------------

  const openTransfer = useCallback((slabKey: string) => {
    setTransferSlabKey(slabKey);
    setScreen('Transfer');
  }, []);

  const updateTransfer = useCallback(
    (id: string, patch: Partial<TransferRecord>) => {
      setTransfers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    },
    []
  );

  const beginTransfer = useCallback(
    async (slab: SlabItem, to: string) => {
      const from = slab.ownerAddress || wallet?.address || DEMO_WALLET_ADDRESS;
      const record = await startTransfer({ slab, from, to });
      setTransfers((prev) => [record, ...prev]);
      upsertSlab({
        ...slab,
        onChainState: 'IN_TRANSIT',
        tone: 'amber',
        stateNote: `Custody transfer to ${truncateMiddle(to, 6, 4)} started. Waiting for the recipient to tap the slab.`
      });
      addEvent({
        tone: 'amber',
        title: `Transfer started • ${slab.short}`,
        subtitle: `Waiting for ${truncateMiddle(to, 6, 4)} to tap the slab`,
        time: 'Just now'
      });
      return record;
    },
    [wallet, upsertSlab, addEvent]
  );

  const completeTransfer = useCallback(
    async (transferId: string, payload: ParsedSunUrl) => {
      const transfer = transfersRef.current.find((t) => t.id === transferId);
      if (!transfer) throw new Error('Transfer not found.');
      const result = await confirmRecipientTap(payload, transfer);
      updateTransfer(transferId, { status: 'COMPLETED' });
      patchSlab(transfer.slabKey, {
        ownerAddress: result.newOwner,
        onChainState: 'SEALED',
        tone: 'emerald',
        stateNote: `Ownership moved to ${truncateMiddle(result.newOwner, 6, 4)} by NFC tap.`
      });
      addEvent({
        tone: 'emerald',
        title: `Transfer completed • ${transfer.slabShort ?? 'Slab'}`,
        subtitle: `New owner ${truncateMiddle(result.newOwner, 6, 4)} • Tx ${truncateMiddle(result.txHash, 8, 6)}`,
        time: 'Just now'
      });
    },
    [updateTransfer, patchSlab, addEvent]
  );

  const cancelPendingTransfer = useCallback(
    async (transferId: string) => {
      const transfer = transfersRef.current.find((t) => t.id === transferId);
      if (!transfer) return;
      await cancelTransfer(transfer);
      updateTransfer(transferId, { status: 'CANCELLED' });
      patchSlab(transfer.slabKey, {
        onChainState: 'SEALED',
        tone: 'emerald',
        stateNote: 'Transfer cancelled. The slab stays with its current owner.'
      });
      addEvent({
        tone: 'slate',
        title: `Transfer cancelled • ${transfer.slabShort ?? 'Slab'}`,
        subtitle: `${truncateMiddle(transfer.to, 6, 4)} was not added as owner`,
        time: 'Just now'
      });
    },
    [updateTransfer, patchSlab, addEvent]
  );

  const hasPending = transfers.some((t) => t.status === 'PENDING');

  // Expire pending transfers once their 120 s window passes.
  useEffect(() => {
    if (!hasPending) return;
    const tick = () => {
      const now = Date.now();
      const expired = transfersRef.current.filter(
        (t) => t.status === 'PENDING' && now >= t.deadline
      );
      for (const t of expired) {
        updateTransfer(t.id, { status: 'EXPIRED' });
        patchSlab(t.slabKey, {
          onChainState: 'SEALED',
          tone: 'emerald',
          ownerAddress: t.from,
          stateNote:
            'The last transfer expired before the recipient tapped. The slab stays with its current owner.'
        });
        addEvent({
          tone: 'rose',
          title: `Transfer expired • ${t.slabShort ?? 'Slab'}`,
          subtitle: `${truncateMiddle(t.to, 6, 4)} did not tap within 120 s`,
          time: 'Just now'
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hasPending, updateTransfer, patchSlab, addEvent]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      setUser,
      screen,
      navigate,
      liveApi,
      setLiveApi,
      backendOnline,
      refreshLiveSlabs,
      filter,
      setFilter,
      events,
      addEvent,
      slabs,
      upsertSlab,
      lastScan,
      openSlabDetail,
      findSlab,
      toast,
      showToast,
      reduceMotion,
      initialReplayError: init.initialReplayError,
      wallet,
      setWallet,
      connectMockWallet,
      walletModalOpen,
      openWalletModal,
      closeWalletModal,
      viewportMode,
      setViewportMode,
      isComparisonDemo: init.isComparisonDemo,
      demoMode,
      setDemoMode,
      transfers,
      transferSlabKey,
      openTransfer,
      beginTransfer,
      completeTransfer,
      cancelPendingTransfer
    }),
    [
      user,
      setUser,
      screen,
      navigate,
      liveApi,
      backendOnline,
      refreshLiveSlabs,
      filter,
      events,
      addEvent,
      slabs,
      upsertSlab,
      lastScan,
      openSlabDetail,
      findSlab,
      toast,
      showToast,
      reduceMotion,
      init.initialReplayError,
      wallet,
      setWallet,
      connectMockWallet,
      walletModalOpen,
      openWalletModal,
      closeWalletModal,
      viewportMode,
      init.isComparisonDemo,
      demoMode,
      setDemoMode,
      transfers,
      transferSlabKey,
      openTransfer,
      beginTransfer,
      completeTransfer,
      cancelPendingTransfer
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return ctx;
}
