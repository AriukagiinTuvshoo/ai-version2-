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
 * Ensures a valid session is active via session cookie or Bearer token.
 */
export async function ensureAuth(): Promise<{ authenticated: boolean; user?: any }> {
  try {
    const headers: Record<string, string> = {};
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const checkRes = await fetch('/api/auth/session', {
      credentials: 'include',
      headers,
    });

    if (checkRes.ok) {
      const data = await checkRes.json();
      currentUser = { id: data.userId || 'owner', role: data.role || 'admin' };
      notifyAuth();
      return { authenticated: true, user: currentUser };
    }

    currentUser = null;
    notifyAuth();
    return { authenticated: false };
  } catch (err) {
    console.warn('Auth check error:', err);
    currentUser = null;
    notifyAuth();
    return { authenticated: false };
  }
}

/**
 * Explicit login using server-side credentials
 */
export async function login(password: string): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      currentUser = { id: data.user.id, role: data.user.role };
      notifyAuth();
      return { success: true, user: currentUser };
    }

    return { success: false, error: data.error || 'Authentication failed' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Invalidate server-side session and clear cookie
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    setAuthToken('');
    currentUser = null;
    notifyAuth();
  }
}

/**
 * Authenticated API Fetch wrapper that always includes credentials and optional Bearer token
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  
  if (currentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  return fetch(input, {
    credentials: 'include',
    ...init,
    headers,
  });
}
