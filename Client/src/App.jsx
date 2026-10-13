import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Spreadsheet from './components/Spreadsheet';
import WorkSpace from './components/Common/workspace';
import Header from './components/Common/HomePage';
import Login from './components/Auth/Login';
import UserRegistration from './components/Auth/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Header />} />
        <Route path="/workspace" element={<WorkSpace />} />
        <Route path="/spreadsheet/:id" element={<Spreadsheet />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<UserRegistration />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
