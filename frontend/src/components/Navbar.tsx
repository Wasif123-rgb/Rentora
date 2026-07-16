import { Link } from 'react-router-dom';

type UserRole = 'manager' | 'tenant';

interface NavbarProps {
  role: UserRole;
}

function Navbar({ role }: NavbarProps) {
  return (
    <nav className="navbar navbar-dark bg-dark px-3">
      <Link className="navbar-brand fw-bold" to="/">
        <i className="bi bi-buildings me-2"></i>
        Rentora
      </Link>

      <span className="badge text-bg-light text-capitalize">
        {role}
      </span>
    </nav>
  );
}

export default Navbar;