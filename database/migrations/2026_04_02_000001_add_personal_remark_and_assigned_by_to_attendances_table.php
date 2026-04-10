<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Personal remark added by the facilitator themselves (e.g., "daughter's birthday")
            $table->text('personal_remark')->nullable()->after('remarks');
            // The user_id of whoever assigned this shift (supervisor/admin)
            $table->string('assigned_by')->nullable()->after('personal_remark');
            // Name of the assigner for quick display
            $table->string('assigned_by_name')->nullable()->after('assigned_by');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['personal_remark', 'assigned_by', 'assigned_by_name']);
        });
    }
};
