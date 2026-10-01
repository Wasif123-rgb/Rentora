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
                $table->foreignId('submitted_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
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
    }
};
