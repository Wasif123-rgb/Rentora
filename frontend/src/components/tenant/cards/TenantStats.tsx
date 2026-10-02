interface TenantStatsProps {
  rent: {
    amount: number;
    outstanding_balance: number;
    next_due_date: string | null;
  };

  utilityBills: {
    id: number;
    type: string;
    amount: number;
    billing_month: string;
    status: "paid" | "unpaid";
  }[];

  complaints: {
    id: number;
    title: string;
    description: string;
    status: "open" | "in_progress" | "resolved";
    created_at: string;
  }[];

  notices: {
    id: number;
  }[];
}

function TenantStats({
  rent,
  utilityBills,
  complaints,
  notices,
}: TenantStatsProps) {
  const unpaidBills = utilityBills.filter(
    (bill) => bill.status === "unpaid"
  );

  const activeComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "open" ||
      complaint.status === "in_progress"
  );

  const stats = [
    {
      id: "rent",
      label: "Monthly Rent",
      value: `৳${Number(rent.amount).toLocaleString()}`,
      description:
        rent.outstanding_balance > 0
          ? `Outstanding: ৳${Number(
              rent.outstanding_balance
            ).toLocaleString()}`
          : "Rent is fully paid",
      status:
        rent.outstanding_balance > 0
          ? "Payment Due"
          : "Paid",
      icon: "bi-cash-stack",
      variant: "primary",
    },
    {
      id: "bills",
      label: "Utility Bills",
      value: `৳${unpaidBills
        .reduce((total, bill) => total + Number(bill.amount), 0)
        .toLocaleString()}`,
      description:
        unpaidBills.length > 0
          ? `${unpaidBills.length} unpaid bill${
              unpaidBills.length > 1 ? "s" : ""
            }`
          : "All bills are paid",
      status:
        unpaidBills.length > 0
          ? "Unpaid"
          : "Paid",
      icon: "bi-lightning-charge",
      variant: "success",
    },
    {
      id: "complaints",
      label: "My Complaints",
      value: String(complaints.length),
      description:
        activeComplaints.length > 0
          ? `${activeComplaints.length} active`
          : "No active complaints",
      status:
        activeComplaints.length > 0
          ? "Active"
          : "Clear",
      icon: "bi-chat-left-text",
      variant: "warning",
    },
    {
      id: "notices",
      label: "New Notices",
      value: String(notices.length),
      description:
        notices.length > 0
          ? "Latest notices available"
          : "No new notices",
      status:
        notices.length > 0
          ? "Available"
          : "None",
      icon: "bi-bell",
      variant: "info",
    },
  ] as const;

  return (
    <div className="tenant-stats-grid">
      {stats.map((item) => (
        <article key={item.id} className="tenant-stat-card">
          <div
            className={`tenant-stat-card__icon tenant-stat-card__icon--${item.variant}`}
          >
            <i className={`bi ${item.icon}`}></i>
          </div>

          <p className="tenant-stat-card__label">
            {item.label}
          </p>

          <p className="tenant-stat-card__value">
            {item.value}
          </p>

          <p className="tenant-stat-card__subtitle">
            {item.description}
          </p>

          <span className="stat-badge">
            {item.status}
          </span>
        </article>
      ))}
    </div>
  );
}

export default TenantStats;
