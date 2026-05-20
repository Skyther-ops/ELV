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
        // Map actual database column names to the expected new array column names
        $mapping = [
            'client_po_number'      => 'po_client',
            'procurement_po_number' => 'pr_po_procurement',
            'delivery_order_path'   => 'delivery_order',
            'invoice_document_path' => 'invoice_document',
        ];

        foreach ($mapping as $oldCol => $newCol) {
            $tempCol = $newCol . '_old';

            // 1. Rename old column defensively if it exists and temp doesn't
            if (Schema::hasColumn('tenders', $oldCol) && !Schema::hasColumn('tenders', $tempCol)) {
                Schema::table('tenders', function (Blueprint $table) use ($oldCol, $tempCol) {
                    $table->renameColumn($oldCol, $tempCol);
                });
            }

            // 2. Add new JSON column defensively if it doesn't exist
            if (!Schema::hasColumn('tenders', $newCol)) {
                Schema::table('tenders', function (Blueprint $table) use ($newCol) {
                    $table->json($newCol)->nullable()->after('success_rate');
                });
            }

            // 3. Migrate data if the old column exists
            if (Schema::hasColumn('tenders', $tempCol)) {
                $rows = DB::table('tenders')->whereNotNull($tempCol)->where($tempCol, '!=', '')->get();
                foreach ($rows as $row) {
                    $value = $row->$tempCol;
                    $jsonVal = json_encode([
                        [
                            'name' => basename($value),
                            'path' => $value,
                            'url'  => rtrim(config('app.url'), '/') . '/api/storage/' . $value,
                        ]
                    ]);
                    DB::table('tenders')->where('id', $row->id)->update([$newCol => $jsonVal]);
                }

                // 4. Drop the old column
                Schema::table('tenders', function (Blueprint $table) use ($tempCol) {
                    $table->dropColumn($tempCol);
                });
            }
        }

        // 5. Rename bg_document_path to bg_document defensively
        if (Schema::hasColumn('tenders', 'bg_document_path') && !Schema::hasColumn('tenders', 'bg_document')) {
            Schema::table('tenders', function (Blueprint $table) {
                $table->renameColumn('bg_document_path', 'bg_document');
            });
        }
    }

    /**
     * Reverse the migration: convert JSON back to string columns.
     */
    public function down(): void
    {
        // Reverse mapping: from new JSON columns back to the original string columns
        $mapping = [
            'client_po_number'      => 'po_client',
            'procurement_po_number' => 'pr_po_procurement',
            'delivery_order_path'   => 'delivery_order',
            'invoice_document_path' => 'invoice_document',
        ];

        foreach ($mapping as $oldCol => $newCol) {
            $tempCol = $newCol . '_old';

            if (Schema::hasColumn('tenders', $newCol) && !Schema::hasColumn('tenders', $tempCol)) {
                Schema::table('tenders', function (Blueprint $table) use ($newCol, $tempCol) {
                    $table->renameColumn($newCol, $tempCol);
                });
            }

            if (!Schema::hasColumn('tenders', $oldCol)) {
                Schema::table('tenders', function (Blueprint $table) use ($oldCol) {
                    $table->string($oldCol, 255)->nullable();
                });
            }

            if (Schema::hasColumn('tenders', $tempCol)) {
                $rows = DB::table('tenders')->whereNotNull($tempCol)->get();
                foreach ($rows as $row) {
                    $arr = json_decode($row->$tempCol, true);
                    $value = is_array($arr) && count($arr) > 0 ? ($arr[0]['path'] ?? '') : '';
                    DB::table('tenders')->where('id', $row->id)->update([$oldCol => $value]);
                }

                Schema::table('tenders', function (Blueprint $table) use ($tempCol) {
                    $table->dropColumn($tempCol);
                });
            }
        }

        // Reverse bg_document to bg_document_path defensively
        if (Schema::hasColumn('tenders', 'bg_document') && !Schema::hasColumn('tenders', 'bg_document_path')) {
            Schema::table('tenders', function (Blueprint $table) {
                $table->renameColumn('bg_document', 'bg_document_path');
            });
        }
    }
};
