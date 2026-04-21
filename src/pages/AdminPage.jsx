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
      <h2 className="text-2xl font-bold mb-2">Admin</h2>
      <div className="flex border-b-2 border-gray-200 mb-5">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm bg-transparent border-0 cursor-pointer -mb-0.5 border-b-2 ${
                active
                  ? 'border-gray-900 font-semibold text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
      {tab === 'Dashboard'  && <AdminDashboardPage />}
      {tab === 'Users'      && <AdminUsersPage />}
      {tab === 'Categories' && <AdminCategoriesPage />}
      {tab === 'Reports'    && <AdminReportsPage />}
      {tab === 'Auctions'   && <AdminAuctionsPage />}
      {tab === 'Deliveries' && <AdminDeliveriesPage />}
    </div>
  );
}
