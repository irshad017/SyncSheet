# ✨ SyncSheet ✨
### *Collaborative, Real-Time, and Secure Spreadsheet Management*
**Deployed Project:** [https://sheet-sync-4k8b.vercel.app](https://sheet-sync-4k8b.vercel.app)

Welcome to **SyncSheet**—an innovative, real-time spreadsheet application that fosters collaboration and interaction among users. Work on your spreadsheets simultaneously with others, engage in discussions, and manage your data securely—all within a beautifully crafted interface.

---

## 🌟 Features

### 📊 Real-Time Collaboration
- Collaborate with multiple users on the same spreadsheet—changes reflect instantly for everyone.
- **WebSockets** power the real-time updates, ensuring a smooth experience.
- Keep track of who’s editing what in real-time.

### 💬 Social Interaction
- Easily share your spreadsheets via email or unique links.
- Engage in threaded discussions about the data directly within the sheet—perfect for teamwork.
- Comment on specific cells or sections, and tag collaborators for instant feedback.

### 🔒 User Authentication
- **Secure login and registration system** keeps your data safe.
- **JWT Authentication** protects user sessions.
- **bcrypt** securely hashes and stores passwords, ensuring that your credentials are encrypted.

---

## 🛠️ Technologies Used

### Frontend
- **React.js**: Dynamic and reactive UI components for an intuitive user experience.
- **Tailwind CSS**: Stylish, responsive, and utility-first CSS for beautiful layouts.
- **JavaScript (ES6+)**: Harness the power of modern JavaScript for maintainability and performance.
- **WebSockets**: For real-time, bi-directional communication between users.

### Backend
- **Node.js**: Asynchronous, event-driven backend for high performance.
- **Express.js**: Lightweight and flexible framework to power the API.
- **MongoDB**: NoSQL database storing user data, spreadsheets, and version history.

### Authentication
- **JWT (JSON Web Tokens)**: Session-based, secure user authentication.
- **bcrypt**: Industry-standard password hashing for user security.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14.x or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** (installed with Node.js)

## Local Setup Instructions (Write for both windows and macos)

Follow these steps to run the project locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Priyesh1311421/SocialCalc.git
   cd SocialCalc
   ```

2. **Install dependencies for both frontend and backend:**

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```
3. **Add your own mongo db url:**

   Locate server.js file in backend folder and your own mongodb url in line number 15.
   
4. **Run the application:**

   ```bash
   # Start the backend server
   cd server
   npm run dev

   # Start the frontend server
   cd client
   npm run dev
   ```

   The application will be available at `http://localhost:5000` for backend and `http://localhost:5173` for frontend

## Usage

- **Create Spreadsheets:** Start a new spreadsheet or open an existing one.
- **Collaborate in Real-Time:** Invite others to collaborate on your spreadsheet, with updates appearing live.
- **Engage Socially:** Share your spreadsheet with others and discuss changes in real-time through the built-in commenting system.
