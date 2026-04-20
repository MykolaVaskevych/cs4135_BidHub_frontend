import { useState } from 'react';
import AdminDashboardPage from './AdminDashboardPage';
import AdminUsersPage from './AdminUsersPage';
import AdminCategoriesPage from './AdminCategoriesPage';
import AdminReportsPage from './AdminReportsPage';
import AdminAuctionsPage from './AdminAuctionsPage';
import AdminDeliveriesPage from './AdminDeliveriesPage';

const TABS = ['Dashboard', 'Users', 'Categories', 'Reports', 'Auctions', 'Deliveries'];

export default function AdminPage() {
  const [tab, setTab] = useState('Dashboard');

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Admin</h2>
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #ddd', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px',
            border: 'none',
            borderBottom: tab === t ? '3px solid #333' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: tab === t ? 'bold' : 'normal',
            fontSize: 14,
          }}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Dashboard'  && <AdminDashboardPage />}
      {tab === 'Users'      && <AdminUsersPage />}
      {tab === 'Categories' && <AdminCategoriesPage />}
      {tab === 'Reports'    && <AdminReportsPage />}
      {tab === 'Auctions'    && <AdminAuctionsPage />}
      {tab === 'Deliveries'  && <AdminDeliveriesPage />}
    </div>
  );
}
