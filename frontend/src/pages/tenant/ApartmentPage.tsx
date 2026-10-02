import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import {
  assignResidence,
  getAvailableApartments,
  getAvailableFlats,
  type AvailableApartment,
  type AvailableFlat,
} from "../../services/tenantResidenceApi";
import type { TenantDashboardData } from "./TenantDashboard";
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

interface ApiError {
  data?: {
    message?: string;
    errors?: Record<string, string[]>;
  };
}

function errorMessage(error: unknown): string {
  const apiError = error as ApiError;
  const validationMessage = apiError.data?.errors
    ? Object.values(apiError.data.errors)[0]?.[0]
    : null;

  return validationMessage || apiError.data?.message || "Something went wrong. Please try again.";
}

function formatDate(value: string | null): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function ApartmentPage() {
  const [apartment, setApartment] = useState<ApartmentInfo | null>(null);
  const [apartments, setApartments] = useState<AvailableApartment[]>([]);
  const [flats, setFlats] = useState<AvailableFlat[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState("");
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadApartment = useCallback(async () => {
    const dashboard = await apiRequest<TenantDashboardData>("/tenant/dashboard");

    if (!dashboard.apartment || !dashboard.flat) {
      setApartment(null);
      return false;
    }

    const leaseDetails = [
      ["Move-in Date", formatDate(dashboard.tenancy?.move_in_date ?? null)],
      ["Lease Start", formatDate(dashboard.tenancy?.lease_start ?? null)],
      ["Lease End", formatDate(dashboard.tenancy?.lease_end ?? null)],
    ]
      .filter((item): item is [string, string] => Boolean(item[1]))
      .map(([label, value]) => ({ label, value }));

    setApartment({
      propertyName: dashboard.apartment.name,
      block: dashboard.apartment.address,
      flat: `Flat ${dashboard.flat.flat_number}`,
      tenantName: dashboard.tenant.name,
      occupancy: dashboard.flat.status === "occupied" ? "Occupied" : "Vacant",
      leaseStatus: dashboard.tenancy?.lease_start ? "Active" : "Not provided",
      monthlyRent: `৳${Number(dashboard.flat.rent_amount).toLocaleString()}`,
      apartmentDetails: [
        { label: "Property", value: dashboard.apartment.name },
        { label: "Address", value: dashboard.apartment.address },
        { label: "Flat / Unit", value: dashboard.flat.flat_number },
        { label: "Floor", value: String(dashboard.flat.floor) },
      ],
      leaseDetails,
      management: dashboard.manager
        ? {
            name: dashboard.manager.name,
            office: "Property Manager",
            phone: dashboard.manager.phone,
            email: dashboard.manager.email,
            address: dashboard.apartment.address,
          }
        : null,
    });

    return true;
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const hasResidence = await loadApartment();

        if (!hasResidence) {
          const response = await getAvailableApartments();
          setApartments(response.data);
        }
      } catch (loadError) {
        setError(errorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [loadApartment]);

  const handleApartmentChange = async (apartmentId: string) => {
    setSelectedApartmentId(apartmentId);
    setSelectedFlatId("");
    setFlats([]);
    setMessage(null);
    setError(null);

    if (!apartmentId) return;

    try {
      setLoadingFlats(true);
      const response = await getAvailableFlats(Number(apartmentId));
      setFlats(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedApartmentId || !selectedFlatId) return;

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      const response = await assignResidence(
        Number(selectedApartmentId),
        Number(selectedFlatId)
      );
      setMessage(response.message);
      await loadApartment();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const hasApartment = Boolean(apartment);

  const apartmentDetails = apartment?.apartmentDetails ?? [];
  const leaseDetails = apartment?.leaseDetails ?? [];
  const amenities = apartment?.amenities ?? [];
  const management = apartment?.management;

  if (loading) {
    return (
      <main className="page-dark">
        <div className="tenant-page-shell">
          <section className="tenant-panel">
            <p>Loading your apartment...</p>
          </section>
        </div>
      </main>
    );
  }

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

        {!hasApartment && (
          <section className="tenant-panel tenant-panel--form tenant-residence-selector">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">Choose Your Home</span>
                <h3>Select Your Residence</h3>
              </div>
            </div>

            {message && <div className="tenant-success-banner">{message}</div>}
            {error && <div className="tenant-error-banner">{error}</div>}

            {apartments.length === 0 ? (
              <div className="tenant-empty-state tenant-empty-state--wide">
                <i className="bi bi-buildings" aria-hidden="true" />
                <p>No apartments are currently available from your property manager.</p>
              </div>
            ) : (
              <form className="tenant-form" onSubmit={handleSubmit}>
                <div className="tenant-form__grid">
                  <label className="tenant-field">
                    <span>Apartment</span>
                    <select
                      value={selectedApartmentId}
                      onChange={(event) => void handleApartmentChange(event.target.value)}
                      disabled={submitting}
                    >
                      <option value="">Select Apartment</option>
                      {apartments.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {item.address}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="tenant-field">
                    <span>Flat / Unit</span>
                    <select
                      value={selectedFlatId}
                      onChange={(event) => setSelectedFlatId(event.target.value)}
                      disabled={!selectedApartmentId || loadingFlats || submitting}
                    >
                      <option value="">
                        {loadingFlats ? "Loading vacant flats..." : "Select Flat"}
                      </option>
                      {flats.map((flat) => (
                        <option key={flat.id} value={flat.id}>
                          {flat.flat_number} — Floor {flat.floor} — ৳{Number(flat.rent_amount).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedApartmentId && !loadingFlats && flats.length === 0 && (
                  <p className="tenant-form__help">
                    No vacant flats are currently available in this apartment.
                  </p>
                )}

                <div className="tenant-actions-row">
                  <button
                    type="submit"
                    className="btn btn-rentora"
                    disabled={!selectedFlatId || submitting}
                  >
                    {submitting ? "Confirming..." : "Confirm Residence"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

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
