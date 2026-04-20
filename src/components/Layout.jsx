import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Layout() {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const isBuyer = user?.role === 'BUYER';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
      <nav style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #ddd', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>BidHub</Link>
        {user ? (
          <>
            <Link to="/auctions">Auctions</Link>
            <Link to="/watchlist">Watchlist</Link>
            {isBuyer && <Link to="/dashboard">Dashboard</Link>}
            {isBuyer && <Link to="/wallet">Wallet</Link>}
            {isSeller && <Link to="/seller">My Listings</Link>}
            <Link to="/deliveries">Deliveries</Link>
            <Link to="/notifications">Notifications</Link>
            <Link to="/profile">Profile</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search auctions…"
                style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, width: 160 }}
              />
              <button type="submit" style={{ padding: '4px 8px', fontSize: 13 }}>Go</button>
            </form>
            <span style={{ fontSize: 13, color: '#555' }}>{user.email}</span>
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
