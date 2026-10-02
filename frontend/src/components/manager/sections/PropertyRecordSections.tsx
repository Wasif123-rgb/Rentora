import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import type {
  Apartment,
  ApartmentFormValues,
  Flat,
  FlatFormValues,
  Notice,
  NoticeFormValues,
  RecordId,
  RentPayment,
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

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

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

type RentSectionProps = {
  payments: RentPayment[];
};

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

type FormErrors = Record<string, string>;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const matches = (
  values: readonly (string | number | null | undefined)[],
  search: string
) => {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return values.some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(query)
  );
};

const money = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const displayValue = (
  value: ReactNode | null | undefined
) =>
  value === null ||
  value === undefined ||
  value === ''
    ? '—'
    : value;

const normalise = (value: string) =>
  value.replace(/_/g, ' ');

/*
|--------------------------------------------------------------------------
| DEFAULT FORMS
|--------------------------------------------------------------------------
*/

const defaultApartment: ApartmentFormValues = {
  name: '',
  address: '',
};

const defaultFlat: FlatFormValues = {
  apartment_id: '',
  flat_number: '',
  floor: '',
  rent_amount: '',
  status: 'vacant',
};

const defaultNotice: NoticeFormValues = {
  title: '',
  content: '',
};

/*
|--------------------------------------------------------------------------
| FORM COMPONENTS
|--------------------------------------------------------------------------
*/

