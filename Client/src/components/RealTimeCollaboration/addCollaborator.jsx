import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';

const CustomDropDown = ({ items, onSelect, placeholder, searchValue, onSearch, disabled }) => {
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
        <div ref={containerRef} className="relative w-full max-w-xs">
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchValue}
                    disabled={disabled}
                    onChange={(e) => onSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <FontAwesomeIcon
                    icon={faUserPlus}
                    className="absolute left-3 text-gray-400 text-sm pointer-events-none"
                />
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">
                            {searchValue ? 'No matching users' : 'Type to search users'}
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => handleItemClick(item)}
                                className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition border-b border-gray-50 last:border-b-0 flex items-center space-x-2"
                            >
                                <FontAwesomeIcon icon={faUser} className="text-xs text-gray-400" />
                                <span className="truncate">{item}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const AddCollaboratorForm = ({ spreadsheetId }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

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
                console.error('Error fetching collaborators list:', err);
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

    const handleAddCollaborator = async (username) => {
        if (!username || !username.trim()) {
            toast.error('Please select a valid user');
            return;
        }

        if (!spreadsheetId) {
            toast.error('Spreadsheet ID missing');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/add-collaborator`,
                {
                    spreadsheetId,
                    collaboratorUsername: username.trim(),
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );

            if (response.status === 200) {
                toast.success(`Added ${username} as collaborator!`);
                setSearchTerm('');
            }
        } catch (error) {
            console.error('Error adding collaborator:', error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to add collaborator';
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-3 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:inline">
                Collaboration:
            </span>
            <CustomDropDown
                items={filteredUsers}
                onSelect={handleAddCollaborator}
                placeholder="Share with user..."
                searchValue={searchTerm}
                onSearch={setSearchTerm}
                disabled={loading}
            />
            {loading && <span className="text-xs text-blue-600 animate-pulse">Adding...</span>}
        </div>
    );
};

export default AddCollaboratorForm;