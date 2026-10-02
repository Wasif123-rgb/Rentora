import { Link } from "react-router-dom";

export interface TenantNotice {
  id: number;
  type: "notice" | "complaint_feedback";
  title: string;
  content: string;
  published_by: number | null;
  created_at: string | null;
  status: "open" | "in_progress" | "resolved" | null;
}

interface NoticeBoardProps {
  notices?: TenantNotice[];
}

function NoticeBoard({ notices = [] }: NoticeBoardProps) {
  const visibleNotices = Array.isArray(notices)
    ? notices.slice(0, 5)
    : [];

  return (
    <section className="dashboard-card notice-card">
      <div className="card-header-custom">
        <div>
          <h5>Notice Board</h5>
          <small>Latest property and community updates</small>
        </div>

        <Link to="/tenant/notices">
          View All
        </Link>
      </div>

      {visibleNotices.length === 0 ? (
        <div className="notice-empty">
          <i className="bi bi-megaphone" aria-hidden="true" />

          <div>
            <strong>No notices yet</strong>
            <small>New notices will appear here.</small>
          </div>
        </div>
      ) : (
        <div className="notice-list">
          {visibleNotices.map((notice) => {
            const date = notice.created_at
              ? new Date(notice.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )
              : "No date";

            const isComplaint =
              notice.type === "complaint_feedback";

            return (
              <article
                key={`${notice.type}-${notice.id}`}
                className="notice-item"
              >
                <div className="notice-icon">
                  <i
                    className={
                      isComplaint
                        ? "bi bi-chat-left-text"
                        : "bi bi-megaphone"
                    }
                    aria-hidden="true"
                  />
                </div>

                <div className="notice-content">
                  <div className="notice-content-top">
                    <strong>{notice.title}</strong>

                    <span className="notice-tag">
                      {isComplaint ? "Complaint Update" : "Notice"}
                    </span>
                  </div>

                  <p>{notice.content}</p>

                  <div className="notice-meta">
                    <span>
                      <i
                        className="bi bi-calendar3"
                        aria-hidden="true"
                      />
                      {date}
                    </span>

                    {isComplaint && notice.status && (
                      <span>
                        Status:{" "}
                        {notice.status
                          .replace("_", " ")
                          .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase()
                          )}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default NoticeBoard;