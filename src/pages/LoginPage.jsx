import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

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

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
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
    </div>
  );
}
