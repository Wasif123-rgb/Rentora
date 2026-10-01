import { useEffect, useMemo, useState } from "react";
import "./Tenant.css";
import { apiRequest } from "../../services/api";

type ComplaintStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Closed";

type ComplaintPriority = "Low" | "Normal" | "High" | "Urgent";

type ComplaintFilter =
  | "all"
  | "open"
  | "in-progress"
  | "resolved"
  | "closed"
  | "priority";

type ApiComplaint = {
  id: number;
  tenant_id?: number | null;
  submitted_by: number;
  title: string;
  apartment_unit?: string | null;
  category: string;
  priority: ComplaintPriority;
  description: string;
  preferred_contact_method: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  updated_at?: string | null;
  manager_feedback?: string | null;
  responded_at?: string | null;
};

type ComplaintsResponse = {
  success: boolean;
  complaints: {
    data: ApiComplaint[];
    current_page: number;
    last_page: number;
    total: number;
  };
};

type ComplaintRecord = {
  id: string;
  title: string;
  apartmentUnit: string;
  category: string;
  submittedDate: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  lastUpdated: string;
  description: string;
  updates: string[];
};

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatStatus(
  status: ApiComplaint["status"]
): ComplaintStatus {
  switch (status) {
    case "open":
      return "Open";

    case "in_progress":
      return "In Progress";

    case "resolved":
      return "Resolved";

    default:
      return "Closed";
  }
}

function ComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<ComplaintFilter>("all");

  const [selectedId, setSelectedId] = useState<string>("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiRequest<ComplaintsResponse>(
          "/tenant/complaints"
        );

        if (!response.success) {
          throw new Error(
            "Failed to load your complaints."
          );
        }

        const records: ComplaintRecord[] =
          response.complaints.data.map((complaint) => ({
            id: String(complaint.id),

            title: complaint.title,
            apartmentUnit: complaint.apartment_unit || "Not provided",

            category: complaint.category,

            submittedDate: formatDate(
              complaint.created_at
            ),

            priority: complaint.priority,

            status: formatStatus(
              complaint.status
            ),

            lastUpdated: formatDate(
              complaint.updated_at || complaint.created_at
            ),

            description: complaint.description,

            /*
             * Updates are not stored in the current
             * complaints schema yet.
             */
            updates: [
              `Complaint submitted on ${formatDate(
                complaint.created_at
              )}`,
              ...(complaint.apartment_unit
                ? [`Apartment / Unit: ${complaint.apartment_unit}`]
                : []),
              ...(complaint.manager_feedback
                ? [`Management response (${formatDate(complaint.responded_at)}): ${complaint.manager_feedback}`]
                : []),
            ],
          }));

        setComplaints(records);

        /*
         * Automatically select the first complaint.
         */
        if (records.length > 0) {
          setSelectedId(records[0].id);
        } else {
          setSelectedId("");
        }
      } catch (err: any) {
        console.error(
          "Complaint history error:",
          err
        );

        setError(
          err?.data?.message ||
            err?.message ||
            "Unable to load complaints."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const visibleComplaints = useMemo(() => {
    const term = search.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "open" &&
          complaint.status === "Open") ||
        (filter === "in-progress" &&
          complaint.status === "In Progress") ||
        (filter === "resolved" &&
          complaint.status === "Resolved") ||
        (filter === "closed" &&
          complaint.status === "Closed") ||
        (filter === "priority" &&
          complaint.priority === "High");

      const matchesSearch =
        complaint.title
          .toLowerCase()
          .includes(term) ||
        complaint.category
          .toLowerCase()
          .includes(term) ||
        complaint.id
          .toLowerCase()
          .includes(term) ||
        complaint.description
          .toLowerCase()
          .includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [complaints, filter, search]);

  const selectedComplaint =
    visibleComplaints.find(
      (complaint) =>
        complaint.id === selectedId
    ) ??
    visibleComplaints[0] ??
    null;

  const totalComplaints = complaints.length;

  const openComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Open"
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "In Progress"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved"
  ).length;

  const summaryCards = [
    {
      label: "Total Complaints",
      value: String(totalComplaints),
      tone: "primary",
    },
    {
      label: "Open",
      value: String(openComplaints),
      tone: "warning",
    },
    {
      label: "In Progress",
      value: String(inProgressComplaints),
      tone: "info",
    },
    {
      label: "Resolved",
      value: String(resolvedComplaints),
      tone: "success",
    },
  ];

  if (loading) {
    return (
      <main className="page-dark">
        <div className="tenant-page-shell">
          <section className="tenant-panel">
            <div className="tenant-empty-state">
              <div className="tenant-empty-state__icon">
                <i
                  className="bi bi-arrow-repeat"
                  aria-hidden="true"
                />
              </div>

              <h4>Loading complaints...</h4>

              <p>
                Please wait while we load your complaint
                history.
              </p>
            </div>
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
            <div className="tenant-empty-state">
              <div className="tenant-empty-state__icon">
                <i
                  className="bi bi-exclamation-circle"
                  aria-hidden="true"
                />
              </div>

              <h4>Unable to load complaints</h4>

              <p>{error}</p>

              <button
                type="button"
                className="btn btn-rentora btn-rentora--compact"
                onClick={() =>
                  window.location.reload()
                }
              >
                Try Again
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-dark">
      <div className="tenant-page-shell">

        {/* SUMMARY CARDS */}
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
                  className="bi bi-journal-text"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="tenant-stat-card__label">
                  {item.label}
                </p>

                <div className="tenant-stat-card__value tenant-stat-card__value--sm">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* HEADER + SEARCH */}
        <section className="tenant-panel">
          <div className="tenant-panel__header tenant-panel__header--split">
            <div>
              <span className="tenant-panel__eyebrow">
                Tracking
              </span>

              <h3>Complaint History</h3>
            </div>

            <div className="tenant-search-inline">
              <i
                className="bi bi-search"
                aria-hidden="true"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search complaints"
                aria-label="Search complaints"
              />
            </div>
          </div>

          {/* FILTERS */}
          <div
            className="tenant-filter-group"
            role="tablist"
            aria-label="Complaint filters"
          >
            {[
              {
                label: "All",
                value: "all",
              },
              {
                label: "Open",
                value: "open",
              },
              {
                label: "In Progress",
                value: "in-progress",
              },
              {
                label: "Resolved",
                value: "resolved",
              },
              {
                label: "Closed",
                value: "closed",
              },
              {
                label: "Priority",
                value: "priority",
              },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`tenant-filter-button ${
                  filter === item.value
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter(
                    item.value as ComplaintFilter
                  )
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* NO COMPLAINTS */}
        {visibleComplaints.length === 0 ? (
          <section className="tenant-panel">
            <div className="tenant-empty-state">
              <div className="tenant-empty-state__icon">
                <i
                  className="bi bi-chat-left-text"
                  aria-hidden="true"
                />
              </div>

              <h4>
                {complaints.length === 0
                  ? "No complaints yet"
                  : "No matching complaints"}
              </h4>

              <p>
                {complaints.length === 0
                  ? "Your submitted complaints and their status updates will appear here."
                  : "Try changing your search or complaint filter."}
              </p>

              {complaints.length === 0 && (
                <a
                  href="/tenant/complaints/new"
                  className="btn btn-rentora btn-rentora--compact"
                >
                  Submit a Complaint
                </a>
              )}
            </div>
          </section>
        ) : (
          /* COMPLAINT LIST + DETAILS */
          <div className="tenant-two-column-layout">

            {/* COMPLAINT LIST */}
            <section className="tenant-panel">
              <div className="tenant-panel__header">
                <div>
                  <span className="tenant-panel__eyebrow">
                    Records
                  </span>

                  <h3>Complaint List</h3>
                </div>
              </div>

              <div className="tenant-complaint-list">
                {visibleComplaints.map(
                  (complaint) => (
                    <button
                      key={complaint.id}
                      type="button"
                      className={`tenant-complaint-item ${
                        selectedComplaint?.id ===
                        complaint.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedId(
                          complaint.id
                        )
                      }
                    >
                      <div className="tenant-complaint-item__top">
                        <div>
                          <span className="tenant-complaint-id">
                            #{complaint.id}
                          </span>

                          <h4>
                            {complaint.title}
                          </h4>
                        </div>

                        <span
                          className={`tenant-table-badge tenant-table-badge--${complaint.status
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {complaint.status}
                        </span>
                      </div>

                      <div className="tenant-complaint-item__meta">
                        <span>
                          {complaint.category}
                        </span>

                        <span>
                          {complaint.submittedDate}
                        </span>

                        <span>
                          {complaint.priority}
                        </span>
                      </div>
                    </button>
                  )
                )}
              </div>
            </section>

            {/* DETAILS */}
            {selectedComplaint && (
              <section className="tenant-panel">
                <div className="tenant-panel__header">
                  <div>
                    <span className="tenant-panel__eyebrow">
                      Details
                    </span>

                    <h3>
                      {selectedComplaint.title}
                    </h3>
                  </div>

                  <span
                    className={`tenant-table-badge tenant-table-badge--${selectedComplaint.status
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )}`}
                  >
                    {selectedComplaint.status}
                  </span>
                </div>

                <div className="tenant-detail-grid">

                  <div>
                    <span>Complaint ID</span>

                    <strong>
                      #{selectedComplaint.id}
                    </strong>
                  </div>

                  <div>
                    <span>Category</span>

                    <strong>
                      {selectedComplaint.category}
                    </strong>
                  </div>

                  <div>
                    <span>Apartment / Unit</span>

                    <strong>
                      {selectedComplaint.apartmentUnit}
                    </strong>
                  </div>

                  <div>
                    <span>Priority</span>

                    <strong>
                      {selectedComplaint.priority}
                    </strong>
                  </div>

                  <div>
                    <span>Submitted</span>

                    <strong>
                      {
                        selectedComplaint.submittedDate
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Last updated</span>

                    <strong>
                      {
                        selectedComplaint.lastUpdated
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>
                      {selectedComplaint.status}
                    </strong>
                  </div>

                </div>

                <div className="tenant-detail-description">
                  <h4>Description</h4>

                  <p>
                    {
                      selectedComplaint.description
                    }
                  </p>
                </div>

                <div className="tenant-detail-timeline">
                  <h4>Updates</h4>

                  <ul>
                    {selectedComplaint.updates.map(
                      (update, index) => (
                        <li
                          key={`${update}-${index}`}
                        >
                          {update}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="tenant-detail-attachments">
                  <h4>Attachments</h4>

                  <span>
                    No attachments uploaded
                  </span>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default ComplaintsPage;
