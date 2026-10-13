import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';

function CreateSSNew() {
    const [isBoxOpen, setBoxOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleCreateSpreadsheet = async (title) => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (!userId) {
            toast.error('User not authenticated');
            navigate('/');
            return;
        }

        const sheetName = title && title.trim() ? title.trim() : 'Untitled Spreadsheet';

        try {
            setIsSubmitting(true);
            const response = await axios.post(
                `${API_BASE_URL}/api/spreadsheet`,
                { name: sheetName, owner: userId },
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            toast.success('Spreadsheet created successfully');
            setBoxOpen(false);
            navigate(`/spreadsheet/${response.data.id}`);
        } catch (error) {
            console.error('Failed to create spreadsheet:', error);
            const errMsg = error.response?.data?.error || error.message || 'Failed to create spreadsheet';
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="inline-block">
            <button
                onClick={() => setBoxOpen(true)}
                className="flex items-center text-sm font-medium bg-blue-600 text-white rounded-md py-1.5 px-3 hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
                <FaPlus className="mr-1.5" />
                New
            </button>
            <Modal
                isOpen={isBoxOpen}
                isSubmitting={isSubmitting}
                onClose={() => setBoxOpen(false)}
                onCreate={handleCreateSpreadsheet}
            />
        </div>
    );
}

const Modal = ({ isOpen, onClose, onCreate, isSubmitting }) => {
    const [newSpreadsheetName, setNewSpreadsheetName] = useState('');

    const handleSubmit = () => {
        onCreate(newSpreadsheetName);
        setNewSpreadsheetName('');
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all text-left">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Spreadsheet</h2>
                <input
                    type="text"
                    value={newSpreadsheetName}
                    onChange={(e) => setNewSpreadsheetName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter spreadsheet title..."
                    autoFocus
                    className="w-full p-2.5 border border-gray-300 rounded-lg mb-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateSSNew;
