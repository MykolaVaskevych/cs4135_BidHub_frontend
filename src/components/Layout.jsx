import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Layout() {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
      <nav style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>BidHub</Link>
        {user ? (
          <>
            <Link to="/auctions">Auctions</Link>
            <Link to="/watchlist">Watchlist</Link>
            {isSeller && <Link to="/seller">My Listings</Link>}
            <Link to="/deliveries">Deliveries</Link>
            <Link to="/profile">Profile</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <span style={{ marginLeft: 'auto', fontSize: 14 }}>{user.email} ({user.role})</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login" style={{ marginLeft: 'auto' }}>Login</Link>
        )}
      </nav>
      <main style={{ padding: '16px 0' }}>
        <Outlet />
      </main>
    </div>
  );
}
