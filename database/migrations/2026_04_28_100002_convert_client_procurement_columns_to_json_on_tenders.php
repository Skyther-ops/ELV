<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Convert po_client, pr_po_procurement, delivery_order, invoice_document
     * from string columns to JSON columns that store arrays of file objects.
     * Any existing string values are preserved by wrapping them in a JSON array.
     */
    public function up(): void
    {
        // Step 1: Rename old columns temporarily, then create new JSON columns
        $columns = ['po_client', 'pr_po_procurement', 'delivery_order', 'invoice_document'];

        // For each column: add a new JSON column, migrate data, drop old
        foreach ($columns as $col) {
            $tempCol = $col . '_old';

            // Rename old string column
            Schema::table('tenders', function (Blueprint $table) use ($col, $tempCol) {
                $table->renameColumn($col, $tempCol);
            });

            // Add new JSON column
            Schema::table('tenders', function (Blueprint $table) use ($col) {
                $table->json($col)->nullable()->after('success_rate');
            });

            // Migrate existing string values into JSON array format
            $rows = DB::table('tenders')->whereNotNull($tempCol)->where($tempCol, '!=', '')->get();
            foreach ($rows as $row) {
                $value = $row->$tempCol;
                // Wrap the old string value as a single file entry with the link as both name & url
                $jsonVal = json_encode([
                    [
                        'name' => $value,
                        'path' => '',
                        'url'  => $value,
                    ]
                ]);
                DB::table('tenders')->where('id', $row->id)->update([$col => $jsonVal]);
            }

            // Drop old column
            Schema::table('tenders', function (Blueprint $table) use ($tempCol) {
                $table->dropColumn($tempCol);
            });
        }
    }

    /**
     * Reverse the migration: convert JSON back to string columns.
     */
    public function down(): void
    {
        $columns = ['po_client', 'pr_po_procurement', 'delivery_order', 'invoice_document'];

        foreach ($columns as $col) {
            $tempCol = $col . '_old';

            Schema::table('tenders', function (Blueprint $table) use ($col, $tempCol) {
                $table->renameColumn($col, $tempCol);
            });

            Schema::table('tenders', function (Blueprint $table) use ($col) {
                $table->string($col, 255)->nullable();
            });

            // Try to restore the first URL from JSON array
            $rows = DB::table('tenders')->whereNotNull($tempCol)->get();
            foreach ($rows as $row) {
                $arr = json_decode($row->$tempCol, true);
                $value = is_array($arr) && count($arr) > 0 ? ($arr[0]['url'] ?? '') : '';
                DB::table('tenders')->where('id', $row->id)->update([$col => $value]);
            }

            Schema::table('tenders', function (Blueprint $table) use ($tempCol) {
                $table->dropColumn($tempCol);
            });
        }
    }
};
