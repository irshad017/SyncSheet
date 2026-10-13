# ✨ SyncSheet ✨

### *Collaborative, Real-Time, and Secure Spreadsheet Management*

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://sheetsync-client.vercel.app)
[![Render Backend](https://img.shields.io/badge/Backend%20on-Render-46E3B7?style=for-the-badge&logo=render)](https://back-it.onrender.com/api/spreadsheet/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-irshad017%2FSyncSheet-181717?style=for-the-badge&logo=github)](https://github.com/irshad017/SyncSheet)

---

## 🌐 Live Deployments

- **Frontend Live URL (Vercel):** [https://sheetsync-client.vercel.app](https://sheetsync-client.vercel.app)
---

## 📖 Overview

**SyncSheet** is a real-time collaborative spreadsheet web application built for teams and individuals. It offers instant updates, live collaborator tracking, cell formatting, email-based sheet sharing, and secure user authentication.

---

## 🌟 Key Features

### 📊 Real-Time Collaboration
- Multiple users can view and edit the same spreadsheet simultaneously.
- **WebSocket connection (`wss://`)** synchronizes cell values and active selections in real-time.
- Visual cell selection tracking to see active collaborator focus.

### 💬 Collaborator Sharing
- Search users by email/username and grant access to spreadsheets.
- Built-in sharing system to manage sheet permissions and team access.

### 🔒 User Authentication & Security
- **JWT (JSON Web Tokens)**: Secure token-based session handling.
- **bcrypt**: Industry-standard password hashing before persistence.
- Protected API routes requiring token authorization.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recoil, React Window, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js, WebSockets (`ws`), Mongoose, JWT, bcrypt |
| **Database** | MongoDB (MongoDB Atlas) |
| **Deployment** | **Vercel** (Frontend SPA) + **Render** (Node.js & WebSocket Backend) |

---

## ⚙️ Environment Variables

### Frontend (`Client/.env`)
Create a `.env` file inside the `Client` directory:

```env
# Render Backend Base URL
VITE_API_URL=https://back-it.onrender.com

# Backend Deployment Base URL
VITE_BACKEND_URL=https://back-it.onrender.com

# Spreadsheet API Endpoint
VITE_SPREADSHEET_API=https://back-it.onrender.com/api/spreadsheet/
```

> **Note:** The frontend automatically derives the secure WebSocket URL (`wss://back-it.onrender.com`) from the configured HTTP base URL.

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- [npm](https://www.npmjs.com/) (v8.x or higher)
- [Git](https://git-scm.com/)
- MongoDB connection string (local or MongoDB Atlas)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/irshad017/SyncSheet.git
cd SyncSheet
```

---

### Step 2: Backend Setup (`Server`)

1. Navigate to the `Server` directory:
   ```bash
   cd Server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your MongoDB connection URI in `server.js` (line 15) or as an environment variable:
   ```javascript
   mongoose.connect(process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING')
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *The server runs on `http://localhost:5000`.*

---

### Step 3: Frontend Setup (`Client`)

1. Open a new terminal and navigate to the `Client` directory:
   ```bash
   cd Client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file (pointing to local backend or production backend):
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SPREADSHEET_API=http://localhost:5000/api/spreadsheet/
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will be running at `http://localhost:5173`.*

---

## 📦 Building & Deploying to Vercel

The frontend is configured with `vercel.json` for seamless Single Page Application (SPA) rewrites.

### Deploying via Vercel CLI

```bash
cd Client
npx vercel --prod
```

### Deploying via Vercel Dashboard

1. Import the repository `irshad017/SyncSheet` on [Vercel](https://vercel.com).
2. Set **Root Directory** to `Client`.
3. Add the following **Environment Variables**:
   - `VITE_API_URL` = `Your_running_backend_url`
   - `VITE_SPREADSHEET_API` = `your_running_backend_url`
4. Click **Deploy**.

---

## 📄 License

This project is licensed under the MIT License.
