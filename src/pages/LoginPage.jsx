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
  ADMIN: 'bg-purple-100',
  BUYER: 'bg-blue-100',
  SELLER: 'bg-green-100',
  DELIVERY_DRIVER: 'bg-amber-100',
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

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500';
  const btnPrimary = 'w-full py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800';

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h2 className="text-2xl font-bold mb-6">{isRegister ? 'Register' : 'Login'}</h2>

      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required className={inputClass} />
        <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required className={inputClass} />

        {isRegister && (
          <>
            <p className="text-xs text-gray-500 -mt-1">Min 8 chars: uppercase, lowercase, digit, special character</p>
            <input placeholder="First Name" value={form.firstName} onChange={set('firstName')} required className={inputClass} />
            <input placeholder="Last Name" value={form.lastName} onChange={set('lastName')} required className={inputClass} />
            <select value={form.role} onChange={set('role')} className={inputClass}>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
            </select>
          </>
        )}

        <button type="submit" className={btnPrimary}>{isRegister ? 'Register' : 'Login'}</button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
          className="text-gray-900 underline bg-transparent border-none cursor-pointer text-sm"
        >
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>

      <div className="mt-10 p-4 bg-gray-50 border border-gray-200">
        <p className="text-xs font-bold text-gray-500 mb-3">Quick login — dev test accounts</p>
        <div className="flex flex-col gap-1.5">
          {TEST_USERS.map((u) => (
            <button
              key={u.email}
              onClick={() => handleQuickLogin(u.email, u.password)}
              className={`px-3 py-1 text-xs text-left border border-gray-300 cursor-pointer hover:opacity-80 ${ROLE_COLORS[u.role] ?? 'bg-gray-100'}`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-gray-400">Seeded automatically on Docker startup.</p>
      </div>
    </div>
  );
}
