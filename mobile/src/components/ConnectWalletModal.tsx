import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CARD_SHADOW, COLORS, truncateMiddle } from '../theme/tokens';
import { TYPE } from '../theme/typography';
import {
  type ConnectedWalletState,
  connectCustomWalletAddress,
  connectEmbeddedSignerWallet,
  connectInjectedWallet,
  detectInjectedWalletName,
  hasInjectedWallet
} from '../web3/wallet';
import { Icon } from './Icon';

interface ConnectWalletModalProps {
  visible: boolean;
  currentWallet: ConnectedWalletState | null;
  onClose: () => void;
  onConnected: (wallet: ConnectedWalletState) => void;
  onDisconnect: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  visible,
  currentWallet,
  onClose,
  onConnected,
  onDisconnect
}) => {
  const [busy, setBusy] = useState<boolean>(false);
  const [customAddr, setCustomAddr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const injectedAvailable = hasInjectedWallet();
  const injectedName = detectInjectedWalletName();

  const handleInjected = async () => {
    if (busy) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      const state = await connectInjectedWallet();
      setBusy(false);
      onConnected(state);
    } catch (err: unknown) {
      setBusy(false);
      setErrorMsg(
        err instanceof Error ? err.message : 'Browser wallet connection failed.'
      );
    }
  };

  const handleEmbedded = async (rotate = false) => {
    if (busy) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      const state = await connectEmbeddedSignerWallet(rotate);
      setBusy(false);
      onConnected(state);
    } catch (err: unknown) {
      setBusy(false);
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to initialize signer.'
      );
    }
  };

  const handleCustomAddress = () => {
    setErrorMsg(null);
    try {
      const state = connectCustomWalletAddress(customAddr);
      setCustomAddr('');
      onConnected(state);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Invalid EVM wallet address.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}
      >
        <View
          style={[
            CARD_SHADOW,
            {
              width: '100%',
              maxWidth: 420,
              borderRadius: 24,
              padding: 24
            }
          ]}
        >
          <Text style={[TYPE.h2, { color: COLORS.ink }]}>
            Connect Web3 Wallet
          </Text>
          <Text
            style={[
              TYPE.small,
              { color: COLORS.inkSecondary, marginTop: 4, marginBottom: 16 }
            ]}
          >
            Polygon Amoy (Chain ID 80002) • EIP-712 Custody Signer
          </Text>

          {currentWallet && (
            <View
              style={{
                backgroundColor: COLORS.emeraldSoft,
                borderRadius: 16,
                padding: 12,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.smallSemiBold, { color: COLORS.emeraldDark }]}>
                  Active: {currentWallet.providerName}
                </Text>
                <Text style={[TYPE.mono, { color: COLORS.ink, marginTop: 2 }]}>
                  {truncateMiddle(currentWallet.address, 10, 6)}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Disconnect active wallet"
                onPress={onDisconnect}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: COLORS.cardHi
                }}
              >
                <Text style={[TYPE.chip, { color: COLORS.rose }]}>
                  Disconnect
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {busy ? (
            <View
              style={{
                paddingVertical: 28,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
            >
              <ActivityIndicator size="large" color={COLORS.yellowDeep} />
              <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                Requesting wallet signature…
              </Text>
            </View>
          ) : (
            <>
              {/* Option 1: Browser Extension (MetaMask / Rabby / EIP-1193) */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Connect ${injectedName}`}
                onPress={handleInjected}
                activeOpacity={0.82}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: COLORS.bg,
                  marginBottom: 10
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: COLORS.yellowSoft,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon name="shield" size={20} color={COLORS.yellowDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                    {injectedAvailable
                      ? `${injectedName} (Detected)`
                      : 'Browser Wallet (MetaMask / Rabby)'}
                  </Text>
                  <Text
                    style={[
                      TYPE.small,
                      { color: COLORS.inkSecondary, marginTop: 2 }
                    ]}
                  >
                    Connect via EIP-1193 provider & switch to Polygon Amoy
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Embedded viem Cryptographic Signer */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Connect Embedded Web3 Signer"
                onPress={() => handleEmbedded(false)}
                activeOpacity={0.82}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: COLORS.bg,
                  marginBottom: 12
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: COLORS.emeraldSoft,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon name="check" size={20} color={COLORS.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                    Embedded Mobile Signer (viem)
                  </Text>
                  <Text
                    style={[
                      TYPE.small,
                      { color: COLORS.inkSecondary, marginTop: 2 }
                    ]}
                  >
                    Real secp256k1 keypair for mobile & extensionless signing
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Custom 0x Address */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: COLORS.line,
                  paddingTop: 12,
                  marginBottom: 8
                }}
              >
                <Text
                  style={[
                    TYPE.small,
                    { color: COLORS.inkSecondary, marginBottom: 6 }
                  ]}
                >
                  Or connect an existing Polygon wallet address:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={customAddr}
                    onChangeText={setCustomAddr}
                    placeholder="0x7099...79C8"
                    placeholderTextColor={COLORS.inkMuted}
                    autoCapitalize="none"
                    style={[
                      TYPE.mono,
                      {
                        flex: 1,
                        backgroundColor: COLORS.bg,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: COLORS.ink
                      }
                    ]}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Import wallet address"
                    onPress={handleCustomAddress}
                    style={{
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: COLORS.yellow,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={[TYPE.chip, { color: COLORS.onAccent }]}>
                      Connect
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {errorMsg && (
                <Text
                  style={[
                    TYPE.small,
                    {
                      color: COLORS.rose,
                      marginTop: 6,
                      marginBottom: 6,
                      textAlign: 'center'
                    }
                  ]}
                >
                  {errorMsg}
                </Text>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={onClose}
                style={{
                  minHeight: 42,
                  marginTop: 6,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={[TYPE.button, { color: COLORS.inkSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
