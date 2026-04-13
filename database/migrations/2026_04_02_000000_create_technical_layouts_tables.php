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
        Schema::create('technical_layouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('image_path');
            $table->timestamps();
        });

        Schema::create('technical_layout_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technical_layout_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('svg_path');
            $table->string('color')->default('#6366f1');
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('technical_layout_zone_objects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technical_layout_zone_id')
                ->constrained('technical_layout_zones', 'id', 'tlz_obj_tlz_id_fk')
                ->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('technical_layout_zone_annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technical_layout_zone_id')
                ->constrained('technical_layout_zones', 'id', 'tlz_ann_tlz_id_fk')
                ->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('open');
            $table->string('priority')->default('medium');
            $table->string('photo_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('technical_layout_zone_annotations');
        Schema::dropIfExists('technical_layout_zone_objects');
        Schema::dropIfExists('technical_layout_zones');
        Schema::dropIfExists('technical_layouts');
    }
};
