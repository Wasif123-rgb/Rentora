<?php

namespace App\Services;

use App\Models\User;
use Stripe\PaymentIntent;
use Stripe\StripeClient;

class StripeRentPaymentService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(
            config('services.stripe.secret')
        );
    }

    /**
     * Get the tenant's Stripe customer.
     *
     * If the customer does not exist yet, create one.
     */
    public function getOrCreateCustomer(User $tenant)
    {
        if ($tenant->stripe_customer_id) {
            return $this->stripe->customers->retrieve(
                $tenant->stripe_customer_id
            );
        }

        $customer = $this->stripe->customers->create([
            'name' => $tenant->name,
            'email' => $tenant->email,
            'metadata' => [
                'rentora_user_id' => (string) $tenant->id,
            ],
        ]);

        $tenant->update([
            'stripe_customer_id' => $customer->id,
        ]);

        return $customer;
    }

    /**
     * Create a PaymentIntent for rent.
     */
    public function createRentPaymentIntent(
        User $tenant,
        float $amount
    ): PaymentIntent {
        $customer = $this->getOrCreateCustomer($tenant);

        /*
         * Get the customer's default payment method.
         */
        $defaultPaymentMethod =
            $customer->invoice_settings->default_payment_method
            ?? null;

        if (!$defaultPaymentMethod) {
            throw new \RuntimeException(
                'Please add a default payment method before paying rent.'
            );
        }

        $currency = strtolower(
            config('services.stripe.currency', 'bdt')
        );

        return $this->stripe->paymentIntents->create([
            'amount' => (int) round($amount * 100),
            'currency' => $currency,

            'customer' => $customer->id,

            'payment_method' => $defaultPaymentMethod,

            /*
             * Allows Stripe to handle additional authentication
             * such as 3D Secure when required.
             */
            'confirmation_method' => 'automatic',

            'confirm' => false,

            'payment_method_types' => [
                'card',
            ],

            'metadata' => [
                'rentora_user_id' => (string) $tenant->id,
                'payment_type' => 'rent',
                'rent_amount' => (string) $amount,
            ],
        ]);
    }

    /**
     * Retrieve a PaymentIntent from Stripe.
     */
    public function retrievePaymentIntent(
        string $paymentIntentId
    ): PaymentIntent {
        return $this->stripe->paymentIntents->retrieve(
            $paymentIntentId
        );
    }
}