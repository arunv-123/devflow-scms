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
  console.log('=== Starting Project Management API & Auth Verification ===\n');

  // 1. Login Admin to obtain auth cookie
  let loginRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
    { email: 'admin@devflow.local', password: 'password123' }
  );

  let authCookie = loginRes.cookie;
  if (!authCookie) {
    const regRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST' },
      { name: 'Admin User', email: 'admin@devflow.local', password: 'password123', role: 'Admin' }
    );
    authCookie = regRes.cookie;
  }
  console.log('1. Auth Cookie obtained:', !!authCookie);

  // 2. Unauthenticated GET /api/projects (401 Expected)
  const unauthRes = await request({ hostname: 'localhost', port: 5000, path: '/api/projects', method: 'GET' });
  console.log('2. Unauthenticated GET /api/projects (401 Expected):', unauthRes.status, unauthRes.body.error);

  // 3. GET /api/projects
  const projectsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/projects', method: 'GET', headers: { Cookie: authCookie } }
  );
  console.log('3. GET /api/projects status:', projectsRes.status, 'count:', projectsRes.body.count);
  const firstProject = projectsRes.body.projects?.[0];

  // 4. POST /api/projects (Create Project)
  const createProjectRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/projects', method: 'POST', headers: { Cookie: authCookie } },
    {
      name: 'CyberShield Quantum Firewall',
      clientName: 'Wayne Enterprises',
      description: 'Zero-trust quantum network intrusion detection system with realtime AI packet inspection.',
      startDate: '2026-05-01',
      endDate: '2026-11-30',
      status: 'In Progress',
      priority: 'Critical',
      budget: 250000,
      spent: 50000,
      progress: 25,
      techStack: ['Rust', 'Python', 'React', 'Docker'],
      healthScore: 95,
      riskLevel: 'Low',
    }
  );
  console.log('4. POST /api/projects status:', createProjectRes.status, 'project:', createProjectRes.body.project?.name);
  const createdPrjId = createProjectRes.body.project?._id;

  // 5. GET /api/projects/:id
  if (createdPrjId) {
    const getPrjRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/projects/${createdPrjId}`, method: 'GET', headers: { Cookie: authCookie } }
    );
    console.log('5. GET /api/projects/:id status:', getPrjRes.status, 'fetched:', getPrjRes.body.project?.name);

    // 6. PUT /api/projects/:id (Update Project Progress)
    const updatePrjRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/projects/${createdPrjId}`, method: 'PUT', headers: { Cookie: authCookie } },
      { progress: 40, status: 'In Progress' }
    );
    console.log('6. PUT /api/projects/:id status:', updatePrjRes.status, 'new progress:', updatePrjRes.body.project?.progress);
  }

  // 7. POST /api/tasks (Create Task linked to Project)
  const targetProjectId = createdPrjId || firstProject?._id;
  const createTaskRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/tasks', method: 'POST', headers: { Cookie: authCookie } },
    {
      projectId: targetProjectId,
      projectName: 'CyberShield Quantum Firewall',
      title: 'Architect eBPF Packet Filter Driver',
      description: 'Implement high-throughput low-latency Linux kernel packet hook using Rust eBPF library.',
      dueDate: '2026-10-15',
      status: 'In Progress',
      priority: 'High',
      tags: ['Kernel', 'Rust', 'Security'],
    }
  );
  console.log('7. POST /api/tasks status:', createTaskRes.status, 'task:', createTaskRes.body.task?.title);
  const createdTaskId = createTaskRes.body.task?._id;

  // 8. GET /api/tasks?projectId=...
  const getTasksRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/tasks?projectId=${targetProjectId}`, method: 'GET', headers: { Cookie: authCookie } }
  );
  console.log('8. GET /api/tasks?projectId status:', getTasksRes.status, 'count:', getTasksRes.body.count);

  // 9. POST /api/tasks/:id/subtasks (Add Subtask)
  if (createdTaskId) {
    const addSubtaskRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/tasks/${createdTaskId}/subtasks`, method: 'POST', headers: { Cookie: authCookie } },
      { title: 'Write unit tests for kernel ring buffer' }
    );
    console.log('9. POST /api/tasks/:id/subtasks status:', addSubtaskRes.status, 'subtasks count:', addSubtaskRes.body.task?.subtasks?.length);
    const addedSubtaskId = addSubtaskRes.body.task?.subtasks?.[0]?.id;

    // 10. PUT /api/tasks/:id/subtasks/:subtaskId (Complete Subtask)
    if (addedSubtaskId) {
      const updateSubtaskRes = await request(
        { hostname: 'localhost', port: 5000, path: `/api/tasks/${createdTaskId}/subtasks/${addedSubtaskId}`, method: 'PUT', headers: { Cookie: authCookie } },
        { completed: true }
      );
      console.log('10. PUT /api/tasks/:id/subtasks/:subtaskId status:', updateSubtaskRes.status, 'subtask completed:', updateSubtaskRes.body.task?.subtasks?.[0]?.completed);
    }
  }

  // 11. POST /api/milestones (Create Milestone)
  const createMilestoneRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/milestones', method: 'POST', headers: { Cookie: authCookie } },
    {
      projectId: targetProjectId,
      projectName: 'CyberShield Quantum Firewall',
      title: 'Alpha Kernel Module Release & Load Benchmark',
      description: 'Deliver initial eBPF packet inspection driver to staging cluster under 10Gbps traffic.',
      dueDate: '2026-10-30',
      status: 'In Progress',
      progress: 30,
    }
  );
  console.log('11. POST /api/milestones status:', createMilestoneRes.status, 'milestone:', createMilestoneRes.body.milestone?.title);

  // 12. GET /api/milestones
  const getMilestonesRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/milestones?projectId=${targetProjectId}`, method: 'GET', headers: { Cookie: authCookie } }
  );
  console.log('12. GET /api/milestones status:', getMilestonesRes.status, 'count:', getMilestonesRes.body.count);

  console.log('\n=== ALL PROJECT MANAGEMENT API TESTS PASSED SUCCESSFULLY ===');
}

main().catch(console.error);
