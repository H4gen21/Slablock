import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  GOOGLE_OAUTH_CLIENT_ID,
  MOCK_GOOGLE_ACCOUNTS,
  signInWithCustomGoogleAccount,
  signInWithGoogle,
  signInWithRealGoogleOAuthPopup,
  type User
} from '../auth/mockGoogle';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';
import { Icon } from './Icon';

interface AccountChooserModalProps {
  visible: boolean;
  onClose: () => void;
  onSignedIn: (user: User) => void;
}

export const AccountChooserModal: React.FC<AccountChooserModalProps> = ({
  visible,
  onClose,
  onSignedIn
}) => {
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [oauthClientId, setOauthClientId] = useState<string>(
    GOOGLE_OAUTH_CLIENT_ID
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePick = async (index: number) => {
    if (signingIn) return;
    setErrorMsg(null);
    setSigningIn(true);
    try {
      const user = await signInWithGoogle(index);
      setSigningIn(false);
      onSignedIn(user);
    } catch {
      setSigningIn(false);
    }
  };

  const handleCustomSignIn = async () => {
    if (signingIn) return;
    setErrorMsg(null);
    setSigningIn(true);
    try {
      const user = await signInWithCustomGoogleAccount({
        email: customEmail,
        name: customName
      });
      setSigningIn(false);
      setShowCustomForm(false);
      onSignedIn(user);
    } catch (err: unknown) {
      setSigningIn(false);
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to sign in with Google.'
      );
    }
  };

  const handleRealOAuthPopup = async () => {
    if (signingIn) return;
    setErrorMsg(null);
    setSigningIn(true);
    try {
      const user = await signInWithRealGoogleOAuthPopup(oauthClientId);
      setSigningIn(false);
      setShowCustomForm(false);
      onSignedIn(user);
    } catch (err: unknown) {
      setSigningIn(false);
      setErrorMsg(
        err instanceof Error ? err.message : 'Google OAuth popup failed.'
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
              maxWidth: 400,
              borderRadius: 24,
              padding: 24
            }
          ]}
        >
          <Text style={[TYPE.h2, { color: COLORS.ink }]}>
            Choose an account
          </Text>
          <Text
            style={[
              TYPE.small,
              {
                color: COLORS.inkSecondary,
                marginTop: 4,
                marginBottom: 18
              }
            ]}
          >
            to continue to SlabLock
          </Text>

          {signingIn ? (
            <View
              style={{
                paddingVertical: 32,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
            >
              <ActivityIndicator size="large" color={COLORS.yellowDeep} />
              <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                Signing in…
              </Text>
            </View>
          ) : !showCustomForm ? (
            <>
              {MOCK_GOOGLE_ACCOUNTS.map((acct, index) => (
                <TouchableOpacity
                  key={acct.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Sign in as ${acct.name} (${acct.email})`}
                  onPress={() => handlePick(index)}
                  activeOpacity={0.82}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    minHeight: 60,
                    borderRadius: 16,
                    backgroundColor: COLORS.bg,
                    marginBottom: 10
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      backgroundColor: acct.color,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.white,
                        fontSize: 14,
                        fontFamily: FONT_FAMILIES.lexendBold
                      }}
                    >
                      {acct.initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                      {acct.name}
                    </Text>
                    <Text
                      style={[
                        TYPE.small,
                        { color: COLORS.inkSecondary, marginTop: 2 }
                      ]}
                    >
                      {acct.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Use another Google account / Live OAuth */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Use another Google account"
                onPress={() => {
                  setErrorMsg(null);
                  setShowCustomForm(true);
                }}
                activeOpacity={0.82}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  minHeight: 56,
                  borderRadius: 16,
                  backgroundColor: COLORS.bgSoft,
                  marginBottom: 10
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: COLORS.cardHi,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon name="profile" size={20} color={COLORS.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                    Use another Google account
                  </Text>
                  <Text
                    style={[
                      TYPE.small,
                      { color: COLORS.inkSecondary, marginTop: 2 }
                    ]}
                  >
                    Sign in with your Google email or OAuth 2.0
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={onClose}
                style={{
                  minHeight: 44,
                  marginTop: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12
                }}
              >
                <Text style={[TYPE.button, { color: COLORS.inkSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View>
              <Text style={[TYPE.smallSemiBold, { color: COLORS.ink, marginBottom: 6 }]}>
                Google Email
              </Text>
              <TextInput
                value={customEmail}
                onChangeText={setCustomEmail}
                placeholder="you@gmail.com"
                placeholderTextColor={COLORS.inkMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  TYPE.body,
                  {
                    backgroundColor: COLORS.bg,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: COLORS.ink,
                    marginBottom: 12
                  }
                ]}
              />

              <Text style={[TYPE.smallSemiBold, { color: COLORS.ink, marginBottom: 6 }]}>
                Display Name (optional)
              </Text>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                placeholder="Randy Collector"
                placeholderTextColor={COLORS.inkMuted}
                style={[
                  TYPE.body,
                  {
                    backgroundColor: COLORS.bg,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: COLORS.ink,
                    marginBottom: 14
                  }
                ]}
              />

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Continue with Google Email"
                onPress={handleCustomSignIn}
                style={{
                  minHeight: 48,
                  borderRadius: 14,
                  backgroundColor: COLORS.yellow,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14
                }}
              >
                <Text style={[TYPE.button, { color: COLORS.onAccent }]}>
                  Continue with Google Email
                </Text>
              </TouchableOpacity>

              {/* Optional Live Google OAuth 2.0 Popup */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: COLORS.line,
                  paddingTop: 12,
                  marginBottom: 10
                }}
              >
                <Text
                  style={[
                    TYPE.small,
                    { color: COLORS.inkSecondary, marginBottom: 6 }
                  ]}
                >
                  Or connect via Google Cloud OAuth 2.0 Client ID:
                </Text>
                <TextInput
                  value={oauthClientId}
                  onChangeText={setOauthClientId}
                  placeholder="xxxx.apps.googleusercontent.com"
                  placeholderTextColor={COLORS.inkMuted}
                  autoCapitalize="none"
                  style={[
                    TYPE.small,
                    {
                      backgroundColor: COLORS.bg,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: COLORS.ink,
                      marginBottom: 8
                    }
                  ]}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Open Google OAuth 2.0 Popup"
                  onPress={handleRealOAuthPopup}
                  style={{
                    minHeight: 44,
                    borderRadius: 12,
                    backgroundColor: COLORS.bgSoft,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={[TYPE.smallSemiBold, { color: COLORS.ink }]}>
                    Open Google OAuth 2.0 Popup
                  </Text>
                </TouchableOpacity>
              </View>

              {errorMsg && (
                <Text
                  style={[
                    TYPE.small,
                    { color: COLORS.rose, marginBottom: 10, textAlign: 'center' }
                  ]}
                >
                  {errorMsg}
                </Text>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Back to accounts"
                onPress={() => {
                  setErrorMsg(null);
                  setShowCustomForm(false);
                }}
                style={{
                  minHeight: 42,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={[TYPE.button, { color: COLORS.inkSecondary }]}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
