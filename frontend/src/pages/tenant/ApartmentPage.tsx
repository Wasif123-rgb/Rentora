import "./Tenant.css";

interface ApartmentInfo {
  propertyName?: string | null;
  block?: string | null;
  flat?: string | null;
  tenantName?: string | null;
  occupancy?: string | null;
  leaseStatus?: string | null;
  monthlyRent?: string | null;
  apartmentDetails?: Array<{
    label: string;
    value: string;
  }>;
  leaseDetails?: Array<{
    label: string;
    value: string;
  }>;
  amenities?: string[];
  management?: {
    name?: string | null;
    office?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
}

interface ApartmentPageProps {
  apartment?: ApartmentInfo | null;
}

function ApartmentPage({ apartment = null }: ApartmentPageProps) {
  const hasApartment = Boolean(apartment);

  const apartmentDetails = apartment?.apartmentDetails ?? [];
  const leaseDetails = apartment?.leaseDetails ?? [];
  const amenities = apartment?.amenities ?? [];
  const management = apartment?.management;

  return (
    <main className="page-dark">
      <div className="tenant-page-shell">
        <section className="tenant-page-hero tenant-property-hero">
          <div className="tenant-property-hero__visual">
            <div className="tenant-property-visual">
              <div className="tenant-property-visual__badge">
                <i
                  className="bi bi-house-door"
                  aria-hidden="true"
                />
                {apartment?.propertyName || "No apartment assigned"}
              </div>

              <div className="tenant-property-visual__icon-wrap">
                <i
                  className="bi bi-building"
                  aria-hidden="true"
                />
              </div>

              <div className="tenant-property-visual__meta">
                <div className="tenant-property-visual__meta-card">
                  <span className="tenant-property-visual__meta-label">
                    Block
                  </span>

                  <strong>
                    {apartment?.block || "Not assigned"}
                  </strong>
                </div>

                <div className="tenant-property-visual__meta-card">
                  <span className="tenant-property-visual__meta-label">
                    Flat / Unit
                  </span>

                  <strong>
                    {apartment?.flat || "Not assigned"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="tenant-property-hero__content">
            <div className="tenant-detail-kicker">
              Apartment Overview
            </div>

            <h2 className="tenant-page-title">
              {apartment?.flat || "No apartment assigned"}
            </h2>

            <div className="tenant-property-line">
              <span className="tenant-property-line__label">
                Property
              </span>

              <strong>
                {apartment?.propertyName ||
                  "No property information available"}
              </strong>
            </div>

            <div className="tenant-property-meta-grid">
              <div>
                <span>Tenant</span>
                <strong>
                  {apartment?.tenantName || "No data yet"}
                </strong>
              </div>

              <div>
                <span>Occupancy</span>
                <strong>
                  {apartment?.occupancy || "No data yet"}
                </strong>
              </div>

              <div>
                <span>Lease Status</span>
                <strong>
                  {apartment?.leaseStatus || "No data yet"}
                </strong>
              </div>

              <div>
                <span>Monthly Rent</span>
                <strong>
                  {apartment?.monthlyRent || "No data yet"}
                </strong>
              </div>
            </div>

            <div className="tenant-property-status-row">
              <span className="status-badge">
                <i
                  className="bi bi-building"
                  aria-hidden="true"
                />

                {hasApartment
                  ? apartment?.occupancy || "No status"
                  : "No apartment assigned"}
              </span>

              <span className="status-badge status-badge--info">
                <i
                  className="bi bi-calendar3"
                  aria-hidden="true"
                />

                {apartment?.leaseStatus ||
                  "No lease information"}
              </span>
            </div>
          </div>
        </section>

        <div className="tenant-two-column-layout">
          <section className="tenant-panel">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Home Details
                </span>
                <h3>Apartment Details</h3>
              </div>
            </div>

            <div className="tenant-info-grid">
              {apartmentDetails.length > 0 ? (
                apartmentDetails.map((item) => (
                  <div
                    key={item.label}
                    className="tenant-info-card"
                  >
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </div>
                ))
              ) : (
                <div className="tenant-info-card">
                  <small>Apartment Details</small>
                  <strong>
                    No apartment details available
                  </strong>
                </div>
              )}
            </div>
          </section>

          <aside className="tenant-panel">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Management
                </span>
                <h3>Property Contact</h3>
              </div>
            </div>

            <div className="tenant-contact-card">
              <div className="tenant-contact-card__header">
                <div className="tenant-avatar tenant-avatar--lg">
                  <i
                    className="bi bi-building"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <strong>
                    {management?.name ||
                      "No management contact available"}
                  </strong>

                  <span>
                    {management?.office ||
                      "No office information"}
                  </span>
                </div>
              </div>

              {management ? (
                <ul className="tenant-contact-list">
                  {management.phone && (
                    <li>
                      <i
                        className="bi bi-telephone"
                        aria-hidden="true"
                      />
                      {management.phone}
                    </li>
                  )}

                  {management.email && (
                    <li>
                      <i
                        className="bi bi-envelope"
                        aria-hidden="true"
                      />
                      {management.email}
                    </li>
                  )}

                  {management.address && (
                    <li>
                      <i
                        className="bi bi-geo-alt"
                        aria-hidden="true"
                      />
                      {management.address}
                    </li>
                  )}
                </ul>
              ) : (
                <p>No contact information available.</p>
              )}

              <div className="tenant-actions-row">
                <button
                  type="button"
                  className="btn btn-rentora btn-rentora--compact"
                  disabled={!hasApartment}
                >
                  View Lease
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-secondary--compact"
                  disabled={!management}
                >
                  Contact Management
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="tenant-two-column-layout">
          <section className="tenant-panel">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Lease
                </span>
                <h3>Lease Information</h3>
              </div>
            </div>

            <div className="tenant-info-grid tenant-info-grid--compact">
              {leaseDetails.length > 0 ? (
                leaseDetails.map((item) => (
                  <div
                    key={item.label}
                    className="tenant-info-card"
                  >
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </div>
                ))
              ) : (
                <div className="tenant-info-card">
                  <small>Lease Information</small>
                  <strong>
                    No lease information available
                  </strong>
                </div>
              )}
            </div>
          </section>

          <section className="tenant-panel">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Amenities
                </span>
                <h3>Property Amenities</h3>
              </div>
            </div>

            <div className="tenant-amenity-list">
              {amenities.length > 0 ? (
                amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="tenant-amenity-chip"
                  >
                    <i
                      className="bi bi-check-circle-fill"
                      aria-hidden="true"
                    />
                    {amenity}
                  </span>
                ))
              ) : (
                <span className="tenant-amenity-chip">
                  No amenities information available
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ApartmentPage;