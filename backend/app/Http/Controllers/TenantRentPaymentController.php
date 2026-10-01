<?php

namespace App\Http\Controllers;

use App\Models\RentPayment;
use App\Models\User;
use App\Services\StripeRentPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\ApiErrorException;
use Throwable;

class TenantRentPaymentController extends Controller
{
    public function __construct(
        private StripeRentPaymentService $stripeRentPaymentService
    ) {
    }

    /**
     * Create a Stripe PaymentIntent for the tenant's
     * current outstanding rent.
     */
    public function create(Request $request): JsonResponse
    {
        $tenant = $request->user();

        if (!$this->isTenant($tenant)) {
            return response()->json([
                'success' => false,
                'message' => 'Only tenants can pay rent.',
            ], 403);
        }

        /*
         * Find the tenant record belonging to the
         * authenticated user.
         */
        $tenantRecord = $tenant->tenant()
            ->with([
                'flat',
                'rentPayments',
            ])
            ->first();

        if (!$tenantRecord) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant record was found for this account.',
            ], 404);
        }

        if (!$tenantRecord->flat) {
            return response()->json([
                'success' => false,
                'message' => 'You are not currently assigned to a flat.',
            ], 422);
        }

        $monthlyRent =
            (float) $tenantRecord->flat->rent_amount;

        /*
         * Calculate how much rent has already been paid
         * during the current month.
         */
        $paidThisMonth = (float) $tenantRecord
            ->rentPayments()
            ->where('status', 'paid')
            ->whereYear(
                'payment_date',
                now()->year
            )
            ->whereMonth(
                'payment_date',
                now()->month
            )
            ->sum('amount');

        $outstandingRent = max(
            0,
            $monthlyRent - $paidThisMonth
        );

        if ($outstandingRent <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Your rent is already fully paid for this month.',
            ], 422);
        }

        try {
            $paymentIntent =
                $this->stripeRentPaymentService
                    ->createRentPaymentIntent(
                        $tenant,
                        $outstandingRent
                    );

            return response()->json([
                'success' => true,
                'message' => 'Rent payment created successfully.',
                'data' => [
                    'payment_intent_id' =>
                        $paymentIntent->id,

                    'client_secret' =>
                        $paymentIntent->client_secret,

                    'amount' =>
                        $outstandingRent,

                    'currency' =>
                        $paymentIntent->currency,
                ],
            ]);
        } catch (ApiErrorException $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' =>
                    'Stripe was unable to create the rent payment.',
            ], 502);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' =>
                    $e->getMessage() ?: 'Unable to create rent payment.',
            ], 500);
        }
    }

    /**
     * Verify the Stripe PaymentIntent and create the
     * corresponding RentPayment database record.
     */
    public function finalize(Request $request): JsonResponse
    {
        $tenant = $request->user();

        if (!$this->isTenant($tenant)) {
            return response()->json([
                'success' => false,
                'message' => 'Only tenants can pay rent.',
            ], 403);
        }

        $validated = $request->validate([
            'payment_intent_id' => [
                'required',
                'string',
            ],
        ]);

        try {
            $paymentIntent =
                $this->stripeRentPaymentService
                    ->retrievePaymentIntent(
                        $validated['payment_intent_id']
                    );

            /*
             * Make sure the PaymentIntent belongs to
             * the authenticated tenant.
             */
            $customer = $tenant->stripe_customer_id;

            if (
                !$customer ||
                $paymentIntent->customer !== $customer
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'This payment does not belong to your account.',
                ], 403);
            }

            /*
             * The Stripe payment must actually be successful.
             */
            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'The Stripe payment has not been completed.',
                ], 422);
            }

            /*
             * Prevent duplicate RentPayment records if the
             * same PaymentIntent is submitted twice.
             *
             * Because the existing rent_payments table does not
             * contain a Stripe PaymentIntent ID, we cannot perform
             * a perfect database-level idempotency check here.
             *
             * The metadata is still used for verification.
             */
            if (
                ($paymentIntent->metadata->payment_type ?? null)
                !== 'rent'
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'This Stripe payment is not a rent payment.',
                ], 422);
            }

            $tenantRecord = $tenant->tenant()
                ->with('flat')
                ->first();

            if (!$tenantRecord || !$tenantRecord->flat) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'No active tenancy was found.',
                ], 404);
            }

            $amount = $paymentIntent->amount / 100;

            /*
             * Make sure Stripe's payment amount is positive.
             */
            if ($amount <= 0) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'The Stripe payment amount is invalid.',
                ], 422);
            }

            /*
             * Create the RentPayment record using the existing
             * database schema.
             */
            $rentPayment = RentPayment::create([
                'tenant_id' =>
                    $tenantRecord->id,

                'amount' =>
                    $amount,

                'payment_date' =>
                    now()->toDateString(),

                'status' =>
                    'paid',
            ]);

            return response()->json([
                'success' => true,
                'message' =>
                    'Rent payment completed successfully.',

                'data' => [
                    'rent_payment_id' =>
                        $rentPayment->id,

                    'payment_intent_id' =>
                        $paymentIntent->id,

                    'amount' =>
                        $amount,

                    'status' =>
                        $rentPayment->status,
                ],
            ]);
        } catch (ApiErrorException $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' =>
                    'Stripe was unable to verify the payment.',
            ], 502);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' =>
                    'Unable to finalize rent payment.',
            ], 500);
        }
    }

    private function isTenant($user): bool
    {
        return $user
            && $user->role
            && strtolower($user->role->name) === 'tenant';
    }
}