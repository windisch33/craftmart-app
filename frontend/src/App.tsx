import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { MobileProvider } from './hooks/useMobile';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Jobs from './pages/Jobs';
import Shops from './pages/Shops';
import Reports from './pages/Reports';
import Login from './pages/Login';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <MobileProvider>
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
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/shops" element={<Shops />} />
                      <Route path="/reports" element={<Reports />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
        </Router>
      </MobileProvider>
    </AuthProvider>
  );
}

export default App;