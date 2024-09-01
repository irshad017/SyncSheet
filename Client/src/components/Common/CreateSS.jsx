import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const DEFAULT_ROW_COUNT = 199;
const DEFAULT_COLUMN_COUNT = 26;

// Function to generate a 2D array representing the spreadsheet grid

function CreateSS ( ) {
    const [isBoxOpen,setBoxOpen] = useState(false)
    const navigate = useNavigate();
    const [user, setUser] = useState("");
    const [spreadsheets, setSpreadsheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
    const history = useNavigate();


    useEffect(() => {
        const fetchUserDetails = async () => {
            const userId = localStorage.getItem('userId');
            try {
                const userResponse = await axios.get(`http://localhost:5000/api/user/${userId}`);
                setUser(userResponse.data);
                setSpreadsheets(userResponse.data.spreadsheet);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch user details:', error);
            }
        };

        fetchUserDetails();
        return () => {
        setSpreadsheets([]);
        setLoading(true);
        };
    }, []);

    const handleOpenSpreadsheet = (spreadsheetId) => {
        history(`/spreadsheet/${spreadsheetId}`);
        console.log(`Open spreadsheet with ID: ${spreadsheetId}`);
    };

    const handleCreateSpreadsheet = async (Title) => {
        // e.preventDefault();
        const userId = localStorage.getItem('userId');
        console.log(userId)
        console.log(Title)
        try {
            console.log('Creating spreadsheet with name:', Title, 'and owner:', userId);
            const response = await axios.post('http://localhost:5000/api/spreadsheet', {
                name: Title,
                owner: userId
            });
            console.log('Spreadsheet created:', response.data);
            setSpreadsheets([...spreadsheets, response.data]);
            setNewSpreadsheetName('');
            toast.success('Spreadsheet created successfully');
            handleOpenSpreadsheet(response.data.id);
        } catch (error) {
            console.error('Failed to create spreadsheet:', error);
            toast.error(`Failed to create spreadsheet: ${error.response?.data?.error || error.message}`);
        }
    };

    

    return (
        <div className="p-4">
            <button
                onClick={() => setBoxOpen(true)}
                className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Create
            </button>
            <Modal
                isOpen={isBoxOpen}
                onClose={() => setBoxOpen(false)}
                onCreate={handleCreateSpreadsheet}
            />
        </div>
    );
}



const Modal = ({ isOpen, onClose, onCreate}) => {
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const [newSpreadsheetName,setNewSpreadsheetName] = useState('')

    const handleSubmit = () => {
        onCreate(newSpreadsheetName);
        setNewSpreadsheetName('');
        setError('Creating')
        onClose();
    };

    const handleOverlayClick =(e)=> {
        if(e.target === e.currentTarget){
            handleSubmit()
        }
    }

    if (!isOpen) return null;

    const handleSub = (e)=>{
        if(e.key === 'Enter'){
            onCreate(newSpreadsheetName)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50" onClick={handleOverlayClick}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm mx-4 sm:mx-6 lg:max-w-md lg:mx-8">
                <h2 className="text-lg font-semibold mb-4">Create a New Spreadsheet</h2>
                {error && <p className="text-red-500 mb-2 text-sm text-center">{error}</p>}
                <input
                    type="text"
                    value={newSpreadsheetName}
                    onChange={(e) => setNewSpreadsheetName(e.target.value)}
                    onKeyDown={(e)=>{handleSub(e)}}
                    placeholder="Enter title"
                    required
                    className=" p-2 min-w-full border border-gray-300 rounded mb-4"
                />
                <div className="flex flex-col sm:flex-row sm:justify-end">
                    <button
                        
                        onClick={handleSubmit}
                        className="bg-blue-500 text-white px-4 py-2 rounded mb-2 sm:mb-0 sm:mr-2 hover:bg-blue-600"
                    >
                        Create
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}


export default CreateSS;
