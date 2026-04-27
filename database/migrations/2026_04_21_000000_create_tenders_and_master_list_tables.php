<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_list_items', function (Blueprint $table) {
            $table->id();
            $table->string('category'); // status | type | agencyTypes | company | customer
            $table->string('label');
            $table->string('color', 20)->nullable();
            $table->string('text_color', 20)->nullable();
            // Contact fields (for agencyTypes, company, customer)
            $table->string('email')->nullable();
            $table->string('contact1', 50)->nullable();
            $table->string('contact2', 50)->nullable();
            $table->string('contact3', 50)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('tenders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->date('date')->nullable();
            $table->string('project_code')->nullable();
            $table->string('status')->nullable();
            $table->string('type')->nullable();
            $table->string('company')->nullable();
            $table->string('customer')->nullable();
            $table->string('agency_types')->nullable();
            $table->string('project_title')->nullable();
            $table->string('person_in_charge')->nullable();
            $table->string('contact_no', 50)->nullable();
            $table->string('email')->nullable();
            $table->string('internal_quotation')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenders');
        Schema::dropIfExists('master_list_items');
    }
};
