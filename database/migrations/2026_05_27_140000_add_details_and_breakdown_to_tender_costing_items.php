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
        Schema::table('tender_costing_items', function (Blueprint $table) {
            $table->text('item_name')->change();
            $table->text('details')->nullable()->after('item_name');
            $table->text('quotation_breakdown')->nullable()->after('details');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tender_costing_items', function (Blueprint $table) {
            $table->string('item_name', 500)->change();
            $table->dropColumn(['details', 'quotation_breakdown']);
        });
    }
};
