import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AccountIndexPage() {
  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
      <Outlet />
    </div>
  );
}
