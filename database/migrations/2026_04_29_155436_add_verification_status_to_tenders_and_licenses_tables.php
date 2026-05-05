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
            $table->string('verification_status')->default('draft');
        });
        Schema::table('licenses', function (Blueprint $table) {
            $table->string('verification_status')->default('draft');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
            $table->dropColumn('verification_status');
        });
        Schema::table('licenses', function (Blueprint $table) {
            $table->dropColumn('verification_status');
        });
    }
};
