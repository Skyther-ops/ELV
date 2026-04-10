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
        Schema::table('technical_layout_widgets', function (Blueprint $table) {
            $table->foreignId('technical_layout_zone_id')->nullable()->constrained('technical_layout_zones')->nullOnDelete();
            $table->string('status')->default('ok'); // 'ok', 'warning', 'critical'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('technical_layout_widgets', function (Blueprint $table) {
            $table->dropForeign(['technical_layout_zone_id']);
            $table->dropColumn(['technical_layout_zone_id', 'status']);
        });
    }
};
