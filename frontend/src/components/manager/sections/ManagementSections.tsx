import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import type {
  Apartment,
  ApartmentFormValues,
  Complaint,
  ComplaintResponseValues,
  Flat,
  FlatFormValues,
  Notice,
  NoticeFormValues,
  RecordId,
  RentPayment,
  RentPaymentFormValues,
  Tenant,
  TenantFormValues,
  UtilityBill,
  UtilityBillFormValues,
} from '../../../types/managerRecords';

import ManagerSectionHeader from '../ManagerSectionHeader';
import StatusBadge from '../StatusBadge';

import {
  DetailDrawer,
  EmptyState,
  Feedback,
  FilterSelect,
  ModuleToolbar,
} from '../ManagerModuleElements';

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

const matches = (
  values: readonly string[],
  search: string
) => {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) =>
    value.toLowerCase().includes(normalizedSearch)
  );
};

const displayValue = (
  value: unknown,
  fallback = '—'
): string => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return fallback;
  }

  return String(value);
};

const tenantName = (tenant: Tenant): string =>
  tenant.user?.name ?? `Tenant #${tenant.id}`;

const complaintSubmitterName = (complaint: Complaint): string =>
  complaint.submitter?.name ??
  (complaint.tenant ? tenantName(complaint.tenant) : 'Unknown tenant');

const tenantEmail = (tenant: Tenant): string =>
  tenant.user?.email ?? '';

const tenantPhone = (tenant: Tenant): string =>
  tenant.user?.phone ?? '';

const flatNumber = (tenant: Tenant): string =>
  tenant.flat?.flat_number ?? '—';

const apartmentName = (tenant: Tenant): string =>
  tenant.flat?.apartment?.name ?? '—';

const apartmentForFlat = (
  flat: Flat,
  apartments: Apartment[]
): string => {
  return (
    flat.apartment?.name ??
    apartments.find(
      (apartment) =>
        String(apartment.id) ===
        String(flat.apartment_id)
    )?.name ??
    '—'
  );
};

/* -------------------------------------------------------------------------- */
/* Shared modal                                                               */
/* -------------------------------------------------------------------------- */

function FormModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="manager-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="manager-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-modal-title"
      >
        <div className="manager-modal__header">
          <h2 id="manager-modal-title">
            {title}
          </h2>

          <button
            type="button"
            className="manager-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="manager-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormActions({
  submitting,
  onCancel,
  submitLabel,
}: {
  submitting: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="manager-form-actions">
      <button
        type="button"
        className="manager-secondary-button"
        onClick={onCancel}
        disabled={submitting}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="manager-primary-button"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <i className="bi bi-arrow-repeat" />
            Saving...
          </>
        ) : (
          <>
            <i className="bi bi-check-lg" />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="manager-form-field">
      <span>
        {label}
        {required ? ' *' : ''}
      </span>

      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Apartments                                                                 */
/* -------------------------------------------------------------------------- */

type ApartmentsSectionProps = {
  apartments: Apartment[];

  onCreate: (
    values: ApartmentFormValues
  ) => void | Promise<void>;

  onUpdate: (
    id: RecordId,
    values: ApartmentFormValues
  ) => void | Promise<void>;

  onDelete: (
    id: RecordId
  ) => void | Promise<void>;

  submitting?: boolean;
  apiError?: string | null;
  successMessage?: string | null;
};

export function ApartmentsSection({
  apartments,
  onCreate,
  onUpdate,
  onDelete,
  submitting = false,
  apiError,
  successMessage,
}: ApartmentsSectionProps) {
  const [search, setSearch] = useState('');

  const [selected, setSelected] =
    useState<Apartment | null>(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Apartment | null>(null);

  const [form, setForm] =
    useState<ApartmentFormValues>({
      name: '',
      address: '',
    });

  const [formError, setFormError] =
    useState('');

  const records = useMemo(() => {
    return apartments.filter((item) =>
      matches(
        [
          item.name,
          item.address,
          String(item.id),
        ],
        search
      )
    );
  }, [apartments, search]);

  const openCreate = () => {
    setEditing(null);

    setForm({
      name: '',
      address: '',
    });

    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (
    apartment: Apartment
  ) => {
    setEditing(apartment);

    setForm({
      name: apartment.name ?? '',
      address: apartment.address ?? '',
    });

    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setFormError('');
  };

  const submitForm = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError(
        'Apartment name is required.'
      );
      return;
    }

    if (!form.address.trim()) {
      setFormError(
        'Apartment address is required.'
      );
      return;
    }

    setFormError('');

    try {
      if (editing) {
        await onUpdate(
          editing.id,
          form
        );
      } else {
        await onCreate(form);
      }

      closeForm();
    } catch {
      setFormError(
        'Unable to save apartment.'
      );
    }
  };

  const deleteApartment = async (
    apartment: Apartment
  ) => {
    const confirmed = window.confirm(
      `Delete "${apartment.name}"?`
    );

    if (!confirmed) {
      return;
    }

    await onDelete(apartment.id);

    if (
      selected &&
      String(selected.id) ===
        String(apartment.id)
    ) {
      setSelected(null);
    }
  };

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Portfolio"
        title="Apartment Management"
        description="Manage buildings and their flat capacity."
        actionLabel="Add Apartment"
        actionIcon="bi-building-add"
        onAction={openCreate}
      />

      <Feedback
        message={
          successMessage ??
          apiError ??
          ''
        }
      />

      <ModuleToolbar
        search={search}
        onSearch={setSearch}
        searchLabel="Search apartments"
      />

      {records.length ? (
        <div className="manager-property-grid">
          {records.map((item) => {
            const totalFlats =
              item.total_flats ??
              item.flats?.length ??
              0;

            const occupiedFlats =
              item.occupied_flats ??
              item.flats?.filter(
                (flat) =>
                  flat.status === 'occupied'
              ).length ??
              0;

            const vacantFlats =
              item.vacant_flats ??
              Math.max(
                totalFlats -
                  occupiedFlats,
                0
              );

            return (
              <article
                className="manager-property-card"
                key={item.id}
              >
                <div className="manager-property-card__visual">
                  <i className="bi bi-building" />
                </div>

                <div className="manager-property-card__body">
                  <span>
                    {item.address}
                  </span>

                  <h2>{item.name}</h2>

                  <div className="manager-property-metrics">
                    <div>
                      <strong>
                        {totalFlats}
                      </strong>

                      <small>
                        Total flats
                      </small>
                    </div>

                    <div>
                      <strong>
                        {occupiedFlats}
                      </strong>

                      <small>
                        Occupied
                      </small>
                    </div>

                    <div>
                      <strong>
                        {vacantFlats}
                      </strong>

                      <small>
                        Vacant
                      </small>
                    </div>
                  </div>

                  <p>
                    <i className="bi bi-building" />{' '}
                    {item.address}
                  </p>

                  <div className="manager-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(item)
                      }
                    >
                      View property{' '}
                      <i className="bi bi-arrow-right" />
                    </button>

                    <button
                      type="button"
                      className="manager-secondary-button"
                      onClick={() =>
                        openEdit(item)
                      }
                    >
                      <i className="bi bi-pencil" />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="manager-danger-button"
                      onClick={() =>
                        deleteApartment(item)
                      }
                    >
                      <i className="bi bi-trash" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No apartments found"
          description="No apartments returned from Laravel."
        />
      )}

      <DetailDrawer
        open={Boolean(selected)}
        title={selected?.name ?? ''}
        subtitle={
          selected?.address ?? ''
        }
        onClose={() =>
          setSelected(null)
        }
      >
        {selected && (
          <div className="manager-detail-grid">
            <div>
              <span>Total flats</span>

              <strong>
                {selected.total_flats ??
                  selected.flats?.length ??
                  0}
              </strong>
            </div>

            <div>
              <span>Occupied</span>

              <strong>
                {selected.occupied_flats ??
                  selected.flats?.filter(
                    (flat) =>
                      flat.status ===
                      'occupied'
                  ).length ??
                  0}
              </strong>
            </div>

            <div>
              <span>Vacant</span>

              <strong>
                {selected.vacant_flats ??
                  selected.flats?.filter(
                    (flat) =>
                      flat.status ===
                      'vacant'
                  ).length ??
                  0}
              </strong>
            </div>

            <div>
              <span>Manager ID</span>

              <strong>
                {displayValue(
                  selected.manager_id
                )}
              </strong>
            </div>

            <div className="manager-detail-grid__wide">
              <span>Address</span>

              <strong>
                {selected.address}
              </strong>
            </div>
          </div>
        )}
      </DetailDrawer>

      <FormModal
        open={formOpen}
        title={
          editing
            ? 'Edit Apartment'
            : 'Add Apartment'
        }
        onClose={closeForm}
      >
        <form onSubmit={submitForm}>
          {formError && (
            <div className="manager-form-error">
              {formError}
            </div>
          )}

          <Field
            label="Apartment name"
            required
          >
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="Apartment name"
            />
          </Field>

          <Field
            label="Address"
            required
          >
            <textarea
              value={form.address}
              onChange={(event) =>
                setForm({
                  ...form,
                  address:
                    event.target.value,
                })
              }
              placeholder="Apartment address"
              rows={4}
            />
          </Field>

          <FormActions
            submitting={submitting}
            onCancel={closeForm}
            submitLabel={
              editing
                ? 'Update Apartment'
                : 'Create Apartment'
            }
          />
        </form>
      </FormModal>

      {submitting && (
        <div className="manager-loading">
          Saving apartment...
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Flats                                                                      */
/* -------------------------------------------------------------------------- */

type FlatsSectionProps = {
  flats: Flat[];
  apartments: Apartment[];

  onCreate: (
    values: FlatFormValues
  ) => void | Promise<void>;

  onUpdate: (
    id: RecordId,
    values: FlatFormValues
  ) => void | Promise<void>;

  onDelete: (
    id: RecordId
  ) => void | Promise<void>;

  submitting?: boolean;
  apiError?: string | null;
  successMessage?: string | null;
};

export function FlatsSection({
  flats,
  apartments,
  onCreate,
  onUpdate,
  onDelete,
  submitting = false,
  apiError,
  successMessage,
}: FlatsSectionProps) {
  const [search, setSearch] =
    useState('');

  const [occupancy, setOccupancy] =
    useState('All occupancy');

  const [property, setProperty] =
    useState('All apartments');

  const [formOpen, setFormOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Flat | null>(null);

  const [formError, setFormError] =
    useState('');

  const [values, setValues] =
    useState<FlatFormValues>({
      apartment_id: '',
      flat_number: '',
      floor: '',
      rent_amount: '',
      status: 'vacant',
    });

  const properties = useMemo(
    () => [
      'All apartments',
      ...Array.from(
        new Set(
          apartments.map(
            (item) => item.name
          )
        )
      ),
    ],
    [apartments]
  );

  const records = useMemo(() => {
    return flats.filter((item) => {
      const propertyName =
        apartmentForFlat(
          item,
          apartments
        );

      const searchMatches = matches(
        [
          item.flat_number,
          String(item.floor),
          propertyName,
          item.tenant
            ? tenantName(
                item.tenant
              )
            : '',
          item.tenant
            ? tenantEmail(
                item.tenant
              )
            : '',
        ],
        search
      );

      const occupancyMatches =
        occupancy ===
          'All occupancy' ||
        item.status ===
          occupancy.toLowerCase();

      const propertyMatches =
        property ===
          'All apartments' ||
        propertyName === property;

      return (
        searchMatches &&
        occupancyMatches &&
        propertyMatches
      );
    });
  }, [
    flats,
    apartments,
    search,
    occupancy,
    property,
  ]);

  const openCreate = () => {
    setEditing(null);

    setValues({
      apartment_id: '',
      flat_number: '',
      floor: '',
      rent_amount: '',
      status: 'vacant',
    });

    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (
    flat: Flat
  ) => {
    setEditing(flat);

    setValues({
      apartment_id:
        flat.apartment_id ?? '',

      flat_number:
        flat.flat_number ?? '',

      floor:
        flat.floor ?? '',

      rent_amount:
        flat.rent_amount ?? '',

      status:
        flat.status ?? 'vacant',
    });

    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setFormError('');
  };

  const submitFlat = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      values.apartment_id === ''
    ) {
      setFormError(
        'Choose an apartment.'
      );
      return;
    }

    if (
      !String(
        values.flat_number
      ).trim()
    ) {
      setFormError(
        'Flat/unit number is required.'
      );
      return;
    }

    if (
      values.floor === '' ||
      Number(values.floor) < 0
    ) {
      setFormError(
        'Floor is required.'
      );
      return;
    }

    if (
      values.rent_amount === '' ||
      Number(values.rent_amount) < 0
    ) {
      setFormError(
        'Rent amount is required and cannot be negative.'
      );
      return;
    }

    setFormError('');

    try {
      if (editing) {
        await onUpdate(
          editing.id,
          values
        );
      } else {
        await onCreate(values);
      }

      closeForm();
    } catch {
      setFormError(
        'Unable to save flat.'
      );
    }
  };

  const deleteFlat = async (
    flat: Flat
  ) => {
    const confirmed = window.confirm(
      `Delete flat "${flat.flat_number}"?`
    );

    if (!confirmed) {
      return;
    }

    await onDelete(flat.id);
  };

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Inventory"
        title="Flat Management"
        description="Track unit availability, residents, and rent."
        actionLabel="Add Flat"
        actionIcon="bi-plus-square"
        onAction={openCreate}
      />

      <Feedback
        message={
          successMessage ??
          apiError ??
          ''
        }
      />

      <ModuleToolbar
        search={search}
        onSearch={setSearch}
        searchLabel="Search flats"
      >
        <FilterSelect
          label="Occupancy"
          value={occupancy}
          options={[
            'All occupancy',
            'Occupied',
            'Vacant',
          ]}
          onChange={setOccupancy}
        />

        <FilterSelect
          label="Apartment"
          value={property}
          options={properties}
          onChange={setProperty}
        />
      </ModuleToolbar>

      <DataTable
        headers={[
          'Flat',
          'Apartment',
          'Floor',
          'Tenant',
          'Monthly rent',
          'Status',
          'Actions',
        ]}
      >
        {records.map((item) => (
          <tr key={item.id}>
            <td className="manager-table__primary">
              {item.flat_number}
            </td>

            <td>
              {apartmentForFlat(
                item,
                apartments
              )}
            </td>

            <td>
              {item.floor}
            </td>

            <td>
              {item.tenant
                ? tenantName(
                    item.tenant
                  )
                : 'Vacant'}
            </td>

            <td>
              {item.rent_amount}
            </td>

            <td>
              <StatusBadge
                value={item.status}
              />
            </td>

            <td>
              <div className="manager-table-actions">
                <button
                  type="button"
                  className="manager-text-button"
                  onClick={() =>
                    openEdit(item)
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="manager-text-button manager-danger-text"
                  onClick={() =>
                    deleteFlat(item)
                  }
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {!records.length && (
        <EmptyState
          title="No flats found"
          description="No flats returned from Laravel."
        />
      )}

      <FormModal
        open={formOpen}
        title={
          editing
            ? 'Edit Flat'
            : 'Add Flat'
        }
        onClose={closeForm}
      >
        <form
          onSubmit={submitFlat}
        >
          {formError && (
            <div className="manager-form-error">
              {formError}
            </div>
          )}

          <Field
            label="Parent apartment"
            required
          >
            <select
              value={String(
                values.apartment_id
              )}
              onChange={(event) =>
                setValues({
                  ...values,
                  apartment_id:
                    event.target.value,
                })
              }
            >
              <option value="">
                Choose apartment
              </option>

              {apartments.map(
                (apartment) => (
                  <option
                    key={apartment.id}
                    value={
                      apartment.id
                    }
                  >
                    {apartment.name}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field
            label="Flat number"
            required
          >
            <input
              type="text"
              value={
                values.flat_number
              }
              onChange={(event) =>
                setValues({
                  ...values,
                  flat_number:
                    event.target.value,
                })
              }
              placeholder="A-101"
            />
          </Field>

          <Field
            label="Floor"
            required
          >
            <input
              type="number"
              value={String(
                values.floor
              )}
              onChange={(event) =>
                setValues({
                  ...values,
                  floor:
                    event.target.value ===
                    ''
                      ? ''
                      : Number(
                          event.target
                            .value
                        ),
                })
              }
            />
          </Field>

          <Field
            label="Monthly rent"
            required
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={String(
                values.rent_amount
              )}
              onChange={(event) =>
                setValues({
                  ...values,
                  rent_amount:
                    event.target.value ===
                    ''
                      ? ''
                      : Number(
                          event.target
                            .value
                        ),
                })
              }
            />
          </Field>

          <Field
            label="Status"
            required
          >
            <select
              value={values.status}
              onChange={(event) =>
                setValues({
                  ...values,
                  status:
                    event.target
                      .value as Flat['status'],
                })
              }
            >
              <option value="vacant">
                Vacant
              </option>

              <option value="occupied">
                Occupied
              </option>
            </select>
          </Field>

          <FormActions
            submitting={submitting}
            onCancel={closeForm}
            submitLabel={
              editing
                ? 'Update Flat'
                : 'Create Flat'
            }
          />
        </form>
      </FormModal>

      {submitting && (
        <div className="manager-loading">
          Saving flat...
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tenants                                                                    */
/* -------------------------------------------------------------------------- */

type TenantsSectionProps = {
  tenants: Tenant[];

  onCreate?: (
    values: TenantFormValues
  ) => void | Promise<void>;

  onUpdate?: (
    id: RecordId,
    values: TenantFormValues
  ) => void | Promise<void>;

  onDelete?: (
    id: RecordId
  ) => void | Promise<void>;

  submitting?: boolean;
};

export function TenantsSection({
  tenants,
  onCreate,
  onUpdate,
  onDelete,
  submitting = false,
}: TenantsSectionProps) {
  const [search, setSearch] =
    useState('');

  const [selected, setSelected] =
    useState<Tenant | null>(null);

  const records = useMemo(() => {
    return tenants.filter((item) =>
      matches(
        [
          tenantName(item),
          tenantEmail(item),
          tenantPhone(item),
          flatNumber(item),
          apartmentName(item),
          item.lease_start,
          item.lease_end,
        ],
        search
      )
    );
  }, [tenants, search]);

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Residents"
        title="Tenant Management"
        description="Manage residents, flats, and lease information."
        actionLabel="Add Tenant"
        actionIcon="bi-person-plus"
        onAction={() => {
          if (onCreate) {
            window.alert(
              'Connect the Tenant form to onCreate.'
            );
          }
        }}
      />

      <ModuleToolbar
        search={search}
        onSearch={setSearch}
        searchLabel="Search tenants"
      />

      <DataTable
        headers={[
          'Tenant',
          'Residence',
          'Contact',
          'Move in',
          'Lease period',
          'Account',
          '',
        ]}
      >
        {records.map((item) => (
          <tr key={item.id}>
            <td>
              <div className="manager-person">
                <span>
                  {tenantName(item)
                    .split(' ')
                    .map(
                      (part) =>
                        part[0]
                    )
                    .join('')
                    .toUpperCase()}
                </span>

                <strong>
                  {tenantName(item)}
                </strong>
              </div>
            </td>

            <td>
              <strong>
                {flatNumber(item)}
              </strong>

              <small>
                {apartmentName(item)}
              </small>
            </td>

            <td>
              {tenantPhone(item) ||
                tenantEmail(item) ||
                '—'}
            </td>

            <td>
              {item.move_in_date}
            </td>

            <td>
              {item.lease_start}
              {' → '}
              {item.lease_end}
            </td>

            <td>
              <StatusBadge value="active" />
            </td>

            <td>
              <button
                className="manager-text-button"
                type="button"
                onClick={() =>
                  setSelected(item)
                }
              >
                View details
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {!records.length && (
        <EmptyState
          title="No tenants found"
          description="No tenants returned from Laravel."
        />
      )}

      <DetailDrawer
        open={Boolean(selected)}
        title={
          selected
            ? tenantName(selected)
            : ''
        }
        subtitle={
          selected
            ? `${apartmentName(selected)} · ${flatNumber(selected)}`
            : ''
        }
        onClose={() =>
          setSelected(null)
        }
      >
        {selected && (
          <div className="manager-detail-grid">
            <div>
              <span>Email</span>

              <strong>
                {tenantEmail(
                  selected
                ) || '—'}
              </strong>
            </div>

            <div>
              <span>Phone</span>

              <strong>
                {tenantPhone(
                  selected
                ) || '—'}
              </strong>
            </div>

            <div>
              <span>Move in</span>

              <strong>
                {selected.move_in_date}
              </strong>
            </div>

            <div>
              <span>Flat</span>

              <strong>
                {flatNumber(selected)}
              </strong>
            </div>

            <div>
              <span>Lease start</span>

              <strong>
                {selected.lease_start}
              </strong>
            </div>

            <div>
              <span>Lease end</span>

              <strong>
                {selected.lease_end}
              </strong>
            </div>
          </div>
        )}
      </DetailDrawer>

      {submitting && (
        <div className="manager-loading">
          Saving tenant...
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Rent payments                                                              */
/* -------------------------------------------------------------------------- */

type RentSectionProps = {
  payments: RentPayment[];

  onCreate?: (
    values: RentPaymentFormValues
  ) => void | Promise<void>;

  onUpdate?: (
    id: RecordId,
    values: RentPaymentFormValues
  ) => void | Promise<void>;

  onDelete?: (
    id: RecordId
  ) => void | Promise<void>;
};

export function RentSection({
  payments,
}: RentSectionProps) {
  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All statuses');

  const records = useMemo(() => {
    return payments.filter((item) => {
      const tenant = item.tenant
        ? tenantName(item.tenant)
        : '';

      const paymentMatches =
        matches(
          [
            tenant,
            String(item.tenant_id),
            String(item.amount),
            item.payment_date,
            item.status,
          ],
          search
        );

      const statusMatches =
        status === 'All statuses' ||
        item.status === status;

      return (
        paymentMatches &&
        statusMatches
      );
    });
  }, [payments, search, status]);

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Finance"
        title="Rent Collection"
        description="Track rent payments and payment status."
        actionLabel="Record Payment"
        actionIcon="bi-receipt"
        onAction={() =>
          window.alert(
            'Connect the rent payment form here.'
          )
        }
      />

      <ModuleToolbar
        search={search}
        onSearch={setSearch}
        searchLabel="Search payments"
      >
        <FilterSelect
          label="Payment status"
          value={status}
          options={[
            'All statuses',
            'paid',
            'pending',
          ]}
          onChange={setStatus}
        />
      </ModuleToolbar>

      <DataTable
        headers={[
          'Tenant',
          'Amount',
          'Payment date',
          'Status',
        ]}
      >
        {records.map((item) => (
          <tr key={item.id}>
            <td className="manager-table__primary">
              {item.tenant
                ? tenantName(
                    item.tenant
                  )
                : `Tenant #${item.tenant_id}`}
            </td>

            <td>{item.amount}</td>

            <td>
              {item.payment_date}
            </td>

            <td>
              <StatusBadge
                value={item.status}
              />
            </td>
          </tr>
        ))}
      </DataTable>

      {!records.length && (
        <EmptyState
          title="No rent payments found"
          description="No rent payments returned from Laravel."
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

type UtilitiesSectionProps = {
  utilityBills: UtilityBill[];
  tenants: Tenant[];

  onCreate: (
    values: UtilityBillFormValues
  ) => void | Promise<void>;

  submitting?: boolean;
  apiError?: string | null;
  successMessage?: string | null;
};

export function UtilitiesSection({
  utilityBills,
  tenants,
  onCreate,
  submitting = false,
  apiError,
  successMessage,
}: UtilitiesSectionProps) {
  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All statuses');

  const [formOpen, setFormOpen] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const [values, setValues] =
    useState<UtilityBillFormValues>({
      tenant_id: '',
      type: '',
      amount: '',
      billing_month: '',
      status: 'unpaid',
    });

  const records = useMemo(() => {
    return utilityBills.filter((item) => {
      const tenant = item.tenant
        ? tenantName(item.tenant)
        : '';

      const searchMatches =
        matches(
          [
            tenant,
            String(item.tenant_id),
            item.type,
            item.billing_month,
            String(item.amount),
          ],
          search
        );

      const statusMatches =
        status === 'All statuses' ||
        item.status === status;

      return (
        searchMatches &&
        statusMatches
      );
    });
  }, [
    utilityBills,
    search,
    status,
  ]);

  const openCreate = () => {
    setValues({
      tenant_id: '',
      type: '',
      amount: '',
      billing_month: '',
      status: 'unpaid',
    });

    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setFormError('');
  };

  const submitForm = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (values.tenant_id === '') {
      setFormError('Choose a tenant.');
      return;
    }

    if (!String(values.type).trim()) {
      setFormError('Utility type is required.');
      return;
    }

    if (
      values.amount === '' ||
      Number(values.amount) < 0
    ) {
      setFormError(
        'Amount is required and cannot be negative.'
      );
      return;
    }

    if (!String(values.billing_month).trim()) {
      setFormError('Billing month is required.');
      return;
    }

    setFormError('');

    try {
      await onCreate(values);
      closeForm();
    } catch {
      setFormError('Unable to create utility bill.');
    }
  };

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Billing"
        title="Utility Bill Management"
        description="Create and review utility charges for your tenants."
        actionLabel="Record Utility Bill"
        actionIcon="bi-plus-circle"
        onAction={openCreate}
      />

      <Feedback
        message={
          successMessage ??
          apiError ??
          ''
        }
      />

      <ModuleToolbar
        search={search}
        onSearch={setSearch}
        searchLabel="Search utility bills"
      >
        <FilterSelect
          label="Billing status"
          value={status}
          options={[
            'All statuses',
            'paid',
            'unpaid',
          ]}
          onChange={setStatus}
        />
      </ModuleToolbar>

      <DataTable
        headers={[
          'Tenant',
          'Type',
          'Amount',
          'Billing month',
          'Status',
        ]}
      >
        {records.map((item) => (
          <tr key={item.id}>
            <td>
              {item.tenant
                ? tenantName(item.tenant)
                : `Tenant #${item.tenant_id}`}
            </td>

            <td>{item.type}</td>

            <td>{item.amount}</td>

            <td>
              {item.billing_month}
            </td>

            <td>
              <StatusBadge
                value={item.status}
              />
            </td>
          </tr>
        ))}
      </DataTable>

      {!records.length && (
        <EmptyState
          title="No utility bills found"
          description="No utility bills returned from Laravel."
        />
      )}

      <FormModal
        open={formOpen}
        title="Record Utility Bill"
        onClose={closeForm}
      >
        <form onSubmit={submitForm}>
          {formError && (
            <div className="manager-form-error">
              {formError}
            </div>
          )}

          <Field label="Tenant" required>
            <select
              value={String(values.tenant_id)}
              onChange={(event) =>
                setValues({
                  ...values,
                  tenant_id:
                    event.target.value,
                })
              }
            >
              <option value="">
                Choose tenant
              </option>

              {tenants.map((tenant) => (
                <option
                  key={tenant.id}
                  value={tenant.id}
                >
                  {tenantName(tenant)}
                  {tenant.flat?.flat_number
                    ? ` — Flat ${tenant.flat.flat_number}`
                    : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Utility type" required>
            <input
              type="text"
              value={String(values.type)}
              onChange={(event) =>
                setValues({
                  ...values,
                  type: event.target.value,
                })
              }
              placeholder="Electricity"
            />
          </Field>

          <Field label="Amount" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={String(values.amount)}
              onChange={(event) =>
                setValues({
                  ...values,
                  amount:
                    event.target.value === ''
                      ? ''
                      : Number(event.target.value),
                })
              }
              placeholder="0.00"
            />
          </Field>

          <Field label="Billing month" required>
            <input
              type="month"
              value={String(values.billing_month)}
              onChange={(event) =>
                setValues({
                  ...values,
                  billing_month: event.target.value,
                })
              }
            />
          </Field>

          <Field label="Status" required>
            <select
              value={values.status}
              onChange={(event) =>
                setValues({
                  ...values,
                  status:
                    event.target.value as UtilityBillFormValues['status'],
                })
              }
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </Field>

          <FormActions
            submitting={submitting}
            onCancel={closeForm}
            submitLabel="Create Utility Bill"
          />
        </form>
      </FormModal>

      {submitting && (
        <div className="manager-loading">
          Saving utility bill...
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Complaints                                                                 */
/* -------------------------------------------------------------------------- */

type ComplaintsSectionProps = {
  complaints: Complaint[];

  onUpdateComplaint: (
    id: RecordId,
    values: ComplaintResponseValues
  ) => void | Promise<void>;
  submitting?: boolean;
  apiError?: string | null;
  successMessage?: string | null;
};

export function ComplaintsSection({
  complaints,
  onUpdateComplaint,
  submitting = false,
  apiError,
  successMessage,
}: ComplaintsSectionProps) {
  const [search, setSearch] =
    useState('');

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [responseValues, setResponseValues] = useState<ComplaintResponseValues>({
    status: 'open',
    manager_feedback: '',
  });
  const [responseError, setResponseError] = useState('');

  const openResponse = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResponseValues({
      status: complaint.status,
      manager_feedback: complaint.manager_feedback ?? '',
    });
    setResponseError('');
  };

  const closeResponse = () => {
    if (!submitting) {
      setSelectedComplaint(null);
      setResponseError('');
    }
  };

  const submitResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedComplaint || !responseValues.manager_feedback.trim()) {
      setResponseError('Manager feedback is required.');
      return;
    }

    try {
      await onUpdateComplaint(selectedComplaint.id, {
        ...responseValues,
        manager_feedback: responseValues.manager_feedback.trim(),
      });
      setSelectedComplaint(null);
    } catch {
      setResponseError('Unable to save the response.');
    }
  };

  const complaintRecords =
    useMemo(() => {
      return complaints.filter(
        (item) => {
          const tenant = complaintSubmitterName(item);

          return matches(
            [
              item.title,
              item.description,
              item.status,
              tenant,
            ],
            search
          );
        }
      );
    }, [complaints, search]);

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Service desk"
        title="Complaints"
        description="Manage resident complaints and responses."
      />

      <Feedback message={successMessage ?? apiError ?? ''} />

      <ModuleToolbar
        search={search}
        onSearch={setSearch}
        searchLabel="Search service records"
      />

      <DataTable
            headers={[
              'Complaint',
              'Tenant',
              'Apartment / Unit',
              'Description',
              'Status',
              'Action',
              'Created',
            ]}
          >
            {complaintRecords.map(
              (item) => (
                <tr key={item.id}>
                  <td className="manager-table__primary">
                    {item.title}
                  </td>

                  <td>
                    {complaintSubmitterName(item)}
                  </td>

                  <td>
                    {item.apartment_unit ?? '—'}
                  </td>

                  <td>
                    {item.description}
                  </td>

                  <td>
                    <StatusBadge
                      value={
                        item.status
                      }
                    />
                  </td>

                  <td>
                    <button
                      type="button"
                      className="manager-secondary-button"
                      onClick={() => openResponse(item)}
                    >
                      View / Respond
                    </button>
                  </td>

                  <td>
                    {item.created_at ??
                      '—'}
                  </td>
                </tr>
              )
            )}
      </DataTable>

      {!complaintRecords.length && (
        <EmptyState
          title="No complaints found"
          description="No complaints returned from Laravel."
        />
      )}

      <FormModal
        open={selectedComplaint !== null}
        title="Complaint response"
        onClose={closeResponse}
      >
        {selectedComplaint && (
          <form onSubmit={submitResponse}>
            {responseError && (
              <div className="manager-form-error">{responseError}</div>
            )}

            <div className="manager-form-grid">
              <Field label="Complaint">
                <input value={selectedComplaint.title} readOnly />
              </Field>

              <Field label="Tenant">
                <input
                  value={complaintSubmitterName(selectedComplaint)}
                  readOnly
                />
              </Field>

              <Field label="Apartment / Unit">
                <input value={selectedComplaint.apartment_unit ?? ''} readOnly />
              </Field>

              <Field label="Status" required>
                <select
                  value={responseValues.status}
                  onChange={(event) => setResponseValues({
                    ...responseValues,
                    status: event.target.value as Complaint['status'],
                  })}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </Field>

              <Field label="Manager feedback" required>
                <textarea
                  rows={6}
                  value={responseValues.manager_feedback}
                  onChange={(event) => setResponseValues({
                    ...responseValues,
                    manager_feedback: event.target.value,
                  })}
                  placeholder="Write a response for the tenant..."
                />
              </Field>
            </div>

            <FormActions
              submitting={submitting}
              onCancel={closeResponse}
              submitLabel="Save Response"
            />
          </form>
        )}
      </FormModal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Notices                                                                    */
/* -------------------------------------------------------------------------- */

type NoticesSectionProps = {
  notices: Notice[];

  onCreate: (
    values: NoticeFormValues
  ) => void | Promise<void>;

  onUpdate: (
    id: RecordId,
    values: NoticeFormValues
  ) => void | Promise<void>;

  onDelete: (
    id: RecordId
  ) => void | Promise<void>;

  submitting?: boolean;
  apiError?: string | null;
  successMessage?: string | null;
};

export function NoticesSection({
  notices,
  onCreate,
  onUpdate,
  onDelete,
  submitting = false,
  apiError,
  successMessage,
}: NoticesSectionProps) {
  const [search, setSearch] =
    useState('');

  const [formOpen, setFormOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Notice | null>(null);

  const [formError, setFormError] =
    useState('');

  const [values, setValues] =
    useState<NoticeFormValues>({
      title: '',
      content: '',
    });

  const records = useMemo(() => {
    return notices.filter((item) =>
      matches(
        [
          item.title,
          item.content,
          String(item.published_by),
        ],
        search
      )
    );
  }, [notices, search]);

  const openCreate = () => {
    setEditing(null);

    setValues({
      title: '',
      content: '',
    });

    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (
    notice: Notice
  ) => {
    setEditing(notice);

    setValues({
      title: notice.title ?? '',
      content: notice.content ?? '',
    });

    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setFormError('');
  };

  const submitNotice = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!values.title.trim()) {
      setFormError(
        'Notice title is required.'
      );
      return;
    }

    if (!values.content.trim()) {
      setFormError(
        'Notice content is required.'
      );
      return;
    }

    setFormError('');

    try {
      if (editing) {
        await onUpdate(
          editing.id,
          values
        );
      } else {
        await onCreate(values);
      }

      closeForm();
    } catch {
      setFormError(
        'Unable to save notice.'
      );
    }
  };

  const deleteNotice = async (
    notice: Notice
  ) => {
    const confirmed = window.confirm(
      `Delete notice "${notice.title}"?`
    );

    if (!confirmed) {
      return;
    }

    await onDelete(notice.id);
  };

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Communications"
        title="Notice Management"
        description="Create and manage updates for residents."
        actionLabel="Publish Notice"
        actionIcon="bi-megaphone"
        onAction={openCreate}
      />

      <Feedback
        message={
          successMessage ??
          apiError ??
          ''
        }
      />

      <ModuleToolbar
        search={search}
        onSearch={setSearch}
        searchLabel="Search notices"
      />

      {records.length ? (
        <div className="manager-notice-grid">
          {records.map((item) => (
            <article
              className="manager-notice-card"
              key={item.id}
            >
              <div>
                <span className="manager-notice-card__icon">
                  <i className="bi bi-megaphone" />
                </span>
              </div>

              <span>
                Published by manager #
                {item.published_by}
              </span>

              <h2>{item.title}</h2>

              <p>
                {item.content}
              </p>

              <footer>
                <time>
                  {item.created_at ??
                    '—'}
                </time>

                <div className="manager-card-actions">
                  <button
                    type="button"
                    onClick={() =>
                      openEdit(item)
                    }
                  >
                    Edit{' '}
                    <i className="bi bi-pencil" />
                  </button>

                  <button
                    type="button"
                    className="manager-danger-button"
                    onClick={() =>
                      deleteNotice(item)
                    }
                  >
                    Delete{' '}
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notices found"
          description="No notices returned from Laravel."
        />
      )}

      <FormModal
        open={formOpen}
        title={
          editing
            ? 'Edit Notice'
            : 'Publish Notice'
        }
        onClose={closeForm}
      >
        <form
          onSubmit={submitNotice}
        >
          {formError && (
            <div className="manager-form-error">
              {formError}
            </div>
          )}

          <Field
            label="Title"
            required
          >
            <input
              type="text"
              value={values.title}
              onChange={(event) =>
                setValues({
                  ...values,
                  title:
                    event.target.value,
                })
              }
              placeholder="Notice title"
            />
          </Field>

          <Field
            label="Content"
            required
          >
            <textarea
              rows={7}
              value={values.content}
              onChange={(event) =>
                setValues({
                  ...values,
                  content:
                    event.target.value,
                })
              }
              placeholder="Write your notice..."
            />
          </Field>

          <FormActions
            submitting={submitting}
            onCancel={closeForm}
            submitLabel={
              editing
                ? 'Update Notice'
                : 'Publish Notice'
            }
          />
        </form>
      </FormModal>

      {submitting && (
        <div className="manager-loading">
          Saving notice...
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared DataTable                                                           */
/* -------------------------------------------------------------------------- */

function DataTable({
  headers,
  children,
}: {
  headers: readonly string[];
  children: ReactNode;
}) {
  return (
    <div className="manager-panel manager-data-panel">
      <div className="table-responsive manager-table-wrap">
        <table className="table manager-table align-middle mb-0">
          <thead>
            <tr>
              {headers.map(
                (header, index) => (
                  <th
                    key={`${header}-${index}`}
                    scope="col"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
