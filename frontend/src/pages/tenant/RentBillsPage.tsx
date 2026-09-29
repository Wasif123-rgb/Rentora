import { useEffect, useState } from "react";
import "./Tenant.css";

interface SummaryCard {
  label: string;
  value?: string | null;
  detail?: string | null;
  tone: "primary" | "warning" | "info" | "success";
}

interface BillingItem {
  label: string;
  amount: string;
}

interface PaymentHistoryItem {
  id: string | number;
  month: string;
  date: string;
  amount: string;
  method: string;
  reference: string;
  status: "Paid" | "Pending" | "Overdue";
}

interface UtilityBill {
  id: number;
  type: string;
  amount: number;
  billing_month: string;
  status: "paid" | "unpaid";
}

interface DashboardResponse {
  rent: {
    amount: number;
    outstanding_balance: number;
    next_due_date: string | null;
  };

  utility_bills: UtilityBill[];

  recent_payments: {
    id: number;
    amount: number;
    payment_date: string;
    status: "paid" | "pending";
  }[];
}

interface RentBillsData {
  summaryCards?: SummaryCard[];
  billingTitle?: string | null;
  dueDate?: string | null;
  paymentStatus?: string | null;
  rentAmount?: string | null;
  utilityAmount?: string | null;
  otherCharges?: string | null;
  totalAmount?: string | null;
  billingBreakdown?: BillingItem[];
  paymentHistory?: PaymentHistoryItem[];
}

interface RentBillsPageProps {
  data?: RentBillsData | null;
}

const defaultSummaryCards: SummaryCard[] = [
  {
    label: "Monthly Rent",
    value: null,
    detail: null,
    tone: "primary",
  },
  {
    label: "Current Amount Due",
    value: null,
    detail: null,
    tone: "warning",
  },
  {
    label: "Next Due Date",
    value: null,
    detail: null,
    tone: "info",
  },
  {
    label: "Payment Status",
    value: null,
    detail: null,
    tone: "success",
  },
];

function formatCurrency(amount: number) {
  return `৳${Number(amount).toLocaleString()}`;
}

