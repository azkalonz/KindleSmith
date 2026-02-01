<?php

namespace App\Http\Controllers;

use App\Models\ProcessedFile;
use App\Jobs\ProcessFileJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
                'output_name' => $request->input('output_name') ?? array_reverse(explode("/", $filePath))[0],
                'margin' => $request->input('margin'),
                'max_columns' => $request->input('max_columns'),
                'font_size' => $request->input('font_size'),
                'status' => 'In Progress',
            ]);

            // Dispatch the processing job
            ProcessFileJob::dispatch($processedFile);

            // Redirect back to the welcome page and flash a message
            return redirect()->route('home')
                ->with('flash', [
                    'success' => true,
                    'message' => 'File processing started'
                ])
                ->with('processed_file_id', $processedFile->id);
        } catch (\Exception $e) {
            // Redirect back with error message
            return redirect()->back()->with('flash', [
                'success' => false,
                'message' => 'Failed to start file processing: ' . $e->getMessage(),
            ]);
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
                    'outputname' => $file->output_name,
                    'dateCreated' => $file->created_at->toIso8601String(),
                    'status' => strtolower($file->status === 'Complete' ? 'complete' : ($file->status === 'Error' ? 'error' : 'in-progress')),
                    'errorMessage' => $file->error_message,
                    'downloadUrl' => route('processed-files.download', ['id' => $file->id]),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $processedFiles,
        ]);
    }

    /**
     * Download a processed file (output if available, otherwise the original input)
     */
    public function download($id)
    {
        $file = ProcessedFile::findOrFail($id);

        $path = storage_path('app/' . $file['output_file_path']);
        if (!file_exists($path)) {
            abort(404, 'File not found');
        }

        return response()->download($path);
    }
}
