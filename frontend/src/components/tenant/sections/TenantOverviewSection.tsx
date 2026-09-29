import TenantHero from "../cards/TenantHero";
import TenantStats from "../cards/TenantStats";
import ApartmentCard from "../cards/ApartmentCard";
import QuickActions from "../cards/QuickActions";
import RecentComplaints from "../cards/RecentComplaints";
import RecentPayments from "../cards/RecentPayments";
import NoticeBoard from "../cards/NoticeBoard";

import type { TenantDashboardData } from "../../../pages/tenant/TenantDashboard";

interface TenantOverviewSectionProps {
  dashboard: TenantDashboardData;
}

function TenantOverviewSection({
  dashboard,
}: TenantOverviewSectionProps) {
  const firstName =
    dashboard.tenant?.name?.split(" ")[0] || "Tenant";

  const activeComplaints = dashboard.recent_complaints.filter(
    (complaint) =>
      complaint.status === "open" ||
      complaint.status === "in_progress"
  ).length;

  const formattedDueDate = dashboard.rent.next_due_date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(dashboard.rent.next_due_date))
    : null;

  return (
    <div className="tenant-overview">
      <div className="tenant-main-column">
        <TenantHero
          firstName={firstName}
          nextRentDue={formattedDueDate}
          activeComplaints={
            activeComplaints > 0
              ? String(activeComplaints)
              : "No active complaints"
          }
          apartmentName={dashboard.apartment?.name}
        />

        <TenantStats
          rent={dashboard.rent}
          utilityBills={dashboard.utility_bills}
          complaints={dashboard.recent_complaints}
          notices={dashboard.notices}
        />

        {/* Utility Bills */}
        <section className="tenant-panel">
          <div className="tenant-panel__header tenant-panel__header--split">
            <div>
              <span className="tenant-panel__eyebrow">Utilities</span>
              <h3>Utility Bills</h3>
            </div>

            <span className="status-badge status-badge--info">
              {dashboard.utility_bills.length}{" "}
              {dashboard.utility_bills.length === 1 ? "bill" : "bills"}
            </span>
          </div>

          {dashboard.utility_bills.length > 0 ? (
            <div className="tenant-table-wrap">
              <table className="tenant-data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Billing Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.utility_bills.map((bill) => (
                    <tr key={bill.id}>
                      <td>{bill.type}</td>

                      <td>
                        {new Intl.DateTimeFormat("en-US", {
                          month: "long",
                          year: "numeric",
                        }).format(
                          new Date(`${bill.billing_month}-01`)
                        )}
                      </td>

                      <td>
                        ৳{Number(bill.amount).toLocaleString()}
                      </td>

                      <td>
                        <span
                          className={`tenant-table-badge ${
                            bill.status === "paid"
                              ? "tenant-table-badge--paid"
                              : "tenant-table-badge--pending"
                          }`}
                        >
                          {bill.status === "paid"
                            ? "Paid"
                            : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tenant-empty-state">
              <i
                className="bi bi-lightning-charge"
                aria-hidden="true"
              />
              <p>No utility bills have been recorded yet.</p>
            </div>
          )}
        </section>

        <RecentComplaints
          complaints={dashboard.recent_complaints.map((complaint) => ({
            id: complaint.id,
            title: complaint.title,
            submittedDate: new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(complaint.created_at)),
            status:
              complaint.status === "open"
                ? "Open"
                : complaint.status === "in_progress"
                ? "In Progress"
                : "Resolved",
          }))}
        />

        <RecentPayments
          payments={dashboard.recent_payments.map((payment) => ({
            id: payment.id,
            title: "Rent Payment",
            paymentDate: new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(payment.payment_date)),
            amount: `৳${Number(payment.amount).toLocaleString()}`,
            status:
              payment.status === "paid"
                ? "Paid"
                : "Pending",
          }))}
        />
      </div>

      <aside className="tenant-side-column">
        <ApartmentCard
          name={dashboard.apartment?.name}
          block={dashboard.apartment?.address}
          flat={dashboard.flat?.flat_number}
          status={
            dashboard.flat?.status === "occupied"
              ? "Occupied"
              : dashboard.flat?.status === "vacant"
              ? "Vacant"
              : null
          }
          rent={
            dashboard.flat
              ? `৳${Number(
                  dashboard.flat.rent_amount
                ).toLocaleString()}`
              : null
          }
          moveInDate={dashboard.tenancy?.move_in_date}
        />

        <QuickActions />

        <NoticeBoard
          notices={dashboard.notices.map((notice) => ({
            id: notice.id,
            title: notice.title,
            preview: notice.content,
            date: new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(notice.created_at)),
            icon: "bi-megaphone",
          }))}
        />
      </aside>
    </div>
  );
}

export default TenantOverviewSection;