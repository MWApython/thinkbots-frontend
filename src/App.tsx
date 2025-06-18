import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GapAnalysis from './components/GapAnalysis';
import DocAnonymity from './components/DocAnonymity';
import TeamCollab from './components/TeamCollab';
import Notifications from './components/Notifications';
import Layout from './components/Layout';
import Requirements from './components/Requirements';
import KeyDocuments from './components/KeyDocuments';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SOCIBot from './components/SOCIBot';
import ApiDashboard from './components/ApiDashboard';
import ReadMe from './components/ReadMe';
import Credits from './components/Credits';
import RiskAssessmentDashboard from './components/RiskAssessmentDashboard';
import CybersecurityFramework from './components/CybersecurityFramework';
import RequirementMapPage from './components/RequirementMapPage';
import SociGapAnalysis from './components/SociGapAnalysis';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

const theme = createTheme({
  // ... existing theme configuration ...
});

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
      <AuthProvider>
          <NotificationProvider>
            <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="gap-analysis" element={<GapAnalysis />} />
                <Route path="doc-anonymity" element={<DocAnonymity />} />
                <Route path="risk-management" element={<RiskAssessmentDashboard />} />
                <Route path="team-collab" element={<TeamCollab />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="requirements" element={<Requirements />} />
                <Route path="key-documents" element={<KeyDocuments />} />
                <Route path="api-dashboard" element={<ApiDashboard />} />
                <Route path="credits" element={<Credits />} />
                <Route path="requirement-map" element={<RequirementMapPage />} />
                <Route path="nist-gap-analysis" element={<SociGapAnalysis />} />
                <Route path="cybersecurity-framework" element={<CybersecurityFramework />} />
                <Route path="soci-bot" element={<SOCIBot />} />
              </Route>
            </Routes>
            </Router>
          </NotificationProvider>
        </AuthProvider>
        </ThemeProvider>
    </LanguageProvider>
  );
}

export default App; 