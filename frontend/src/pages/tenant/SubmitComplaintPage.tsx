import { useState } from "react";
import "./Tenant.css";
import { apiRequest } from "../../services/api";

type FormState = {
  subject: string;
  category: string;
  priority: string;
  description: string;
  unit: string;
  contactMethod: string;
};

interface SubmitComplaintPageProps {
  unit?: string | null;
  expectedResponse?: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
}

interface ComplaintResponse {
  success: boolean;
  message: string;
  complaint?: {
    id: number;
    tenant_id: number | null;
    submitted_by: number;
    title: string;
    description: string;
    status: string;
  };
}

function SubmitComplaintPage({
  unit = null,
  expectedResponse = null,
  supportPhone = null,
  supportEmail = null,
}: SubmitComplaintPageProps) {
  const [form, setForm] = useState<FormState>({
    subject: "",
    category: "Maintenance",
    priority: "Normal",
    description: "",
    unit: unit || "",
    contactMethod: "Email",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setIsSubmitted(false);
    setSubmitError(null);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.subject.trim()) {
      nextErrors.subject = "Please enter a complaint title.";
    }

    if (!form.description.trim()) {
      nextErrors.description =
        "Please provide a brief description of the issue.";
    }

    if (!form.unit.trim()) {
      nextErrors.unit = "Please confirm your unit.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setIsSubmitted(false);
      return;
    }

    try {
      setErrors({});
      setSubmitError(null);
      setIsSubmitted(false);
      setIsSubmitting(true);

      const response = await apiRequest<ComplaintResponse>(
        "/tenant/complaints",
        {
          method: "POST",
          body: JSON.stringify({
            title: form.subject.trim(),
            apartment_unit: form.unit.trim(),
            category: form.category,
            priority: form.priority,
            description: form.description.trim(),
            preferred_contact_method: form.contactMethod,
          }),
        }
      );

      if (response.success) {
        setIsSubmitted(true);

        setForm({
          subject: "",
          category: "Maintenance",
          priority: "Normal",
          description: "",
          unit: unit || "",
          contactMethod: "Email",
        });
      } else {
        setSubmitError(
          response.message || "Failed to submit complaint."
        );
      }
    } catch (error: any) {
      console.error("Complaint submission error:", error);

      const message =
        error?.data?.message ||
        "Unable to submit complaint. Please try again.";

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-dark">
      <div className="tenant-page-shell tenant-page-shell--narrow">
        <div className="tenant-two-column-layout tenant-two-column-layout--complaint">
          <section className="tenant-panel tenant-panel--form">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Report Issue
                </span>
                <h3>Submit Complaint</h3>
              </div>
            </div>

            <form
              className="tenant-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="tenant-form__grid">
                <label className="tenant-field">
                  <span>Complaint subject</span>

                  <input
                    type="text"
                    value={form.subject}
                    onChange={(event) =>
                      handleChange("subject", event.target.value)
                    }
                    placeholder="Enter complaint title"
                    className={errors.subject ? "has-error" : ""}
                  />

                  {errors.subject && (
                    <small className="tenant-field__error">
                      {errors.subject}
                    </small>
                  )}
                </label>

                <label className="tenant-field">
                  <span>Apartment / Unit</span>

                  <input
                    type="text"
                    value={form.unit}
                    onChange={(event) =>
                      handleChange("unit", event.target.value)
                    }
                    placeholder="Enter your apartment / unit"
                    className={errors.unit ? "has-error" : ""}
                  />

                  {errors.unit && (
                    <small className="tenant-field__error">
                      {errors.unit}
                    </small>
                  )}
                </label>

                <label className="tenant-field">
                  <span>Category</span>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      handleChange("category", event.target.value)
                    }
                  >
                    <option>Plumbing</option>
                    <option>Electrical</option>
                    <option>Maintenance</option>
                    <option>Security</option>
                    <option>Cleaning</option>
                    <option>Noise</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="tenant-field">
                  <span>Priority</span>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      handleChange("priority", event.target.value)
                    }
                  >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </label>
              </div>

              <label className="tenant-field">
                <span>Detailed description</span>

                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  placeholder="Describe the issue, when it started, and any relevant details."
                  className={errors.description ? "has-error" : ""}
                />

                {errors.description && (
                  <small className="tenant-field__error">
                    {errors.description}
                  </small>
                )}
              </label>

              <label className="tenant-field">
                <span>Preferred contact method</span>

                <select
                  value={form.contactMethod}
                  onChange={(event) =>
                    handleChange("contactMethod", event.target.value)
                  }
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                </select>
              </label>

              <div className="tenant-upload-box">
                <div className="tenant-upload-box__content">
                  <div className="tenant-upload-box__icon">
                    <i
                      className="bi bi-cloud-upload"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <strong>Upload photos or documents</strong>
                    <p>
                      Drag and drop files here or browse from your
                      device.
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  multiple
                  aria-label="Upload complaint attachments"
                />
              </div>

              <div className="tenant-form__help">
                Please include the exact location, frequency, and any
                safety concerns so the team can respond quickly.
              </div>

              {isSubmitted && (
                <div className="tenant-success-banner">
                  <i
                    className="bi bi-check-circle-fill"
                    aria-hidden="true"
                  />

                  <span>
                    <strong>Complaint submitted successfully.</strong>{" "}
                    The management team will review it shortly.
                  </span>
                </div>
              )}

              {submitError && (
                <div className="tenant-error-banner">
                  <i
                    className="bi bi-exclamation-circle-fill"
                    aria-hidden="true"
                  />

                  <span>{submitError}</span>
                </div>
              )}

              <div className="tenant-actions-row tenant-actions-row--align-end">
                <button
                  type="button"
                  className="btn btn-secondary btn-secondary--compact"
                  disabled={isSubmitting}
                >
                  Save Draft
                </button>

                <button
                  type="submit"
                  className="btn btn-rentora btn-rentora--compact"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Submitting...
                    </>
                  ) : (
                    "Submit Complaint"
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="tenant-panel tenant-panel--support">
            <div className="tenant-panel__header">
              <div>
                <span className="tenant-panel__eyebrow">
                  Support
                </span>
                <h3>Need urgent help?</h3>
              </div>
            </div>

            <div className="tenant-support-card">
              <div className="tenant-support-card__block">
                <span className="tenant-support-card__label">
                  Expected response
                </span>

                <strong>
                  {expectedResponse ||
                    "No response-time information available"}
                </strong>
              </div>

              <div className="tenant-support-card__block">
                <span className="tenant-support-card__label">
                  Emergency guidance
                </span>

                <strong>
                  For urgent safety issues, contact property management
                  or the appropriate emergency service.
                </strong>
              </div>

              <div className="tenant-support-card__block">
                <span className="tenant-support-card__label">
                  Contact
                </span>

                {supportPhone || supportEmail ? (
                  <>
                    {supportPhone && <strong>{supportPhone}</strong>}
                    {supportEmail && <small>{supportEmail}</small>}
                  </>
                ) : (
                  <strong>No support contact available</strong>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default SubmitComplaintPage;
