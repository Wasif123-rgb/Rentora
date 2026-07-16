import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="auth-page">
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;