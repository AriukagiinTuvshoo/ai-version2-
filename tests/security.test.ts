import test, { describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app, loginRateLimiter } from '../server.js';

describe('Security & Authentication Regression Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalAdminPass = process.env.ADMIN_PASSWORD;
  const originalFriendPass = process.env.FRIEND_PASSWORD;
  const originalAuthToken = process.env.WORKSPACE_AUTH_TOKEN;

  const TEST_ADMIN_PASSWORD = 'test-secure-admin-pass-9988';
  const TEST_FRIEND_PASSWORD = 'test-friend-pass-1122';

  before(async () => {
    // Set controlled test credentials
    process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
    process.env.FRIEND_PASSWORD = TEST_FRIEND_PASSWORD;
    delete process.env.WORKSPACE_AUTH_TOKEN;
    loginRateLimiter.clear();

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Restore environment
    if (originalAdminPass !== undefined) process.env.ADMIN_PASSWORD = originalAdminPass;
    else delete process.env.ADMIN_PASSWORD;

    if (originalFriendPass !== undefined) process.env.FRIEND_PASSWORD = originalFriendPass;
    else delete process.env.FRIEND_PASSWORD;

    if (originalAuthToken !== undefined) process.env.WORKSPACE_AUTH_TOKEN = originalAuthToken;
    else delete process.env.WORKSPACE_AUTH_TOKEN;

    loginRateLimiter.clear();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // Helper fetcher
  async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body,
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    const setCookie = res.headers.get('set-cookie');
    return { status: res.status, headers: res.headers, text, json, setCookie };
  }

  // 1. Unauthenticated requests to private routes return 401
  test('1. Unauthenticated requests to private routes return 401 Unauthorized', async () => {
    const routesToTest = [
      { method: 'GET', path: '/api/store' },
      { method: 'GET', path: '/api/projects' },
      { method: 'GET', path: '/api/memory/vault' },
      { method: 'GET', path: '/api/reports' },
      { method: 'GET', path: '/api/activity' },
      { method: 'GET', path: '/api/dashboard/overview' },
      { method: 'GET', path: '/api/auth/session' },
      { method: 'GET', path: '/api/diagnostics' },
      { method: 'GET', path: '/api/run-acceptance-tests' },
      { method: 'GET', path: '/api/memory/knowledge-graph-v2' },
      { method: 'POST', path: '/api/agent/run', body: JSON.stringify({ user_text: 'hello' }) },
      { method: 'POST', path: '/api/workspace/create', body: JSON.stringify({ taskId: 'test' }) },
      { method: 'GET', path: '/api/workspace/test-task' },
      { method: 'GET', path: '/api/workspace/test-task/diff' },
    ];

    for (const route of routesToTest) {
      const res = await request(route.path, { method: route.method, body: route.body });
      assert.strictEqual(
        res.status,
        401,
        `Expected 401 for unauthenticated ${route.method} ${route.path}, got ${res.status} (${res.text})`
      );
      assert.strictEqual(res.json?.code, 'AUTH_REQUIRED');
    }
  });

  // 2. Public healthcheck returns 200 without authentication
  test('2. Public /api/health endpoint returns 200 without authentication', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json?.status, 'ok');
    assert.strictEqual(typeof res.json?.uptime, 'number');
    assert.ok(res.json?.timestamp);
  });

  // 3. Security headers are present on all responses
  test('3. Security headers (X-Content-Type-Options, X-Frame-Options) are enforced', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.strictEqual(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });

  // 4. Rate limiting on /api/auth/login locks out after 5 consecutive failures
  test('4. Rate limiting locks out after 5 failed login attempts', async () => {
    loginRateLimiter.clear();
    const testIpHeader = { 'X-Forwarded-For': '198.51.100.42' };

    // 4 failed attempts should return 401
    for (let i = 1; i <= 4; i++) {
      const failRes = await request('/api/auth/login', {
        method: 'POST',
        headers: testIpHeader,
        body: JSON.stringify({ password: `wrong-pass-${i}` }),
      });
      assert.strictEqual(failRes.status, 401, `Attempt ${i} should return 401`);
      assert.strictEqual(failRes.json?.code, 'INVALID_CREDENTIALS');
    }

    // 5th failed attempt triggers 429
    const lockRes = await request('/api/auth/login', {
      method: 'POST',
      headers: testIpHeader,
      body: JSON.stringify({ password: 'wrong-pass-5' }),
    });
    assert.strictEqual(lockRes.status, 429, '5th failure should return 429 Too Many Requests');
    assert.strictEqual(lockRes.json?.code, 'RATE_LIMITED');
    assert.ok(lockRes.json?.error.includes('RATE_LIMITED'));

    // 6th attempt (even with valid password) should still be rejected with 429 while locked
    const lockedValidRes = await request('/api/auth/login', {
      method: 'POST',
      headers: testIpHeader,
      body: JSON.stringify({ password: TEST_ADMIN_PASSWORD }),
    });
    assert.strictEqual(lockedValidRes.status, 429, 'Subsequent attempts while locked should return 429');

    // Clean up rate limiter
    loginRateLimiter.clear();
  });

  // 5. Non-owner request to privileged route returns 403
  test('5. Non-owner (role: user) request to privileged routes returns 403 Forbidden', async () => {
    loginRateLimiter.clear();
    // Login as friend
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: TEST_FRIEND_PASSWORD }),
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.json?.user?.role, 'user');
    assert.ok(loginRes.setCookie, 'Expected set-cookie header');

    // Extract cookie
    const cookieHeader = loginRes.setCookie.split(';')[0];

    // Privileged routes requiring admin
    const privilegedRoutes = [
      { method: 'POST', path: '/api/workspace/create', body: JSON.stringify({ taskId: 'unauth-task' }) },
      { method: 'GET', path: '/api/workspace/some-task' },
      { method: 'POST', path: '/api/settings', body: JSON.stringify({ offlineMode: true }) },
      { method: 'POST', path: '/api/store/switch-user', body: JSON.stringify({ userId: 'owner' }) },
      { method: 'POST', path: '/api/knowledge', body: JSON.stringify({ filename: 'test.txt', content: 'test' }) },
      { method: 'POST', path: '/api/dashboard/automations/auto-1/trigger' },
    ];

    for (const route of privilegedRoutes) {
      const res = await request(route.path, {
        method: route.method,
        headers: { Cookie: cookieHeader },
        body: route.body,
      });
      assert.strictEqual(
        res.status,
        403,
        `Expected 403 for non-owner ${route.method} ${route.path}, got ${res.status} (${res.text})`
      );
      assert.strictEqual(res.json?.code, 'FORBIDDEN');
    }
  });

  // 6. If ADMIN_PASSWORD is unset, server refuses login with error
  test('6. Refuses login with 503 error when ADMIN_PASSWORD is not set', async () => {
    delete process.env.ADMIN_PASSWORD;

    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'any-password' }),
    });

    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.json?.ok, false);
    assert.ok(res.json?.error.includes('SERVER_MISCONFIGURED'));

    // Restore test admin password
    process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
  });

  // 7. Successful login returns no token in response body and sets httpOnly cookie
  test('7. Successful login returns no token in response body and sets httpOnly cookie', async () => {
    loginRateLimiter.clear();
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: TEST_ADMIN_PASSWORD }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json?.ok, true);
    assert.strictEqual(res.json?.user?.id, 'owner');
    assert.strictEqual(res.json?.user?.role, 'admin');

    // STRICT CHECK: Token must never appear in response JSON body
    assert.strictEqual(res.json?.token, undefined, 'Token must not be in response body');
    assert.strictEqual(res.json?.sessionToken, undefined, 'Session token must not be in response body');
    assert.strictEqual(JSON.stringify(res.json).includes('sess-'), false, 'No token pattern in response body');

    // Verify session token is conveyed via httpOnly cookie
    assert.ok(res.setCookie, 'set-cookie header must be present');
    assert.ok(res.setCookie.includes('ai_session_token='), 'ai_session_token cookie must be set');
    assert.ok(res.setCookie.toLowerCase().includes('httponly'), 'cookie must be HttpOnly');
    assert.ok(res.setCookie.toLowerCase().includes('samesite=lax'), 'cookie must be SameSite=Lax');

    // Verify subsequent authenticated call with cookie works and leaks no token
    const cookieHeader = res.setCookie.split(';')[0];
    const sessionRes = await request('/api/auth/session', {
      headers: { Cookie: cookieHeader },
    });
    assert.strictEqual(sessionRes.status, 200);
    assert.strictEqual(sessionRes.json?.authenticated, true);
    assert.strictEqual(sessionRes.json?.role, 'admin');
    assert.strictEqual(sessionRes.json?.token, undefined, 'Token must not be in /api/auth/session body');
  });

  // 8. Logout invalidates server session and clears cookie
  test('8. Logout endpoint invalidates the server session and clears cookie', async () => {
    loginRateLimiter.clear();
    // Login
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: TEST_ADMIN_PASSWORD }),
    });
    assert.strictEqual(loginRes.status, 200);
    const cookieHeader = loginRes.setCookie!.split(';')[0];

    // Verify authenticated
    const check1 = await request('/api/auth/session', {
      headers: { Cookie: cookieHeader },
    });
    assert.strictEqual(check1.status, 200);

    // Call logout
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.json?.ok, true);
    assert.ok(logoutRes.setCookie, 'Logout should send set-cookie to clear token');

    // Verify session is invalidated on server
    const checkAfter = await request('/api/auth/session', {
      headers: { Cookie: cookieHeader },
    });
    assert.strictEqual(checkAfter.status, 401, 'Session must return 401 after logout');
  });

  // 9. Client cannot forge role or identity via request body
  test('9. Rejects client forgery of userId or role in request body', async () => {
    loginRateLimiter.clear();
    const forgedRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: TEST_FRIEND_PASSWORD,
        userId: 'owner',
        role: 'admin',
      }),
    });

    assert.strictEqual(forgedRes.status, 200);
    // Role MUST remain 'user', NOT the forged 'admin'
    assert.strictEqual(forgedRes.json?.user?.id, 'friend');
    assert.strictEqual(forgedRes.json?.user?.role, 'user');
  });
});
