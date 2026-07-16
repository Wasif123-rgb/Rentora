import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AuthLayout from './layouts/AuthLayout';
import ManagerLayout from './layouts/ManagerLayout';
import TenantLayout from './layouts/TenantLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import TenantDashboard from './pages/tenant/TenantDashboard';
import SubmitComplaintPage from './pages/tenant/SubmitComplaintPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/manager" element={<ManagerLayout />}>
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />
        <Route
          path="dashboard"
          element={<ManagerDashboard />}
        />
      </Route>

      <Route path="/tenant" element={<TenantLayout />}>
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />
        <Route
          path="dashboard"
          element={<TenantDashboard />}
        />
        <Route
          path="complaints/new"
          element={<SubmitComplaintPage />}
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;