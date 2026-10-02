import { useEffect, useMemo, useState } from "react";
import "./Tenant.css";
import { apiRequest } from "../../services/api";

type ComplaintStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Closed";

type ComplaintPriority =
  | "Low"
  | "Normal"
  | "High"
  | "Urgent";

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

function formatDate(
  value: string | null | undefined
): string {
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

function getStatusClass(
  status: ComplaintStatus
): string {
  return status
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getPriorityClass(
  priority: ComplaintPriority
): string {
  return priority
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function ComplaintsPage() {
  const [complaints, setComplaints] = useState<
    ComplaintRecord[]
  >([]);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<ComplaintFilter>("all");

  const [selectedId, setSelectedId] =
    useState<string>("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ========================================================
   * FETCH COMPLAINTS
   * ========================================================
   */

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await apiRequest<ComplaintsResponse>(
            "/tenant/complaints"
          );

        if (!response.success) {
          throw new Error(
            "Failed to load your complaints."
          );
        }

        const records: ComplaintRecord[] =
          response.complaints.data.map(
            (complaint) => ({
              id: String(complaint.id),

              title: complaint.title,

              apartmentUnit:
                complaint.apartment_unit ||
                "Not provided",

              category: complaint.category,

              submittedDate: formatDate(
                complaint.created_at
              ),

              priority: complaint.priority,

              status: formatStatus(
                complaint.status
              ),

              lastUpdated: formatDate(
                complaint.updated_at ||
                  complaint.created_at
              ),

              description:
                complaint.description,

              /*
               * The current complaints schema
               * does not have a separate updates table.
               */
              updates: [
                `Complaint submitted on ${formatDate(
                  complaint.created_at
                )}`,

                ...(complaint.apartment_unit
                  ? [
                      `Apartment / Unit: ${complaint.apartment_unit}`,
                    ]
                  : []),

                ...(complaint.manager_feedback
                  ? [
                      `Management response (${formatDate(
                        complaint.responded_at
                      )}): ${complaint.manager_feedback}`,
                    ]
                  : []),
              ],
            })
          );

        setComplaints(records);

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

  /*
   * ========================================================
   * SEARCH + FILTER
   * ========================================================
   */

  const visibleComplaints = useMemo(() => {
    const term =
      search.trim().toLowerCase();

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

        /*
         * Priority means High or Urgent.
         */
        (filter === "priority" &&
          (complaint.priority === "High" ||
            complaint.priority === "Urgent"));

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
          .includes(term) ||

        complaint.apartmentUnit
          .toLowerCase()
          .includes(term);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [complaints, filter, search]);

  /*
   * ========================================================
   * SELECTED COMPLAINT
   * ========================================================
   */

  const selectedComplaint =
    visibleComplaints.find(
      (complaint) =>
        complaint.id === selectedId
    ) ??
    visibleComplaints[0] ??
    null;

  /*
   * ========================================================
   * SUMMARY
   * ========================================================
   */

  const totalComplaints =
    complaints.length;

  const openComplaints =
    complaints.filter(
      (complaint) =>
        complaint.status === "Open"
    ).length;

  const inProgressComplaints =
    complaints.filter(
      (complaint) =>
        complaint.status === "In Progress"
    ).length;

  const resolvedComplaints =
    complaints.filter(
      (complaint) =>
        complaint.status === "Resolved"
    ).length;

  const summaryCards = [
    {
      label: "Total Complaints",
      value: String(totalComplaints),
      tone: "primary",
      icon: "bi-journal-text",
    },
    {
      label: "Open",
      value: String(openComplaints),
      tone: "warning",
      icon: "bi-exclamation-circle",
    },
    {
      label: "In Progress",
      value: String(
        inProgressComplaints
      ),
      tone: "info",
      icon: "bi-hourglass-split",
    },
    {
      label: "Resolved",
      value: String(
        resolvedComplaints
      ),
      tone: "success",
      icon: "bi-check-circle",
    },
  ];

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

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

              <h4>
                Loading complaints...
              </h4>

              <p>
                Please wait while we load
                your complaint history.
              </p>

            </div>
          </section>
        </div>
      </main>
    );
  }

  /*
   * ========================================================
   * ERROR
   * ========================================================
   */

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

              <h4>
                Unable to load complaints
              </h4>

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

  /*
   * ========================================================
   * MAIN PAGE
   * ========================================================
   */

  return (
    <main className="page-dark">
      <div className="tenant-page-shell">

        {/* ==================================================
            SUMMARY CARDS
            ================================================== */}

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
                  className={`bi ${item.icon}`}
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

        {/* ==================================================
            HEADER / SEARCH / FILTERS
            ================================================== */}

        <section className="tenant-panel">

          <div className="tenant-panel__header tenant-panel__header--split">

            <div>
              <span className="tenant-panel__eyebrow">
                Tracking
              </span>

              <h3>
                Complaint History
              </h3>

              <p className="tenant-panel__subtitle">
                Track the complaints you have
                submitted and their latest status.
              </p>
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
                  setSearch(
                    event.target.value
                  )
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

        {/* ==================================================
            EMPTY STATE
            ================================================== */}

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

          <div className="tenant-complaints-section">

            {/* ==================================================
                COMPLAINT TABLE
                ================================================== */}

            <section className="tenant-panel tenant-complaints-table-panel">

              <div className="tenant-panel__header tenant-panel__header--split">

                <div>
                  <span className="tenant-panel__eyebrow">
                    Records
                  </span>

                  <h3>
                    Complaint List
                  </h3>

                  <p className="tenant-panel__subtitle">
                    Select a complaint to view
                    its full details.
                  </p>
                </div>

                <div className="tenant-complaints-count">

                  <strong>
                    {visibleComplaints.length}
                  </strong>

                  <span>
                    {visibleComplaints.length === 1
                      ? "Complaint"
                      : "Complaints"}
                  </span>

                </div>

              </div>

              <div className="tenant-table-wrapper">

                <table className="tenant-complaints-table">

                  <thead>
                    <tr>
                      <th>Complaint</th>
                      <th>Category</th>
                      <th>Unit</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Updated</th>
                    </tr>
                  </thead>

                  <tbody>

                    {visibleComplaints.map(
                      (complaint) => {

                        const isSelected =
                          selectedComplaint?.id ===
                          complaint.id;

                        return (
                          <tr
                            key={complaint.id}
                            className={`tenant-complaint-row ${
                              isSelected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedId(
                                complaint.id
                              )
                            }
                          >

                            {/* COMPLAINT */}

                            <td>
                              <div className="tenant-complaint-table-title">

                                <span className="tenant-complaint-table-id">
                                  #{complaint.id}
                                </span>

                                <strong>
                                  {complaint.title}
                                </strong>

                                <span className="tenant-complaint-table-description">
                                  {complaint.description}
                                </span>

                              </div>
                            </td>

                            {/* CATEGORY */}

                            <td>
                              <span className="tenant-table-category">
                                {complaint.category}
                              </span>
                            </td>

                            {/* UNIT */}

                            <td>
                              <span className="tenant-table-unit">
                                {complaint.apartmentUnit}
                              </span>
                            </td>

                            {/* PRIORITY */}

                            <td>
                              <span
                                className={`tenant-priority-badge tenant-priority-badge--${getPriorityClass(
                                  complaint.priority
                                )}`}
                              >

                                <span className="tenant-priority-dot" />

                                {complaint.priority}

                              </span>
                            </td>

                            {/* STATUS */}

                            <td>
                              <span
                                className={`tenant-status-badge tenant-status-badge--${getStatusClass(
                                  complaint.status
                                )}`}
                              >

                                <span className="tenant-status-dot" />

                                {complaint.status}

                              </span>
                            </td>

                            {/* SUBMITTED */}

                            <td>
                              <span className="tenant-table-date">
                                {complaint.submittedDate}
                              </span>
                            </td>

                            {/* UPDATED */}

                            <td>
                              <span className="tenant-table-date">
                                {complaint.lastUpdated}
                              </span>
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* ==================================================
                COMPLAINT DETAILS
                ================================================== */}

            {selectedComplaint && (
              <section className="tenant-panel tenant-complaint-details-panel">

                <div className="tenant-panel__header tenant-panel__header--split">

                  <div>

                    <span className="tenant-panel__eyebrow">
                      Complaint Details
                    </span>

                    <h3>
                      {selectedComplaint.title}
                    </h3>

                    <span className="tenant-complaint-detail-id">
                      Complaint #
                      {selectedComplaint.id}
                    </span>

                  </div>

                  <span
                    className={`tenant-status-badge tenant-status-badge--large tenant-status-badge--${getStatusClass(
                      selectedComplaint.status
                    )}`}
                  >

                    <span className="tenant-status-dot" />

                    {selectedComplaint.status}

                  </span>

                </div>

                {/* ==================================================
                    INFORMATION GRID
                    ================================================== */}

                <div className="tenant-complaint-info-grid">

                  <div className="tenant-complaint-info-card">
                    <span>
                      Category
                    </span>

                    <strong>
                      {selectedComplaint.category}
                    </strong>
                  </div>

                  <div className="tenant-complaint-info-card">
                    <span>
                      Apartment / Unit
                    </span>

                    <strong>
                      {selectedComplaint.apartmentUnit}
                    </strong>
                  </div>

                  <div className="tenant-complaint-info-card">
                    <span>
                      Priority
                    </span>

                    <strong>
                      <span
                        className={`tenant-priority-badge tenant-priority-badge--${getPriorityClass(
                          selectedComplaint.priority
                        )}`}
                      >

                        <span className="tenant-priority-dot" />

                        {selectedComplaint.priority}

                      </span>
                    </strong>
                  </div>

                  <div className="tenant-complaint-info-card">
                    <span>
                      Status
                    </span>

                    <strong>
                      {selectedComplaint.status}
                    </strong>
                  </div>

                  <div className="tenant-complaint-info-card">
                    <span>
                      Submitted
                    </span>

                    <strong>
                      {selectedComplaint.submittedDate}
                    </strong>
                  </div>

                  <div className="tenant-complaint-info-card">
                    <span>
                      Last Updated
                    </span>

                    <strong>
                      {selectedComplaint.lastUpdated}
                    </strong>
                  </div>

                </div>

                {/* ==================================================
                    DESCRIPTION
                    ================================================== */}

                <div className="tenant-complaint-content-block">

                  <div className="tenant-complaint-content-heading">

                    <i
                      className="bi bi-file-text"
                      aria-hidden="true"
                    />

                    <h4>
                      Description
                    </h4>

                  </div>

                  <div className="tenant-complaint-description-box">

                    <p>
                      {selectedComplaint.description}
                    </p>

                  </div>

                </div>

                {/* ==================================================
                    UPDATES
                    ================================================== */}

                <div className="tenant-complaint-content-block">

                  <div className="tenant-complaint-content-heading">

                    <i
                      className="bi bi-clock-history"
                      aria-hidden="true"
                    />

                    <h4>
                      Updates
                    </h4>

                  </div>

                  <div className="tenant-complaint-timeline">

                    {selectedComplaint.updates.map(
                      (update, index) => (

                        <div
                          className="tenant-complaint-timeline-item"
                          key={`${update}-${index}`}
                        >

                          <div className="tenant-complaint-timeline-marker">
                            <span />
                          </div>

                          <div className="tenant-complaint-timeline-content">

                            <span>
                              Update{" "}
                              {index + 1}
                            </span>

                            <p>
                              {update}
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>

                {/* ==================================================
                    ATTACHMENTS
                    ================================================== */}

                <div className="tenant-complaint-content-block">

                  <div className="tenant-complaint-content-heading">

                    <i
                      className="bi bi-paperclip"
                      aria-hidden="true"
                    />

                    <h4>
                      Attachments
                    </h4>

                  </div>

                  <div className="tenant-complaint-attachments-empty">

                    <i
                      className="bi bi-paperclip"
                      aria-hidden="true"
                    />

                    <span>
                      No attachments uploaded
                    </span>

                  </div>

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
