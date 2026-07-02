# 📄 AI Resume Builder & Chat Assistant

A full-stack MERN application with AI-powered resume generation, chat assistant, PDF export, and admin dashboard.

## Tech Stack
- **Frontend**: React.js, React Router, Axios, jsPDF
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT + bcrypt
- **AI**: OpenAI GPT-3.5

## Quick Start

### 1. Clone & Install
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Configure Environment Variables
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-resume-builder
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
OPENAI_API_KEY=sk-your-openai-api-key
CLIENT_URL=http://localhost:3000

# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Run
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

Open http://localhost:3000

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Get JWT token |
| GET | /api/auth/me | JWT | Get current user |
| POST | /api/ai/generate-resume | JWT | AI resume generation |
| POST | /api/ai/improve-resume | JWT | AI improvement |
| POST | /api/ai/chat | JWT | Chat assistant |
| GET | /api/history/resumes | JWT | List resumes |
| GET | /api/history/resumes/:id | JWT | Get single resume |
| PUT | /api/history/resumes/:id | JWT | Update resume |
| DELETE | /api/history/resumes/:id | JWT | Delete resume |
| GET | /api/history/chats | JWT | List chat sessions |
| GET | /api/history/chats/:id | JWT | Get chat messages |
| DELETE | /api/history/chats/:id | JWT | Delete chat |
| GET | /api/history/stats | JWT | Dashboard stats |
| GET | /api/admin/dashboard | Admin | Platform analytics |
| GET | /api/admin/users | Admin | All users |
| PUT | /api/admin/users/:id/role | Admin | Update user role |
| DELETE | /api/admin/users/:id | Admin | Delete user |

## Features
- JWT Authentication (register/login/logout)
- AI Resume Generator (OpenAI GPT)
- Live Resume Preview
- 3 Templates (Modern, Classic, Minimal)
- PDF Export (jsPDF)
- AI Improvement Suggestions
- AI Chat Assistant with history
- Dark Mode
- Role-Based Access (Admin/User)
- Admin Dashboard
- Search & Filter History
- Socket.io Real-time events
- Rate limiting & security headers

## Deployment

### Backend → Railway / Render
```bash
# Set env vars in dashboard, then:
npm start
```

### Frontend → Vercel
```bash
npm run build
# Deploy build/ folder or connect GitHub repo
```

### Database → MongoDB Atlas
- Create free cluster at mongodb.com/atlas
- Get connection string → set as MONGODB_URI