function Field({
  label,
  error,
  children,
  wide = false,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={`manager-form-field${
        wide
          ? ' manager-form-field--wide'
          : ''
      }`}
    >
      <span>{label}</span>

      {children}

      {error && (
        <small role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

function FormShell({
  children,
  error,
  success,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  children: ReactNode;
  error?: string | null;
  success?: string | null;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <form
      className="manager-record-form"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="manager-form-scroll">
        <div className="manager-form-grid">
          {children}
        </div>

        {error && (
          <p
            className="manager-form-message manager-form-message--error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="manager-form-message"
            role="status"
          >
            {success}
          </p>
        )}
      </div>

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
          {submitting
            ? 'Saving...'
            : submitLabel}
        </button>
      </div>
    </form>
  );
}

/*
|--------------------------------------------------------------------------
| APARTMENTS
|--------------------------------------------------------------------------
*/

export function ApartmentsSection({
  apartments,
  onCreate,
  onUpdate,
  onDelete,
  submitting = false,
  apiError,
  successMessage,
}: ApartmentsSectionProps) {
  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All statuses');

  const [selected, setSelected] =
    useState<Apartment | null>(null);

  const [editing, setEditing] =
    useState<Apartment | null>(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [values, setValues] =
    useState<ApartmentFormValues>({
      ...defaultApartment,
    });

  const [errors, setErrors] =
    useState<FormErrors>({});

  const records = useMemo(
    () =>
      apartments.filter((item) => {
        const searchMatches = matches(
          [
            item.name,
            item.address,
          ],
          search
        );

        /*
         * Current Apartment type does not contain
         * a status field.
         *
         * Therefore the status filter is kept disabled
         * until status exists in managerRecords.ts.
         */
        const statusMatches =
          status === 'All statuses';

        return (
          searchMatches &&
          statusMatches
        );
      }),
    [
      apartments,
      search,
      status,
    ]
  );

  const openCreate = () => {
    setEditing(null);

    setValues({
      ...defaultApartment,
    });

    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (
    apartment: Apartment
  ) => {
    setEditing(apartment);

    setValues({
      name: apartment.name ?? '',
      address: apartment.address ?? '',
    });

    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setErrors({});
  };

  const submitApartment = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name =
        'Apartment name is required.';
    }

    if (!values.address.trim()) {
      nextErrors.address =
        'Apartment address is required.';
    }

    setErrors(nextErrors);

    if (
      Object.keys(nextErrors).length
    ) {
      return;
    }

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
      // Parent handles API error.
    }
  };

  const deleteApartment = async (
    apartment: Apartment
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${apartment.name}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(apartment.id);

      if (
        selected &&
        String(selected.id) ===
          String(apartment.id)
      ) {
        setSelected(null);
      }
    } catch {
      // Parent displays API error.
    }
  };

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Portfolio"
        title="Apartment Management"
        description="Manage your apartments and their addresses."
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
      >
        <FilterSelect
          label="Status"
          value={status}
          options={[
            'All statuses',
          ]}
          onChange={setStatus}
        />
      </ModuleToolbar>

      {records.length ? (
        <div className="manager-property-grid">
          {records.map((item) => (
            <article
              className="manager-property-card"
              key={item.id}
            >
              <div className="manager-property-card__visual">
                <i className="bi bi-building" />
              </div>

              <div className="manager-property-card__body">
                <span>
                  {displayValue(
                    item.address
                  )}
                </span>

                <h2>
                  {item.name}
                </h2>

                <div className="manager-property-metrics">
                  <div>
                    <strong>
                      {item.total_flats ??
                        item.flats?.length ??
                        0}
                    </strong>

                    <small>
                      Total flats
                    </small>
                  </div>

                  <div>
                    <strong>
                      {item.occupied_flats ??
                        0}
                    </strong>

                    <small>
                      Occupied
                    </small>
                  </div>

                  <div>
                    <strong>
                      {item.vacant_flats ??
                        0}
                    </strong>

                    <small>
                      Vacant
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelected(item)
                    }
                  >
                    View{' '}
                    <i className="bi bi-eye" />
                  </button>

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
                    onClick={() =>
                      deleteApartment(item)
                    }
                    disabled={submitting}
                  >
                    Delete{' '}
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No apartments found"
          description="No apartments returned from Laravel."
        />
      )}

      <DetailDrawer
        open={Boolean(selected)}
        title={
          selected?.name ?? ''
        }
        subtitle={
          selected
            ? selected.address
            : ''
        }
        onClose={() =>
          setSelected(null)
        }
      >
        {selected && (
          <div className="manager-detail-grid">
            <div>
              <span>
                Total flats
              </span>

              <strong>
                {selected.total_flats ??
                  selected.flats?.length ??
                  0}
              </strong>
            </div>

            <div>
              <span>
                Occupied
              </span>

              <strong>
                {selected.occupied_flats ??
                  0}
              </strong>
            </div>

            <div>
              <span>
                Vacant
              </span>

              <strong>
                {selected.vacant_flats ??
                  0}
              </strong>
            </div>

            <div className="manager-detail-grid__wide">
              <span>
                Address
              </span>

              <strong>
                {displayValue(
                  selected.address
                )}
              </strong>
            </div>
          </div>
        )}
      </DetailDrawer>

      <DetailDrawer
        open={formOpen}
        title={
          editing
            ? 'Edit apartment'
            : 'Add apartment'
        }
        subtitle="Apartment details"
        onClose={closeForm}
      >
        <FormShell
          onSubmit={submitApartment}
          onCancel={closeForm}
          submitLabel={
            editing
              ? 'Save changes'
              : 'Add apartment'
          }
          submitting={submitting}
          error={apiError}
          success={successMessage}
        >
          <Field
            label="Apartment name *"
            error={errors.name}
          >
            <input
              type="text"
              value={values.name}
              onChange={(event) =>
                setValues({
                  ...values,
                  name: event.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Address *"
            error={errors.address}
            wide
          >
            <textarea
              rows={4}
              value={values.address}
              onChange={(event) =>
                setValues({
                  ...values,
                  address:
                    event.target.value,
                })
              }
            />
          </Field>
        </FormShell>
      </DetailDrawer>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| FLATS
|--------------------------------------------------------------------------
*/

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

  const [status, setStatus] =
    useState('All statuses');

  const [property, setProperty] =
    useState('All apartments');

  const [formOpen, setFormOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Flat | null>(null);

  const [values, setValues] =
    useState<FlatFormValues>({
      ...defaultFlat,
    });

  const [errors, setErrors] =
    useState<FormErrors>({});

  const properties = [
    'All apartments',
    ...Array.from(
      new Set(
        apartments.map(
          (item) => item.name
        )
      )
    ),
  ];

  const records = useMemo(
    () =>
      flats.filter((item) => {
        const apartmentName =
          item.apartment?.name ??
          apartments.find(
            (apartment) =>
              String(
                apartment.id
              ) ===
              String(
                item.apartment_id
              )
          )?.name ??
          '';

        const tenantName =
          item.tenant?.user?.name ??
          '';

        const matchesSearch =
          matches(
            [
              item.flat_number,
              item.floor,
              item.rent_amount,
              item.status,
              apartmentName,
              tenantName,
            ],
            search
          );

        const matchesStatus =
          status === 'All statuses' ||
          item.status === status;

        const matchesProperty =
          property ===
            'All apartments' ||
          apartmentName === property;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesProperty
        );
      }),
    [
      flats,
      apartments,
      search,
      status,
      property,
    ]
  );

  const openCreate = () => {
    setEditing(null);

    setValues({
      ...defaultFlat,
    });

    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (
    flat: Flat
  ) => {
    setEditing(flat);

    setValues({
      apartment_id:
        flat.apartment_id ??
        '',

      flat_number:
        flat.flat_number ??
        '',

      floor:
        flat.floor ?? '',

      rent_amount:
        flat.rent_amount ?? '',

      status:
        flat.status ??
        'vacant',
    });

    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setErrors({});
  };

  const submitFlat = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (
      values.apartment_id === ''
    ) {
      nextErrors.apartment_id =
        'Choose an apartment.';
    }

    if (
      !String(
        values.flat_number
      ).trim()
    ) {
      nextErrors.flat_number =
        'Flat/unit number is required.';
    }

    if (
      values.floor === '' ||
      Number(values.floor) < 0
    ) {
      nextErrors.floor =
        'Floor number is required.';
    }

    if (
      values.rent_amount === '' ||
      Number(values.rent_amount) < 0
    ) {
      nextErrors.rent_amount =
        'Rent amount cannot be negative.';
    }

    setErrors(nextErrors);

    if (
      Object.keys(nextErrors).length
    ) {
      return;
    }

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
      // Parent handles API error.
    }
  };

  const deleteFlat = async (
    flat: Flat
  ) => {
    const confirmed =
      window.confirm(
        `Delete flat "${flat.flat_number}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(flat.id);
    } catch {
      // Parent handles API error.
    }
  };

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Inventory"
        title="Flat Management"
        description="Track apartment units, rent amounts, and occupancy status."
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
          label="Flat status"
          value={status}
          options={[
            'All statuses',
            'vacant',
            'occupied',
          ]}
          onChange={setStatus}
        />

        <FilterSelect
          label="Apartment"
          value={property}
          options={properties}
          onChange={setProperty}
        />
      </ModuleToolbar>

      {records.length ? (
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
          {records.map((item) => {
            const apartmentName =
              item.apartment?.name ??
              apartments.find(
                (apartment) =>
                  String(
                    apartment.id
                  ) ===
                  String(
                    item.apartment_id
                  )
              )?.name ??
              '—';

            const tenantName =
              item.tenant?.user?.name ??
              'Vacant';

            return (
              <tr
                key={item.id}
              >
                <td className="manager-table__primary">
                  {item.flat_number}
                </td>

                <td>
                  {apartmentName}
                </td>

                <td>
                  {item.floor}
                </td>

                <td>
                  {tenantName}
                </td>

                <td>
                  {money(
                    Number(
                      item.rent_amount
                    )
                  )}
                </td>

                <td>
                  <StatusBadge
                    value={normalise(
                      item.status
                    )}
                  />
                </td>

                <td>
  <div className="manager-table-actions">
    <button
      type="button"
      onClick={() => openEdit(item)}
    >
      Edit
    </button>

    <button
      type="button"
      className="danger"
      onClick={() => deleteFlat(item)}
      disabled={submitting}
    >
      Delete
    </button>
  </div>
</td>
              </tr>
            );
          })}
        </DataTable>
      ) : (
        <EmptyState
          title="No flats found"
          description="No flats returned from Laravel."
        />
      )}

      <DetailDrawer
        open={formOpen}
        title={
          editing
            ? 'Edit flat'
            : 'Add flat'
        }
        subtitle="Unit and rent details"
        onClose={closeForm}
      >
        <FormShell
          onSubmit={submitFlat}
          onCancel={closeForm}
          submitLabel={
            editing
              ? 'Save changes'
              : 'Add flat'
          }
          submitting={submitting}
          error={apiError}
          success={successMessage}
        >
          <Field
            label="Parent apartment *"
            error={
              errors.apartment_id
            }
            wide
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
                Select an apartment
              </option>

              {apartments.map(
                (apartment) => (
                  <option
                    key={
                      apartment.id
                    }
                    value={String(
                      apartment.id
                    )}
                  >
                    {apartment.name}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field
            label="Flat / unit *"
            error={
              errors.flat_number
            }
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
            />
          </Field>

          <Field
            label="Floor number *"
            error={errors.floor}
          >
            <input
              type="number"
              min="0"
              step="1"
              value={
                values.floor
              }
              onChange={(event) =>
                setValues({
                  ...values,
                  floor:
                    event.target.value ===
                    ''
                      ? ''
                      : Number(
                          event.target.value
                        ),
                })
              }
            />
          </Field>

          <Field
            label="Monthly rent *"
            error={
              errors.rent_amount
            }
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                values.rent_amount
              }
              onChange={(event) =>
                setValues({
                  ...values,
                  rent_amount:
                    event.target.value ===
                    ''
                      ? ''
                      : Number(
                          event.target.value
                        ),
                })
              }
            />
          </Field>

          <Field label="Status">
            <select
              value={
                values.status
              }
              onChange={(event) =>
                setValues({
                  ...values,
                  status:
                    event.target
                      .value as FlatFormValues['status'],
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
        </FormShell>
      </DetailDrawer>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| RENT
|--------------------------------------------------------------------------
*/

export function RentSection({
  payments,
}: RentSectionProps) {
  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All statuses');

  const records = useMemo(
    () =>
      payments.filter((item) => {
        const tenantName =
          item.tenant?.user?.name ??
          '';

        const flatNumber =
          item.tenant?.flat
            ?.flat_number ??
          '';

        const matchesSearch =
          matches(
            [
              tenantName,
              flatNumber,
              item.amount,
              item.payment_date,
              item.status,
            ],
            search
          );

        const matchesStatus =
          status === 'All statuses' ||
          item.status === status;

        return (
          matchesSearch &&
          matchesStatus
        );
      }),
    [
      payments,
      search,
      status,
    ]
  );

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Finance"
        title="Rent Payments"
        description="View rent payment records and their current status."
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

      {records.length ? (
        <DataTable
          headers={[
            'Tenant',
            'Flat',
            'Amount',
            'Payment date',
            'Status',
          ]}
        >
          {records.map((item) => (
            <tr
              key={item.id}
            >
              <td className="manager-table__primary">
                {item.tenant?.user?.name ??
                  'Unknown tenant'}
              </td>

              <td>
                {item.tenant?.flat
                  ?.flat_number ??
                  '—'}
              </td>

              <td>
                {money(
                  Number(
                    item.amount
                  )
                )}
              </td>

              <td>
                {item.payment_date}
              </td>

              <td>
                <StatusBadge
                  value={normalise(
                    item.status
                  )}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState
          title="No rent payments found"
          description="No rent payment records returned from Laravel."
        />
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| NOTICES
|--------------------------------------------------------------------------
*/

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

  const [values, setValues] =
    useState<NoticeFormValues>({
      ...defaultNotice,
    });

  const [errors, setErrors] =
    useState<FormErrors>({});

  const records = useMemo(
    () =>
      notices.filter((item) =>
        matches(
          [
            item.title,
            item.content,
          ],
          search
        )
      ),
    [
      notices,
      search,
    ]
  );

  const openCreate = () => {
    setEditing(null);

    setValues({
      ...defaultNotice,
    });

    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (
    notice: Notice
  ) => {
    setEditing(notice);

    setValues({
      title:
        notice.title ?? '',

      content:
        notice.content ?? '',
    });

    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setErrors({});
  };

  const submitNotice = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.title.trim()) {
      nextErrors.title =
        'Notice title is required.';
    }

    if (!values.content.trim()) {
      nextErrors.content =
        'Notice content is required.';
    }

    setErrors(nextErrors);

    if (
      Object.keys(nextErrors).length
    ) {
      return;
    }

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
      // Parent handles API error.
    }
  };

  const deleteNotice = async (
    notice: Notice
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${notice.title}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(
        notice.id
      );
    } catch {
      // Parent handles API error.
    }
  };

  return (
    <div className="manager-section">
      <ManagerSectionHeader
        eyebrow="Communications"
        title="Notice Management"
        description="Create and manage notices for residents."
        actionLabel="Add Notice"
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

              <h2>
                {item.title}
              </h2>

              <p>
                {item.content}
              </p>

              <footer>
                <time>
                  {item.created_at ??
                    '—'}
                </time>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEdit(
                        item
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteNotice(
                        item
                      )
                    }
                    disabled={
                      submitting
                    }
                  >
                    Delete
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

      <DetailDrawer
        open={formOpen}
        title={
          editing
            ? 'Edit notice'
            : 'Add notice'
        }
        subtitle="Resident communication"
        onClose={closeForm}
      >
        <FormShell
          onSubmit={submitNotice}
          onCancel={closeForm}
          submitLabel={
            editing
              ? 'Save changes'
              : 'Add notice'
          }
          submitting={submitting}
          error={apiError}
          success={successMessage}
        >
          <Field
            label="Notice title *"
            error={errors.title}
            wide
          >
            <input
              type="text"
              value={
                values.title
              }
              onChange={(event) =>
                setValues({
                  ...values,
                  title:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Content *"
            error={
              errors.content
            }
            wide
          >
            <textarea
              rows={8}
              value={
                values.content
              }
              onChange={(event) =>
                setValues({
                  ...values,
                  content:
                    event.target.value,
                })
              }
            />
          </Field>
        </FormShell>
      </DetailDrawer>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DATA TABLE
|--------------------------------------------------------------------------
*/

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
                (header) => (
                  <th
                    key={header}
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


