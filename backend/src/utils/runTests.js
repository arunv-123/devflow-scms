const http = require('http');

function post(path, data, cookie) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      const setCookie = res.headers['set-cookie'];
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body), cookie: setCookie ? setCookie[0].split(';')[0] : null });
        } catch (e) {
          resolve({ status: res.statusCode, body, cookie: setCookie ? setCookie[0].split(';')[0] : null });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: cookie ? { Cookie: cookie } : {},
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('--- DevFlow Auth & RBAC Verification ---\n');

  // 1. Health
  const health = await get('/api/health');
  console.log('1. Health status:', health.status, health.body);

  // 2. Register Admin
  const adminReg = await post('/api/auth/register', {
    name: 'Admin User',
    email: 'admin@devflow.local',
    password: 'password123',
    role: 'Admin',
    department: 'Management',
  });
  console.log('2. Register Admin:', adminReg.status, adminReg.body.message || adminReg.body.error, '| User:', adminReg.body.user?.email, '| Role:', adminReg.body.user?.role, '| Cookie:', adminReg.cookie);

  // 3. Login Admin
  const adminLogin = await post('/api/auth/login', {
    email: 'admin@devflow.local',
    password: 'password123',
  });
  console.log('3. Login Admin:', adminLogin.status, adminLogin.body.message || adminLogin.body.error, '| Cookie:', adminLogin.cookie);
  const adminCookie = adminLogin.cookie;

  // 4. Register Developer
  const devReg = await post('/api/auth/register', {
    name: 'Developer User',
    email: 'developer@devflow.local',
    password: 'password123',
    role: 'Developer',
    department: 'Engineering',
  });
  console.log('4. Register Developer:', devReg.status, devReg.body.message || devReg.body.error, '| User:', devReg.body.user?.email, '| Role:', devReg.body.user?.role, '| Cookie:', devReg.cookie);

  // 5. Login Developer
  const devLogin = await post('/api/auth/login', {
    email: 'developer@devflow.local',
    password: 'password123',
  });
  console.log('5. Login Developer:', devLogin.status, devLogin.body.message || devLogin.body.error, '| Cookie:', devLogin.cookie);
  const devCookie = devLogin.cookie;

  // 6. Access /me with Admin Cookie
  const meAdmin = await get('/api/auth/me', adminCookie);
  console.log('6. GET /me (Admin Session):', meAdmin.status, '| Profile:', meAdmin.body.user?.name, '| Role:', meAdmin.body.user?.role);

  // 7. Access /admin-only with Admin Cookie (RBAC Authorized)
  const adminOnlyAdmin = await get('/api/auth/admin-only', adminCookie);
  console.log('7. GET /admin-only (Admin Session - 200 OK Expected):', adminOnlyAdmin.status, '| Message:', adminOnlyAdmin.body.message);

  // 8. Access /admin-only with Developer Cookie (RBAC Forbidden - 403 Expected)
  const adminOnlyDev = await get('/api/auth/admin-only', devCookie);
  console.log('8. GET /admin-only (Developer Session - 403 Forbidden Expected):', adminOnlyDev.status, '| Error:', adminOnlyDev.body.error);

  // 9. Access /me without Cookie (Unauthenticated - 401 Expected)
  const meNoAuth = await get('/api/auth/me');
  console.log('9. GET /me (No Cookie - 401 Unauthorized Expected):', meNoAuth.status, '| Error:', meNoAuth.body.error);

  // 10. Logout
  const logout = await post('/api/auth/logout', {});
  console.log('10. POST /logout:', logout.status, logout.body.message);
}

main().catch(console.error);
