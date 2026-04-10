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
        // Fix usage_records
        Schema::table('usage_records', function (Blueprint $table) {
            $table->decimal('out_qty', 15, 2)->change();
            if (Schema::hasColumn('usage_records', 'return_qty')) {
                $table->decimal('return_qty', 15, 2)->default(0)->change();
            }
        });

        // Fix stock_in_records
        Schema::table('stock_in_records', function (Blueprint $table) {
            $table->decimal('in_qty', 15, 2)->change();
        });

        // Fix materials and tools quantity_in_stock
        Schema::table('materials', function (Blueprint $table) {
            $table->decimal('quantity_in_stock', 15, 2)->default(0)->change();
        });

        Schema::table('tools', function (Blueprint $table) {
            $table->decimal('quantity_in_stock', 15, 2)->default(0)->change();
        });

        // Proactively fix polymorphic column existence
        foreach (['usage_records', 'stock_in_records'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'item_id')) {
                    $table->unsignedBigInteger('item_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn($tableName, 'item_type')) {
                    $table->string('item_type')->nullable()->after('item_id');
                }
            });
        }
    }

    public function down(): void
    {
        //
    }
};
