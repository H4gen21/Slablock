import * as Clipboard from 'expo-clipboard';
import React from 'react';
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { useApp } from '../state/AppContext';
import { CARD_SHADOW, COLORS, truncateMiddle } from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';

export const ProfileScreen: React.FC = () => {
  const {
    user,
    setUser,
    liveApi,
    setLiveApi,
    backendOnline,
    refreshLiveSlabs,
    showToast,
    wallet,
    openWalletModal,
    isComparisonDemo,
    demoMode,
    setDemoMode
  } = useApp();

  const email = user?.email || 'alex.tan@slablock.io';
  const name = user?.name || 'Alex Tan';
  const initials = user?.initials || 'AT';
  const avatarColor = user?.color || COLORS.ink;
  const activeWalletAddress =
    wallet?.address ||
    user?.walletAddress ||
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  const handleCopyWallet = async () => {
    try {
      await Clipboard.setStringAsync(activeWalletAddress);
      showToast('Copied wallet address');
    } catch {
      showToast('Copied wallet address');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 132,
        maxWidth: 1040,
        width: '100%',
        alignSelf: 'center'
      }}
      style={{ flex: 1 }}
    >
      <Text style={[TYPE.h1, { color: COLORS.ink, marginBottom: 16 }]}>
        Profile
      </Text>

      {/* User Card */}
      <View
        style={[
          CARD_SHADOW,
          {
            borderRadius: 20,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16
          }
        ]}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            backgroundColor: avatarColor,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontSize: 18,
              fontFamily: FONT_FAMILIES.lexendBold
            }}
          >
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.h3, { color: COLORS.ink }]}>{name}</Text>
          <Text
            style={[
              TYPE.small,
              {
                color: COLORS.inkSecondary,
                marginTop: 2
              }
            ]}
          >
            Signed in with Google as {email}
          </Text>
        </View>
      </View>

      {/* Wallet & Network Card */}
      <View
        style={[
          CARD_SHADOW,
          {
            borderRadius: 20,
            padding: 18,
            marginBottom: 16
          }
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.line
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[TYPE.small, { color: COLORS.inkSecondary }]}>
              {wallet ? `Wallet (${wallet.providerName})` : 'Wallet'}
            </Text>
            <Text
              style={[
                TYPE.mono,
                {
                  color: COLORS.ink,
                  marginTop: 3
                }
              ]}
            >
              {truncateMiddle(activeWalletAddress, 8, 6)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!isComparisonDemo && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Connect or change Web3 wallet"
                onPress={openWalletModal}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: COLORS.yellow,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon name="shield" size={15} color={COLORS.onAccent} />
                <Text style={[TYPE.chip, { color: COLORS.onAccent }]}>
                  {wallet ? 'Switch' : 'Connect'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Copy wallet address"
              onPress={handleCopyWallet}
              style={{
                minWidth: 44,
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: COLORS.yellowSoft,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icon name="copy" size={15} color={COLORS.ink} />
              <Text style={[TYPE.chip, { color: COLORS.ink }]}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 14
          }}
        >
          <View>
            <Text style={[TYPE.small, { color: COLORS.inkSecondary }]}>
              Network
            </Text>
            <Text
              style={[
                TYPE.listItemTitle,
                {
                  color: COLORS.ink,
                  marginTop: 3
                }
              ]}
            >
              {wallet?.chainName || 'Polygon Amoy testnet'}
            </Text>
          </View>
          {wallet ? (
            <Chip label="Connected" tone="emerald" dot />
          ) : (
            <Chip label="Not connected" tone="brand" dot />
          )}
        </View>
      </View>

      {/* Use local API switch */}
      <View
        style={[
          CARD_SHADOW,
          {
            borderRadius: 20,
            padding: 18,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14
          }
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
            Use local API
          </Text>
          <Text
            style={[
              TYPE.small,
              {
                color: COLORS.inkSecondary,
                marginTop: 3
              }
            ]}
          >
            {isComparisonDemo
              ? 'Send scans to localhost:3000 instead of built-in demo data'
              : backendOnline
                ? 'Connected to live SlabLock Fastify relay (localhost:4000)'
                : 'Send scans to live SlabLock relay instead of built-in demo data'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Use local API"
          value={liveApi}
          onValueChange={(next) => {
            setLiveApi(next);
            if (next) {
              refreshLiveSlabs().catch(() => undefined);
            }
          }}
          trackColor={{ false: COLORS.line, true: COLORS.yellow }}
          thumbColor={liveApi ? COLORS.ink : COLORS.white}
          {...({ activeThumbColor: COLORS.ink } as object)}
        />
      </View>

      {/* Demo data switch: seeded slabs are labelled "Demo" here only. */}
      <View
        style={[
          CARD_SHADOW,
          {
            borderRadius: 20,
            padding: 18,
            marginBottom: 24,
            marginTop: -12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14
          }
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
              Demo slabs
            </Text>
            <Chip label="Demo" tone="slate" />
          </View>
          <Text style={[TYPE.small, { color: COLORS.inkSecondary, marginTop: 3 }]}>
            {demoMode
              ? 'Sample slabs, a sample transfer and simulated taps are on. They are not part of your real collection.'
              : 'Add sample slabs and turn on simulated recipient taps, for trying the app without a chip.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Demo slabs"
          value={demoMode}
          onValueChange={setDemoMode}
          trackColor={{ false: COLORS.line, true: COLORS.yellow }}
          thumbColor={demoMode ? COLORS.ink : COLORS.white}
          {...({ activeThumbColor: COLORS.ink } as object)}
        />
      </View>

      {/* Sign out */}
      <Button
        label="Sign out"
        variant="outline"
        icon={<Icon name="logout" size={18} color={COLORS.ink} />}
        onPress={() => {
          setUser(null);
          showToast('Signed out');
        }}
        style={{ width: '100%' }}
      />
    </ScrollView>
  );
};
