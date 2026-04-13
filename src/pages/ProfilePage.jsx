import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState({ firstName: '', lastName: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/accounts/me').then((data) => {
      if (cancelled) return;
      setProfile(data);
      setEdit({ firstName: data.firstName, lastName: data.lastName });
    });
    return () => { cancelled = true; };
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const data = await api.put('/accounts/me', edit);
      setProfile(data);
      setMsg('Profile updated');
    } catch (err) { setError(err.body?.message || err.message); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api.put('/accounts/me/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      setMsg('Password changed');
    } catch (err) { setError(err.body?.message || err.message); }
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <h2>Profile</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ marginBottom: 16 }}>
        <tbody>
          <tr><td><strong>Email</strong></td><td>{profile.email}</td></tr>
          <tr><td><strong>Role</strong></td><td>{profile.role}</td></tr>
          <tr><td><strong>Status</strong></td><td>{profile.status}</td></tr>
          <tr><td><strong>Registered</strong></td><td>{new Date(profile.createdAt).toLocaleDateString()}</td></tr>
        </tbody>
      </table>

      <h3>Edit Profile</h3>
      <form onSubmit={handleUpdate} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input placeholder="First Name" value={edit.firstName}
          onChange={(e) => setEdit({ ...edit, firstName: e.target.value })} required />
        <input placeholder="Last Name" value={edit.lastName}
          onChange={(e) => setEdit({ ...edit, lastName: e.target.value })} required />
        <button type="submit">Save</button>
      </form>

      <h3>Change Password</h3>
      <form onSubmit={handlePassword} style={{ display: 'flex', gap: 8 }}>
        <input type="password" placeholder="Current Password" value={pw.currentPassword}
          onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
        <input type="password" placeholder="New Password" value={pw.newPassword}
          onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
        <button type="submit">Change</button>
      </form>

      {profile.addresses?.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Addresses</h3>
          <ul>
            {profile.addresses.map((a) => (
              <li key={a.addressId}>
                {a.addressLine1}, {a.city}, {a.county}, {a.eircode}
                {a.isDefault && <strong> (default)</strong>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
