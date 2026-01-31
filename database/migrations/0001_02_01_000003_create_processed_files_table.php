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
        Schema::create('processed_files', function (Blueprint $table) {
            $table->id();
            $table->string('input_file_path');
            $table->string('output_file_path')->nullable();

            // Process parameters
            $table->boolean('kindle_friendly')->default(false);
            $table->boolean('remove_hyphens')->default(false);

            // Kindle options
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->integer('preview_page')->nullable();
            $table->string('output_name')->nullable();
            $table->decimal('margin', 5, 2)->nullable();
            $table->integer('max_columns')->nullable();
            $table->integer('font_size')->nullable();

            // Status tracking
            $table->enum('status', ['In Progress', 'Complete', 'Error'])->default('In Progress');
            $table->text('error_message')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('processed_files');
    }
};
