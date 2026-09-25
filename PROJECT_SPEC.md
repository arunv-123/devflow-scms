# DevFlow — AI Software Company Management System

## 1. Project Overview

DevFlow is a full-stack AI-powered Software Company Management System (SCMS) designed to help software companies manage their complete workflow from lead generation to project delivery.

The system provides centralized management of:
- Users and roles
- Leads and clients
- Meetings
- Projects
- Tasks and subtasks
- Milestones
- Documents
- Reports and analytics
- Notifications
- Activity logs
- AI-powered project intelligence
- Team recommendations
- Project health

The application must have a professional, modern SaaS dashboard UI.

---

# 2. Primary Goal

Build a production-style MERN/Next.js based Software Company Management System with:

1. Secure authentication
2. Role-based access control
3. CRM
4. Project management
5. Team management
6. Document management
7. Reports and analytics
8. Notifications
9. Activity tracking
10. AI project intelligence
11. Smart team recommendation
12. Project health monitoring

The system should be modular, scalable and maintainable.

---

# 3. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios
- TanStack Query
- React Hook Form
- Zod
- Recharts

## Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose

## Authentication & Security

- JWT
- HttpOnly Cookies
- bcrypt
- Helmet
- CORS
- Rate Limiting

## Development

- Git
- GitHub
- ESLint
- Prettier

## Future Infrastructure

- Redis
- BullMQ
- Docker
- GitHub Actions

These future technologies should only be introduced when actually required.

---

# 4. User Roles

The system should support role-based access control.

Primary roles:

- Super Admin
- Admin
- Project Manager
- Team Lead
- Developer
- Designer
- QA
- Client

Each role must have appropriate permissions.

Permissions must be enforced on the backend, not only hidden in the frontend.

---

# 5. CORE MODULES

## 5.1 Authentication

Features:

- Login
- Logout
- Protected routes
- JWT authentication
- HttpOnly cookies
- Password hashing
- Authentication state
- Role-based authorization

Screens:

- Sign In
- Forgot Password
- Reset Password

---

# 5.2 Dashboard

Dashboard must provide an overview of company/project activity.

Include:

- Total projects
- Active projects
- Completed projects
- Total clients
- Total team members
- Pending tasks
- Overdue tasks
- Upcoming milestones
- Project health
- Recent activity
- Task statistics
- Project progress

Use charts where appropriate.

---

# 5.3 CRM

Manage the complete lead/client workflow.

### Leads

- Lead list
- Lead details
- Create lead
- Edit lead
- Lead status
- Lead source
- Lead conversion

### Clients

- Client list
- Client details
- Client projects
- Client contact information
- Client activity

### Meetings

- Meeting list
- Create meeting
- Meeting details
- Meeting notes
- Meeting status
- Meeting participants

---

# 5.4 Project Management

Projects are the central module.

Project information:

- Project name
- Client
- Description
- Project manager
- Team members
- Start date
- End date
- Status
- Priority
- Budget
- Progress
- Technology stack

Project features:

- Project overview
- Project details
- Project members
- Tasks
- Subtasks
- Milestones
- Documents
- Activity
- Reports
- Project health

---

# 5.5 Tasks & Subtasks

Features:

- Create task
- Edit task
- Delete task
- Assign task
- Task status
- Priority
- Due date
- Description
- Tags
- Subtasks
- Comments
- Attachments

Statuses:

- Todo
- In Progress
- Review
- Completed

Tasks must support filtering and sorting.

---

# 5.6 Milestones

Features:

- Create milestone
- Edit milestone
- Milestone status
- Start date
- Due date
- Progress
- Related tasks
- Completion tracking

Display milestones using a clean timeline/list interface.

---

# 5.7 Team Management

Features:

- Team directory
- Add member
- Member details
- Role
- Skills
- Assigned projects
- Workload
- Availability
- Performance

---

# 5.8 Document Management

Features:

- Upload documents
- Document list
- Document categories
- Project documents
- Client documents
- Download
- Delete
- Search
- File metadata

---

# 5.9 Reports & Analytics

Reports should include:

- Project performance
- Team workload
- Task completion
- Project progress
- Milestone completion
- Client/project statistics

Use Recharts for visual analytics.

---

# 5.10 Notifications

Support:

- Task assignment notifications
- Task deadline notifications
- Project updates
- Milestone notifications
- Team notifications
- System notifications

Include:

- Notification list
- Read/unread state
- Mark as read
- Mark all as read

---

# 5.11 Activity Logs

Track important system actions.

Examples:

- User created
- Project created
- Task created
- Task assigned
- Status changed
- Milestone completed
- Document uploaded
- Client updated

Activity logs should contain:

- User
- Action
- Entity
- Timestamp
- Description

---

# 5.12 Settings

Include:

### Profile Settings
- Name
- Email
- Profile image
- Password

