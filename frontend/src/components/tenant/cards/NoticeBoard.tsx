import { Link } from "react-router-dom";

interface TenantNotice {
  id: number;
  type: "notice" | "complaint_feedback";
  title: string;
  preview: string;
  date: string;
  icon: string;
  status?: string | null;
}

interface NoticeBoardProps {
  notices?: TenantNotice[];
}

function NoticeBoard({
  notices = [],
}: NoticeBoardProps) {
  return (
    <div className="dashboard-card notice-card">
      <div className="card-header-custom">
        <h5>Notice Board</h5>

        <Link to="/tenant/notices">
          View All
        </Link>
      </div>

      <div className="notice-list">
        {notices.length > 0 ? (
          notices.map((notice) => (
            <div
              key={`${notice.type}-${notice.id}`}
              className="notice-item"
            >
              <div className="notice-text">
                <strong>{notice.title}</strong>

                <small>
                  {notice.preview}
                </small>

                {notice.status && (
                  <small>
                    Status: {notice.status}
                  </small>
                )}
              </div>

              <div className="notice-tag">
                <i className={`bi ${notice.icon}`}></i>

                <span>{notice.date}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="notice-item">
            <div className="notice-text">
              <strong>No notices yet</strong>

              <small>
                New notices will appear here.
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoticeBoard;
