import { NavLink } from "react-router-dom";

interface NavItem {
  label: string;
  path?: string;
  icon: string;
  disabled?: boolean;
  aria?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/tenant/dashboard",
    icon: "bi-speedometer2",
  },
  {
    label: "My Apartment",
    path: "/tenant/apartment",
    icon: "bi-building",
    disabled: false,
  },
  {
    label: "Rent & Bills",
    path: "/tenant/rent-bills",
    icon: "bi-credit-card",
    disabled: false,
  },
  {
    label: "Payment Methods",
    path: "/tenant/payment-methods",
    icon: "bi-wallet2",
    disabled: false,
  },
  {
    label: "Submit Complaint",
    path: "/tenant/complaints/new",
    icon: "bi-chat-left-text",
  },
  {
    label: "Complaint History",
    path: "/tenant/complaints",
    icon: "bi-journal-text",
    disabled: false,
  },
  {
    label: "Notices",
    path: "/tenant/notices",
    icon: "bi-megaphone",
  },
  {
    label: "Profile",
    path: "/tenant/profile",
    icon: "bi-person-circle",
    disabled: false,
  },
  {
    label: "Help & Support",
    path: "/tenant/support",
    icon: "bi-life-preserver",
    disabled: false,
  },
];

interface Props {
  onNavigate?: () => void;
  isOpen?: boolean;
}

function TenantSidebar({ onNavigate, isOpen }: Props) {
  return (
    <aside
      id="tenant-sidebar"
      className={`tenant-sidebar ${isOpen ? "open" : ""}`}
      aria-label="Tenant navigation"
    >
      <div className="tenant-sidebar__brand">
        <div className="tenant-sidebar__brand-top">
          <div>
            <div className="tenant-logo">Rentora</div>
            <small className="tenant-sub">Tenant Portal</small>
          </div>

          <button
            type="button"
            className="tenant-sidebar__collapse-btn"
            onClick={() => onNavigate && onNavigate()}
            aria-label="Collapse sidebar"
          >
            <i
              className="bi bi-chevron-left"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div
        className="tenant-sidebar__menu"
        role="navigation"
        aria-label="Tenant menu"
      >
        <div className="tenant-sidebar__label">
          Tenant Menu
        </div>

        <nav className="tenant-nav">
          {navItems.map((item) =>
            item.path && !item.disabled ? (
              <NavLink
                key={item.label}
                to={item.path}
                end
                className={({ isActive }) =>
                  `tenant-nav__item ${
                    isActive ? "active" : ""
                  }`
                }
                onClick={() =>
                  onNavigate && onNavigate()
                }
              >
                <i
                  className={`bi ${item.icon} tenant-nav__icon`}
                  aria-hidden="true"
                />

                <span className="tenant-nav__text">
                  {item.label}
                </span>
              </NavLink>
            ) : (
              <button
                key={item.label}
                className="tenant-nav__item tenant-nav__item--disabled"
                disabled
                aria-disabled="true"
                aria-label={`${item.label} (Coming Soon)`}
              >
                <i
                  className={`bi ${item.icon} tenant-nav__icon`}
                  aria-hidden="true"
                />

                <span className="tenant-nav__text">
                  {item.label}
                </span>
              </button>
            )
          )}
        </nav>
      </div>

      <div className="tenant-sidebar__bottom">
        <div className="status-card">
          <div
            className="status-dot"
            aria-hidden="true"
          ></div>

          <div>
            <div className="status-title">
              Account Active
            </div>

            <div className="status-sub">
              Tenant since Aug 2025
            </div>
          </div>
        </div>

        <NavLink
          to="/login"
          className="tenant-logout"
          aria-label="Logout"
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Logout
        </NavLink>
      </div>
    </aside>
  );
}

export default TenantSidebar;