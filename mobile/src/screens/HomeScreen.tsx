import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { Button } from '../components/Button';
import { HighGradesBanner } from '../components/HighGradesBanner';
import { Icon } from '../components/Icon';
import { OngoingTransactions } from '../components/OngoingTransactions';
import { EmptySlabsCard, SlabGrid } from '../components/SlabGrid';
import { useApp } from '../state/AppContext';
import { CARD_SHADOW, COLORS, truncateMiddle } from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';

/** Header pill: yellow dot when disconnected, green dot with the short address when connected. */
export const WalletPill: React.FC = () => {
  const { wallet, connectMockWallet, openWalletModal } = useApp();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={
        wallet
          ? `Wallet ${truncateMiddle(wallet.address, 6, 4)}. Manage wallet`
          : 'Connect wallet'
      }
      onPress={wallet ? openWalletModal : connectMockWallet}
      style={[
        CARD_SHADOW,
        {
          height: 44,
          paddingHorizontal: 14,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8
        }
      ]}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: wallet ? COLORS.emerald : COLORS.yellowDeep
        }}
      />
      <Text style={[wallet ? TYPE.mono : TYPE.chip, { color: COLORS.ink }]}>
        {wallet ? truncateMiddle(wallet.address, 6, 4) : 'Connect wallet'}
      </Text>
    </TouchableOpacity>
  );
};

export const HomeScreen: React.FC = () => {
  const {
    user,
    slabs,
    navigate,
    openSlabDetail,
    transfers,
    openTransfer,
    viewportMode
  } = useApp();
  const { width } = useWindowDimensions();
  const isWide = width >= 900 && viewportMode !== 'mobile';

  const firstName = user?.firstName || 'Alex';
  const initials = user?.initials || 'AT';
  const avatarColor = user?.color || COLORS.ink;

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 132,
        maxWidth: 1040,
        width: '100%',
        alignSelf: 'center'
      }}
      style={{ flex: 1 }}
    >
      {/* Header: avatar, greeting, wallet pill, bell */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 10
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => navigate('Profile')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: avatarColor,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontSize: 15,
                fontFamily: FONT_FAMILIES.lexendBold
              }}
            >
              {initials}
            </Text>
          </TouchableOpacity>
          <View style={{ flexShrink: 1 }}>
            <Text style={[TYPE.small, { color: COLORS.inkSecondary }]}>
              Hello!
            </Text>
            <Text numberOfLines={1} style={[TYPE.h2, { color: COLORS.ink }]}>
              {firstName}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <WalletPill />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => navigate('Activity')}
            style={[
              CARD_SHADOW,
              {
                width: 44,
                height: 44,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center'
              }
            ]}
          >
            <Icon name="bell" size={20} color={COLORS.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <HighGradesBanner
        slabs={slabs}
        onViewSlab={(slab) => openSlabDetail(slab, false)}
        onScan={() => navigate('Scan')}
      />

      <Button
        label="Scan a slab"
        variant="primary"
        icon={<Icon name="nfc" size={18} color={COLORS.onAccent} />}
        onPress={() => navigate('Scan')}
        style={{ width: '100%', marginTop: 16, marginBottom: 28 }}
      />

      <View style={{ marginBottom: 28 }}>
        <OngoingTransactions
          transfers={transfers}
          onOpen={(t) => openTransfer(t.slabKey)}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12
        }}
      >
        <Text style={[TYPE.sectionHeading, { color: COLORS.ink }]}>
          Your collection
        </Text>
        {slabs.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="See all"
            onPress={() => navigate('Collection')}
            style={{
              minHeight: 44,
              paddingHorizontal: 8,
              justifyContent: 'center'
            }}
          >
            <Text style={[TYPE.smallSemiBold, { color: COLORS.ink }]}>
              See all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {slabs.length === 0 ? (
        <EmptySlabsCard onScan={() => navigate('Scan')} />
      ) : (
        <SlabGrid
          slabs={slabs}
          columns={isWide ? 2 : 1}
          onPressSlab={(picked) => openSlabDetail(picked, false)}
        />
      )}
    </ScrollView>
  );
};
