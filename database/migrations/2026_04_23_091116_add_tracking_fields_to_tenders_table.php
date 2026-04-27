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
        Schema::table('tenders', function (Blueprint $table) {
            $table->string('client_po_number')->nullable();
            $table->string('bg_document_path')->nullable();
            $table->date('bg_issue_date')->nullable();
            $table->string('procurement_po_number')->nullable();
            $table->string('delivery_order_path')->nullable();
            $table->string('invoice_document_path')->nullable();
            $table->string('project_progress_link')->nullable();
            $table->string('project_folder_link')->nullable();
            $table->string('sourcing_link')->nullable();
            $table->string('quotation_link')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
            $table->dropColumn([
                'client_po_number',
                'bg_document_path',
                'bg_issue_date',
                'procurement_po_number',
                'delivery_order_path',
                'invoice_document_path',
                'project_progress_link',
                'project_folder_link',
                'sourcing_link',
                'quotation_link',
            ]);
        });
    }
};
