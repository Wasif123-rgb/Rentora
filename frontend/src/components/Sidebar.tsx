import { NavLink } from 'react-router-dom';

type UserRole = 'manager' | 'tenant';

interface SidebarProps {
  role: UserRole;
}

interface SidebarLink {
  label: string;
  path: string;
  icon: string;
}

function Sidebar({ role }: SidebarProps) {
  const managerLinks: SidebarLink[] = [
    {
      label: 'Dashboard',
      path: '/manager/dashboard',
      icon: 'bi-speedometer2',
    },
  ];

  const tenantLinks: SidebarLink[] = [
    {
      label: 'Dashboard',
      path: '/tenant/dashboard',
      icon: 'bi-speedometer2',
    },
    {
      label: 'Submit Complaint',
      path: '/tenant/complaints/new',
      icon: 'bi-tools',
    },
  ];

  const links = role === 'manager' ? managerLinks : tenantLinks;

  return (
    <aside className="sidebar bg-white border-end p-3">
      <h6 className="text-uppercase text-muted mb-3">
        {role} menu
      </h6>

      <nav className="nav nav-pills flex-column gap-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : 'text-dark'}`
            }
          >
            <i className={`bi ${link.icon} me-2`}></i>
            {link.label}
          </NavLink>
        ))}

        <NavLink to="/login" className="nav-link text-danger mt-3">
          <i className="bi bi-box-arrow-right me-2"></i>
          Logout
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;