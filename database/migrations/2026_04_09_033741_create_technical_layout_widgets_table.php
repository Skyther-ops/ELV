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
        Schema::create('technical_layout_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technical_layout_id')->constrained()->onDelete('cascade');
            $table->string('type')->default('sensor');
            $table->string('color_theme')->default('blue');
            $table->decimal('x_pos', 8, 4); // Percentage
            $table->decimal('y_pos', 8, 4); // Percentage
            $table->json('metadata')->nullable(); // For temperature, humidity
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('technical_layout_widgets');
    }
};
