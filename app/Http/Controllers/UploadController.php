<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UploadController extends Controller
{
    /**
     * Handle file upload
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        try {
            // Store the file temporarily in the local storage
            $file = $request->file('file');
            $path = $file->storePublicly('uploads/temp', 'local');

            return response()->json([
                'success' => true,
                'path' => $path,
                'filename' => $file->getClientOriginalName(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed: ' . $e->getMessage(),
            ], 400);
        }
    }
}
