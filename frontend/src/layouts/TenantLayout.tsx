import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import TenantSidebar from "../components/tenant/TenantSidebar";
import TenantTopbar from "../components/tenant/TenantTopbar";
import { useAuth } from "../context/AuthContext";
import "../styles/tenant-layout.css";

type RouteMeta = {
  title: string;
  subtitle?: string;
};

const routeMetaMap: Record<string, RouteMeta> = {
  "/tenant/dashboard": {
    title: "Dashboard",
    subtitle: "Overview of your home",
  },
  "/tenant/apartment": {
    title: "My Apartment",
    subtitle: "Details about your apartment",
  },
  "/tenant/rent-bills": {
    title: "Rent & Bills",
    subtitle: "Payments and billing history",
  },
  "/tenant/complaints/new": {
    title: "Submit Complaint",
    subtitle: "Report an issue",
  },
  "/tenant/complaints": {
    title: "Complaint History",
    subtitle: "Track past complaints",
  },
  "/tenant/notices": {
    title: "Notices",
    subtitle: "Community announcements",
  },
  "/tenant/profile": {
    title: "Profile",
    subtitle: "Manage your profile",
  },
  "/tenant/support": {
    title: "Help & Support",
    subtitle: "Get assistance",
  },
};

function TenantLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const meta = useMemo(() => {
    const path = location.pathname;

    return (
      routeMetaMap[path] ?? {
        title: "Tenant Portal",
        subtitle: "",
      }
    );
  }, [location.pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "tenant") {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return (
    <div
      className={`app-shell tenant-shell ${
        isDrawerOpen ? "drawer-open" : ""
      }`}
    >
      <TenantSidebar
        onNavigate={() => setDrawerOpen(false)}
        isOpen={isDrawerOpen}
      />

      <div className="tenant-shell__content">
        <TenantTopbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuToggle={() => setDrawerOpen((v) => !v)}
          isMenuOpen={isDrawerOpen}
          userName={user.name}
          userRole={user.role}
        />

        <div className="tenant-shell__page">
          <Outlet />
        </div>
      </div>

      {isDrawerOpen && (
        <div
          className="tenant-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default TenantLayout;
