import {
  JetBrainsMono_500Medium
} from '@expo-google-fonts/jetbrains-mono';
import {
  LexendDeca_400Regular,
  LexendDeca_500Medium,
  LexendDeca_600SemiBold,
  LexendDeca_700Bold
} from '@expo-google-fonts/lexend-deca';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import React from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { ConnectWalletModal } from './src/components/ConnectWalletModal';
import { GlowBackground } from './src/components/GlowBackground';
import { TabBar } from './src/components/TabBar';
import { Toast } from './src/components/Toast';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { SlabDetailScreen } from './src/screens/SlabDetailScreen';
import { TransferScreen } from './src/screens/TransferScreen';
import { AppProvider, useApp } from './src/state/AppContext';
import {
  applyTheme,
  COLORS,
  type ThemeMode,
  truncateMiddle
} from './src/theme/tokens';
import { TYPE } from './src/theme/typography';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

const THEME_STORAGE_KEY = 'slablock-theme';

function loadInitialTheme(): ThemeMode {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // storage unavailable; fall through to light
  }
  return 'light';
}

// Apply before the first render so every component reads the right palette.
const INITIAL_THEME = loadInitialTheme();
applyTheme(INITIAL_THEME);

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected runtime error'
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.bg,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24
          }}
        >
          <Text style={{ color: COLORS.rose, fontSize: 16 }}>
            SlabLock UI Render Error
          </Text>
          <Text
            style={{
              color: COLORS.inkSecondary,
              fontSize: 13,
              marginTop: 8
            }}
          >
            {this.state.errorMessage}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const ScreenRouter: React.FC = () => {
  const { user, screen } = useApp();

  if (!user || screen === 'SignIn') {
    return <SignInScreen />;
  }

  switch (screen) {
    case 'Home':
      return <HomeScreen />;
    case 'Collection':
      return <CollectionScreen />;
    case 'Scan':
      return <ScanScreen />;
    case 'SlabDetail':
      return <SlabDetailScreen />;
    case 'Transfer':
      return <TransferScreen />;
    case 'Activity':
      return <ActivityScreen />;
    case 'Profile':
      return <ProfileScreen />;
    default:
      return <HomeScreen />;
  }
};

const AppShell: React.FC = () => {
  const {
    wallet,
    setWallet,
    walletModalOpen,
    openWalletModal,
    closeWalletModal,
    showToast,
    backendOnline,
    liveApi,
    isComparisonDemo
  } = useApp();
  const { width } = useWindowDimensions();
  const showDesktopToolbar =
    Platform.OS === 'web' && width >= 900 && !isComparisonDemo;
  const [theme, setTheme] = React.useState<ThemeMode>(INITIAL_THEME);
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
    setTheme(next);
  };

  const coreViewport = (
    <View
      key={theme}
      style={{
        flex: 1,
        width: '100%',
        backgroundColor: COLORS.bg,
        overflow: 'hidden'
      }}
    >
      <GlowBackground />
      <ScreenRouter />
      <TabBar />
      <Toast />
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        minHeight: '100%'
      }}
    >
      <StatusBar barStyle="light-content" />

      {showDesktopToolbar && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: COLORS.toolbarBg,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.line,
            zIndex: 100
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor:
                  liveApi && backendOnline
                    ? COLORS.emeraldSoft
                    : COLORS.amberSoft,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor:
                    liveApi && backendOnline ? COLORS.emerald : COLORS.amber
                }}
              />
              <Text
                style={[
                  TYPE.chip,
                  {
                    color:
                      liveApi && backendOnline
                        ? COLORS.emeraldDark
                        : COLORS.amberDark
                  }
                ]}
              >
                {liveApi && backendOnline
                  ? 'Live Relay: localhost:4000'
                  : 'Relay: Demo Fallback'}
              </Text>
            </View>

          </View>

          {/* Right side: wallet (the app is dark-only, so no theme toggle) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open Web3 wallet modal"
                onPress={openWalletModal}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: wallet ? COLORS.emeraldSoft : COLORS.yellowSoft,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: wallet ? COLORS.emerald : COLORS.yellowDeep
                  }}
                />
                <Text style={[TYPE.chip, { color: COLORS.ink }]}>
                  {wallet
                    ? `${wallet.providerName}: ${truncateMiddle(wallet.address, 6, 4)}`
                    : 'Connect Web3 Wallet'}
                </Text>
              </TouchableOpacity>
          </View>
        </View>
      )}

      {coreViewport}

      <ConnectWalletModal
        visible={walletModalOpen}
        currentWallet={wallet}
        onClose={closeWalletModal}
        onConnected={(connected) => {
          setWallet(connected);
          closeWalletModal();
          showToast(
            `Connected ${connected.providerName} (${truncateMiddle(connected.address, 6, 4)})`
          );
        }}
        onDisconnect={() => {
          setWallet(null);
          closeWalletModal();
          showToast('Wallet disconnected');
        }}
      />
    </SafeAreaView>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_500Medium,
    LexendDeca_600SemiBold,
    LexendDeca_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    JetBrainsMono_500Medium
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  }

  return (
    <RootErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </RootErrorBoundary>
  );
}
