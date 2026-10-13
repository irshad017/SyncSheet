import React, { useEffect, useRef, useState } from 'react';
import { FaSave, FaFileExport, FaFileImport, FaBars, FaShareAlt } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faUser, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import CreateSSNew from '../Common/CreateSSNew';
import CreateSSNewList from '../Common/createSSNewList';
import { useNavigate, useParams } from 'react-router-dom';

const CustomDropDown = ({ items, onSelect, placeholder, searchValue, onSearch }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const handleItemClick = (item) => {
        onSelect(item);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => onSearch(e.target.value)}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-40 sm:w-56 text-gray-800 text-xs sm:text-sm pl-8 pr-3 py-1.5 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaShareAlt className="absolute left-2.5 text-gray-400 text-xs pointer-events-none" />
            </div>
            {isOpen && (
                <ul className="absolute right-0 mt-1 max-h-60 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-y-auto">
                    {items.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-gray-500">No users found</li>
                    ) : (
                        items.map((item, index) => (
                            <li
                                key={index}
                                onClick={() => handleItemClick(item)}
                                className="px-3 py-2 text-xs text-gray-800 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition border-b border-gray-100 last:border-b-0"
                            >
                                {item}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

const Header = ({ sheetId, title, cells, onSave, onImport }) => {
    const { id } = useParams();
    const effectiveSheetId = sheetId || id;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [filterUsers, setFilteredUsers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/emails`);
                if (response.data && response.data.data && isMounted) {
                    const currentUsername = localStorage.getItem('username') || '';
                    const emails = response.data.data
                        .map((u) => u.username)
                        .filter((u) => u && u.toLowerCase() !== currentUsername.toLowerCase());
                    setAllUsers(emails);
                    setFilteredUsers(emails);
                }
            } catch (err) {
                console.error('Error fetching collaborators:', err);
            }
        };
        fetchUsers();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsers(allUsers);
        } else {
            const filtered = allUsers.filter((email) =>
                email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, allUsers]);

    const handleSaveAndBack = async () => {
        setIsSaving(true);
        try {
            if (onSave) {
                await onSave();
            }
            toast.success('Spreadsheet saved');
            navigate('/workspace');
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Failed to save spreadsheet');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportCSV = () => {
        if (!cells || !cells.length) {
            toast.error('No spreadsheet data to export');
            return;
        }

        try {
            // Find non-empty bounds to make exported CSV clean
            const csvRows = cells.map((row) =>
                row
                    .map((cell) => {
                        const val = cell !== undefined && cell !== null ? String(cell) : '';
                        // Escape quotes and wrap in quotes if contains comma or newline
                        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                            return `"${val.replace(/"/g, '""')}"`;
                        }
                        return val;
                    })
                    .join(',')
            );

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${title || 'spreadsheet'}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Spreadsheet exported as CSV');
        } catch (err) {
            console.error('CSV export error:', err);
            toast.error('Failed to export CSV');
        }
    };

    const handleImportCSVClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const rows = text.split(/\r?\n/).map((row) => {
                    // Simple CSV parser supporting quotes
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    for (let i = 0; i < row.length; i++) {
                        const char = row[i];
                        if (char === '"' && row[i + 1] === '"') {
                            current += '"';
                            i++;
                        } else if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            result.push(current);
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    result.push(current);
                    return result;
                });

                if (onImport) {
                    onImport(rows);
                    toast.success('CSV imported successfully');
                }
            } catch (parseErr) {
                console.error('Failed to parse CSV:', parseErr);
                toast.error('Invalid CSV file format');
            }
        };
        reader.readAsText(file);
        // Reset file input so re-selecting same file works
        e.target.value = '';
    };

    const handleShareUser = async (email) => {
        setSearchTerm(email);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/add-collaborator`,
                {
                    spreadsheetId: effectiveSheetId,
                    collaboratorUsername: email,
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );

            if (response.status === 200) {
                toast.success(`Shared with ${email}!`);
                setSearchTerm('');
            }
        } catch (err) {
            console.error('Error sharing sheet:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to share';
            toast.error(errMsg);
        }
    };

    return (
        <header className="bg-gray-900 text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-md select-none">
            {/* Left side actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                    onClick={() => navigate('/workspace')}
                    className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition"
                    title="Back to Workspace"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                </button>

                <div className="hidden md:flex items-center space-x-2">
                    <CreateSSNew />

                    <button
                        onClick={handleSaveAndBack}
                        disabled={isSaving}
                        className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition shadow-sm"
                    >
                        <FaSave className="mr-1.5" />
                        {isSaving ? 'Saving...' : 'Save & Back'}
                    </button>

                    <button
                        onClick={handleImportCSVClick}
                        className="flex items-center bg-amber-600 hover:bg-amber-700 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition shadow-sm"
                    >
                        <FaFileImport className="mr-1.5" />
                        Import
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition shadow-sm"
                    >
                        <FaFileExport className="mr-1.5" />
                        Export
                    </button>

                    {/* Hidden file input for CSV Import */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                    />
                </div>

                {/* Mobile hamburger button */}
                <button
                    className="md:hidden text-white p-1.5 rounded-md hover:bg-gray-800"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <FontAwesomeIcon icon={faClose} className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
                </button>
            </div>

            {/* Title display */}
            <div className="truncate px-2 text-center">
                <span className="text-sm sm:text-base font-semibold text-gray-100 truncate">
                    {title || 'Spreadsheet'}
                </span>
            </div>

            {/* Right side sharing & profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
                <CustomDropDown
                    items={filterUsers}
                    onSelect={handleShareUser}
                    placeholder="Share with..."
                    searchValue={searchTerm}
                    onSearch={setSearchTerm}
                />

                <button
                    onClick={() => navigate('/workspace')}
                    className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition"
                    title="Profile / Workspace"
                >
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                </button>
            </div>

            {/* Mobile dropdown menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-14 left-3 right-3 bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2 shadow-xl z-50">
                    <CreateSSNewList />

                    <button
                        onClick={handleSaveAndBack}
                        className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md text-sm transition"
                    >
                        <FaSave className="mr-2" />
                        Save & Back
                    </button>

                    <button
                        onClick={handleImportCSVClick}
                        className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-3 rounded-md text-sm transition"
                    >
                        <FaFileImport className="mr-2" />
                        Import CSV
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 rounded-md text-sm transition"
                    >
                        <FaFileExport className="mr-2" />
                        Export CSV
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;
