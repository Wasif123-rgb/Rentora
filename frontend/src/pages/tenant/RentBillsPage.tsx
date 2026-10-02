import { useEffect, useState } from "react";
import type React from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  createRentPayment,
  finalizeRentPayment,
} from "../../services/rentPaymentsApi";
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

interface DashboardApiResponse {
  success?: boolean;
  message?: string;
  data?: DashboardResponse;
  rent?: DashboardResponse["rent"];
  utility_bills?: UtilityBill[];
  recent_payments?: DashboardResponse["recent_payments"];
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

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  dueDate: string | null;
  outstandingRent: number;
  utilityBills: UtilityBill[];
  totalAmountDue: number;
  paymentStatus: string | null;
}

const stripeKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = stripeKey
  ? loadStripe(stripeKey)
  : null;

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

/*
|--------------------------------------------------------------------------
| Get logged-in user
|--------------------------------------------------------------------------
*/

function getLoggedInUser() {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return {
        name: "Tenant",
        email: "",
      };
    }

    const user = JSON.parse(
      storedUser
    );

    return {
      name:
        user?.name ||
        "Tenant",

      email:
        user?.email ||
        "",
    };
  } catch {
    return {
      name: "Tenant",
      email: "",
    };
  }
}

/*
|--------------------------------------------------------------------------
| Extract dashboard from API response
|--------------------------------------------------------------------------
*/

function extractDashboard(
  responseData: DashboardApiResponse
): DashboardResponse {
  if (responseData?.data) {
    return responseData.data;
  }

  return responseData as DashboardResponse;
}

/*
|--------------------------------------------------------------------------
| Invoice Modal
|--------------------------------------------------------------------------
*/

