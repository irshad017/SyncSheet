import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Spreadsheet from './components/Spreadsheet';
import WorkSpace from './components/Common/workspace';
import Header from './components/Common/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Header/>} />
        <Route path='/workspace' element={<WorkSpace/>} ></Route>
        <Route path="/spreadsheet/:id" element={<Spreadsheet/>} />
      </Routes>
    </Router>
  );
}

export default App;
