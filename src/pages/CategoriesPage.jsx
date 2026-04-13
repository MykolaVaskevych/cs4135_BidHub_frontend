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
      <h2>Browse Categories</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Depth</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.categoryId} style={{ borderBottom: '1px solid #eee' }}>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>{c.depth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}