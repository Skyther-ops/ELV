<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create inspection_reports table if it doesn't exist
        if (!Schema::hasTable('inspection_reports')) {
            Schema::create('inspection_reports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->unsignedBigInteger('assigned_to_user_id')->nullable();
                $table->unsignedBigInteger('created_by_user_id')->nullable();
                $table->string('title');
                $table->string('rfwi_ref_no')->nullable();
                $table->string('location')->nullable();
                $table->string('gridline_zone')->nullable();
                $table->date('date_inspected')->nullable();
                $table->text('consultant_comments')->nullable();
                $table->text('description')->nullable();
                $table->string('file_path')->nullable();
                $table->string('status')->default('pending');
                $table->date('inspection_date')->nullable();
                $table->unsignedBigInteger('linked_service_report_id')->nullable();
                $table->timestamps();
            });
        }

        // 2. Add missing columns to incident_reports
        Schema::table('incident_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('incident_reports', 'linked_service_report_id')) {
                $table->unsignedBigInteger('linked_service_report_id')->nullable();
            }
        });

        // 3. Add missing columns to service_reports
        Schema::table('service_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('service_reports', 'linked_incident_report_id')) {
                $table->unsignedBigInteger('linked_incident_report_id')->nullable();
            }
            if (!Schema::hasColumn('service_reports', 'linked_inspection_report_id')) {
                $table->unsignedBigInteger('linked_inspection_report_id')->nullable();
            }
        });

        // 4. Ensure linked_service_report_id is in inspection_reports (already in create if we created it above, but just in case)
        Schema::table('inspection_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('inspection_reports', 'linked_service_report_id')) {
                $table->unsignedBigInteger('linked_service_report_id')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse for this recovery migration
    }
};
