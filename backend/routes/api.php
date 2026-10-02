<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ManagerDashboardController;
use App\Http\Controllers\ManagerApartmentController;
use App\Http\Controllers\ManagerFlatController;
use App\Http\Controllers\ManagerTenantController;
use App\Http\Controllers\ManagerRentPaymentController;
use App\Http\Controllers\ManagerUtilityBillController;
use App\Http\Controllers\ManagerComplaintController;
use App\Http\Controllers\ManagerMaintenanceRequestController;
use App\Http\Controllers\ManagerNoticeController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\TenantDashboardController;
use App\Http\Controllers\TenantResidenceController;
use App\Http\Controllers\TenantRentPaymentController;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| Test Route
|--------------------------------------------------------------------------
*/

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Rentora Backend API Working',
    ]);
});


/*
|--------------------------------------------------------------------------
| Google Authentication Routes
|--------------------------------------------------------------------------
*/

Route::get('/auth/google', [
    AuthController::class,
    'redirectToGoogle',
]);

Route::get('/auth/google/callback', [
    AuthController::class,
    'handleGoogleCallback',
]);


/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [
    AuthController::class,
    'register',
]);

Route::post('/login', [
    AuthController::class,
    'login',
]);


/*
|--------------------------------------------------------------------------
| Password Recovery Routes
|--------------------------------------------------------------------------
*/

Route::post('/forgot-password', [
    AuthController::class,
    'forgotPassword',
])->middleware('throttle:forgot-password');

Route::post('/reset-password', [
    AuthController::class,
    'resetPassword',
])->middleware('throttle:reset-password');


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | General Authenticated User Routes
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [
        AuthController::class,
        'logout',
    ]);

    Route::get('/user', [
        AuthController::class,
        'user',
    ]);


    /*
    |--------------------------------------------------------------------------
    | Tenant Payment Method Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('tenant/payment-methods')->group(function () {

        /*
        | Create Stripe SetupIntent
        */

        Route::post('/setup-intent', [
            PaymentMethodController::class,
            'createSetupIntent',
        ]);

        /*
        | List saved payment methods
        */

        Route::get('/', [
            PaymentMethodController::class,
            'index',
        ]);

        /*
        | Set default payment method
        */

        Route::patch('/{paymentMethod}/default', [
            PaymentMethodController::class,
            'setDefault',
        ]);

        /*
        | Remove payment method
        */

        Route::delete('/{paymentMethod}', [
            PaymentMethodController::class,
            'deletePaymentMethod',
        ]);
    });


    /*
    |--------------------------------------------------------------------------
    | Tenant Routes
    |--------------------------------------------------------------------------
    |
    | These routes require:
    |
    | 1. A valid Sanctum authentication token
    | 2. The authenticated user to have the tenant role
    |
    */

    Route::middleware('tenant')
        ->prefix('tenant')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | Tenant Dashboard
            |--------------------------------------------------------------------------
            */

            Route::get('/dashboard', [
                TenantDashboardController::class,
                'index',
            ]);

            Route::get('/available-apartments', [
                TenantResidenceController::class,
                'apartments',
            ]);

            Route::get('/apartments/{apartment}/available-flats', [
                TenantResidenceController::class,
                'flats',
            ]);

            Route::patch('/residence', [
                TenantResidenceController::class,
                'update',
            ]);


            /*
            |--------------------------------------------------------------------------
            | Tenant Profile
            |--------------------------------------------------------------------------
            */

            Route::get('/profile', [
                TenantDashboardController::class,
                'profile',
            ]);

            Route::patch('/profile', [
                TenantDashboardController::class,
                'updateProfile',
            ]);


            /*
            |--------------------------------------------------------------------------
            | Tenant Complaints
            |--------------------------------------------------------------------------
            */

            Route::get('/complaints', [
                TenantDashboardController::class,
                'complaints',
            ]);

            Route::post('/complaints', [
                TenantDashboardController::class,
                'storeComplaint',
            ]);


            /*
            |--------------------------------------------------------------------------
            | Tenant Maintenance Requests
            |--------------------------------------------------------------------------
            */

            Route::get('/maintenance-requests', [
                TenantDashboardController::class,
                'maintenanceRequests',
            ]);


            /*
            |--------------------------------------------------------------------------
            | Tenant Rent Payment
            |--------------------------------------------------------------------------
            |
            | Create a Stripe PaymentIntent for the tenant's
            | current outstanding rent and finalize the payment.
            |
            */

            Route::post('/rent-payment/create', [
                TenantRentPaymentController::class,
                'create',
            ]);

            Route::post('/rent-payment/finalize', [
                TenantRentPaymentController::class,
                'finalize',
            ]);
        });


    /*
    |--------------------------------------------------------------------------
    | Manager Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('manager')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Manager Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get('/manager/dashboard', [
            ManagerDashboardController::class,
            'index',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Apartment CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/apartments',
            ManagerApartmentController::class
        );


        /*
        |--------------------------------------------------------------------------
        | Flat CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/flats',
            ManagerFlatController::class
        )->names('flats');


        /*
        |--------------------------------------------------------------------------
        | Tenant Onboarding
        |--------------------------------------------------------------------------
        |
        | Find already-registered tenant users who have not yet been
        | assigned a Tenant record.
        |
        */

        Route::get('/manager/eligible-tenants', [
            ManagerTenantController::class,
            'eligibleTenants',
        ]);

        /*
        | Onboard an existing tenant user.
        |
        | A flat/property is optional at this stage.
        */

        Route::post('/manager/tenants/onboard', [
            ManagerTenantController::class,
            'onboard',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Tenant CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/tenants',
            ManagerTenantController::class
        )->names('tenants');


        /*
        |--------------------------------------------------------------------------
        | Rent Payment CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/rent-payments',
            ManagerRentPaymentController::class
        )->parameters([
            'rent-payments' => 'rentPayment',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Utility Bill CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/utility-bills',
            ManagerUtilityBillController::class
        )->parameters([
            'utility-bills' => 'utilityBill',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Complaint CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/complaints',
            ManagerComplaintController::class
        )->only(['index', 'show', 'update'])
        ->parameters([
            'complaints' => 'complaint',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Maintenance Request CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/maintenance-requests',
            ManagerMaintenanceRequestController::class
        )->parameters([
            'maintenance-requests' => 'maintenanceRequest',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Notice CRUD
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'manager/notices',
            ManagerNoticeController::class
        )->parameters([
            'notices' => 'notice',
        ]);
    });
});