function formatBillingMonth(month: string) {
  const date = new Date(`${month}-01`);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDate(dateString: string | null) {
  if (!dateString) {
    return "No data yet";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function RentBillsPage({ data = null }: RentBillsPageProps) {
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("auth_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "http://127.0.0.1:8000/api";

        const response = await fetch(
          `${apiUrl}/tenant/dashboard`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData?.message ||
              "Failed to load billing information."
          );
        }

        setDashboard(responseData);
      } catch (err) {
        console.error("Rent & Bills error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load billing information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [data]);

  if (loading) {
    return (
      <main className="page-dark">
        <div className="tenant-page-shell">
          <section className="tenant-panel">
            <p>Loading your billing information...</p>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-dark">
        <div className="tenant-page-shell">
          <section className="tenant-panel">
            <h3>Unable to load billing information</h3>
            <p>{error}</p>
          </section>
        </div>
      </main>
    );
  }

  /*
   * If this page is still being supplied with the old `data` prop,
   * preserve that behavior.
   */
  if (data) {
    return (
      <RentBillsContent
        data={data}
        dashboard={null}
      />
    );
  }

  return (
    <RentBillsContent
      data={null}
      dashboard={dashboard}
    />
  );
}

interface RentBillsContentProps {
  data: RentBillsData | null;
  dashboard: DashboardResponse | null;
}

function RentBillsContent({
  data,
  dashboard,
}: RentBillsContentProps) {
  const utilityBills = dashboard?.utility_bills ?? [];

  const unpaidUtilityBills = utilityBills.filter(
    (bill) => bill.status === "unpaid"
  );

  const utilityAmount = unpaidUtilityBills.reduce(
    (total, bill) => total + Number(bill.amount),
    0
  );

  const rentAmount = dashboard?.rent.amount ?? 0;

  const outstandingRent =
    dashboard?.rent.outstanding_balance ?? 0;

  const totalAmountDue =
    outstandingRent + utilityAmount;

  const billingBreakdown: BillingItem[] =
    dashboard
      ? [
          {
            label: "Monthly Rent",
            amount: formatCurrency(rentAmount),
          },
          ...utilityBills.map((bill) => ({
            label: `${bill.type} — ${formatBillingMonth(
              bill.billing_month
            )}`,
            amount: formatCurrency(Number(bill.amount)),
          })),
        ]
      : data?.billingBreakdown ?? [];

  const paymentHistory: PaymentHistoryItem[] =
    dashboard
      ? (dashboard.recent_payments ?? []).map((payment) => ({
          id: payment.id,
          month: formatDate(payment.payment_date),
          date: formatDate(payment.payment_date),
          amount: formatCurrency(Number(payment.amount)),
          method: "Rent Payment",
          reference: "—",
          status:
            payment.status === "paid"
              ? "Paid"
              : "Pending",
        }))
      : data?.paymentHistory ?? [];

  const dueDate =
    dashboard?.rent.next_due_date ??
    data?.dueDate ??
    null;

  const paymentStatus = dashboard
    ? totalAmountDue > 0
      ? "Payment Due"
      : "Paid"
    : data?.paymentStatus ?? null;

  const totalAmount =
    dashboard
      ? formatCurrency(totalAmountDue)
      : data?.totalAmount ?? null;

  const rentDisplay =
    dashboard
      ? formatCurrency(rentAmount)
      : data?.rentAmount ?? null;

  const utilityDisplay =
    dashboard
      ? formatCurrency(utilityAmount)
      : data?.utilityAmount ?? null;

  const hasCurrentBill = Boolean(
    dashboard
      ? rentAmount > 0 || utilityAmount > 0
      : data?.dueDate ||
          data?.paymentStatus ||
          data?.rentAmount ||
          data?.utilityAmount ||
          data?.otherCharges ||
          data?.totalAmount
  );

  const summaryCards: SummaryCard[] = dashboard
    ? [
        {
          label: "Monthly Rent",
          value: formatCurrency(rentAmount),
          detail:
            outstandingRent > 0
              ? `Outstanding: ${formatCurrency(
                  outstandingRent
                )}`
              : "Rent is fully paid",
          tone: "primary",
        },
        {
          label: "Current Amount Due",
          value: formatCurrency(totalAmountDue),
          detail:
            unpaidUtilityBills.length > 0
              ? `${unpaidUtilityBills.length} unpaid utility bill${
                  unpaidUtilityBills.length > 1
                    ? "s"
                    : ""
                }`
              : outstandingRent > 0
              ? "Rent payment due"
              : "Nothing currently due",
          tone: "warning",
        },
        {
          label: "Next Due Date",
          value: formatDate(dueDate),
          detail: "Next rent payment",
          tone: "info",
        },
        {
          label: "Payment Status",
          value: paymentStatus,
          detail:
            totalAmountDue > 0
              ? "Payment required"
              : "All current charges paid",
          tone: "success",
        },
      ]
    : data?.summaryCards ?? defaultSummaryCards;

  return (
    <main className="page-dark">
      <div className="tenant-page-shell">
        <section className="tenant-stats-grid tenant-stats-grid--compact">
          {summaryCards.map((item) => (
            <div
              key={item.label}
              className="tenant-stat-card"
            >
              <div
                className={`tenant-stat-card__icon tenant-stat-card__icon--${item.tone}`}
              >
                <i
                  className="bi bi-cash-stack"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="tenant-stat-card__label">
                  {item.label}
                </p>

                <div className="tenant-stat-card__value tenant-stat-card__value--sm">
                  {item.value || "No data yet"}
                </div>

                <p className="tenant-stat-card__subtitle">
                  {item.detail ||
                    "No information available"}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="tenant-panel tenant-panel--featured">
          <div className="tenant-panel__header tenant-panel__header--split">
            <div>
              <span className="tenant-panel__eyebrow">
                Current Payment
              </span>

              <h3>
                {dashboard
                  ? "Current Rent & Utility Charges"
                  : data?.billingTitle ||
                    "No current billing data"}
              </h3>
            </div>

            <span className="status-badge">
              <i
                className="bi bi-clock-history"
                aria-hidden="true"
              />

              {paymentStatus || "No status"}
            </span>
          </div>

          <div className="tenant-payment-hero">
            <div>
              <small>Due date</small>
              <strong>
                {formatDate(dueDate)}
              </strong>
            </div>

            <div>
              <small>Payment status</small>
              <strong>
                {paymentStatus || "No data yet"}
              </strong>
            </div>
          </div>

          <div className="tenant-payment-summary">
            {hasCurrentBill ? (
              <>
                <div className="tenant-payment-summary__row">
                  <span>Rent</span>
                  <strong>
                    {rentDisplay || "No data yet"}
                  </strong>
                </div>

                <div className="tenant-payment-summary__row">
                  <span>Utility Charges</span>
                  <strong>
                    {utilityDisplay ||
                      "No utility charges"}
                  </strong>
                </div>

                <div className="tenant-payment-summary__row">
                  <span>Other Charges</span>
                  <strong>
                    {data?.otherCharges ||
                      (dashboard ? "৳0" : "No data yet")}
                  </strong>
                </div>

                <div className="tenant-payment-summary__row tenant-payment-summary__row--total">
                  <span>Total Amount Due</span>
                  <strong>
                    {totalAmount || "No data yet"}
                  </strong>
                </div>
              </>
            ) : (
              <div className="tenant-payment-summary__row">
                <span>Current Billing</span>
                <strong>
                  No billing data yet
                </strong>
              </div>
            )}
          </div>

          <div className="tenant-actions-row tenant-actions-row--align-end">
            <button
              type="button"
              className="btn btn-secondary btn-secondary--compact"
              disabled={!hasCurrentBill}
            >
              View Invoice
            </button>

            <button
              type="button"
              className="btn btn-rentora btn-rentora--compact"
              disabled={!hasCurrentBill}
            >
              Pay Rent
            </button>
          </div>
        </section>

        <div className="tenant-two-column-layout">
          <section className="tenant-panel">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Details
                </span>

                <h3>Billing Breakdown</h3>
              </div>
            </div>

            <div className="tenant-billing-list">
              {billingBreakdown.length > 0 ? (
                billingBreakdown.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="tenant-billing-list__row"
                  >
                    <span>{item.label}</span>
                    <strong>{item.amount}</strong>
                  </div>
                ))
              ) : (
                <div className="tenant-billing-list__row">
                  <span>Billing details</span>
                  <strong>
                    No billing details available
                  </strong>
                </div>
              )}
            </div>
          </section>

          <section className="tenant-panel">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Receipts
                </span>

                <h3>Quick Actions</h3>
              </div>
            </div>

            <div className="tenant-quick-stack">
              <button
                type="button"
                className="tenant-quick-action"
                disabled={!hasCurrentBill}
              >
                <span>
                  <i
                    className="bi bi-receipt"
                    aria-hidden="true"
                  />{" "}
                  Download Invoice
                </span>

                <i
                  className="bi bi-arrow-right-short"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className="tenant-quick-action"
                disabled={
                  paymentHistory.length === 0
                }
              >
                <span>
                  <i
                    className="bi bi-file-earmark-text"
                    aria-hidden="true"
                  />{" "}
                  View Receipt
                </span>

                <i
                  className="bi bi-arrow-right-short"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className="tenant-quick-action"
                disabled={
                  paymentHistory.length === 0
                }
              >
                <span>
                  <i
                    className="bi bi-credit-card"
                    aria-hidden="true"
                  />{" "}
                  Payment History
                </span>

                <i
                  className="bi bi-arrow-right-short"
                  aria-hidden="true"
                />
              </button>
            </div>
          </section>
        </div>

        <section className="tenant-panel">
          <div className="tenant-panel__header tenant-panel__header--split">
            <div>
              <span className="tenant-panel__eyebrow">
                Transactions
              </span>

              <h3>Payment History</h3>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-secondary--compact"
              disabled={paymentHistory.length === 0}
            >
              Download Statement
            </button>
          </div>

          {paymentHistory.length > 0 ? (
            <div className="tenant-table-wrap">
              <table className="tenant-data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Payment Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>

                <tbody>
                  {paymentHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.month}</td>
                      <td>{item.date}</td>
                      <td>{item.amount}</td>
                      <td>{item.method}</td>
                      <td>{item.reference}</td>

                      <td>
                        <span
                          className={`tenant-table-badge tenant-table-badge--${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="tenant-link-button"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tenant-info-card">
              <small>Payment History</small>
              <strong>
                No payment history yet
              </strong>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default RentBillsPage;