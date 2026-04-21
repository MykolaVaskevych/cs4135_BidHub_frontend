import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/catalogue/categories')
      .then((data) => setCategories(data))
      .catch((err) => setError(err.body?.message || err.message));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Browse Categories</h2>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories found.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Category Name</th>
                <th className="px-3 py-2 font-medium text-gray-700">Slug</th>
                <th className="px-3 py-2 font-medium text-gray-700">Depth</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.categoryId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">{c.slug ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-600">{c.depth ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
