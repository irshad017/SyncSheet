import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = ({ title, date, onSaveAndGoBack }) => {
    const navigate = useNavigate();

    const handleBack = async () => {
        if (onSaveAndGoBack) {
            await onSaveAndGoBack();
        } else {
            navigate('/workspace');
        }
    };

    return (
        <footer className="flex justify-between items-center bg-gray-100 border-t border-gray-200 px-4 py-2.5 text-xs sm:text-sm">
            <div className="text-gray-600 flex items-center space-x-4">
                {title && (
                    <span className="font-semibold text-gray-800">
                        {title}
                    </span>
                )}
                {date && (
                    <span className="hidden sm:inline text-gray-400">
                        Created: {date}
                    </span>
                )}
                <span className="text-gray-400">
                    Auto-saved via Realtime Sync
                </span>
            </div>
            <button
                onClick={handleBack}
                className="bg-blue-600 text-white font-medium py-1 px-3.5 rounded-md hover:bg-blue-700 transition shadow-sm text-xs sm:text-sm"
            >
                Back to Workspace
            </button>
        </footer>
    );
};

export default Footer;
