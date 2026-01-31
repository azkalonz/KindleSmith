<?php

namespace App\Jobs;

use App\Models\ProcessedFile;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

use function Illuminate\Filesystem\join_paths;

class ProcessFileJob implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels, InteractsWithQueue;

    public $timeout = 900;
    protected ProcessedFile $processedFile;

    /**
     * Create a new job instance.
     */
    public function __construct(ProcessedFile $processedFile)
    {
        $this->processedFile = $processedFile;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $filePath = storage_path('app/private/' . $this->processedFile->input_file_path);

            // Check if file exists
            if (!file_exists($filePath)) {
                throw new \Exception('Input file not found' . $this->processedFile->input_file_path);
            }

            $outputPath = $filePath;

            // Process with k2pdfopt if kindle_friendly is true
            if ($this->processedFile->kindle_friendly) {
                $outputPath = $this->processKindleFriendly($filePath);
            }

            // Process with ebook-modify if remove_hyphens is true
            if ($this->processedFile->remove_hyphens) {
                $this->removeHyphens($outputPath);
            }

            // Update status to complete
            $this->processedFile->update([
                'status' => 'Complete',
                'output_file_path' => str_replace(storage_path('app/'), '', $outputPath),
            ]);

            Log::info('File processed successfully', ['processed_file_id' => $this->processedFile->id]);
        } catch (\Exception $e) {
            // Update status to error
            $this->processedFile->update([
                'status' => 'Error',
                'error_message' => $e->getMessage(),
            ]);

            Log::error('File processing failed', [
                'processed_file_id' => $this->processedFile->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process file with k2pdfopt for Kindle-friendly view
     */
    private function processKindleFriendly(string $filePath): string
    {
        $outputName = $this->processedFile->output_name ?? pathinfo($filePath, PATHINFO_FILENAME) . '_kindle';
        $outputDir = join_paths(base_path(), 'storage', 'app', 'public', 'outputs');
        $outputPath = $outputDir . DIRECTORY_SEPARATOR . $outputName;

        // Build command with k2pdfopt arguments
        $command = [join_paths(base_path(), 'lib', 'k2pdfopt'), '-nt 8'];

        // Add optional parameters
        if ($this->processedFile->width) {
            $command[] = '-dev_' . $this->processedFile->width;
        }

        if ($this->processedFile->preview_page) {
            $command[] = '-p';
            $command[] = (string) $this->processedFile->preview_page;
        }

        if ($this->processedFile->margin) {
            $command[] = '-m';
            $command[] = (string) $this->processedFile->margin;
        }

        if ($this->processedFile->max_columns) {
            $command[] = '-col';
            $command[] = (string) $this->processedFile->max_columns;
        }

        if ($this->processedFile->font_size) {
            $command[] = '-fs';
            $command[] = (string) $this->processedFile->font_size;
        }

        // Add output and input paths
        $command[] = '-o';
        $command[] = $outputPath;
        $command[] = $filePath;

        $process = new Process($command);
        $process->setTimeout($this->timeout);
        $process->run();

        if (!$process->isSuccessful()) {
            Log::info('FAIL:::' . $process->getErrorOutput());
            $this->processedFile->update([
                'status' => 'Error',
                'error_message' => $process->getErrorOutput(),
            ]);
            throw new \Exception('k2pdfopt processing failed: ' . $process->getErrorOutput());
        }

        return $outputPath;
    }

    /**
     * Remove hyphens using ebook-modify
     */
    private function removeHyphens(string $filePath): void
    {
        $command = [
            'ebook-modify',
            $filePath,
        ];

        $process = new Process($command);

        $process->setTimeout($this->timeout);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \Exception('k2pdfopt processing failed: ' . $process->getErrorOutput());
        }
    }
}
