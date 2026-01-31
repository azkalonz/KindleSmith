import { Head, router, usePage } from '@inertiajs/react';
import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import ProcessedFilesList from './components/ProcessedFilesList';

export default function Welcome() {
    const [kindleOptions, setKindleOptions] = useState(false);
    const [epubOptions, setEpubOptions] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dialog for flash messages
    const { flash } = usePage().props as any;
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setDialogMessage(flash.success ?? flash.error);
            setDialogVisible(true);
        }
    }, [flash]);

    // Fetch processed files from the API
    const [processedFiles, setProcessedFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(true);

    useEffect(() => {
        fetchProcessedFiles();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchProcessedFiles, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchProcessedFiles = async () => {
        try {
            const response = await fetch('/processed-files');
            const result = await response.json();
            if (result.success) {
                setProcessedFiles(result.data);
            }
        } catch (error) {
            console.error('Error fetching processed files:', error);
        } finally {
            setLoadingFiles(false);
        }
    };

    const [formData, setFormData] = useState({
        width: '1072',
        height: '1442',
        previewPage: '',
        outputName: '',
        margin: '0.2',
        maxColumns: '1',
        fontSize: '14',
    });

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setFormData((prev) => ({
                ...prev,
                outputName: selectedFile.name,
            }));
            await uploadFile(selectedFile);
        }
    };

    const uploadFile = async (fileToUpload: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadedFilePath(null);

        const formData = new FormData();
        formData.append('file', fileToUpload);

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    setUploadProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    setUploadedFilePath(response.path);
                    setUploadProgress(100);
                } else {
                    alert('Upload failed');
                    setFile(null);
                    setUploadedFilePath(null);
                }
            });

            xhr.addEventListener('error', () => {
                alert('Error uploading file');
                setFile(null);
                setUploadedFilePath(null);
            });

            xhr.open('POST', '/upload');
            xhr.send(formData);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
            setFile(null);
            setUploadedFilePath(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!uploadedFilePath) {
            alert('Please upload a file first');
            return;
        }

        setIsProcessing(true);

        const data = new FormData();
        data.append('file_path', uploadedFilePath);

        if (kindleOptions) {
            if (formData.width) data.append('width', formData.width);
            if (formData.height) data.append('height', formData.height);
            if (formData.previewPage) data.append('preview_page', formData.previewPage);
            if (formData.outputName) data.append('output_name', formData.outputName);
            if (formData.margin) data.append('margin', formData.margin);
            if (formData.maxColumns) data.append('max_columns', formData.maxColumns);
            if (formData.fontSize) data.append('font_size', formData.fontSize);
            data.append('kindle_friendly', 'true');
        }

        if (epubOptions) {
            data.append('remove_hyphens', 'true');
        }

        try {
            router.post('/process', data);
            // Refresh processed files after submission
            setTimeout(() => {
                fetchProcessedFiles();
            }, 1000);
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-4xl font-bold text-slate-900">PDF/EPUB Processor</h1>
                        <p className="text-slate-600">Upload and transform your documents</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-lg">
                        <div>
                            <div
                                className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-slate-400"
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                            >
                                <div className="space-y-2">
                                    <div className="text-4xl">📄</div>
                                    <p className="font-medium text-slate-700">{file ? file.name : 'Drop your file here'}</p>
                                    <p className="text-sm text-slate-500">
                                        {isUploading ? 'Uploading...' : file ? 'Click to change' : 'or click to browse'}
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.epub"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>
                            {isUploading && (
                                <div className="mt-4 space-y-2">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-center text-sm text-slate-600">{Math.round(uploadProgress)}%</p>
                                </div>
                            )}
                            {uploadedFilePath && (
                                <div className="mt-4 rounded-lg bg-green-50 p-3 text-center">
                                    <p className="text-sm font-medium text-green-700">✓ File uploaded successfully</p>
                                </div>
                            )}
                        </div>

                        {uploadedFilePath && (
                            <div className="space-y-3">
                                <label className="flex cursor-pointer items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300"
                                        checked={kindleOptions}
                                        onChange={(e) => setKindleOptions(e.target.checked)}
                                    />
                                    <span className="text-sm text-slate-700">Turn PDF into Kindle-friendly view</span>
                                </label>
                                {kindleOptions && (
                                    <div className="ml-7 space-y-3 rounded-lg bg-slate-50 p-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Width</label>
                                            <input
                                                type="number"
                                                name="width"
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                placeholder="Width in pixels"
                                                value={formData.width}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Height</label>
                                            <input
                                                type="number"
                                                name="height"
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                placeholder="Height in pixels"
                                                value={formData.height}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Preview Page</label>
                                            <input
                                                type="number"
                                                name="previewPage"
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                placeholder="Page number"
                                                value={formData.previewPage}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Output Name</label>
                                            <input
                                                type="text"
                                                name="outputName"
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                placeholder="Output filename"
                                                value={formData.outputName}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Margin</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="margin"
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                placeholder="Margin value"
                                                value={formData.margin}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Maximum Columns</label>
                                            <input
                                                type="number"
                                                name="maxColumns"
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                placeholder="Number of columns"
                                                value={formData.maxColumns}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Font Size</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="fontSize"
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                placeholder="Font size"
                                                value={formData.fontSize}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                )}
                                <label className="flex cursor-pointer items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300"
                                        checked={epubOptions}
                                        onChange={(e) => setEpubOptions(e.target.checked)}
                                    />
                                    <span className="text-sm text-slate-700">Remove hyphens for EPUB</span>
                                </label>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Process File'}
                        </button>
                    </form>

                    {/* Flash dialog */}
                    {dialogVisible && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setDialogVisible(false)} />
                            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                                <h3 className="text-lg font-medium text-slate-900">{dialogMessage}</h3>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => setDialogVisible(false)} className="rounded bg-slate-900 px-3 py-1 text-white">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <ProcessedFilesList files={processedFiles} />
                </div>
            </div>
        </>
    );
}
