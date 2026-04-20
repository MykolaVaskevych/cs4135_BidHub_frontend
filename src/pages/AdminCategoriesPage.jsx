import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    api.get('/admin/categories')
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch((err) => { if (!cancelled) setError(err.body?.detail || err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      if (editId) {
        await api.put(`/admin/categories/${editId}`, form);
        setMsg('Category updated');
      } else {
        await api.post('/admin/categories', form);
        setMsg('Category created');
      }
      setForm({ name: '', description: '' });
      setEditId(null);
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  }, [editId, form]);

  const handleDeactivate = useCallback(async (id) => {
    setMsg(''); setError('');
    try {
      await api.del(`/admin/categories/${id}`);
      setMsg('Category deactivated');
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  }, []);

  const handleActivate = useCallback(async (id) => {
    setMsg(''); setError('');
    try {
      await api.put(`/admin/categories/${id}/activate`);
      setMsg('Category activated');
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Permanently delete this category? This cannot be undone.')) return;
    setMsg(''); setError('');
    try {
      await api.del(`/admin/categories/${id}/hard`);
      setMsg('Category deleted');
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  }, []);

  const startEdit = (cat) => {
    setEditId(cat.categoryId);
    setForm({ name: cat.name, description: cat.description || '' });
  };

  return (
    <div>
      <h2>Admin: Categories</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Category name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ flex: 1 }} />
        <button type="submit">{editId ? 'Update' : 'Create'}</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: '', description: '' }); }}>Cancel</button>}
      </form>

      {categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.categoryId} style={{ borderBottom: '1px solid #eee', opacity: c.isActive ? 1 : 0.5 }}>
                <td>{c.name}</td>
                <td>{c.description}</td>
                <td style={{ color: c.isActive ? 'green' : '#999', fontWeight: 'bold' }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </td>
                <td style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEdit(c)}>Edit</button>
                  {c.isActive
                    ? <button onClick={() => handleDeactivate(c.categoryId)}>Deactivate</button>
                    : <button onClick={() => handleActivate(c.categoryId)}>Activate</button>
                  }
                  <button
                    onClick={() => handleDelete(c.categoryId)}
                    style={{ background: '#fee', color: '#c00', border: '1px solid #f88' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
