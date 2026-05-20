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
        // 1. Create floor_annotations table first
        if (!Schema::hasTable('floor_annotations')) {
            Schema::create('floor_annotations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->foreignId('floor_id')->constrained()->onDelete('cascade');
                $table->foreignId('zone_id')->nullable()->constrained()->onDelete('set null');
                $table->string('category');
                $table->unsignedBigInteger('riser_id')->nullable();
                $table->foreignId('legend_id')->nullable()->constrained()->onDelete('set null');
                $table->string('name')->nullable();
                $table->text('description')->nullable();
                $table->json('coordinates');
                $table->integer('rotation')->nullable();
                $table->string('status')->default('pending');
                $table->text('remarks')->nullable();
                $table->boolean('not_our_fault')->default(false);
                $table->string('photo_path')->nullable();
                $table->date('due_date')->nullable();
                $table->timestamps();
            });
        }

        // 2. Create risers table
        if (!Schema::hasTable('risers')) {
            Schema::create('risers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->foreignId('floor_id')->constrained()->onDelete('cascade');
                $table->string('name');
                $table->string('location')->nullable();
                $table->foreignId('annotation_id')->nullable()->constrained('floor_annotations')->onDelete('cascade');
                $table->timestamps();
            });
        }

        // Add foreign key constraint to floor_annotations.riser_id if table exists
        if (Schema::hasTable('floor_annotations') && Schema::hasTable('risers')) {
            Schema::table('floor_annotations', function (Blueprint $table) {
                $table->foreign('riser_id')->references('id')->on('risers')->onDelete('set null');
            });
        }

        // 3. Create cable_ports table
        if (!Schema::hasTable('cable_ports')) {
            Schema::create('cable_ports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('annotation_id')->constrained('floor_annotations')->onDelete('cascade');
                $table->string('port_number');
                $table->string('status');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 4. Create cable_connections table
        if (!Schema::hasTable('cable_connections')) {
            Schema::create('cable_connections', function (Blueprint $table) {
                $table->id();
                $table->string('cable_id')->nullable();
                $table->string('cable_type')->nullable();
                $table->foreignId('port_a_id')->constrained('cable_ports')->onDelete('cascade');
                $table->foreignId('port_b_id')->constrained('cable_ports')->onDelete('cascade');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cable_connections');
        Schema::dropIfExists('cable_ports');
        
        if (Schema::hasTable('floor_annotations')) {
            Schema::table('floor_annotations', function (Blueprint $table) {
                $table->dropForeign(['riser_id']);
            });
        }
        
        Schema::dropIfExists('risers');
        Schema::dropIfExists('floor_annotations');
    }
};
