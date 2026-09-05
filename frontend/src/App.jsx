import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DataGuru from './pages/DataGuru';
import Periode from './pages/Periode';
import Penggajian from './pages/Penggajian';
import Rekap from './pages/Rekap';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [loginInput, setLoginInput] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [currentPath, setCurrentPath] = useState('dashboard');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginInput)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUsername(data.username);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setLoginError('');
      } else {
        setLoginError(data.message);
      }
    } catch (err) {
      setLoginError("Koneksi gagal");
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setCurrentPath('dashboard');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-green-700">Login Sistem Gaji</h2>
          {loginError && <p className="text-red-500 mb-4 text-center text-sm">{loginError}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Username (default: admin)" value={loginInput.username} onChange={(e) => setLoginInput({...loginInput, username: e.target.value})} className="w-full border p-2 rounded" required />
            <input type="password" placeholder="Password (default: admin123)" value={loginInput.password} onChange={(e) => setLoginInput({...loginInput, password: e.target.value})} className="w-full border p-2 rounded" required />
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard': return <Dashboard token={token} />;
      case 'guru': return <DataGuru token={token} />;
      case 'periode': return <Periode token={token} />;
      case 'penggajian': return <Penggajian token={token} />;
      case 'rekap': return <Rekap token={token} />;
      default: return <Dashboard token={token} />;
    }
  };

  return (
    <Layout currentPath={currentPath} setCurrentPath={setCurrentPath} onLogout={handleLogout} username={username}>
      {renderContent()}
    </Layout>
  );
}

export default App;