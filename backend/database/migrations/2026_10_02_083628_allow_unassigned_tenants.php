<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Temporary manager ownership is needed for tenants who have
         * registered but have not selected/been assigned a property yet.
         */
        if (! Schema::hasColumn('tenants', 'manager_id')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->foreignId('manager_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        /*
         * Preserve ownership for all existing tenants.
         *
         * Existing tenants already have a flat, so their manager can
         * be determined through:
         *
         * tenant -> flat -> apartment -> manager_id
         */
        $assignments = DB::table('tenants')
            ->join('flats', 'flats.id', '=', 'tenants.flat_id')
            ->join('apartments', 'apartments.id', '=', 'flats.apartment_id')
            ->whereNull('tenants.manager_id')
            ->select(
                'tenants.id as tenant_id',
                'apartments.manager_id'
            )
            ->get();

        foreach ($assignments as $assignment) {
            DB::table('tenants')
                ->where('id', $assignment->tenant_id)
                ->whereNull('manager_id')
                ->update([
                    'manager_id' => $assignment->manager_id,
                ]);
        }

        /*
         * New tenants may initially have no property and no lease dates.
         */
        Schema::table('tenants', function (Blueprint $table) {
            $table->unsignedBigInteger('flat_id')
                ->nullable()
                ->change();

            $table->date('move_in_date')
                ->nullable()
                ->change();

            $table->date('lease_start')
                ->nullable()
                ->change();

            $table->date('lease_end')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        /*
         * Keep the nullable tenant assignment fields intact because rows
         * created by this feature may legitimately contain null values.
         */
        if (Schema::hasColumn('tenants', 'manager_id')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->dropForeign(['manager_id']);
                $table->dropColumn('manager_id');
            });
        }
    }
};
