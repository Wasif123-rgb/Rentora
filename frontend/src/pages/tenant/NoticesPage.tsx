import { useEffect, useMemo, useState } from "react";
import "./Tenant.css";

export interface TenantNotice {
  id: number;
  type: "notice" | "complaint_feedback";
  title: string;
  content: string;
  published_by: number | null;
  created_at: string | null;
  status: "open" | "in_progress" | "resolved" | null;
}

type NoticeFilter = "all" | "unread" | "important";

function NoticesPage() {
  const [notices, setNotices] = useState<TenantNotice[]>([]);
  const [filter, setFilter] = useState<NoticeFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("auth_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const apiUrl = "/api";

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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load notices."
          );
        }

        console.log("TENANT NOTICES PAGE:", data.notices);

        setNotices(
          Array.isArray(data.notices)
            ? data.notices
            : []
        );
      } catch (err) {
        console.error("Tenant notices error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load notices."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const unreadNotices = useMemo(() => {
    return notices.filter(
      (notice) =>
        notice.type === "notice" &&
        notice.status === null
    );
  }, [notices]);

  const importantNotices = useMemo(() => {
    return notices.filter(
      (notice) =>
        notice.type === "complaint_feedback" &&
        notice.status !== "resolved"
    );
  }, [notices]);

  const filteredNotices = useMemo(() => {
    switch (filter) {
      case "unread":
        return unreadNotices;

      case "important":
        return importantNotices;

      case "all":
      default:
        return notices;
    }
  }, [
    filter,
    notices,
    unreadNotices,
    importantNotices,
  ]);

  if (loading) {
    return (
      <section className="tenant-panel tenant-panel--plain">
        <div className="tenant-panel__header">
          <div>
            <span className="tenant-panel__eyebrow">
              Community Updates
            </span>

            <h3>Notices</h3>
          </div>
        </div>

        <div className="tenant-empty-state">
          <div className="tenant-empty-state__icon">
            <i
              className="bi bi-hourglass-split"
              aria-hidden="true"
            />
          </div>

          <h4>Loading notices...</h4>

          <p>
            Please wait while we load the latest property
            and community updates.
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tenant-panel tenant-panel--plain">
        <div className="tenant-panel__header">
          <div>
            <span className="tenant-panel__eyebrow">
              Community Updates
            </span>

            <h3>Notices</h3>
          </div>
        </div>

        <div className="tenant-empty-state">
          <div className="tenant-empty-state__icon">
            <i
              className="bi bi-exclamation-circle"
              aria-hidden="true"
            />
          </div>

          <h4>Unable to load notices</h4>

          <p>{error}</p>

          <button
            type="button"
            className="btn btn-rentora"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="tenant-panel tenant-panel--plain">
      {/* Header */}
      <div className="tenant-panel__header tenant-panel__header--split">
        <div>
          <span className="tenant-panel__eyebrow">
            Community Updates
          </span>

          <h3>Notices</h3>
        </div>

        <div
          className="tenant-filter-group"
          role="tablist"
          aria-label="Notice filters"
        >
          {[
            {
              label: "All",
              value: "all" as NoticeFilter,
            },
            {
              label: "Unread",
              value: "unread" as NoticeFilter,
            },
            {
              label: "Important",
              value: "important" as NoticeFilter,
            },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`tenant-filter-button ${
                filter === item.value ? "active" : ""
              }`}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="tenant-notice-topline">
        <div>
          <strong>{notices.length}</strong>
          <span>Total notices</span>
        </div>

        <div>
          <strong>{unreadNotices.length}</strong>
          <span>Unread</span>
        </div>

        <div>
          <strong>{importantNotices.length}</strong>
          <span>Important</span>
        </div>
      </div>

      {/* Notices */}
      <div className="tenant-notice-list">
        {filteredNotices.length === 0 ? (
          <div className="tenant-empty-state">
            <div className="tenant-empty-state__icon">
              <i
                className="bi bi-megaphone"
                aria-hidden="true"
              />
            </div>

            <h4>
              {filter === "all"
                ? "No notices yet"
                : filter === "unread"
                ? "No unread notices"
                : "No important notices"}
            </h4>

            <p>
              {filter === "all"
                ? "Property and community notices will appear here when they are available."
                : filter === "unread"
                ? "You have no unread management notices."
                : "You have no important complaint updates."}
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const noticeKey = `${notice.type}-${notice.id}`;

            const isExpanded =
              expandedId === noticeKey;

            const isComplaintFeedback =
              notice.type === "complaint_feedback";

            const category = isComplaintFeedback
              ? "Complaint Update"
              : "Management Notice";

            const isImportant =
              isComplaintFeedback &&
              notice.status !== "resolved";

            const formattedDate = notice.created_at
              ? new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(notice.created_at))
              : "No date";

            return (
              <article
                key={noticeKey}
                className={`tenant-notice-item ${
                  isImportant ? "is-unread" : ""
                }`}
              >
                <div className="tenant-notice-item__main">
                  <div className="tenant-notice-item__topline">
                    <span className="tenant-notice-tag">
                      {category}
                    </span>

                    {isImportant && (
                      <span className="tenant-notice-tag tenant-notice-tag--priority">
                        Important
                      </span>
                    )}
                  </div>

                  <div className="tenant-notice-item__body">
                    <div>
                      <h4>{notice.title}</h4>

                      <p>{notice.content}</p>
                    </div>

                    <span className="tenant-notice-date">
                      {formattedDate}
                    </span>
                  </div>
                </div>

                <div className="tenant-notice-item__footer">
                  <button
                    type="button"
                    className="tenant-link-button"
                    onClick={() =>
                      setExpandedId(
                        isExpanded
                          ? null
                          : noticeKey
                      )
                    }
                  >
                    {isExpanded
                      ? "Hide details"
                      : "View details"}
                  </button>

                  <span className="tenant-notice-state">
                    {isComplaintFeedback
                      ? notice.status
                          ?.replace("_", " ")
                          .replace(
                            /\b\w/g,
                            (letter) =>
                              letter.toUpperCase()
                          ) || "Update"
                      : "Notice"}
                  </span>
                </div>

                {isExpanded && (
                  <div className="tenant-notice-item__details">
                    <strong>Notice Details</strong>

                    <p>{notice.content}</p>

                    <small>
                      Published on {formattedDate}
                    </small>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default NoticesPage;