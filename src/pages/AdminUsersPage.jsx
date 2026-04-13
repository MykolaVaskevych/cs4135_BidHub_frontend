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

  return (
    <div>
      <h2>Admin: User Management</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Search by email/name..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); reload(); } }}
          style={{ flex: 1 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
        <button onClick={() => { setPage(0); reload(); }}>Search</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userId} style={{ borderBottom: '1px solid #eee' }}>
              <td>{u.email}</td>
              <td>{u.firstName} {u.lastName}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td style={{ display: 'flex', gap: 4 }}>
                {u.status === 'ACTIVE' && (
                  <>
                    <button onClick={() => action(u.userId, 'suspend', 'Admin action')}>Suspend</button>
                    <button onClick={() => action(u.userId, 'ban', 'Admin action')}>Ban</button>
                  </>
                )}
                {u.status === 'SUSPENDED' && (
                  <>
                    <button onClick={() => action(u.userId, 'reactivate')}>Reactivate</button>
                    <button onClick={() => action(u.userId, 'ban', 'Escalated')}>Ban</button>
                  </>
                )}
                {u.status === 'BANNED' && <span style={{ color: '#999' }}>Banned</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
