<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
            // Drop old link columns
            $table->dropColumn([
                'project_progress_link',
                'project_folder_link',
                'sourcing_link',
                'quotation_link',
            ]);
        });

        Schema::table('tenders', function (Blueprint $table) {
            // Add new JSON columns for multiple file paths
            $table->json('project_progress_files')->nullable()->after('invoice_document');
            $table->json('project_folder_files')->nullable()->after('project_progress_files');
            $table->json('sourcing_files')->nullable()->after('project_folder_files');
            $table->json('quotation_files')->nullable()->after('sourcing_files');
        });
    }

    public function down(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
            $table->dropColumn([
                'project_progress_files',
                'project_folder_files',
                'sourcing_files',
                'quotation_files',
            ]);
        });

        Schema::table('tenders', function (Blueprint $table) {
            $table->string('project_progress_link', 1000)->nullable()->after('invoice_document');
            $table->string('project_folder_link', 1000)->nullable()->after('project_progress_link');
            $table->string('sourcing_link', 1000)->nullable()->after('project_folder_link');
            $table->string('quotation_link', 1000)->nullable()->after('sourcing_link');
        });
    }
};
