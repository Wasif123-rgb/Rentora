import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

function ManagerLayout() {
  return (
    <div className="app-shell">
      <Navbar role="manager" />

      <div className="d-flex">
        <Sidebar role="manager" />

        <div className="content-area p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default ManagerLayout;