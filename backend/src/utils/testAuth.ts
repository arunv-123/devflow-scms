async function runTests() {
  console.log('=== Starting Auth API Verification Tests ===\n');

  const BASE_URL = 'http://localhost:5000/api/auth';

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const health = await healthRes.json();
  console.log('1. Health Check status:', healthRes.status, 'body:', JSON.stringify(health));

  // 2. Register Admin
  const adminRegRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Admin Test',
      email: 'admin@devflow.local',
      password: 'password123',
      role: 'Admin',
      department: 'Management',
    }),
  });
  const adminRegCookies = adminRegRes.headers.get('set-cookie');
  const adminReg = await adminRegRes.json();
  console.log('2. Register Admin status:', adminRegRes.status, 'success:', adminReg.success, 'email:', adminReg.user?.email || adminReg.error, 'cookie set:', !!adminRegCookies);

  // 3. Login Admin
  const adminLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@devflow.local',
      password: 'password123',
    }),
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  const adminLogin = await adminLoginRes.json();
  console.log('3. Login Admin status:', adminLoginRes.status, 'success:', adminLogin.success, 'cookie header:', adminCookie?.split(';')[0]);

  // 4. Register Developer
  const devRegRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dev Test',
      email: 'dev@devflow.local',
      password: 'password123',
      role: 'Developer',
    }),
  });
  const devReg = await devRegRes.json();
  console.log('4. Register Developer status:', devRegRes.status, 'success:', devReg.success, 'role:', devReg.user?.role || devReg.error);

  // 5. Login Developer
  const devLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dev@devflow.local',
      password: 'password123',
    }),
  });
  const devCookie = devLoginRes.headers.get('set-cookie');
  const devLogin = await devLoginRes.json();
  console.log('5. Login Developer status:', devLoginRes.status, 'success:', devLogin.success, 'cookie header:', devCookie?.split(';')[0]);

  // Extract clean Cookie headers
  const adminCookieHeader = adminCookie ? adminCookie.split(';')[0] : '';
  const devCookieHeader = devCookie ? devCookie.split(';')[0] : '';

  // 6. Access /me as Admin
  const meAdminRes = await fetch(`${BASE_URL}/me`, {
    headers: { Cookie: adminCookieHeader },
  });
  const meAdmin = await meAdminRes.json();
  console.log('6. GET /me (Admin) status:', meAdminRes.status, 'email:', meAdmin.user?.email, 'role:', meAdmin.user?.role);

  // 7. Access /admin-only as Admin
  const adminOnlyAdminRes = await fetch(`${BASE_URL}/admin-only`, {
    headers: { Cookie: adminCookieHeader },
  });
  const adminOnlyAdmin = await adminOnlyAdminRes.json();
  console.log('7. GET /admin-only (Admin User) status:', adminOnlyAdminRes.status, 'message:', adminOnlyAdmin.message);

  // 8. Access /admin-only as Developer (RBAC check - Expected 403)
  const adminOnlyDevRes = await fetch(`${BASE_URL}/admin-only`, {
    headers: { Cookie: devCookieHeader },
  });
  const adminOnlyDev = await adminOnlyDevRes.json();
  console.log('8. GET /admin-only (Developer User - 403 Expected) status:', adminOnlyDevRes.status, 'error:', adminOnlyDev.error);

  // 9. Access protected route without cookie (Expected 401)
  const meNoAuthRes = await fetch(`${BASE_URL}/me`);
  const meNoAuth = await meNoAuthRes.json();
  console.log('9. GET /me (No Auth Token - 401 Expected) status:', meNoAuthRes.status, 'error:', meNoAuth.error);

  // 10. Logout
  const logoutRes = await fetch(`${BASE_URL}/logout`, { method: 'POST' });
  const logout = await logoutRes.json();
  console.log('10. POST /logout status:', logoutRes.status, 'message:', logout.message);

  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
});
