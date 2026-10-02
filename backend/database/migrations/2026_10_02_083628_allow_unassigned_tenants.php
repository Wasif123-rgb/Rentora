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
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('manager_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users')
                ->nullOnDelete();
        });

        /*
         * Preserve ownership for all existing tenants.
         *
         * Existing tenants already have a flat, so their manager can
         * be determined through:
         *
         * tenant -> flat -> apartment -> manager_id
         */
        DB::statement('
            UPDATE tenants
            INNER JOIN flats
                ON flats.id = tenants.flat_id
            INNER JOIN apartments
                ON apartments.id = flats.apartment_id
            SET tenants.manager_id = apartments.manager_id
            WHERE tenants.manager_id IS NULL
        ');

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
         * Do not allow rollback while unassigned tenants exist because
         * their required flat/lease fields cannot safely be restored.
         */
        if (DB::table('tenants')->whereNull('flat_id')->exists()) {
            throw new RuntimeException(
                'Cannot rollback tenant assignment migration while unassigned tenants exist.'
            );
        }

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
            $table->dropColumn('manager_id');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->unsignedBigInteger('flat_id')
                ->nullable(false)
                ->change();

            $table->date('move_in_date')
                ->nullable(false)
                ->change();

            $table->date('lease_start')
                ->nullable(false)
                ->change();

            $table->date('lease_end')
                ->nullable(false)
                ->change();
        });
    }
};