### Organization Settings
- Organization name
- Organization details
- Team settings

### System Settings
- Notifications
- Security
- Preferences

---

# 6. CORE AI INTELLIGENCE

AI features are mandatory parts of DevFlow.

## 6.1 AI Project Assistant

The assistant should help analyze project information.

Capabilities:

- Meeting summary
- Requirement analysis
- Milestone generation
- Task generation
- Timeline estimation
- Technology stack suggestion

The AI output must be displayed clearly and allow the user to review the generated result before applying it.

---

# 6.2 Smart Team Recommendation

Recommend suitable team members for a project/task based on:

- Skills
- Experience
- Current workload
- Availability
- Role

Display:

- Recommended member
- Matching skills
- Current workload
- Recommendation reason

---

# 6.3 Project Health Score

Calculate/display a project health score using available project data.

Consider:

- Task completion
- Overdue tasks
- Milestone progress
- Deadline status
- Team workload

Display:

- Health score
- Health status
- Main issues
- Recommended actions

---

# 7. EXPANSION FEATURES

After the CORE system is stable, implement:

1. Resource Optimization Engine
2. Risk Prediction & Management
3. Change Request Impact Analysis
4. Workload & Capacity Analysis
5. Advanced Project Forecasting
6. Smart Analytics Dashboard

These must not block completion of the CORE system.

---

# 8. OPTIONAL FEATURE

AI Chat Assistant / AI Project Copilot.

This is optional and should only be implemented after all mandatory functionality is stable.

---

# 9. UI/UX REQUIREMENTS

The UI must be professional SaaS software quality.

Requirements:

- Consistent typography
- Consistent spacing
- Consistent buttons
- Consistent cards
- Consistent forms
- Consistent tables
- Consistent colors
- Responsive layout
- Accessible components
- Clear visual hierarchy
- Professional empty states
- Loading states
- Error states
- Confirmation dialogs
- Toast notifications

Use the existing DevFlow Figma design as the visual reference.

Do not create unrelated visual styles between screens.

All screens must feel like one unified product.

---

# 10. FRONTEND ARCHITECTURE

Use a modular architecture.

Suggested structure:

app/
components/
features/
lib/
hooks/
services/
types/
schemas/
providers/
utils/

Group functionality by feature where practical.

Avoid putting all components into one directory.

---

# 11. BACKEND ARCHITECTURE

Suggested structure:

server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
    types/

Use:

Routes → Controllers → Services → Models

Business logic should primarily live in services.

---

# 12. DATABASE

MongoDB with Mongoose.

Main models:

- User
- Organization
- Lead
- Client
- Meeting
- Project
- Task
- Subtask
- Milestone
- Document
- Notification
- ActivityLog

Additional models may be introduced when required.

Use proper relationships and validation.

---

# 13. API REQUIREMENTS

Use RESTful APIs.

Examples:

POST /api/auth/login
POST /api/auth/logout
GET /api/dashboard
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id

Follow consistent:

- HTTP methods
- Status codes
- Request validation
- Error responses
- Authentication
- Authorization

---

# 14. ERROR HANDLING

The application must handle:

- Invalid input
- Unauthorized requests
- Forbidden requests
- Missing resources
- Server errors
- Network errors
- Authentication failures

Frontend must show user-friendly error messages.

Never expose sensitive server errors to users.

---

# 15. DEVELOPMENT PRIORITY

Implementation order:

PHASE 1
Authentication
Users
Roles
Database
Project structure

PHASE 2
Dashboard
Projects
Tasks
Subtasks
Milestones

PHASE 3
Team Management
CRM
Clients
Meetings

PHASE 4
Documents
Notifications
Activity Logs
Settings

PHASE 5
Reports & Analytics

PHASE 6
AI Project Assistant
Smart Team Recommendation
Project Health Score

PHASE 7
Expansion features

PHASE 8
Testing
Security
UI polish
Deployment

Do not move to advanced features if the foundation is broken.

---

# 16. IMPORTANT DEVELOPMENT RULES

1. Do not rewrite working functionality unnecessarily.
2. Do not introduce libraries without a reason.
3. Keep frontend and backend separated logically.
4. Reuse components.
5. Use TypeScript properly.
6. Validate API input.
7. Protect authenticated routes.
8. Enforce RBAC on backend.
9. Keep code readable.
10. Avoid duplicated business logic.
11. Do not hardcode sensitive credentials.
12. Use environment variables.
13. Keep UI consistent with the Figma design.
14. Test each module before moving to the next.
15. Commit changes frequently.

---

# 17. DEMO PRIORITY

For the project submission, the most important complete user journey is:

Sign In
→ Dashboard
→ Projects
→ Project Details
→ Milestones
→ Tasks
→ Task Details
→ Team
→ Reports
→ AI Project Intelligence

This flow must work reliably.

The application should look complete and professional during demonstration.