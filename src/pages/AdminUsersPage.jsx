import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page, size: 10 });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    api.get(`/admin/users?${params}`)
      .then((data) => {
        if (cancelled) return;
        setUsers(data.content);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        if (!cancelled) setError(err.body?.message || err.message);
      });

    return () => { cancelled = true; };
  }, [page, reloadKey, search, statusFilter]);

  const action = useCallback(async (userId, act, reason) => {
    setMsg(''); setError('');
    try {
      if (act === 'reactivate') {
        await api.post(`/admin/users/${userId}/reactivate`);
      } else {
        await api.post(`/admin/users/${userId}/${act}`, { reason: reason || `Admin ${act}` });
      }
      setMsg(`User successfully ${act === 'reactivate' ? 'reactivated' : act + 'ed'}`);
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  }, []);

  const statusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700';
      case 'SUSPENDED': return 'text-amber-700';
      case 'BANNED': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  const inputCls = 'px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500';
  const btnBase = 'px-2.5 py-1 text-xs font-medium border';
  const btnPrimary = `${btnBase} text-white bg-gray-900 border-gray-900 hover:bg-gray-800`;
  const btnSecondary = `${btnBase} text-gray-900 bg-white border-gray-300 hover:bg-gray-50`;
  const btnDanger = `${btnBase} text-red-700 bg-white border-red-300 hover:bg-red-50`;
  const btnPager = 'px-3 py-1 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">User Management</h3>
      {msg && <p className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          placeholder="Search by email / name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); reload(); } }}
          className={`${inputCls} flex-1 min-w-[220px]`}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
        <button onClick={() => { setPage(0); reload(); }} className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800">
          Search
        </button>
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <th className="px-3 py-2 font-medium text-gray-700">Email</th>
              <th className="px-3 py-2 font-medium text-gray-700">Name</th>
              <th className="px-3 py-2 font-medium text-gray-700">Role</th>
              <th className="px-3 py-2 font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-b border-gray-100">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.firstName} {u.lastName}</td>
                <td className="px-3 py-2 text-gray-600">{u.role}</td>
                <td className={`px-3 py-2 font-medium ${statusClass(u.status)}`}>{u.status}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {u.status === 'ACTIVE' && (
                      <>
                        <button onClick={() => action(u.userId, 'suspend', 'Admin action')} className={btnSecondary}>Suspend</button>
                        <button onClick={() => action(u.userId, 'ban', 'Admin action')} className={btnDanger}>Ban</button>
                      </>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <>
                        <button onClick={() => action(u.userId, 'reactivate')} className={btnPrimary}>Reactivate</button>
                        <button onClick={() => action(u.userId, 'ban', 'Escalated')} className={btnDanger}>Ban</button>
                      </>
                    )}
                    {u.status === 'BANNED' && <span className="text-xs text-gray-400">No actions</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex gap-2 items-center">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className={btnPager}>Prev</button>
          <span className="text-sm text-gray-600">Page {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className={btnPager}>Next</button>
        </div>
      )}
    </div>
  );
}
