import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components
import Layout from './components/layout/Layout';
import HelpButton from './components/ui/HelpButton';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import Deposit from './pages/Deposit';
import VipSelection from './pages/VipSelection';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Invite from './pages/Invite';
import AdminPanel from './pages/AdminPanel';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                    <HelpButton />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                    <HelpButton />
                  </PublicRoute>
                }
              />

              {/* Email verification route (semi-protected) */}
              <Route 
                path="/verify-email" 
                element={
                  <>
                    <VerifyEmail />
                    <HelpButton />
                  </>
                } 
              />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deposit"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Deposit />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vip-selection"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <VipSelection />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Tasks />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invite"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Invite />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                    <HelpButton />
                  </ProtectedRoute>
                }
              />

              {/* Placeholder routes for future pages */}
              <Route
                path="/withdraw"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Withdraw Page</h1>
                        <p className="text-gray-600">Coming soon...</p>
                      </div>
                    </div>
                    <HelpButton />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referral"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Referral Page</h1>
                      <p className="text-gray-600">Coming soon...</p>
                    </div>
                  </div>
                  <HelpButton />
                </ProtectedRoute>
              }
            />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Transactions Page</h1>
                        <p className="text-gray-600">Coming soon...</p>
                      </div>
                    </div>
                    <HelpButton />
                  </ProtectedRoute>
                }
              />


              {/* Admin routes placeholder */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
                        <p className="text-gray-600">Coming soon...</p>
                      </div>
                    </div>
                    <HelpButton />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 page */}
              <Route
                path="*"
                element={
                  <>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-gray-600 mb-4">Page not found</p>
                        <a
                          href="/dashboard"
                          className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                          Go to Dashboard
                        </a>
                      </div>
                    </div>
                    <HelpButton />
                  </>
                }
              />
            </Routes>

            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
