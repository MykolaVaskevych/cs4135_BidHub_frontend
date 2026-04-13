import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AuctionsPage from './pages/AuctionsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import SearchPage from './pages/SearchPage';
import { useAuth } from './context/useAuth';


function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AuctionsPage /></ProtectedRoute>} />
        <Route path="/auctions" element={<ProtectedRoute><AuctionsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
