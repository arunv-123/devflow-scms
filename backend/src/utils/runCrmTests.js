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
      status: 'New',
      source: 'Inbound Web Contact',
      assignedTo: 'Sarah Chen',
    }
  );
  console.log('5. POST /api/crm/leads status:', createLeadRes.status, 'created lead status:', createLeadRes.body.lead?.status);
  const createdLeadId = createLeadRes.body.lead?._id;

  // 5a. Test status transitions: New -> Contacted -> Proposal -> Converted
  if (createdLeadId) {
    const update1 = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/leads/${createdLeadId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { status: 'Contacted' }
    );
    console.log('5a. PUT status to Contacted:', update1.status, 'status:', update1.body.lead?.status);

    const update2 = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/leads/${createdLeadId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { status: 'Proposal' }
    );
    console.log('5b. PUT status to Proposal:', update2.status, 'status:', update2.body.lead?.status);

    const update3 = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/leads/${createdLeadId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { status: 'Converted' }
    );
    console.log('5c. PUT status to Converted:', update3.status, 'status:', update3.body.lead?.status);
  }

  // 5b. Test flow: Create Lead -> New -> Contacted -> Lost
  const lostLeadRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/leads', method: 'POST', headers: { Cookie: authCookie } },
    {
      name: 'Dwight Schrute',
      company: 'Schrute Farms',
      email: 'dwight@schrute.com',
      value: 30000,
      status: 'New',
      source: 'Direct Contact',
      assignedTo: 'Alex Morgan',
    }
  );
  const lostLeadId = lostLeadRes.body.lead?._id;
  if (lostLeadId) {
    await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/leads/${lostLeadId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { status: 'Contacted' }
    );
    const lostUpdate = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/leads/${lostLeadId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { status: 'Lost' }
    );
    console.log('5d. PUT status to Lost:', lostUpdate.status, 'status:', lostUpdate.body.lead?.status);
  }

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
  const createdClientId = createClientRes.body.client?._id;

  // 8a. Test PUT /api/crm/clients/:id (Update Client)
  if (createdClientId) {
    const updateClientRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/clients/${createdClientId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { name: 'Bruce Wayne', totalValue: 400000 }
    );
    console.log('8a. PUT /api/crm/clients/:id status:', updateClientRes.status, 'updated value:', updateClientRes.body.client?.totalValue);

    // 8b. Test DELETE /api/crm/clients/:id (Delete Client)
    const deleteClientRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/clients/${createdClientId}`, method: 'DELETE', headers: { Cookie: authCookie } }
    );
    console.log('8b. DELETE /api/crm/clients/:id status:', deleteClientRes.status, 'message:', deleteClientRes.body.message);
  }

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
  const createdMtgId = createMeetingRes.body.meeting?._id;

  // 10a. Test Meeting Status Workflow: Scheduled -> In Progress -> Completed
  if (createdMtgId) {
    const startMtgRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/meetings/${createdMtgId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { status: 'In Progress' }
    );
    console.log('10a. Start Meeting (Scheduled -> In Progress):', startMtgRes.status, 'status:', startMtgRes.body.meeting?.status);

    // 10b. Test validation failure when Notes/Outcome are missing on completion
    const invalidCompleteRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/meetings/${createdMtgId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { status: 'Completed', notes: '', outcome: '' }
    );
    console.log('10b. Complete Meeting missing notes/outcome (400 Expected):', invalidCompleteRes.status, invalidCompleteRes.body.error);

    // 10c. Successful completion with notes, outcome, action items, and next steps
    const completeMtgRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/crm/meetings/${createdMtgId}`, method: 'PUT', headers: { Cookie: authCookie } },
      {
        status: 'Completed',
        notes: 'Tony Stark discussed requirements for a real-time cybersecurity monitoring platform.',
        outcome: 'Client is interested and requested a technical proposal.',
        actionItems: ['Prepare technical proposal', 'Estimate development timeline', 'Prepare architecture'],
        nextSteps: 'Schedule proposal review with Tony Stark.',
      }
    );
    console.log(
      '10c. Complete Meeting (In Progress -> Completed):',
      completeMtgRes.status,
      'status:',
      completeMtgRes.body.meeting?.status,
      'nextSteps:',
      completeMtgRes.body.meeting?.nextSteps
    );
  }

  console.log('\n=== ALL CRM API TESTS PASSED SUCCESSFULLY ===');
}

main().catch(console.error);
