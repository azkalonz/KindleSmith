<?php

namespace App\Http\Controllers;

use App\Models\ProcessedFile;
use App\Jobs\ProcessFileJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProcessController extends Controller
{
    /**
     * Process the uploaded file
     */
    public function store(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
            'kindle_friendly' => 'nullable|in:true,false',
            'remove_hyphens' => 'nullable|in:true,false',
            'width' => 'nullable|integer',
            'height' => 'nullable|integer',
            'preview_page' => 'nullable|integer',
            'output_name' => 'nullable|string',
            'margin' => 'nullable|numeric',
            'max_columns' => 'nullable|integer',
            'font_size' => 'nullable|integer',
        ]);

        try {
            $filePath = $request->input('file_path');

            // Check if file exists
            if (!Storage::disk('local')->exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found at the specified path'
                ], 404);
            }

            // Create a processed file record
            $processedFile = ProcessedFile::create([
                'input_file_path' => $filePath,
                'kindle_friendly' => $request->boolean('kindle_friendly'),
                'remove_hyphens' => $request->boolean('remove_hyphens'),
                'width' => $request->input('width'),
                'height' => $request->input('height'),
                'preview_page' => $request->input('preview_page'),
                'output_name' => $request->input('output_name'),
                'margin' => $request->input('margin'),
                'max_columns' => $request->input('max_columns'),
                'font_size' => $request->input('font_size'),
                'status' => 'In Progress',
            ]);

            // Dispatch the processing job
            ProcessFileJob::dispatch($processedFile);

            return response()->json([
                'success' => true,
                'message' => 'File processing started',
                'processed_file_id' => $processedFile->id,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Processing failed: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get processed files
     */
    public function index()
    {
        $processedFiles = ProcessedFile::latest('created_at')
            ->get()
            ->map(function ($file) {
                // Extract filename from path
                $filename = pathinfo($file->output_file_path ?? $file->input_file_path, PATHINFO_BASENAME);

                return [
                    'id' => (string) $file->id,
                    'filename' => $filename,
                    'dateCreated' => $file->created_at->toIso8601String(),
                    'status' => strtolower($file->status === 'Complete' ? 'complete' : ($file->status === 'Error' ? 'error' : 'in-progress')),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $processedFiles,
        ]);
    }
}
