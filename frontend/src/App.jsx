/**
 * App.js — Root component: sets up routing, auth protection, and providers
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

import Layout        from './components/UI/Layout';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BuilderPage   from './pages/BuilderPage';
import ChatPage      from './pages/ChatPage';
import HistoryPage   from './pages/HistoryPage';
import AdminPage     from './pages/AdminPage';
import NotFoundPage  from './pages/NotFoundPage';

/* Protected route — redirects to /login if not authenticated */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

/* Admin-only route */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected — wrapped in shared Layout (sidebar + topbar) */}
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index                 element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"      element={<DashboardPage />} />
                <Route path="builder"        element={<BuilderPage />} />
                <Route path="builder/:id"    element={<BuilderPage />} />
                <Route path="chat"           element={<ChatPage />} />
                <Route path="history"        element={<HistoryPage />} />
                <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
