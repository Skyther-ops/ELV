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
        Schema::table('master_list_items', function (Blueprint $table) {
            $table->string('pic_name')->nullable();
            $table->string('pic_phone', 50)->nullable();
            $table->string('pic_email')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_list_items', function (Blueprint $table) {
            $table->dropColumn(['pic_name', 'pic_phone', 'pic_email']);
        });
    }
};
