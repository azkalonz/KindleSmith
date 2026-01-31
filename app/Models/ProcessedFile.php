<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProcessedFile extends Model
{
    protected $fillable = [
        'input_file_path',
        'output_file_path',
        'kindle_friendly',
        'remove_hyphens',
        'width',
        'height',
        'preview_page',
        'output_name',
        'margin',
        'max_columns',
        'font_size',
        'status',
        'error_message',
    ];

    protected $casts = [
        'kindle_friendly' => 'boolean',
        'remove_hyphens' => 'boolean',
        'width' => 'integer',
        'height' => 'integer',
        'preview_page' => 'integer',
        'margin' => 'decimal:2',
        'max_columns' => 'integer',
        'font_size' => 'integer',
    ];
}
