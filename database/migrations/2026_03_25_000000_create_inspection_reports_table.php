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
        if (!Schema::hasTable('inspection_reports')) {
            Schema::create('inspection_reports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->unsignedBigInteger('assigned_to_user_id')->nullable();
                $table->unsignedBigInteger('created_by_user_id')->nullable();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('file_path')->nullable();
                $table->string('status')->default('pending');
                $table->date('inspection_date')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_reports');
    }
};
