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

  if (!profile && !error) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!profile) return <p className="text-sm text-red-600">{error}</p>;

  const statusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700';
      case 'SUSPENDED': return 'text-amber-700';
      case 'BANNED': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  const inputClass = 'px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500';
  const btnBase = 'px-3 py-1.5 text-sm font-medium border';
  const btnPrimary = `${btnBase} text-white bg-gray-900 border-gray-900 hover:bg-gray-800`;
  const btnSecondary = `${btnBase} text-gray-900 bg-white border-gray-300 hover:bg-gray-50`;
  const btnDanger = `${btnBase} text-red-700 bg-white border-red-300 hover:bg-red-50`;

  const rowLabel = 'py-1.5 pr-4 text-sm text-gray-500 font-medium align-top w-32';
  const rowValue = 'py-1.5 text-sm text-gray-900';

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      {msg && <p role="status" className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      <table className="mb-6 w-full">
        <tbody>
          <tr><td className={rowLabel}>Email</td><td className={rowValue}>{profile.email}</td></tr>
          <tr><td className={rowLabel}>Role</td><td className={rowValue}>{profile.role}</td></tr>
          <tr>
            <td className={rowLabel}>Status</td>
            <td className={`${rowValue} font-medium ${statusClass(profile.status)}`}>{profile.status}</td>
          </tr>
          <tr><td className={rowLabel}>Registered</td><td className={`${rowValue} text-gray-600`}>{new Date(profile.createdAt).toLocaleDateString()}</td></tr>
        </tbody>
      </table>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Edit Profile</h3>
        <form onSubmit={handleUpdate} className="flex gap-2 flex-wrap items-center">
          <input
            placeholder="First Name" value={edit.firstName}
            onChange={(e) => setEdit({ ...edit, firstName: e.target.value })}
            required className={inputClass}
          />
          <input
            placeholder="Last Name" value={edit.lastName}
            onChange={(e) => setEdit({ ...edit, lastName: e.target.value })}
            required className={inputClass}
          />
          <button type="submit" className={btnPrimary}>Save</button>
        </form>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Change Password</h3>
        <form onSubmit={handlePassword} className="flex gap-2 flex-wrap items-center">
          <input
            type="password" placeholder="Current Password" value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required className={inputClass}
          />
          <input
            type="password" placeholder="New Password" value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            required className={inputClass}
          />
          <button type="submit" className={btnPrimary}>Change</button>
        </form>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Addresses</h3>

        {addresses.length > 0 && (
          <div className="border border-gray-200 overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-3 py-2 font-medium text-gray-700">Address</th>
                  <th className="px-3 py-2 font-medium text-gray-700">City</th>
                  <th className="px-3 py-2 font-medium text-gray-700">County</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Eircode</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((a) => (
                  <tr key={a.addressId} className="border-b border-gray-100">
                    <td className="px-3 py-2">
                      {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}
                      {a.isDefault && <span className="ml-2 text-xs font-semibold text-green-700">default</span>}
                    </td>
                    <td className="px-3 py-2">{a.city}</td>
                    <td className="px-3 py-2">{a.county}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.eircode}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        {!a.isDefault && (
                          <button onClick={() => handleSetDefault(a.addressId)} className={`${btnSecondary} text-xs`}>
                            Set Default
                          </button>
                        )}
                        <button onClick={() => handleDeleteAddress(a.addressId)} className={`${btnDanger} text-xs`}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h4 className="text-base font-semibold mb-2">Add Address</h4>
        <form onSubmit={handleAddAddress} className="flex flex-col gap-3 max-w-md">
          <input
            placeholder="Address Line 1" value={addrForm.addressLine1}
            onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })}
            required className={inputClass}
          />
          <input
            placeholder="Address Line 2 (optional)" value={addrForm.addressLine2}
            onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="City" value={addrForm.city}
            onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
            required className={inputClass}
          />
          <input
            placeholder="County" value={addrForm.county}
            onChange={(e) => setAddrForm({ ...addrForm, county: e.target.value })}
            required className={inputClass}
          />
          <input
            placeholder="Eircode" value={addrForm.eircode}
            onChange={(e) => setAddrForm({ ...addrForm, eircode: e.target.value })}
            required className={inputClass}
          />
          <button type="submit" className={`${btnPrimary} self-start`}>Add Address</button>
        </form>
      </section>
    </div>
  );
}
