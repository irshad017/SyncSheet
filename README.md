


## Features

- **Real-Time Collaboration:** Multiple users can work on the same spreadsheet simultaneously, with updates appearing in real-time..
- **Social Interaction:** Share your spreadsheet with others, and engage in discussions about the data and changes.
- **User Authentication:** Secure login and registration system to protect user data.

## Technologies Used

- **Frontend:**
  - React.js
  - Tailwind CSS
  - JavaScript (ES6+)
  - WebSockets (for real-time updates)


- **Backend:**
  - Node.js
  - Express.js
  - MongoDB (for storing user data, spreadsheets, and version history)

- **Authentication:**
  - JSON Web Tokens (JWT)
  - bcrypt (for password hashing)  

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
