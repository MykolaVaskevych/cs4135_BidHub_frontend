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
    if (!globalThis.confirm('Permanently delete this category? This cannot be undone.')) return;
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

  const inputCls = 'px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500';
  const btnBase = 'px-2.5 py-1 text-xs font-medium border';
  const btnPrimary = `${btnBase} text-white bg-gray-900 border-gray-900 hover:bg-gray-800`;
  const btnSecondary = `${btnBase} text-gray-900 bg-white border-gray-300 hover:bg-gray-50`;
  const btnDanger = `${btnBase} text-red-700 bg-white border-red-300 hover:bg-red-50`;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Categories</h3>
      {msg && <p className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap">
        <input
          placeholder="Category name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className={`${inputCls} w-48`}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputCls} flex-1 min-w-[200px]`}
        />
        <button type="submit" className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800">
          {editId ? 'Update' : 'Create'}
        </button>
        {editId && (
          <button
            type="button"
            onClick={() => { setEditId(null); setForm({ name: '', description: '' }); }}
            className="px-4 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </form>

      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Name</th>
                <th className="px-3 py-2 font-medium text-gray-700">Description</th>
                <th className="px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.categoryId} className={`border-b border-gray-100 ${c.isActive ? '' : 'opacity-50'}`}>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 text-gray-600">{c.description || <span className="text-gray-400">-</span>}</td>
                  <td className={`px-3 py-2 font-medium ${c.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => startEdit(c)} className={btnSecondary}>Edit</button>
                      {c.isActive
                        ? <button onClick={() => handleDeactivate(c.categoryId)} className={btnSecondary}>Deactivate</button>
                        : <button onClick={() => handleActivate(c.categoryId)} className={btnPrimary}>Activate</button>}
                      <button onClick={() => handleDelete(c.categoryId)} className={btnDanger}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
