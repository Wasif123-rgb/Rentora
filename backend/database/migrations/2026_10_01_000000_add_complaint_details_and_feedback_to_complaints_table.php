<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->change();
        });

        if (!Schema::hasColumn('complaints', 'submitted_by')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->foreignId('submitted_by')->nullable()
                    ->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('complaints', 'apartment_unit')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->string('apartment_unit')->nullable();
            });
        }

        if (!Schema::hasColumn('complaints', 'category')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->string('category', 50)->default('Maintenance');
            });
        }

        if (!Schema::hasColumn('complaints', 'priority')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->string('priority', 20)->default('Normal');
            });
        }

        if (!Schema::hasColumn('complaints', 'preferred_contact_method')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->string('preferred_contact_method', 20)->default('Email');
            });
        }

        if (!Schema::hasColumn('complaints', 'manager_feedback')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->text('manager_feedback')->nullable();
            });
        }

        if (!Schema::hasColumn('complaints', 'responded_by')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->foreignId('responded_by')->nullable()
                    ->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('complaints', 'responded_at')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->timestamp('responded_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('complaints', 'submitted_by')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->dropConstrainedForeignId('submitted_by');
            });
        }

        if (Schema::hasColumn('complaints', 'responded_by')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->dropConstrainedForeignId('responded_by');
            });
        }

        $columns = [
            'apartment_unit',
            'category',
            'priority',
            'preferred_contact_method',
            'manager_feedback',
            'responded_at',
        ];

        foreach ($columns as $column) {
            if (Schema::hasColumn('complaints', $column)) {
                Schema::table('complaints', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
