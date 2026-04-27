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
            $table->decimal('sales_price', 15, 2)->nullable()->after('internal_quotation');
            $table->decimal('cost_price', 15, 2)->nullable()->after('sales_price');
            $table->decimal('margin', 15, 2)->nullable()->after('cost_price');
            $table->date('submission_date')->nullable()->after('margin');
            $table->string('success_rate', 50)->nullable()->after('submission_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
            $table->dropColumn(['sales_price', 'cost_price', 'margin', 'submission_date', 'success_rate']);
        });
    }
};
