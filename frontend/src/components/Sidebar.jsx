import React from 'react';

export default function Sidebar({ currentPath, setCurrentPath, onLogout }) {
  const menus = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'guru', label: 'Data Guru', icon: '👨‍🏫' },
    { id: 'periode', label: 'Periode Penggajian', icon: '📅' },
    { id: 'penggajian', label: 'Penggajian', icon: '💰' },
    { id: 'rekap', label: 'Rekap Penggajian', icon: '📊' },
  ];

  return (
    <div className="w-64 bg-green-800 text-white min-h-screen flex flex-col">
      <div className="p-4 flex items-center justify-center border-b border-green-700">
        <h2 className="text-xl font-bold">Sistem Gaji</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {menus.map((menu) => (
            <li key={menu.id}>
              <button
                onClick={() => setCurrentPath(menu.id)}
                className={`w-full text-left px-4 py-2 rounded flex items-center gap-3 hover:bg-green-700 transition ${
                  currentPath === menu.id ? 'bg-green-700 font-bold' : ''
                }`}
              >
                <span>{menu.icon}</span>
                <span>{menu.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-green-700">
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 rounded flex items-center gap-3 hover:bg-red-600 transition"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

