import React from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => (
  <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
    <Sidebar />
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        height: '64px', 
        borderBottom: '1px solid #e0e0e0', 
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <NotificationBell />
      </header>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout; 