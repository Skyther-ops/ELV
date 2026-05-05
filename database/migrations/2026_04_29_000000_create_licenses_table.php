<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tender_id')->nullable();
            $table->string('company', 100)->nullable();
            $table->string('project_code', 100)->nullable();
            $table->string('do_no', 100)->nullable();
            $table->string('quotation_no', 255)->nullable();
            $table->string('client_name', 255)->nullable();
            $table->string('product_name', 500)->nullable();
            $table->string('serial_no', 255)->nullable();
            $table->date('start_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('validity_period', 100)->nullable();
            $table->boolean('acknowledged')->default(false);
            $table->timestamp('last_notified_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('tender_id')->references('id')->on('tenders')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
