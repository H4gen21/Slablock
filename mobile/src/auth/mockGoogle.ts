import { Platform } from 'react-native';

export interface User {
  id: string;
  name: string;
  firstName: string;
  email: string;
  initials: string;
  color: string;
  walletAddress: string;
  role: string;
  authMethod?: 'google_oauth' | 'google_custom' | 'demo';
}

declare const process: {
  env: Record<string, string | undefined>;
};

const STORAGE_USER_KEY = 'slablock_google_user_v1';

export const GOOGLE_OAUTH_CLIENT_ID =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) ||
  '';

export const MOCK_GOOGLE_ACCOUNTS: User[] = [
  {
    id: 'usr_alex_tan',
    name: 'Alex Tan',
    firstName: 'Alex',
    email: 'alex.tan@slablock.io',
    initials: 'AT',
    color: '#343A45',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: 'Vault Collector',
    authMethod: 'demo'
  },
  {
    id: 'usr_demo_collector',
    name: 'Demo Collector',
    firstName: 'Demo',
    email: 'collector@demo.slablock.io',
    initials: 'DC',
    color: '#12A16B',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    role: 'Grading Inspector',
    authMethod: 'demo'
  }
];

const AVATAR_PALETTE = ['#343A45', '#1F7A55', '#2F5F8A', '#8A6A00', '#A8323E'];

function computeInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (email.slice(0, 2) || 'SL').toUpperCase();
}

export function loadSavedGoogleUser(): User | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.email || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGoogleUser(user: User | null): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }
  try {
    if (!user) {
      window.localStorage.removeItem(STORAGE_USER_KEY);
    } else {
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Signs in with one of the pre-configured Google accounts (900 ms spinner).
 */
export async function signInWithGoogle(accountIndex = 0): Promise<User> {
  const chosen = MOCK_GOOGLE_ACCOUNTS[accountIndex] ?? MOCK_GOOGLE_ACCOUNTS[0];
  await new Promise((resolve) => setTimeout(resolve, 900));
  saveGoogleUser(chosen);
  return chosen;
}

/**
 * Signs in with a custom Google account email & display name.
 */
export async function signInWithCustomGoogleAccount(params: {
  email: string;
  name?: string;
}): Promise<User> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid Google email address.');
  }

  const derivedName =
    params.name?.trim() ||
    cleanEmail
      .split('@')[0]
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') ||
    'Google Collector';

  const firstName = derivedName.split(/\s+/)[0] || 'Collector';
  const initials = computeInitials(derivedName, cleanEmail);
  const colorIdx =
    cleanEmail.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    AVATAR_PALETTE.length;

  const user: User = {
    id: `usr_google_${Date.now()}`,
    name: derivedName,
    firstName,
    email: cleanEmail,
    initials,
    color: AVATAR_PALETTE[colorIdx],
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: 'Collector',
    authMethod: 'google_custom'
  };

  await new Promise((resolve) => setTimeout(resolve, 900));
  saveGoogleUser(user);
  return user;
}

/**
 * Launches a real Google OAuth 2.0 popup window on web when `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
 * (or a user-provided Google OAuth Client ID) is available, fetching the authenticated profile
 * from `https://www.googleapis.com/oauth2/v3/userinfo`.
 */
export async function signInWithRealGoogleOAuthPopup(
  customClientId?: string
): Promise<User> {
  const clientId = (customClientId || GOOGLE_OAUTH_CLIENT_ID).trim();
  if (!clientId) {
    throw new Error(
      'No Google OAuth Client ID configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID or sign in with your Google email below.'
    );
  }

  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    throw new Error('Google OAuth popup is only supported in web mode.');
  }

  const redirectUri = window.location.origin;
  const scope = encodeURIComponent('openid email profile');
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${scope}` +
    `&prompt=select_account`;

  const width = 500;
  const height = 620;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    authUrl,
    'slablock_google_oauth',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!popup) {
    throw new Error('Popup blocked by browser. Please allow popups for localhost.');
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const timer = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(timer);
          reject(new Error('Google sign-in window was closed.'));
          return;
        }
        if (popup.location.origin === window.location.origin) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get('access_token');
          popup.close();
          clearInterval(timer);
          if (token) {
            resolve(token);
          } else {
            reject(new Error('No access_token returned from Google OAuth.'));
          }
        }
      } catch {
        // Cross-origin while user is still on accounts.google.com
      }
    }, 250);
  });

  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch Google userinfo profile.');
  }

  const profile = (await resp.json()) as {
    sub: string;
    name?: string;
    given_name?: string;
    email?: string;
  };

  const email = profile.email || 'user@gmail.com';
  const name = profile.name || email.split('@')[0];
  const firstName = profile.given_name || name.split(' ')[0] || name;

  const user: User = {
    id: `google_${profile.sub}`,
    name,
    firstName,
    email,
    initials: computeInitials(name, email),
    color: '#343A45',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: 'Google Collector',
    authMethod: 'google_oauth'
  };

  saveGoogleUser(user);
  return user;
}
