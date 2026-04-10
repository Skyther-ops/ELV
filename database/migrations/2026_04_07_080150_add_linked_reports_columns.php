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
        Schema::table('incident_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('linked_service_report_id')->nullable();
        });

        Schema::table('inspection_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('linked_service_report_id')->nullable();
        });

        Schema::table('service_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('linked_incident_report_id')->nullable();
            $table->unsignedBigInteger('linked_inspection_report_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_reports', function (Blueprint $table) {
            $table->dropColumn('linked_service_report_id');
        });

        Schema::table('inspection_reports', function (Blueprint $table) {
            $table->dropColumn('linked_service_report_id');
        });

        Schema::table('service_reports', function (Blueprint $table) {
            $table->dropColumn(['linked_incident_report_id', 'linked_inspection_report_id']);
        });
    }
};
