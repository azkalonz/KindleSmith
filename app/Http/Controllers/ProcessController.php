<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class ProcessController extends Controller
{
    /**
     * Process the uploaded file
     */
    public function store(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
            'kindle_friendly' => 'nullable|boolean',
            'remove_hyphens' => 'nullable|boolean',
        ]);

        try {
            $filePath = $request->input('file_path');

            // Check if file exists
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found at the specified path',
                ], 404);
            }

            // Process with k2pdfopt if kindle_friendly is true
            if ($request->boolean('kindle_friendly')) {
                $this->processKindleFriendly($filePath, $request);
            }

            // Process with ebook-modify if remove_hyphens is true
            if ($request->boolean('remove_hyphens')) {
                $this->removeHyphens($filePath);
            }

            return response()->json([
                'success' => true,
                'message' => 'File processed successfully',
                'file_path' => $filePath,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Processing failed: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Process file with k2pdfopt for Kindle-friendly view
     */
    private function processKindleFriendly($filePath, Request $request)
    {
        $outputName = $request->input('output_name') ?? pathinfo($filePath, PATHINFO_FILENAME) . '_kindle';

        // Build command with k2pdfopt arguments
        $command = ['k2pdfopt.exe'];

        // Add optional parameters
        if ($request->input('width')) {
            $command[] = '-dev_' . $request->input('width');
        }

        if ($request->input('preview_page')) {
            $command[] = '-p';
            $command[] = $request->input('preview_page');
        }

        if ($request->input('margin')) {
            $command[] = '-m';
            $command[] = $request->input('margin');
        }

        if ($request->input('max_columns')) {
            $command[] = '-col';
            $command[] = $request->input('max_columns');
        }

        if ($request->input('font_size')) {
            $command[] = '-fs';
            $command[] = $request->input('font_size');
        }

        // Add output and input paths
        $command[] = '-o';
        $command[] = $outputName;
        $command[] = $filePath;

        $process = new Process($command);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \Exception('k2pdfopt processing failed: ' . $process->getErrorOutput());
        }
    }

    /**
     * Remove hyphens using ebook-modify
     */
    private function removeHyphens($filePath)
    {
        $command = [
            'ebook-modify.exe',
            $filePath,
        ];

        $process = new Process($command);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \Exception('ebook-modify processing failed: ' . $process->getErrorOutput());
        }
    }
}
