import { useEffect, useState } from "react";
import "./Tenant.css";
import TenantOverviewSection from "../../components/tenant/sections/TenantOverviewSection";

export interface TenantDashboardData {
  success: boolean;

  tenant: {
    id: number;
    user_id: number;
    move_in_date: string | null;
    lease_start: string | null;
    lease_end: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    role?: string | null;
  };

  apartment: {
    id: number;
    name: string;
    address: string;
  } | null;

  flat: {
    id: number;
    flat_number: string;
    floor: number;
    rent_amount: number;
    status: "vacant" | "occupied";
  } | null;

  tenancy: {
    id: number;
    move_in_date: string | null;
    lease_start: string | null;
    lease_end: string | null;
  } | null;

  rent: {
    amount: number;
    outstanding_balance: number;
    next_due_date: string | null;
  };

  utility_bills: {
    id: number;
    type: string;
    amount: number;
    billing_month: string;
    status: "paid" | "unpaid";
  }[];

  recent_payments: {
    id: number;
    amount: number;
    payment_date: string;
    status: "paid" | "pending";
  }[];

  recent_complaints: {
    id: number;
    title: string;
    description: string;
    status: "open" | "in_progress" | "resolved";
    created_at: string;
  }[];

  recent_maintenance_requests: {
    id: number;
    complaint_id: number;
    remarks: string | null;
    status: "pending" | "in_progress" | "completed";
  }[];

  notices: {
    id: number;
    type: "notice" | "complaint_feedback";
    title: string;
    content: string;
    published_by: number | null;
    created_at: string;
    status: "open" | "in_progress" | "resolved" | null;
  }[];
}

function TenantDashboard() {
  const [dashboard, setDashboard] =
    useState<TenantDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("auth_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const apiUrl =
          import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

        const response = await fetch(`${apiUrl}/tenant/dashboard`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load tenant dashboard."
          );
        }

        setDashboard(data);
      } catch (err) {
        console.error("Tenant dashboard error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load tenant dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <main className="page-dark">
        <div className="container-fluid px-4 py-4">
          <div className="dashboard-card">
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-dark">
        <div className="container-fluid px-4 py-4">
          <div className="dashboard-card">
            <h5>Unable to load dashboard</h5>
            <p>{error}</p>

            <button
              type="button"
              className="btn btn-rentora"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <main className="page-dark">
      <div className="container-fluid px-4 py-4">
        <TenantOverviewSection dashboard={dashboard} />
      </div>
    </main>
  );
}

export default TenantDashboard;
