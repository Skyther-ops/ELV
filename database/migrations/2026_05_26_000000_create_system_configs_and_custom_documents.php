<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create system_configs table
        if (!Schema::hasTable('system_configs')) {
            Schema::create('system_configs', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->timestamps();
            });

            // Seed default SST rate
            DB::table('system_configs')->insert([
                'key' => 'sst_rate',
                'value' => '8', // Represents 8%
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Add custom_documents to tenders table
        Schema::table('tenders', function (Blueprint $table) {
            if (!Schema::hasColumn('tenders', 'custom_documents')) {
                $table->json('custom_documents')->nullable()->after('quotation_files');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
            if (Schema::hasColumn('tenders', 'custom_documents')) {
                $table->dropColumn('custom_documents');
            }
        });

        Schema::dropIfExists('system_configs');
    }
};
