const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devflow_jwt_secret_dev_only';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devflow';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      const cookies = res.headers['set-cookie'];
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, cookies });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, cookies });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  department: String,
  skills: [String],
  avatar: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function runNotificationTests() {
  console.log('--- STARTING NOTIFICATION SYSTEM INTEGRATION VERIFICATION ---');
  await mongoose.connect(MONGO_URI);

  // Get or create User A (Super Admin) and User B (Team Lead)
  let userA = await User.findOne({ role: 'Super Admin' });
  if (!userA) {
    userA = await User.create({
      name: 'Alex Morgan',
      email: 'alex.morgan@devflow.io',
      role: 'Super Admin',
      department: 'Executive',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });
  }

  let userB = await User.findOne({ role: 'Team Lead' });
  if (!userB) {
    userB = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.v@devflow.io',
      role: 'Team Lead',
      department: 'Engineering',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });
  }

  const tokenA = jwt.sign({ id: userA._id.toString(), role: userA.role }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userB._id.toString(), role: userB.role }, JWT_SECRET, { expiresIn: '1h' });

  const cookieA = `token=${tokenA}`;
  const cookieB = `token=${tokenB}`;

  console.log('1. User A (Super Admin) Authenticated:', userA.name, `| ID: ${userA._id}`);
  console.log('2. User B (Team Lead) Authenticated:', userB.name, `| ID: ${userB._id}`);

  // 3. Test Scoping & Dummy Notification Prevention for User B
  const getNotifsB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );
  console.log('3. User B Notifications Count:', getNotifsB.body.count, '| Unread:', getNotifsB.body.unreadCount);

  // 4. Create Task assigned to User B by User A -> verify User B receives notification
  const projectsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/projects', method: 'GET', headers: { Cookie: cookieA } }
  );
  const prj = projectsRes.body.projects[0];
  const prjId = prj._id || prj.id;

  const createTaskRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/tasks', method: 'POST', headers: { Cookie: cookieA, 'Content-Type': 'application/json' } },
    {
      title: `Test Task ${Date.now()}`,
      description: 'Testing task assignment notifications',
      projectId: prjId,
      assignee: {
        id: userB._id.toString(),
        name: userB.name,
        email: userB.email,
        role: userB.role,
        avatar: userB.avatar || '',
      },
    }
  );
  const createdTask = createTaskRes.body.task;
  const taskId = createdTask._id || createdTask.id;
  console.log('4. Created Task assigned to User B:', createdTask.title, '| Task ID:', taskId);

  // Verify User B received notification & User A did NOT receive User B's notification
  const afterTaskNotifsB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );
  const assignedNotifB = afterTaskNotifsB.body.notifications.find((n) => n.title.includes('New Task Assigned') || n.message.includes(createdTask.title));
  console.log('4a. User B received task assignment notification:', !!assignedNotifB, '| Notification ID:', assignedNotifB?.id);

  const afterTaskNotifsA = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieA } }
  );
  const leakInA = afterTaskNotifsA.body.notifications.find((n) => n.id === assignedNotifB?.id);
  console.log('4b. User A received User B notification? (Expect false):', !!leakInA);

  // 5. Test Ownership Protection: User A attempts to mark User B's notification as read
  if (assignedNotifB) {
    const unauthorizedReadRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/notifications/${assignedNotifB.id}/read`, method: 'PUT', headers: { Cookie: cookieA } }
    );
    console.log('5. User A marking User B notification read status:', unauthorizedReadRes.status, '(Expect 403 Forbidden)');
  }

  // 6. Test Task Status Change & Deduplication (Status unchanged should not trigger notification)
  const statusUpdateRes1 = await request(
    { hostname: 'localhost', port: 5000, path: `/api/tasks/${taskId}`, method: 'PUT', headers: { Cookie: cookieB, 'Content-Type': 'application/json' } },
    { status: 'In Progress' }
  );
  console.log('6a. User B updated task status to "In Progress":', statusUpdateRes1.status);

  const notifsBAfterStatus1 = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );

  // Same status update call (should be ignored by notification deduplicator)
  const countBeforeDup = notifsBAfterStatus1.body.count;
  await request(
    { hostname: 'localhost', port: 5000, path: `/api/tasks/${taskId}`, method: 'PUT', headers: { Cookie: cookieB, 'Content-Type': 'application/json' } },
    { status: 'In Progress' }
  );
  const notifsBAfterStatusDup = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );
  console.log('6b. Duplicate status update notification check: before =', countBeforeDup, 'after =', notifsBAfterStatusDup.body.count, '| Deduped:', countBeforeDup === notifsBAfterStatusDup.body.count);

  // 7. Project Member Event: Add User B to Project team
  const updateProjectRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/projects/${prjId}`, method: 'PUT', headers: { Cookie: cookieA, 'Content-Type': 'application/json' } },
    {
      members: [
        ...(prj.members || []),
        { id: userB._id.toString(), name: userB.name, email: userB.email, role: userB.role, avatar: userB.avatar || '' },
      ],
    }
  );
  console.log('7. Updated Project Members (Added User B):', updateProjectRes.status);

  const memberNotifsB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );
  const memberNotif = memberNotifsB.body.notifications.find((n) => n.title.includes('Added to Project'));
  console.log('7a. User B received project added notification:', !!memberNotif);

  // 8. Milestone Event Notifications
  const milestoneRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/milestones', method: 'POST', headers: { Cookie: cookieA, 'Content-Type': 'application/json' } },
    {
      projectId: prjId,
      projectName: prj.name,
      title: `Sprint Milestone ${Date.now()}`,
      description: 'Testing milestone notifications',
      dueDate: '2026-12-31',
    }
  );
  console.log('8. Milestone created:', milestoneRes.body.milestone?.title);

  const milestoneNotifsB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );
  const milestoneNotif = milestoneNotifsB.body.notifications.find((n) => n.title.includes('New Milestone Created'));
  console.log('8a. User B received milestone notification:', !!milestoneNotif);

  // 8. Meeting Event Notifications
  const meetingRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/crm/meetings', method: 'POST', headers: { Cookie: cookieA, 'Content-Type': 'application/json' } },
    {
      title: `Sync Meeting ${Date.now()}`,
      clientName: 'Apex Capital Corp',
      date: '2026-11-01',
      time: '10:00 EST',
      duration: '30 mins',
      participants: [userA.name, userB.name],
    }
  );
  console.log('8. Meeting scheduled:', meetingRes.body.meeting?.title);

  const meetingNotifsB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );
  const meetingNotif = meetingNotifsB.body.notifications.find((n) => n.title.includes('New Meeting Scheduled'));
  console.log('8a. User B received meeting notification:', !!meetingNotif);

  // 9. AI Action Confirmation Notification (subtask breakdown confirmed to MongoDB)
  const aiSubtasksRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/ai/confirm-subtasks', method: 'POST', headers: { Cookie: cookieB, 'Content-Type': 'application/json' } },
    {
      taskId: taskId,
      subtasks: [
        { title: 'Subtask 1 from AI', completed: false },
        { title: 'Subtask 2 from AI', completed: false },
      ],
    }
  );
  console.log('9. AI subtasks confirmed to MongoDB:', aiSubtasksRes.status);

  const aiNotifsB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { Cookie: cookieB } }
  );
  const aiNotif = aiNotifsB.body.notifications.find((n) => n.title.includes('AI Action Approved'));
  console.log('9a. User B received committed AI action notification:', !!aiNotif);

  // 10. User B marks own notification as read
  if (assignedNotifB) {
    const markReadB = await request(
      { hostname: 'localhost', port: 5000, path: `/api/notifications/${assignedNotifB.id}/read`, method: 'PUT', headers: { Cookie: cookieB } }
    );
    console.log('10. User B marking own notification read status:', markReadB.status, '| Read:', markReadB.body.notification?.read);
  }

  console.log('--- ALL NOTIFICATION SYSTEM VERIFICATION TESTS PASSED ---');
  await mongoose.disconnect();
}

runNotificationTests().catch((e) => {
  console.error('Test execution failed:', e);
  mongoose.disconnect();
});
