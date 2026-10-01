<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\MaintenanceRequest;
use App\Models\Notice;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TenantDashboardController extends Controller
{
    /**
     * Return the authenticated tenant's dashboard.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $tenant = Tenant::with([
            'user.role',
            'flat.apartment',
            'rentPayments' => function ($query) {
                $query->latest('payment_date')->latest('id');
            },
            'utilityBills' => function ($query) {
                $query->latest('billing_month')->latest('id');
            },
            'complaints' => function ($query) {
                $query->latest('created_at')->latest('id');
            },
            'complaints.maintenanceRequests' => function ($query) {
                $query->latest('created_at')->latest('id');
            },
        ])
            ->where('user_id', $user->id)
            ->first();

        /*
         * A registered tenant may not have been assigned a flat yet.
         * Return a valid empty dashboard instead of throwing an error.
         */
        if (!$tenant) {
            return response()->json([
                'success' => true,
                'tenant' => $this->profileData($user),
                'apartment' => null,
                'flat' => null,
                'tenancy' => null,
                'rent' => [
                    'amount' => 0,
                    'outstanding_balance' => 0,
                    'next_due_date' => null,
                ],
                'utility_bills' => [],
                'recent_payments' => [],
                'recent_complaints' => [],
                'recent_maintenance_requests' => [],
                'notices' => $this->notices(),
            ]);
        }

        $rentAmount = (float) ($tenant->flat?->rent_amount ?? 0);

        /*
         * Current-month rent calculation.
         *
         * Since rent_payments does not contain a billing month,
         * use payment_date for the current month.
         */
        $now = Carbon::now();

        $paidThisMonth = (float) $tenant->rentPayments
            ->filter(function ($payment) use ($now) {
                return $payment->status === 'paid'
                    && Carbon::parse($payment->payment_date)->isSameMonth($now);
            })
            ->sum('amount');

        $outstandingBalance = max(0, $rentAmount - $paidThisMonth);

        /*
         * The schema has no explicit rent due-date column.
         * Use the first day of the current/next applicable month,
         * constrained by the lease period.
         */
        $nextDueDate = $this->nextDueDate($tenant);

        return response()->json([
            'success' => true,

            'tenant' => $this->tenantData($tenant),

            'apartment' => $tenant->flat?->apartment ? [
                'id' => $tenant->flat->apartment->id,
                'name' => $tenant->flat->apartment->name,
                'address' => $tenant->flat->apartment->address,
            ] : null,

            'flat' => $tenant->flat ? [
                'id' => $tenant->flat->id,
                'flat_number' => $tenant->flat->flat_number,
                'floor' => $tenant->flat->floor,
                'rent_amount' => (float) $tenant->flat->rent_amount,
                'status' => $tenant->flat->status,
            ] : null,

            'tenancy' => [
                'id' => $tenant->id,
                'move_in_date' => $tenant->move_in_date,
                'lease_start' => $tenant->lease_start,
                'lease_end' => $tenant->lease_end,
            ],

            'rent' => [
                'amount' => $rentAmount,
                'outstanding_balance' => $outstandingBalance,
                'next_due_date' => $nextDueDate,
            ],

            'utility_bills' => $tenant->utilityBills
                ->take(10)
                ->values()
                ->map(fn ($bill) => [
                    'id' => $bill->id,
                    'type' => $bill->type,
                    'amount' => (float) $bill->amount,
                    'billing_month' => $bill->billing_month,
                    'status' => $bill->status,
                ]),

            'recent_payments' => $tenant->rentPayments
                ->take(10)
                ->values()
                ->map(fn ($payment) => [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'payment_date' => $payment->payment_date,
                    'status' => $payment->status,
                ]),

            'recent_complaints' => $tenant->complaints
                ->take(10)
                ->values()
                ->map(fn ($complaint) => [
                    'id' => $complaint->id,
                    'title' => $complaint->title,
                    'description' => $complaint->description,
                    'status' => $complaint->status,
                    'created_at' => $complaint->created_at,
                ]),

            'recent_maintenance_requests' => $tenant->complaints
                ->flatMap(fn ($complaint) => $complaint->maintenanceRequests)
                ->sortByDesc('created_at')
                ->take(10)
                ->values()
                ->map(fn ($request) => [
                    'id' => $request->id,
                    'complaint_id' => $request->complaint_id,
                    'remarks' => $request->remarks,
                    'status' => $request->status,
                ]),

            'notices' => $this->notices(),
        ]);
    }

    /**
     * Get the authenticated tenant's profile.
     */
    public function profile(Request $request)
    {
        return response()->json([
            'success' => true,
            'tenant' => $this->profileData($request->user()),
        ]);
    }

    /**
     * Update only tenant-permitted profile fields.
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $user->fill($validator->validated());
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'tenant' => $this->profileData($user->fresh()),
        ]);
    }

    /**
     * List complaints belonging to the authenticated tenant.
     */
    public function complaints(Request $request)
    {
        $userId = $request->user()->id;

        $complaints = Complaint::where('submitted_by', $userId)
            ->orWhereHas('tenant', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'complaints' => $complaints,
        ]);
    }

    /**
     * Submit a complaint for the authenticated tenant.
     */
    public function storeComplaint(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'apartment_unit' => 'required|string|max:255',
            'category' => 'required|string|in:Plumbing,Electrical,Maintenance,Security,Cleaning,Noise,Other',
            'priority' => 'required|string|in:Low,Normal,High,Urgent',
            'description' => 'required|string|max:5000',
            'preferred_contact_method' => 'required|string|in:Email,Phone,WhatsApp',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tenant = $this->tenantForUser($request);

        $complaint = Complaint::create([
            'tenant_id' => $tenant?->id,
            'submitted_by' => $request->user()->id,
            'title' => $validator->validated()['title'],
            'apartment_unit' => $validator->validated()['apartment_unit'],
            'category' => $validator->validated()['category'],
            'priority' => $validator->validated()['priority'],
            'description' => $validator->validated()['description'],
            'preferred_contact_method' => $validator->validated()['preferred_contact_method'],
            'status' => 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Complaint submitted successfully. The management team will review it shortly.',
            'complaint' => $complaint,
        ], 201);
    }

    /**
     * List maintenance requests belonging to the authenticated tenant.
     */
    public function maintenanceRequests(Request $request)
    {
        $tenant = $this->tenantForUser($request);

        if (!$tenant) {
            return response()->json([
                'success' => true,
                'maintenance_requests' => [],
            ]);
        }

        $requests = MaintenanceRequest::whereHas(
            'complaint',
            fn ($query) => $query->where('tenant_id', $tenant->id)
        )
            ->with('complaint')
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'maintenance_requests' => $requests,
        ]);
    }

    /**
     * Return notices visible to tenants.
     *
     * Notices are currently global because the notices table has no
     * tenant/apartment/flat foreign key.
     */
    private function notices()
    {
        return Notice::with('publisher')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($notice) => [
                'id' => $notice->id,
                'title' => $notice->title,
                'content' => $notice->content,
                'published_by' => $notice->published_by,
                'created_at' => $notice->created_at,
            ])
            ->values();
    }

    private function tenantForUser(Request $request): ?Tenant
    {
        return Tenant::where('user_id', $request->user()->id)->first();
    }

    private function profileData($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar ?? null,
            'role' => $user->role?->name,
        ];
    }

    private function tenantData(Tenant $tenant): array
{
    return [
        'id' => $tenant->id,
        'user_id' => $tenant->user_id,

        'name' => $tenant->user?->name,
        'email' => $tenant->user?->email,
        'phone' => $tenant->user?->phone,
        'avatar' => $tenant->user?->avatar,
        'role' => $tenant->user?->role?->name,

        'move_in_date' => $tenant->move_in_date,
        'lease_start' => $tenant->lease_start,
        'lease_end' => $tenant->lease_end,
    ];
}

    private function nextDueDate(Tenant $tenant): ?string
    {
        if (!$tenant->lease_start || !$tenant->lease_end) {
            return null;
        }

        $today = Carbon::today();
        $leaseStart = Carbon::parse($tenant->lease_start);
        $leaseEnd = Carbon::parse($tenant->lease_end);

        if ($today->lt($leaseStart)) {
            return $leaseStart->toDateString();
        }

        if ($today->gt($leaseEnd)) {
            return null;
        }

        $due = $today->copy()->startOfMonth();

        if ($due->lt($leaseStart)) {
            $due = $leaseStart->copy();
        }

        if ($due->gt($leaseEnd)) {
            return null;
        }

        return $due->toDateString();
    }
}
