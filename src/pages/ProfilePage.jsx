import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState({ firstName: '', lastName: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({ addressLine1: '', addressLine2: '', city: '', county: '', eircode: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [addrReloadKey, setAddrReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get('/accounts/me')
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setEdit({ firstName: data.firstName, lastName: data.lastName });
      })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get('/accounts/me/addresses')
      .then((data) => { if (!cancelled) setAddresses(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [addrReloadKey]);

  const reloadAddresses = () => setAddrReloadKey((k) => k + 1);

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

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api.post('/accounts/me/addresses', addrForm);
      setAddrForm({ addressLine1: '', addressLine2: '', city: '', county: '', eircode: '' });
      setMsg('Address added');
      reloadAddresses();
    } catch (err) { setError(err.body?.message || err.message); }
  };

  const handleSetDefault = async (addressId) => {
    setMsg(''); setError('');
    try {
      await api.put(`/accounts/me/addresses/${addressId}/default`);
      setMsg('Default address updated');
      reloadAddresses();
    } catch (err) { setError(err.body?.message || err.message); }
  };

  const handleDeleteAddress = async (addressId) => {
    setMsg(''); setError('');
    try {
      await api.del(`/accounts/me/addresses/${addressId}`);
      setMsg('Address removed');
      reloadAddresses();
    } catch (err) { setError(err.body?.message || err.message); }
  };

  if (!profile && !error) return <p>Loading...</p>;
  if (!profile) return <p style={{ color: 'red' }}>{error}</p>;

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
      <form onSubmit={handlePassword} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input type="password" placeholder="Current Password" value={pw.currentPassword}
          onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
        <input type="password" placeholder="New Password" value={pw.newPassword}
          onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
        <button type="submit">Change</button>
      </form>

      <h3>Addresses</h3>
      {addresses.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>Address</th>
              <th>City</th>
              <th>County</th>
              <th>Eircode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((a) => (
              <tr key={a.addressId} style={{ borderBottom: '1px solid #eee' }}>
                <td>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}{a.isDefault && <strong> (default)</strong>}</td>
                <td>{a.city}</td>
                <td>{a.county}</td>
                <td>{a.eircode}</td>
                <td style={{ display: 'flex', gap: 4 }}>
                  {!a.isDefault && <button onClick={() => handleSetDefault(a.addressId)}>Set Default</button>}
                  <button onClick={() => handleDeleteAddress(a.addressId)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Add Address</h4>
      <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
        <input placeholder="Address Line 1" value={addrForm.addressLine1}
          onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })} required />
        <input placeholder="Address Line 2 (optional)" value={addrForm.addressLine2}
          onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })} />
        <input placeholder="City" value={addrForm.city}
          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} required />
        <input placeholder="County" value={addrForm.county}
          onChange={(e) => setAddrForm({ ...addrForm, county: e.target.value })} required />
        <input placeholder="Eircode" value={addrForm.eircode}
          onChange={(e) => setAddrForm({ ...addrForm, eircode: e.target.value })} required />
        <button type="submit" style={{ alignSelf: 'flex-start' }}>Add Address</button>
      </form>
    </div>
  );
}
