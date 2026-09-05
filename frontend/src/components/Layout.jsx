import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, currentPath, setCurrentPath, onLogout, username }) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-sm overflow-hidden">
      <Sidebar currentPath={currentPath} setCurrentPath={setCurrentPath} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-700 capitalize">
             {currentPath.replace('-', ' ')}
          </h1>
          <div className="text-gray-500 font-medium">
             Selamat datang, <span className="text-green-700">{username}</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

