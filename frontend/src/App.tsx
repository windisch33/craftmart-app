import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { MobileProvider } from './hooks/useMobile';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Salesmen from './pages/Salesmen';
import Jobs from './pages/Jobs';
import Projects from './pages/Projects';
import Shops from './pages/Shops';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Users from './pages/Users';
import './styles/App.css';
import { ToastProvider } from './components/common/ToastProvider';

function App() {
  return (
    <AuthProvider>
      <MobileProvider>
        <ToastProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="app-container">
                <Header />
                <div className="main-layout">
                  <Sidebar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/salesmen" element={<Salesmen />} />
                      {/* Job Items and Jobs (project-level) routes */}
                      <Route path="/job-items" element={<Jobs />} />
                      <Route path="/jobs" element={<Projects />} />
                      <Route path="/shops" element={<Shops />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
        </Router>
        </ToastProvider>
      </MobileProvider>
    </AuthProvider>
  );
}

export default App;
