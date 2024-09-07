import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotSignedIn from './pages/NotSignedIn';
import LandingPage from './pages/LandingPage';
import InviteeAvailability from './pages/InviteeAvailability';

function App() {
  const BACKENDURL = 'http://localhost:8000';
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<NotSignedIn BACKENDURL={BACKENDURL} />} />
        <Route path="dashboard" element={<LandingPage BACKENDURL={BACKENDURL} />} />
        <Route path="schedules/calendars/:calendarID/respond/:token" 
          element={<InviteeAvailability BACKENDURL={BACKENDURL}/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
