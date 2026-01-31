# KindleSmith: PDF/EPUB EDITOR

A web application for processing PDF and EPUB files with support for Kindle-friendly conversion and hyphenation removal.

## Features

- **File Upload**: Upload PDF and EPUB files with progress tracking
- **Kindle-Friendly Conversion**: Transform PDFs into Kindle-optimized layouts using k2pdfopt with customizable parameters:
    - Width and height adjustments
    - Page preview selection
    - Margin configuration
    - Column management
    - Font size customization
- **Hyphen Removal**: Remove hyphens from EPUB files using ebook-modify
- **Background Processing**: Files are processed asynchronously without blocking the UI
- **File History**: View all processed files with status tracking (In Progress, Complete, Error)
- **Search & Filter**: Find processed files by name and filter by status
- **Pagination**: Browse processed files with 10 items per page
- **Download**: Download original or processed output files
- **Real-time Updates**: Automatic polling every 5 seconds to reflect processing status

## Prerequisites

- PHP 8.1 or higher
- Node.js 16+ and npm
- Composer
- Docker (optional, for development)
- k2pdfopt executable
- ebook-modify executable (from Calibre)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pdf-epub-processor
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Environment Configuration

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and configure:

- Database connection (if using a database other than SQLite)
- Queue driver (set to `sync` for testing, `database` or `redis` for production)

### 5. Database Setup

```bash
php artisan migrate
```

### 6. Build Assets

```bash
npm run build
```

### 7. (Optional) Development with Hot Reload

```bash
npm run dev
```

## Running the Application

### Development

Start the Laravel development server:

```bash
php artisan serve
```

In a separate terminal, start the asset build watcher:

```bash
npm run dev
```

### Queue Worker (Background Processing)

To process files in the background, start a queue worker:

```bash
php artisan queue:work
```

For production, use Supervisor to manage the queue worker process.

### Docker Compose (Optional)

If using Docker:

```bash
docker-compose up -d
```

## Project Structure

```
app/
├── Http/Controllers/
│   ├── UploadController.php       # Handles file uploads
│   └── ProcessController.php       # Handles processing and retrieval
├── Jobs/
│   └── ProcessFileJob.php          # Background job for file processing
└── Models/
    └── ProcessedFile.php           # Database model
resources/
├── js/
│   └── pages/
│       ├── welcome.tsx             # Main upload and form page
│       └── components/
│           └── ProcessedFilesList.tsx  # File history list
└── css/
    └── app.css                    # Styles
database/
└── migrations/
    └── 0001_02_01_000003_create_processed_files_table.php
routes/
└── web.php                        # API routes
```

## API Endpoints

- `POST /upload` - Upload a file
    - Returns: `{ success, path, filename }`
- `POST /process` - Process an uploaded file
    - Returns: Redirect with flash message
    - Dispatches background job
- `GET /processed-files` - List all processed files
    - Returns: `{ success, data: [...] }`
- `GET /download/{id}` - Download a processed file

## Configuration

### Default Kindle Parameters

Edit `resources/js/pages/welcome.tsx` to change defaults:

```typescript
const [formData, setFormData] = useState({
    width: '1072', // Pixel width
    height: '1442', // Pixel height
    previewPage: '', // Page number to preview (optional)
    outputName: '', // Output filename (auto-filled with input name)
    margin: '0.2', // Margin value
    maxColumns: '1', // Maximum columns
    fontSize: '14', // Font size
});
```

## Troubleshooting

### Queue Not Processing

- Check that `php artisan queue:work` is running
- Verify queue driver in `.env` is set correctly
- Check logs: `storage/logs/laravel.log`

### k2pdfopt/ebook-modify Not Found

- Ensure executables are in system PATH
- Or update the command paths in `ProcessFileJob.php`

### Files Not Uploading

- Check disk space
- Verify `storage/app` directory is writable
- Check maximum upload size in `.env` and server config

### Database Errors

- Run migrations: `php artisan migrate`
- Check database connection in `.env`

## To-Do / Future Improvements

### High Priority

- [ ] Add user authentication and authorization
- [ ] Store processed files in public disk for direct URLs
- [ ] Implement batch file processing
- [ ] Add file size validation and limits
- [ ] Integrate real-time WebSocket updates instead of polling
- [ ] Add job retry logic with configurable attempts
- [ ] Create admin dashboard for monitoring

### Medium Priority

- [ ] Support for additional file formats (MOBI, AZW)
- [ ] Customizable processing profiles/presets
- [ ] Email notifications when processing completes
- [ ] File compression options
- [ ] Progress indicators per file type
- [ ] Undo/rollback functionality
- [ ] Multi-language support

### Low Priority

- [ ] Dark mode UI toggle
- [ ] File comparison tool (before/after)
- [ ] Processing history export (CSV/JSON)
- [ ] API rate limiting
- [ ] Mobile app version
- [ ] Advanced scheduling for batch jobs
- [ ] Integration with cloud storage (S3, Azure Blob)

### Technical Debt

- [ ] Add comprehensive unit and integration tests
- [ ] Implement error logging and monitoring
- [ ] Add TypeScript strict mode
- [ ] Set up CI/CD pipeline
- [ ] Performance optimization for large files
- [ ] Database query optimization

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details
