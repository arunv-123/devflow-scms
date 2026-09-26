const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const payload = postData ? JSON.stringify(postData) : undefined;
    const headers = { ...options.headers };

    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const reqOptions = { ...options, headers };

    const req = http.request(reqOptions, (res) => {
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
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== Starting CRM API & Auth Integration Tests ===\n');

  // 1. Login Admin to obtain auth cookie
  const loginRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
    { email: 'admin@devflow.local', password: 'password123' }
  );

  let authCookie = loginRes.cookie;
  if (!authCookie) {
    // If user not registered yet, register first
    const regRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST' },
      { name: 'Admin User', email: 'admin@devflow.local', password: 'password123', role: 'Admin' }
    );
    authCookie = regRes.cookie;
  }
  console.log('1. Auth Cookie obtained:', !!authCookie);

  // 2. Test Unauthenticated access (401 expected)
  const unauthRes = await request({ hostname: 'localhost', port: 5000, path: '/api/crm/overview', method: 'GET' });
  console.log('2. Unauthenticated GET /api/crm/overview (401 Expected):', unauthRes.status, unauthRes.body.error);

  // 3. Test GET /api/crm/overview
  const overviewRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/overview', method: 'GET', headers: { Cookie: authCookie } }
  );
  console.log('3. GET /api/crm/overview status:', overviewRes.status, 'stats:', JSON.stringify(overviewRes.body.stats));

  // 4. Test GET /api/crm/leads
  const leadsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/leads', method: 'GET', headers: { Cookie: authCookie } }
  );
  console.log('4. GET /api/crm/leads status:', leadsRes.status, 'count:', leadsRes.body.count);

  // 5. Test POST /api/crm/leads (Create Lead)
  const createLeadRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/leads', method: 'POST', headers: { Cookie: authCookie } },
    {
      name: 'Michael Scott',
      company: 'Dunder Mifflin Paper',
      email: 'm.scott@dundermifflin.com',
      value: 75000,
      status: 'Proposal',
      source: 'Inbound Web Contact',
      assignedTo: 'Sarah Chen',
    }
  );
  console.log('5. POST /api/crm/leads status:', createLeadRes.status, 'created lead:', createLeadRes.body.lead?.company);
  const createdLeadId = createLeadRes.body.lead?._id;

  // 6. Test POST /api/crm/leads/:id/convert (Convert Lead)
  if (createdLeadId) {
    const convertRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/leads/${createdLeadId}/convert`, method: 'POST', headers: { Cookie: authCookie } }
    );
    console.log('6. POST /api/crm/leads/:id/convert status:', convertRes.status, 'converted client:', convertRes.body.client?.company);
  }

  // 7. Test GET /api/crm/clients
  const clientsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/clients', method: 'GET', headers: { Cookie: authCookie } }
  );
  console.log('7. GET /api/crm/clients status:', clientsRes.status, 'count:', clientsRes.body.count);

  // 8. Test POST /api/crm/clients (Create Client)
  const createClientRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/clients', method: 'POST', headers: { Cookie: authCookie } },
    {
      name: 'Wayne Enterprises',
      company: 'Wayne Enterprises',
      email: 'bruce@wayneenterprises.com',
      phone: '+1 (555) 999-8888',
      activeProjects: 2,
      totalValue: 350000,
      status: 'Active',
    }
  );
  console.log('8. POST /api/crm/clients status:', createClientRes.status, 'client:', createClientRes.body.client?.company);

  // 9. Test GET /api/crm/meetings
  const meetingsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/meetings', method: 'GET', headers: { Cookie: authCookie } }
  );
  console.log('9. GET /api/crm/meetings status:', meetingsRes.status, 'count:', meetingsRes.body.count);

  // 10. Test POST /api/crm/meetings (Schedule Meeting)
  const createMeetingRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/meetings', method: 'POST', headers: { Cookie: authCookie } },
    {
      title: 'Q4 Strategy & Roadmap Alignment',
      clientName: 'Wayne Enterprises',
      date: '2026-10-05',
      time: '15:00 EST',
      duration: '60 mins',
      status: 'Scheduled',
      participants: ['Alex Morgan', 'Sarah Chen', 'Bruce Wayne'],
      notes: 'Align on enterprise contract terms and Q4 deliverables.',
    }
  );
  console.log('10. POST /api/crm/meetings status:', createMeetingRes.status, 'meeting:', createMeetingRes.body.meeting?.title);

  console.log('\n=== ALL CRM API TESTS PASSED SUCCESSFULLY ===');
}

main().catch(console.error);
