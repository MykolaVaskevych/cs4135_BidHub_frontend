import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const TEST_USERS = [
  { label: 'Admin',    email: 'admin@bidhub.local',   password: 'Admin123!',    role: 'ADMIN' },
  { label: 'Buyer 1',  email: 'buyer1@bidhub.local',  password: 'Buyer1Pass!',  role: 'BUYER' },
  { label: 'Buyer 2',  email: 'buyer2@bidhub.local',  password: 'Buyer2Pass!',  role: 'BUYER' },
  { label: 'Seller 1', email: 'seller1@bidhub.local', password: 'Seller1Pass!', role: 'SELLER' },
  { label: 'Seller 2', email: 'seller2@bidhub.local', password: 'Seller2Pass!', role: 'SELLER' },
  { label: 'Driver',   email: 'driver1@bidhub.local', password: 'Driver1Pass!', role: 'DELIVERY_DRIVER' },
];

const ROLE_COLORS = {
  ADMIN: '#e8d5ff',
  BUYER: '#d5eaff',
  SELLER: '#d5ffe8',
  DELIVERY_DRIVER: '#fff3d5',
};

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'BUYER',
  });

  if (user) {
    navigate('/');
    return null;
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.body?.message || err.message);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.body?.message || err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
        {isRegister && <small style={{ color: '#666', marginTop: -4 }}>Min 8 chars, must include uppercase, lowercase, digit, and special character (e.g. Password1!)</small>}
        {isRegister && (
          <>
            <input placeholder="First Name" value={form.firstName} onChange={set('firstName')} required />
            <input placeholder="Last Name" value={form.lastName} onChange={set('lastName')} required />
            <select value={form.role} onChange={set('role')}>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
            </select>
          </>
        )}
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <p style={{ marginTop: 12 }}>
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }}
          style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>

      <div style={{ marginTop: 32, padding: 16, background: '#f8f8f8', borderRadius: 8, border: '1px solid #e0e0e0' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 'bold', color: '#555' }}>Quick login — dev test accounts</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TEST_USERS.map((u) => (
            <button key={u.email}
              onClick={() => handleQuickLogin(u.email, u.password)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: ROLE_COLORS[u.role] ?? '#eee',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
              }}>
              {u.label}
            </button>
          ))}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#888' }}>
          Seeded automatically on Docker startup.
        </p>
      </div>
    </div>
  );
}
