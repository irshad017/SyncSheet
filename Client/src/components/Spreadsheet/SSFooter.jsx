import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = ({ spreadsheetId, onSaveAndGoBack, title, date }) => {
    const Navigate = useNavigate()
    
    const HandleRoot = ()=>{
        Navigate('/workspace')
    }

    return (
        <footer className="flex justify-between items-center bg-gray-100 p-4 shadow-md">
            <div className="text-gray-700">
                <p className='text-lg text-green-500 '><strong>Title: {title}</strong></p>
                <p className='text-sm'><strong>Created Date: {date}</strong></p>
            </div>
            <button
                onClick={HandleRoot}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
                Save and Go Back
            </button>
        </footer>
    );
};

export default Footer;
