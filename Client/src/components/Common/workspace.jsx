import React, { useCallback, useEffect, useState, memo } from 'react';
import { faArrowAltCircleLeft, faSave, faTrash, faUser, faSignOut, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import CreateSS from './CreateSS';
import toast, { Toaster } from 'react-hot-toast';

function WorkSpace() {
    const [isSliderOpen, setSliderOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState(null);
    const [spreadsheets, setSpreadsheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUserDetails = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (!userId || !token) {
            toast.error('Please login to access workspace');
            navigate('/');
            return;
        }

        try {
            const userResponse = await axios.get(`${API_BASE_URL}/api/user/${userId}`);
            if (userResponse.data) {
                setUser(userResponse.data);
                const sheets = Array.isArray(userResponse.data.spreadsheet)
                    ? userResponse.data.spreadsheet.filter(Boolean)
                    : [];
                setSpreadsheets(sheets);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            toast.error('Failed to load user spreadsheets');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    const handleSheetCreated = (newSheet) => {
        if (newSheet) {
            setSpreadsheets((prev) => [newSheet, ...prev]);
        }
    };

    const handleDeleteSheet = async (sheetId, isOwner) => {
        if (!sheetId) return;
        const confirmMessage = isOwner
            ? 'Are you sure you want to permanently delete this spreadsheet? As the creator, it will be deleted for you and all collaborators.'
            : 'Are you sure you want to remove this spreadsheet from your workspace? The creator and other collaborators will still keep their access.';

        const confirmDelete = window.confirm(confirmMessage);
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId') || user?._id;
            const response = await axios.delete(`${API_BASE_URL}/api/spreadsheet/${sheetId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: { userId },
            });
            setSpreadsheets((prev) => prev.filter((item) => (item._id || item) !== sheetId));
            const msg = response.data?.message || (isOwner ? 'Spreadsheet permanently deleted' : 'Spreadsheet removed from workspace');
            toast.success(msg);
        } catch (err) {
            console.error('Error deleting spreadsheet:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete spreadsheet';
            toast.error(errMsg);
        }
    };

    const currentUserId = user?._id || localStorage.getItem('userId');

    return (
        <div className="flex h-screen bg-gray-50">
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onProfileClick={() => setSliderOpen(!isSliderOpen)}
                />
                <div className="p-4 sm:p-6 flex-1 overflow-auto">
                    <Templates
                        spreadsheets={spreadsheets}
                        searchTerm={searchTerm}
                        loading={loading}
                        currentUserId={currentUserId}
                        onDelete={handleDeleteSheet}
                        onCreated={handleSheetCreated}
                    />
                </div>
            </div>
            <ProfileSlider
                isOpen={isSliderOpen}
                onClose={() => setSliderOpen(false)}
                user={user}
                spreadsheets={spreadsheets}
            />
            <Toaster position="top-right" />
        </div>
    );
}

const Header = memo(({ onProfileClick, searchTerm, onSearchChange }) => {
    const navigate = useNavigate();
    return (
        <header className="flex justify-between items-center px-4 py-3 bg-white border-b shadow-sm">
            <div className="flex items-center space-x-3">
                <button
                    onClick={() => navigate('/')}
                    className="text-blue-700 hover:text-blue-900 transition p-1"
                    title="Back to Home"
                >
                    <FontAwesomeIcon className="w-6 h-6" icon={faArrowAltCircleLeft} />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    SheetSync
                </h1>
            </div>
            <div className="flex items-center space-x-3">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search spreadsheets..."
                    className="border border-gray-300 rounded-lg px-3 py-1.5 w-44 sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={onProfileClick}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-700"
                    title="User Profile"
                >
                    <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
});

const Templates = memo(({ spreadsheets, searchTerm, loading, onDelete, currentUserId }) => {
    const navigate = useNavigate();

    const handleOpenSpreadsheet = (spreadsheetId) => {
        navigate(`/spreadsheet/${spreadsheetId}`);
    };

    const reversedSheets = [...spreadsheets].reverse();
    const filteredSheets = reversedSheets.filter((template) => {
        if (!template) return false;
        const name = template.name || 'Untitled Spreadsheet';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Your Spreadsheets</h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    Loading spreadsheets...
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Create Blank Spreadsheet Card */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                            <FontAwesomeIcon icon={faPlus} className="text-xl" />
                        </div>
                        <span className="text-base font-semibold text-gray-800 mb-2">New Spreadsheet</span>
                        <CreateSS />
                    </div>

                    {/* Existing Spreadsheets List */}
                    {filteredSheets.map((template) => {
                        const templateId = template._id || template;
                        const templateName = template.name || 'Untitled Spreadsheet';
                        const templateDate = template.date
                            ? new Date(template.date).toLocaleDateString()
                            : '';
                        const ownerId = template.owner?._id || template.owner;
                        const isOwner = Boolean(
                            ownerId && currentUserId && (ownerId.toString() === currentUserId.toString())
                        );

                        return (
                            <div
                                key={templateId}
                                className="relative border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
                            >
                                <button
                                    onClick={() => onDelete(templateId, isOwner)}
                                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                    title={isOwner ? "Permanently delete spreadsheet (Owner)" : "Remove from your workspace (Collaborator)"}
                                >
                                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                </button>

                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                            <FontAwesomeIcon icon={faSave} className="text-lg" />
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            isOwner
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {isOwner ? 'Owner' : 'Shared'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 truncate" title={templateName}>
                                        {templateName}
                                    </h3>
                                    {templateDate && (
                                        <p className="text-xs text-gray-500 mt-1">Created: {templateDate}</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleOpenSpreadsheet(templateId)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Open
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && filteredSheets.length === 0 && searchTerm && (
                <div className="text-center py-12 text-gray-500">
                    No spreadsheets found matching &quot;{searchTerm}&quot;
                </div>
            )}
        </div>
    );
});

const ProfileSlider = memo(({ isOpen, onClose, user, spreadsheets }) => {
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        toast.success('Logged out successfully');
        navigate('/');
    }, [navigate]);

    if (!isOpen) return null;

    const username = user?.username || localStorage.getItem('username') || 'User';
    const displayName = username.split('@')[0];
    const userSheets = Array.isArray(spreadsheets) ? spreadsheets : [];

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-end z-50 transition-opacity"
            onClick={onClose}
        >
            <div
                className="bg-white p-6 h-full shadow-2xl w-80 sm:w-96 flex flex-col justify-between"
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <div className="flex justify-between items-center pb-4 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Your Profile</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="flex items-center my-6">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mr-4 uppercase">
                            {displayName.charAt(0)}
                        </div>
                        <div className="truncate">
                            <p className="text-lg font-semibold text-gray-800 truncate">{displayName}</p>
                            <p className="text-sm text-gray-500 truncate">{username}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                            Spreadsheets ({userSheets.length})
                        </h3>
                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {userSheets.map((sheet, index) => {
                                const sId = sheet._id || sheet;
                                const sName = sheet.name || 'Untitled';
                                const sDate = sheet.date ? new Date(sheet.date).toLocaleDateString() : '';
                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            onClose();
                                            navigate(`/spreadsheet/${sId}`);
                                        }}
                                        className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition text-sm"
                                    >
                                        <span className="font-medium text-blue-600 truncate mr-2">{sName}</span>
                                        {sDate && <span className="text-xs text-gray-400 whitespace-nowrap">{sDate}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg transition"
                    >
                        <FontAwesomeIcon icon={faSignOut} />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
});

Header.displayName = 'Header';
Templates.displayName = 'Templates';
ProfileSlider.displayName = 'ProfileSlider';

export default WorkSpace;