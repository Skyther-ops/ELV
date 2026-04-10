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
        Schema::create('pdu_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('pdu_ref_no')->unique();
            $table->date('record_date');
            $table->text('units_data')->nullable(); // JSON payload of the PDU boxes
            $table->text('meta_data')->nullable(); // JSON payload of the signatures
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdu_checklists');
    }
};
