import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ROLE_BADGE = {
  ADMIN: 'bg-gray-900 text-white',
  BUYER: 'bg-blue-100 text-blue-800',
  SELLER: 'bg-green-100 text-green-800',
  DELIVERY_DRIVER: 'bg-amber-100 text-amber-800',
};

export default function Layout() {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
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

  const linkCls = ({ isActive }) =>
    `text-sm px-1 py-3 -mb-px border-b-2 transition-colors ${
      isActive
        ? 'text-gray-900 font-semibold border-gray-900'
        : 'text-gray-600 hover:text-gray-900 border-transparent'
    }`;

  return (
    <div>
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-6">
          <Link to="/" className="font-bold text-lg text-gray-900 shrink-0 py-3">
            BidHub
          </Link>

          {user && (
            <nav className="flex items-center gap-5 flex-1 flex-wrap">
              <NavLink to="/auctions" className={linkCls}>Auctions</NavLink>
              <NavLink to="/watchlist" className={linkCls}>Watchlist</NavLink>
              {isBuyer && <NavLink to="/dashboard" className={linkCls}>Dashboard</NavLink>}
              {isBuyer && <NavLink to="/wallet" className={linkCls}>Wallet</NavLink>}
              {isSeller && <NavLink to="/seller" className={linkCls}>My Listings</NavLink>}
              <NavLink to="/deliveries" className={linkCls}>Deliveries</NavLink>
              <NavLink to="/notifications" className={linkCls}>Notifications</NavLink>
              {isAdmin && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
            </nav>
          )}

          {user ? (
            <div className="flex items-center gap-3 shrink-0 relative py-2">
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search auctions…"
                  className="px-3 py-1.5 text-sm border border-gray-300 w-48 focus:outline-none focus:border-gray-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm border border-l-0 border-gray-300 bg-gray-50 hover:bg-gray-100"
                >
                  Go
                </button>
              </form>

              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-2 py-1 border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                  {user.role === 'DELIVERY_DRIVER' ? 'DRIVER' : user.role}
                </span>
                <span className="text-sm text-gray-700 max-w-[10rem] truncate">{user.email}</span>
                <svg className="w-3 h-3 text-gray-500" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-10 bg-transparent border-0 cursor-default"
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-sm z-20">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                    <div className="border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 bg-transparent border-0 cursor-pointer"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="ml-auto py-3 text-sm text-gray-700 hover:text-gray-900">
              Log in
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
