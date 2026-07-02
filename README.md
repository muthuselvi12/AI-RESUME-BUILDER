# 📄 AI Resume Builder

A full-stack MERN application with AI-powered resume generation, live preview, PDF export, chat assistant, and admin dashboard — powered by **Groq AI**.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=flat-square) ![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203-orange?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- 🔐 JWT Authentication (register / login / logout)
- 🤖 AI Resume Generator powered by Groq (LLaMA 3.3-70B)
- 👁️ Live Resume Preview with 6 templates
- 📄 PDF Export (A4, properly formatted)
- 📥 Resume Upload & AI Parsing
- ✍️ AI Improvement Suggestions
- 💬 AI Chat Assistant with history
- 🌙 Dark Mode
- 👑 Role-Based Access (Admin / User)
- 📊 Admin Dashboard with analytics
- 🔍 Search & Filter Resume History
- ⚡ Socket.io Real-time events
- 🛡️ Rate limiting & security headers (Helmet)

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router v6, Axios, jsPDF |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| AI | Groq API (llama-3.3-70b-versatile) |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## 🚀 Quick Start (Local)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-resume-builder.git
cd ai-resume-builder
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (open new terminal)
cd frontend
npm install
```

### 3. Configure Environment Variables

**`backend/.env`**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-resume-builder
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRE=7d
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:3000
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

> 💡 Get your free Groq API key at [console.groq.com](https://console.groq.com)

### 4. Run the App
```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
cd frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Project Structure

```
ai-resume-builder/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile
│   │   ├── aiController.js     # AI generation, chat, parse
│   │   ├── historyController.js# Resume & chat history
│   │   └── adminController.js  # Admin dashboard
│   ├── middleware/
│   │   ├── auth.js             # JWT middleware
│   │   └── errorHandler.js     # Centralized error handling
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Resume.js           # Resume schema
│   │   └── Chat.js             # Chat schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── historyRoutes.js
│   │   └── adminRoutes.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/         # Reusable components
│       ├── context/            # Auth & Toast context
│       ├── pages/              # Page components
│       ├── services/           # API service layer
│       └── utils/              # PDF export helpers
└── README.md
```

---

## 📡 API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login & get JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| PUT | `/api/auth/profile` | JWT | Update profile |

### AI
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/ai/generate-resume` | JWT | Generate resume with AI |
| POST | `/api/ai/improve-resume` | JWT | AI improvement suggestions |
| POST | `/api/ai/chat` | JWT | Career chat assistant |
| POST | `/api/ai/parse-resume` | JWT | Parse uploaded resume file |

### History
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/history/resumes` | JWT | List all resumes |
| GET | `/api/history/resumes/:id` | JWT | Get single resume |
| PUT | `/api/history/resumes/:id` | JWT | Update resume |
| DELETE | `/api/history/resumes/:id` | JWT | Delete resume |
| GET | `/api/history/chats` | JWT | List chat sessions |
| GET | `/api/history/chats/:id` | JWT | Get chat messages |
| DELETE | `/api/history/chats/:id` | JWT | Delete chat |
| GET | `/api/history/stats` | JWT | Dashboard stats |

### Admin
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/admin/dashboard` | Admin | Platform analytics |
| GET | `/api/admin/users` | Admin | All users list |
| PUT | `/api/admin/users/:id/role` | Admin | Update user role |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |

---

## 🎨 Resume Templates

| Template | Best For |
|----------|----------|
| Modern | Tech & creative roles |
| Classic | Traditional industries |
| Minimal | Clean, simple look |
| ATS-Optimal | Applicant tracking systems |
| Technical | Engineers & developers |
| Executive | Senior & leadership roles |

---

## ☁️ Deployment

### Backend → Render
1. Push code to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `backend/.env.example`

### Frontend → Vercel
1. Create new project on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variables:
   - `REACT_APP_API_URL` = your Render backend URL + `/api`
   - `REACT_APP_SOCKET_URL` = your Render backend URL

### Database → MongoDB Atlas
1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Get connection string
3. Set as `MONGODB_URI` in Render environment variables

---

## 🔒 Security Notes

- Never commit `.env` files to git (already in `.gitignore`)
- Rotate your Groq API key if it's ever exposed
- Use a strong random `JWT_SECRET` in production
- Set `CLIENT_URL` to your exact frontend domain in production

---

## 📝 License

MIT © 2025