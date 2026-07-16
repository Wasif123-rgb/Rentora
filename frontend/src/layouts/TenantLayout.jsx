import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

function TenantLayout() {
  return (
    <div className="app-shell">
      <Navbar role="tenant" />

      <div className="d-flex">
        <Sidebar role="tenant" />

        <div className="content-area p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default TenantLayout;