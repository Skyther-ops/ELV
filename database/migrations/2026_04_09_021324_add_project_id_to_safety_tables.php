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
        $tables = [
            'safety_documents',
            'safety_agendas',
            'safety_ppes',
            'safety_notifications',
        ];

        foreach ($tables as $table) {
            if (!Schema::hasColumn($table, 'project_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->foreignId('project_id')->nullable()->constrained('projects')->cascadeOnDelete();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'safety_documents',
            'safety_agendas',
            'safety_ppes',
            'safety_notifications',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropForeign(['project_id']);
                $table->dropColumn('project_id');
            });
        }
    }
};