function InvoiceModal({
  open,
  onClose,
  dueDate,
  outstandingRent,
  utilityBills,
  totalAmountDue,
  paymentStatus,
}: InvoiceModalProps) {
  if (!open) {
    return null;
  }

  const user =
    getLoggedInUser();

  const invoiceDate =
    new Date();

  const invoiceNumber =
    `INV-${invoiceDate
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}`;

  const unpaidUtilityBills =
    utilityBills.filter(
      (bill) =>
        bill.status ===
        "unpaid"
    );

  const utilityAmount =
    unpaidUtilityBills.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.amount
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Print / Save PDF
  |--------------------------------------------------------------------------
  */

  const handlePrint =
    () => {
      const utilityRows =
        unpaidUtilityBills.length >
        0
          ? unpaidUtilityBills
              .map(
                (bill) => `
                  <tr>
                    <td>
                      <strong>
                        ${bill.type}
                      </strong>

                      <small>
                        ${formatBillingMonth(
                          bill.billing_month
                        )}
                      </small>
                    </td>

                    <td>
                      ${formatCurrency(
                        Number(
                          bill.amount
                        )
                      )}
                    </td>
                  </tr>
                `
              )
              .join("")
          : `
              <tr>
                <td>
                  <strong>
                    Utility Charges
                  </strong>

                  <small>
                    No unpaid utility bills
                  </small>
                </td>

                <td>
                  ৳0
                </td>
              </tr>
            `;

      const invoiceHtml = `
        <!DOCTYPE html>

        <html>

          <head>

            <title>
              ${invoiceNumber}
              - Rentora Invoice
            </title>

            <style>

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                padding: 40px;

                font-family:
                  Inter,
                  Arial,
                  Helvetica,
                  sans-serif;

                color: #172033;
                background: #ffffff;
              }

              .invoice {
                max-width: 850px;
                margin: 0 auto;
              }

              .invoice-header {
                display: flex;

                justify-content:
                  space-between;

                gap: 30px;

                padding-bottom:
                  28px;

                border-bottom:
                  2px solid #e5e7eb;
              }

              .invoice-brand {
                font-size: 30px;
                font-weight: 800;
                color: #2563eb;
              }

              .invoice-brand-subtitle {
                margin-top: 5px;
                color: #6b7280;
              }

              .invoice-title {
                text-align: right;
              }

              .invoice-title h1 {
                margin: 0;
                font-size: 32px;
              }

              .invoice-title p {
                margin: 6px 0 0;
                color: #6b7280;
              }

              .invoice-parties {
                display: grid;

                grid-template-columns:
                  1fr 1fr;

                gap: 40px;

                padding:
                  28px 0;
              }

              .invoice-label {
                font-size: 11px;
                font-weight: 700;
                color: #6b7280;

                text-transform:
                  uppercase;

                letter-spacing:
                  0.08em;
              }

              .invoice-party strong {
                display: block;

                margin-top: 7px;

                font-size: 17px;
              }

              .invoice-party span {
                display: block;

                margin-top: 5px;

                color: #6b7280;
              }

              .invoice-table {
                width: 100%;

                border-collapse:
                  collapse;
              }

              .invoice-table th {
                padding: 14px;

                text-align: left;

                background: #f5f7fa;

                font-size: 12px;

                text-transform:
                  uppercase;
              }

              .invoice-table th:last-child,
              .invoice-table td:last-child {
                text-align: right;
              }

              .invoice-table td {
                padding: 16px 14px;

                border-bottom:
                  1px solid #e5e7eb;
              }

              .invoice-table td small {
                display: block;

                margin-top: 5px;

                color: #6b7280;
              }

              .invoice-total {
                width: 360px;

                max-width: 100%;

                margin:
                  25px 0 0 auto;
              }

              .invoice-total-row {
                display: flex;

                justify-content:
                  space-between;

                gap: 20px;

                padding:
                  8px 0;
              }

              .invoice-total-row--final {
                margin-top: 8px;

                padding-top:
                  15px;

                border-top:
                  2px solid #172033;

                font-size: 20px;

                font-weight: 800;
              }

              .invoice-status {
                display: inline-block;

                margin-top: 25px;

                padding:
                  8px 15px;

                border-radius:
                  999px;

                background:
                  #fff4d6;

                color:
                  #8a5a00;

                font-weight:
                  700;
              }

              .invoice-footer {
                margin-top: 50px;

                padding-top:
                  20px;

                border-top:
                  1px solid #e5e7eb;

                color:
                  #6b7280;

                text-align:
                  center;

                font-size: 13px;
              }

              @media (max-width: 650px) {

                body {
                  padding: 20px;
                }

                .invoice-header {
                  display: grid;

                  grid-template-columns:
                    1fr;
                }

                .invoice-title {
                  text-align: left;
                }

                .invoice-parties {
                  grid-template-columns:
                    1fr;
                }

                .invoice-total {
                  width: 100%;
                }

              }

              @media print {

                body {
                  padding: 0;
                }

              }

            </style>

          </head>

          <body>

            <div class="invoice">

              <div class="invoice-header">

                <div>

                  <div class="invoice-brand">
                    Rentora
                  </div>

                  <div class="invoice-brand-subtitle">
                    Property Rental Management
                  </div>

                </div>

                <div class="invoice-title">

                  <h1>
                    INVOICE
                  </h1>

                  <p>
                    ${invoiceNumber}
                  </p>

                </div>

              </div>

              <div class="invoice-parties">

                <div class="invoice-party">

                  <div class="invoice-label">
                    Billed To
                  </div>

                  <strong>
                    ${user.name}
                  </strong>

                  ${
                    user.email
                      ? `<span>${user.email}</span>`
                      : ""
                  }

                </div>

                <div class="invoice-party">

                  <div class="invoice-label">
                    Invoice Details
                  </div>

                  <span>
                    Invoice Date:
                    ${formatDate(
                      invoiceDate.toISOString()
                    )}
                  </span>

                  <span>
                    Due Date:
                    ${formatDate(
                      dueDate
                    )}
                  </span>

                </div>

              </div>

              <table class="invoice-table">

                <thead>

                  <tr>

                    <th>
                      Description
                    </th>

                    <th>
                      Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  <tr>

                    <td>

                      <strong>
                        Monthly Rent
                      </strong>

                      <small>
                        ${
                          outstandingRent >
                          0
                            ? "Outstanding rent balance"
                            : "Rent fully paid"
                        }
                      </small>

                    </td>

                    <td>
                      ${formatCurrency(
                        outstandingRent
                      )}
                    </td>

                  </tr>

                  ${utilityRows}

                </tbody>

              </table>

              <div class="invoice-total">

                <div class="invoice-total-row">

                  <span>
                    Rent Outstanding
                  </span>

                  <strong>
                    ${formatCurrency(
                      outstandingRent
                    )}
                  </strong>

                </div>

                <div class="invoice-total-row">

                  <span>
                    Utility Charges
                  </span>

                  <strong>
                    ${formatCurrency(
                      utilityAmount
                    )}
                  </strong>

                </div>

                <div class="invoice-total-row invoice-total-row--final">

                  <span>
                    Total Due
                  </span>

                  <strong>
                    ${formatCurrency(
                      totalAmountDue
                    )}
                  </strong>

                </div>

              </div>

              <div class="invoice-status">

                ${
                  paymentStatus ||
                  "Payment Due"
                }

              </div>

              <div class="invoice-footer">

                Thank you for using Rentora.

              </div>

            </div>

          </body>

        </html>
      `;

      const invoiceWindow =
        window.open(
          "",
          "_blank",
          "width=900,height=800"
        );

      if (!invoiceWindow) {
        window.alert(
          "Please allow pop-ups in your browser to print the invoice."
        );

        return;
      }

      invoiceWindow.document.open();

      invoiceWindow.document.write(
        invoiceHtml
      );

      invoiceWindow.document.close();

      invoiceWindow.focus();

      setTimeout(() => {
        invoiceWindow.print();
      }, 300);
    };

  return (
    <div
      className="tenant-invoice-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-invoice-title"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="tenant-invoice-modal">

        {/* ============================================================
            INVOICE HEADER
        ============================================================ */}

        <div className="tenant-invoice-header">

          <div className="tenant-invoice-brand">

            <span className="tenant-invoice-brand__name">
              Rentora
            </span>

            <span className="tenant-invoice-brand__subtitle">
              Property Rental Management
            </span>

          </div>

          <div className="tenant-invoice-header__right">

            <span className="tenant-invoice-number">
              {invoiceNumber}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-secondary--compact"
              onClick={
                handlePrint
              }
            >

              <i
                className="bi bi-printer me-2"
                aria-hidden="true"
              />

              Print / Save PDF

            </button>

            <button
              type="button"
              className="tenant-invoice-close"
              onClick={
                onClose
              }
              aria-label="Close invoice"
            >

              <i
                className="bi bi-x-lg"
                aria-hidden="true"
              />

            </button>

          </div>

        </div>

        {/* ============================================================
            INVOICE CONTENT
        ============================================================ */}

        <div className="tenant-invoice-content">

          {/* Invoice Title */}

          <div className="tenant-invoice-title-row">

            <div>

              <span className="tenant-panel__eyebrow">
                Billing Document
              </span>

              <h2 id="tenant-invoice-title">
                Invoice
              </h2>

            </div>

            <span
              className={`tenant-invoice-status ${
                totalAmountDue > 0
                  ? "tenant-invoice-status--pending"
                  : "tenant-invoice-status--paid"
              }`}
            >

              <i
                className={
                  totalAmountDue > 0
                    ? "bi bi-clock"
                    : "bi bi-check-circle"
                }
                aria-hidden="true"
              />

              {paymentStatus ||
                "Payment Due"}

            </span>

          </div>

          {/* ==========================================================
              TENANT / INVOICE DETAILS
          ========================================================== */}

          <div className="tenant-invoice-parties">

            <div className="tenant-invoice-party">

              <span className="tenant-invoice-party__label">
                Billed To
              </span>

              <strong>
                {user.name}
              </strong>

              {user.email && (
                <span>
                  {user.email}
                </span>
              )}

            </div>

            <div className="tenant-invoice-party">

              <span className="tenant-invoice-party__label">
                Invoice Details
              </span>

              <div>
                Invoice Date:{" "}
                <strong>
                  {formatDate(
                    invoiceDate.toISOString()
                  )}
                </strong>
              </div>

              <div>
                Due Date:{" "}
                <strong>
                  {formatDate(
                    dueDate
                  )}
                </strong>
              </div>

            </div>

          </div>

          {/* ==========================================================
              INVOICE ITEMS
          ========================================================== */}

          <div className="tenant-invoice-table-wrap">

            <table className="tenant-invoice-table">

              <thead>

                <tr>

                  <th>
                    Description
                  </th>

                  <th>
                    Amount
                  </th>

                </tr>

              </thead>

              <tbody>

                {/* Rent */}

                <tr>

                  <td>

                    <strong>
                      Monthly Rent
                    </strong>

                    <small>
                      {outstandingRent >
                      0
                        ? "Outstanding rent balance"
                        : "Rent fully paid"}
                    </small>

                  </td>

                  <td>

                    {formatCurrency(
                      outstandingRent
                    )}

                  </td>

                </tr>

                {/* Unpaid Utilities */}

                {unpaidUtilityBills.map(
                  (bill) => (
                    <tr
                      key={
                        bill.id
                      }
                    >

                      <td>

                        <strong>
                          {bill.type}
                        </strong>

                        <small>
                          {formatBillingMonth(
                            bill.billing_month
                          )}
                        </small>

                      </td>

                      <td>

                        {formatCurrency(
                          Number(
                            bill.amount
                          )
                        )}

                      </td>

                    </tr>
                  )
                )}

                {/* No unpaid utilities */}

                {unpaidUtilityBills.length ===
                  0 && (
                  <tr>

                    <td>

                      <strong>
                        Utility Charges
                      </strong>

                      <small>
                        No unpaid utility bills
                      </small>

                    </td>

                    <td>
                      ৳0
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          {/* ==========================================================
              TOTALS
          ========================================================== */}

          <div className="tenant-invoice-total">

            <div className="tenant-invoice-total__row">

              <span>
                Rent Outstanding
              </span>

              <strong>
                {formatCurrency(
                  outstandingRent
                )}
              </strong>

            </div>

            <div className="tenant-invoice-total__row">

              <span>
                Utility Charges
              </span>

              <strong>
                {formatCurrency(
                  utilityAmount
                )}
              </strong>

            </div>

            <div className="tenant-invoice-total__row tenant-invoice-total__row--final">

              <span>
                Total Due
              </span>

              <strong>
                {formatCurrency(
                  totalAmountDue
                )}
              </strong>

            </div>

          </div>

          {/* Invoice Note */}

          <div className="tenant-invoice-note">

            <i
              className="bi bi-info-circle"
              aria-hidden="true"
            />

            <span>
              This invoice reflects the
              current outstanding rent and
              unpaid utility charges available
              in your Rentora account.
            </span>

          </div>

          {/* Footer */}

          <div className="tenant-invoice-footer">

            Thank you for using Rentora.

          </div>

        </div>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Rent Bills Page
|--------------------------------------------------------------------------
*/

function RentBillsPage({
  data = null,
}: RentBillsPageProps) {
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(!data);

  const [error, setError] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (data) {
      return;
    }

    const fetchDashboard =
      async () => {
        try {
          setLoading(true);

          setError(null);

          const token =
            localStorage.getItem(
              "auth_token"
            );

          if (!token) {
            throw new Error(
              "Authentication token not found."
            );
          }

          const apiUrl = "/api";

          const response =
            await fetch(
              `${apiUrl}/tenant/dashboard`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const responseData: DashboardApiResponse =
            await response.json();

          if (!response.ok) {
            throw new Error(
              responseData?.message ||
                "Failed to load billing information."
            );
          }

          const dashboardData =
            extractDashboard(
              responseData
            );

          setDashboard(
            dashboardData
          );
        } catch (err) {
          console.error(
            "Rent & Bills error:",
            err
          );

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

            <p>
              Loading your billing information...
            </p>

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

            <h3>
              Unable to load billing information
            </h3>

            <p>
              {error}
            </p>

          </section>

        </div>

      </main>
    );
  }

  return (
    <RentBillsContent
      data={data}
      dashboard={
        data
          ? null
          : dashboard
      }
      setDashboard={
        setDashboard
      }
    />
  );
}

/*
|--------------------------------------------------------------------------
| Content Props
|--------------------------------------------------------------------------
*/

interface RentBillsContentProps {
  data: RentBillsData | null;

  dashboard:
    DashboardResponse | null;

  setDashboard:
    React.Dispatch<
      React.SetStateAction<
        DashboardResponse | null
      >
    >;
}

/*
|--------------------------------------------------------------------------
| Rent Bills Content
|--------------------------------------------------------------------------
*/

function RentBillsContent({
  data,
  dashboard,
  setDashboard,
}: RentBillsContentProps) {
  const [isPaying, setIsPaying] =
    useState(false);

  const [paymentMessage, setPaymentMessage] =
    useState<string | null>(
      null
    );

  const [paymentError, setPaymentError] =
    useState<string | null>(
      null
    );

  const [invoiceOpen, setInvoiceOpen] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Billing Data
  |--------------------------------------------------------------------------
  */

  const utilityBills =
    dashboard?.utility_bills ??
    [];

  const unpaidUtilityBills =
    utilityBills.filter(
      (bill) =>
        bill.status ===
        "unpaid"
    );

  const utilityAmount =
    unpaidUtilityBills.reduce(
      (total, bill) =>
        total +
        Number(
          bill.amount
        ),
      0
    );

  const rentAmount =
    dashboard?.rent.amount ??
    0;

  const outstandingRent =
    dashboard?.rent
      .outstanding_balance ??
    0;

  const totalAmountDue =
    outstandingRent +
    utilityAmount;

  /*
  |--------------------------------------------------------------------------
  | Billing Breakdown
  |--------------------------------------------------------------------------
  */

  const billingBreakdown:
    BillingItem[] =
    dashboard
      ? [
          {
            label:
              "Monthly Rent",

            amount:
              formatCurrency(
                rentAmount
              ),
          },

          ...utilityBills.map(
            (bill) => ({
              label:
                `${bill.type} — ${formatBillingMonth(
                  bill.billing_month
                )}`,

              amount:
                formatCurrency(
                  Number(
                    bill.amount
                  )
                ),
            })
          ),
        ]
      : data?.billingBreakdown ??
        [];

  /*
  |--------------------------------------------------------------------------
  | Payment History
  |--------------------------------------------------------------------------
  */

  const paymentHistory:
    PaymentHistoryItem[] =
    dashboard
      ? (
          dashboard.recent_payments ??
          []
        ).map(
          (payment) => ({
            id:
              payment.id,

            month:
              formatDate(
                payment.payment_date
              ),

            date:
              formatDate(
                payment.payment_date
              ),

            amount:
              formatCurrency(
                Number(
                  payment.amount
                )
              ),

            method:
              "Rent Payment",

            reference:
              "—",

            status:
              payment.status ===
              "paid"
                ? "Paid"
                : "Pending",
          })
        )
      : data?.paymentHistory ??
        [];

  /*
  |--------------------------------------------------------------------------
  | Payment Information
  |--------------------------------------------------------------------------
  */

  const dueDate =
    dashboard?.rent
      .next_due_date ??
    data?.dueDate ??
    null;

  const paymentStatus =
    dashboard
      ? totalAmountDue > 0
        ? "Payment Due"
        : "Paid"
      : data?.paymentStatus ??
        null;

  const totalAmount =
    dashboard
      ? formatCurrency(
          totalAmountDue
        )
      : data?.totalAmount ??
        null;

  const rentDisplay =
    dashboard
      ? formatCurrency(
          rentAmount
        )
      : data?.rentAmount ??
        null;

  const utilityDisplay =
    dashboard
      ? formatCurrency(
          utilityAmount
        )
      : data?.utilityAmount ??
        null;

  /*
  |--------------------------------------------------------------------------
  | Current Bill
  |--------------------------------------------------------------------------
  */

  const hasCurrentBill =
    Boolean(
      dashboard
        ? rentAmount > 0 ||
          utilityAmount > 0
        : data?.dueDate ||
          data?.paymentStatus ||
          data?.rentAmount ||
          data?.utilityAmount ||
          data?.otherCharges ||
          data?.totalAmount
    );

  /*
  |--------------------------------------------------------------------------
  | Outstanding Rent
  |--------------------------------------------------------------------------
  */

  const hasOutstandingRent =
    dashboard
      ? outstandingRent > 0
      : hasCurrentBill;

  /*
  |--------------------------------------------------------------------------
  | Pay Rent
  |--------------------------------------------------------------------------
  */

  const handlePayRent =
    async () => {
      try {
        setIsPaying(
          true
        );

        setPaymentError(
          null
        );

        setPaymentMessage(
          null
        );

        if (!stripePromise) {
          throw new Error(
            "Stripe is not configured. Please check VITE_STRIPE_PUBLISHABLE_KEY."
          );
        }

        if (!dashboard) {
          throw new Error(
            "Billing information is not available."
          );
        }

        if (
          outstandingRent <=
          0
        ) {
          throw new Error(
            "There is no outstanding rent to pay."
          );
        }

        const payment =
          await createRentPayment();

        if (
          !payment ||
          !payment.client_secret
        ) {
          throw new Error(
            "Stripe payment could not be started."
          );
        }

        const stripe =
          await stripePromise;

        if (!stripe) {
          throw new Error(
            "Stripe could not be initialized."
          );
        }

        const result =
          await stripe.confirmCardPayment(
            payment.client_secret
          );

        if (result.error) {
          throw new Error(
            result.error.message ||
              "Stripe payment failed."
          );
        }

        if (
          !result.paymentIntent ||
          result.paymentIntent.status !==
            "succeeded"
        ) {
          throw new Error(
            "Payment was not completed."
          );
        }

        await finalizeRentPayment(
          result.paymentIntent.id
        );

        setPaymentMessage(
          "Rent payment completed successfully."
        );

        const token =
          localStorage.getItem(
            "auth_token"
          );

        if (!token) {
          return;
        }

        const apiUrl = "/api";

        const response =
          await fetch(
            `${apiUrl}/tenant/dashboard`,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!response.ok) {
          return;
        }

        const responseData:
          DashboardApiResponse =
          await response.json();

        const refreshedDashboard =
          extractDashboard(
            responseData
          );

        setDashboard(
          refreshedDashboard
        );
      } catch (err) {
        console.error(
          "Rent payment error:",
          err
        );

        setPaymentError(
          err instanceof Error
            ? err.message
            : "Unable to complete rent payment."
        );
      } finally {
        setIsPaying(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Summary Cards
  |--------------------------------------------------------------------------
  */

  const summaryCards:
    SummaryCard[] =
    dashboard
      ? [
          {
            label:
              "Monthly Rent",

            value:
              formatCurrency(
                rentAmount
              ),

            detail:
              outstandingRent >
              0
                ? `Outstanding: ${formatCurrency(
                    outstandingRent
                  )}`
                : "Rent is fully paid",

            tone:
              "primary",
          },

          {
            label:
              "Current Amount Due",

            value:
              formatCurrency(
                totalAmountDue
              ),

            detail:
              unpaidUtilityBills.length >
              0
                ? `${
                    unpaidUtilityBills.length
                  } unpaid utility bill${
                    unpaidUtilityBills.length >
                    1
                      ? "s"
                      : ""
                  }`
                : outstandingRent >
                    0
                ? "Rent payment due"
                : "Nothing currently due",

            tone:
              "warning",
          },

          {
            label:
              "Next Due Date",

            value:
              formatDate(
                dueDate
              ),

            detail:
              "Next rent payment",

            tone:
              "info",
          },

          {
            label:
              "Payment Status",

            value:
              paymentStatus,

            detail:
              totalAmountDue > 0
                ? "Payment required"
                : "All current charges paid",

            tone:
              "success",
          },
        ]
      : data?.summaryCards ??
        defaultSummaryCards;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="page-dark">

      <div className="tenant-page-shell">

        {/* ================================================================
            SUMMARY CARDS
        ================================================================= */}

        <section className="tenant-stats-grid tenant-stats-grid--compact">

          {summaryCards.map(
            (item) => (
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
                    {item.value ||
                      "No data yet"}
                  </div>

                  <p className="tenant-stat-card__subtitle">
                    {item.detail ||
                      "No information available"}
                  </p>

                </div>

              </div>
            )
          )}

        </section>

        {/* ================================================================
            CURRENT PAYMENT
        ================================================================= */}

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

              {paymentStatus ||
                "No status"}

            </span>

          </div>

          {/* Payment Hero */}

          <div className="tenant-payment-hero">

            <div>

              <small>
                Due date
              </small>

              <strong>
                {formatDate(
                  dueDate
                )}
              </strong>

            </div>

            <div>

              <small>
                Payment status
              </small>

              <strong>
                {paymentStatus ||
                  "No data yet"}
              </strong>

            </div>

          </div>

          {/* Payment Summary */}

          <div className="tenant-payment-summary">

            {hasCurrentBill ? (
              <>

                <div className="tenant-payment-summary__row">

                  <span>
                    Rent
                  </span>

                  <strong>
                    {rentDisplay ||
                      "No data yet"}
                  </strong>

                </div>

                <div className="tenant-payment-summary__row">

                  <span>
                    Utility Charges
                  </span>

                  <strong>
                    {utilityDisplay ||
                      "No utility charges"}
                  </strong>

                </div>

                <div className="tenant-payment-summary__row">

                  <span>
                    Other Charges
                  </span>

                  <strong>
                    {data?.otherCharges ||
                      (dashboard
                        ? "৳0"
                        : "No data yet")}
                  </strong>

                </div>

                <div className="tenant-payment-summary__row tenant-payment-summary__row--total">

                  <span>
                    Total Amount Due
                  </span>

                  <strong>
                    {totalAmount ||
                      "No data yet"}
                  </strong>

                </div>

              </>
            ) : (

              <div className="tenant-payment-summary__row">

                <span>
                  Current Billing
                </span>

                <strong>
                  No billing data yet
                </strong>

              </div>

            )}

          </div>

          {/* Payment Error */}

          {paymentError && (
            <div
              style={{
                marginTop:
                  "16px",

                padding:
                  "12px 16px",

                borderRadius:
                  "8px",

                background:
                  "rgba(220, 53, 69, 0.12)",

                color:
                  "#dc3545",
              }}
            >
              {paymentError}
            </div>
          )}

          {/* Payment Success */}

          {paymentMessage && (
            <div
              style={{
                marginTop:
                  "16px",

                padding:
                  "12px 16px",

                borderRadius:
                  "8px",

                background:
                  "rgba(25, 135, 84, 0.12)",

                color:
                  "#198754",
              }}
            >
              {paymentMessage}
            </div>
          )}

          {/* Buttons */}

          <div className="tenant-actions-row tenant-actions-row--align-end">

            <button
              type="button"
              className="btn btn-secondary btn-secondary--compact"
              disabled={
                !hasCurrentBill
              }
              onClick={() =>
                setInvoiceOpen(
                  true
                )
              }
            >

              <i
                className="bi bi-receipt me-2"
                aria-hidden="true"
              />

              View Invoice

            </button>

            <button
              type="button"
              className="btn btn-rentora btn-rentora--compact"
              disabled={
                !hasOutstandingRent ||
                isPaying
              }
              onClick={
                handlePayRent
              }
            >

              {isPaying
                ? "Processing..."
                : "Pay Rent"}

            </button>

          </div>

        </section>

        {/* ================================================================
            TWO COLUMN AREA
        ================================================================= */}

        <div className="tenant-two-column-layout">

          {/* Billing Breakdown */}

          <section className="tenant-panel">

            <div className="tenant-panel__header">

              <div>

                <span className="tenant-panel__eyebrow">
                  Details
                </span>

                <h3>
                  Billing Breakdown
                </h3>

              </div>

            </div>

            <div className="tenant-billing-list">

              {billingBreakdown.length >
              0 ? (

                billingBreakdown.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={`${item.label}-${index}`}
                      className="tenant-billing-list__row"
                    >

                      <span>
                        {item.label}
                      </span>

                      <strong>
                        {item.amount}
                      </strong>

                    </div>

                  )
                )

              ) : (

                <div className="tenant-billing-list__row">

                  <span>
                    Billing details
                  </span>

                  <strong>
                    No billing details
                    available
                  </strong>

                </div>

              )}

            </div>

          </section>

          {/* Quick Actions */}

          <section className="tenant-panel">

            <div className="tenant-panel__header">

              <div>

                <span className="tenant-panel__eyebrow">
                  Receipts
                </span>

                <h3>
                  Quick Actions
                </h3>

              </div>

            </div>

            <div className="tenant-quick-stack">

              {/* Download Invoice */}

              <button
                type="button"
                className="tenant-quick-action"
                disabled={
                  !hasCurrentBill
                }
                onClick={() =>
                  setInvoiceOpen(
                    true
                  )
                }
              >

                <span>

                  <i
                    className="bi bi-receipt"
                    aria-hidden="true"
                  />

                  {" "}
                  Download Invoice

                </span>

                <i
                  className="bi bi-arrow-right-short"
                  aria-hidden="true"
                />

              </button>

              {/* View Receipt */}

              <button
                type="button"
                className="tenant-quick-action"
                disabled={
                  paymentHistory.length ===
                  0
                }
              >

                <span>

                  <i
                    className="bi bi-file-earmark-text"
                    aria-hidden="true"
                  />

                  {" "}
                  View Receipt

                </span>

                <i
                  className="bi bi-arrow-right-short"
                  aria-hidden="true"
                />

              </button>

              {/* Payment History */}

              <button
                type="button"
                className="tenant-quick-action"
                disabled={
                  paymentHistory.length ===
                  0
                }
              >

                <span>

                  <i
                    className="bi bi-credit-card"
                    aria-hidden="true"
                  />

                  {" "}
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

        {/* ================================================================
            PAYMENT HISTORY
        ================================================================= */}

        <section className="tenant-panel">

          <div className="tenant-panel__header tenant-panel__header--split">

            <div>

              <span className="tenant-panel__eyebrow">
                Transactions
              </span>

              <h3>
                Payment History
              </h3>

            </div>

            <button
              type="button"
              className="btn btn-secondary btn-secondary--compact"
              disabled={
                paymentHistory.length ===
                0
              }
            >
              Download Statement
            </button>

          </div>

          {paymentHistory.length >
          0 ? (

            <div className="tenant-table-wrap">

              <table className="tenant-data-table">

                <thead>

                  <tr>

                    <th>
                      Month
                    </th>

                    <th>
                      Payment Date
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Method
                    </th>

                    <th>
                      Reference
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Receipt
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paymentHistory.map(
                    (item) => (

                      <tr
                        key={item.id}
                      >

                        <td>
                          {item.month}
                        </td>

                        <td>
                          {item.date}
                        </td>

                        <td>
                          {item.amount}
                        </td>

                        <td>
                          {item.method}
                        </td>

                        <td>
                          {item.reference}
                        </td>

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

                    )
                  )}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="tenant-info-card">

              <small>
                Payment History
              </small>

              <strong>
                No payment history yet
              </strong>

            </div>

          )}

        </section>

        {/* ================================================================
            INVOICE MODAL
        ================================================================= */}

        <InvoiceModal
          open={
            invoiceOpen
          }

          onClose={() =>
            setInvoiceOpen(
              false
            )
          }

          dueDate={
            dueDate
          }

          outstandingRent={
            outstandingRent
          }

          utilityBills={
            utilityBills
          }

          totalAmountDue={
            totalAmountDue
          }

          paymentStatus={
            paymentStatus
          }
        />

      </div>

    </main>
  );
}

export default RentBillsPage;