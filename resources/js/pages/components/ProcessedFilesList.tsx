import { useState, useMemo } from 'react';

interface ProcessedFile {
    id: string;
    filename: string;
    dateCreated: string;
    status: 'complete' | 'error' | 'in-progress';
    downloadUrl?: string;
    outputname: string;
    errorMessage: string;
}

interface ProcessedFilesListProps {
    files: ProcessedFile[];
}

const ITEMS_PER_PAGE = 10;

const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':
            return '📄';
        case 'epub':
            return '📕';
        default:
            return '📃';
    }
};

const getStatusColor = (status: 'complete' | 'error' | 'in-progress'): string => {
    if (status === 'complete') return 'bg-green-100 text-green-800';
    if (status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
};

const getStatusText = (status: 'complete' | 'error' | 'in-progress'): string => {
    if (status === 'complete') return '✓ Complete';
    if (status === 'error') return '✗ Error';
    return '… In Progress';
};

export default function ProcessedFilesList({ files }: ProcessedFilesListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'error' | 'in-progress'>('all');

    // Filter files based on search and status
    const filteredFiles = useMemo(() => {
        return files.filter((file) => {
            const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [files, searchQuery, statusFilter]);

    // Paginate files
    const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
    const paginatedFiles = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredFiles, currentPage]);

    // Reset to page 1 when search or filter changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (value: 'all' | 'complete' | 'error') => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    return (
        <div className="w-full max-w-4xl space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Recently Processed</h2>

            {/* Search and Filter Controls */}
            <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center">
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'complete' | 'error' | 'in-progress')}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="in-progress">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="error">Error</option>
                </select>
            </div>

            {/* Files Table */}
            {filteredFiles.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center shadow">
                    <p className="text-slate-600">No processed files found</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg bg-white shadow">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">File Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Date Created</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedFiles.map((file) => (
                                    <tr key={file.id} className="border-b border-slate-200 hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{getFileIcon(file.filename)}</span>
                                                <span className="font-medium text-slate-900">{file.outputname}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{new Date(file.dateCreated).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(file.status)}`}
                                            >
                                                {getStatusText(file.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {file.downloadUrl ? (
                                                <a
                                                    href={file.downloadUrl}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Download
                                                </a>
                                            ) : (
                                                <span className="text-sm text-slate-500">N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow">
                            <p className="text-sm text-slate-600">
                                Showing {Math.min(currentPage * ITEMS_PER_PAGE - ITEMS_PER_PAGE + 1, filteredFiles.length)} to{' '}
                                {Math.min(currentPage * ITEMS_PER_PAGE, filteredFiles.length)} of {filteredFiles.length}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                                currentPage === i + 1
                                                    ? 'bg-slate-900 text-white'
                                                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
