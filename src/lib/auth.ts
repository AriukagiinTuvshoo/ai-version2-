// Authentication & Session Client Manager for Tuvshoo AI

const TOKEN_STORAGE_KEY = 'tuvshoo_auth_token';

let currentToken: string = typeof window !== 'undefined' ? (localStorage.getItem(TOKEN_STORAGE_KEY) || '') : '';
let currentUser: { id: string; role: 'admin' | 'user'; email?: string } | null = null;
const authListeners = new Set<(user: typeof currentUser) => void>();

export function getAuthToken(): string {
  return currentToken;
}

export function setAuthToken(token: string) {
  currentToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function subscribeAuth(listener: (user: typeof currentUser) => void) {
  authListeners.add(listener);
  listener(currentUser);
  return () => authListeners.delete(listener);
}

function notifyAuth() {
  authListeners.forEach((l) => l(currentUser));
}

/**
 * Ensures a valid session is active.
 * Checks /api/auth/session; if unauthenticated, bootstraps owner session seamlessly.
 */
export async function ensureAuth(): Promise<{ authenticated: boolean; user?: any }> {
  try {
    // 1. Try existing token
    if (currentToken) {
      const checkRes = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        currentUser = { id: data.userId || 'owner', role: data.role || 'admin' };
        notifyAuth();
        return { authenticated: true, user: currentUser };
      }
    }

    // 2. Auto-handshake for seamless personal assistant usage
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'personal-ai-master', userId: 'owner' }),
    });

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      if (loginData.token) {
        setAuthToken(loginData.token);
        currentUser = { id: loginData.user?.id || 'owner', role: loginData.user?.role || 'admin' };
        notifyAuth();
        return { authenticated: true, user: currentUser };
      }
    }

    currentUser = null;
    notifyAuth();
    return { authenticated: false };
  } catch (err) {
    console.warn('Auth handshake error:', err);
    return { authenticated: false };
  }
}

/**
 * Authenticated API Fetch wrapper that always attaches Bearer token
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  
  if (currentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  let res = await fetch(input, { ...init, headers });

  // If 401 Unauthorized, attempt refresh once
  if (res.status === 401) {
    const refreshed = await ensureAuth();
    if (refreshed.authenticated && currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
      res = await fetch(input, { ...init, headers });
    }
  }

  return res;
}
