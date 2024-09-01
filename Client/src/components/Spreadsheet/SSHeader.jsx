// EFFICIENT CODE------
// EFFICIENT CODE------
// EFFICIENT CODE------
// EFFICIENT CODE------
// EFFICIENT CODE------
// EFFICIENT CODE------
import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaPlus, FaSave, FaFileExport, FaFileImport, FaUndo, FaRedo, FaBars, FaShare, FaCheckCircle, FaCrosshairs, FaRegCheckCircle, FaDownload, FaNeos, FaPills } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faShare, faUsd, faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import toast, { ToastBar, Toaster } from 'react-hot-toast';
import CreateSS from '../Common/CreateSS';
import CreateSSNew from '../Common/CreateSSNew';
import CreateSSNewList from '../Common/createSSNewList';
import { useNavigate, useParams } from 'react-router-dom';
import AddCollaboratorForm from '../RealTimeCollaboration/addCollaborator';

// Custom Dropdown Component
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
        <div ref={containerRef} className='relative'>
            <input
                type='text'
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="lg:w-60 md:w-24 mr-3 sm:w-32 w-40  text-black px-1  md:px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            />
            <FontAwesomeIcon className='relative lg:-left-12 md:-left-10 -left-9 text-lg text-gray-800 md:h-6 md:w-6 w-5 h-5 top-0.5'  icon={faShare} ></FontAwesomeIcon>
            {isOpen && (
                <div className=''>
                <ul className="absolute lg:left-0 md:-left-24 left-0 max-h-80 sm:max-w-60 sm:min-w-36 min-w-44 bg-white border rounded-md shadow-lg mt-1 z-10 overflow-y-auto">
                    {items.length === 0 ? (
                        <li className="px-4 py-2 text-gray-500">No results</li>
                    ) : (
                        items.map((item, index) => (
                            <li
                                key={index}
                                onClick={() => handleItemClick(item)}
                                className="border-2 border-gray-200 px-4 py-2 text-black hover:bg-gray-200 cursor-pointer"
                            >
                                {item}
                            </li>
                        ))
                    )}
                </ul>
                </div>
            )}
        </div>
    );
};

// Header Component
const Header = ({ sheetId }) => {
    const {id} = useParams()
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [noti, setNoti] = useState(false);
    const [ShareMsg, setShareMsg] = useState(false);
    const [FailedMsg, setFailedMsg] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [SheetDATA, setSheetDATA] = useState([])
    const UserId = localStorage.getItem('UserId')
    const [showCollabNoti,setShowCollabNoti] = useState(false)
    const [User,setUser] = useState([])
    const [temp,setTemp] = useState([])
    const [filterUsers, setFilteredUsers] = useState([]);
    const [Loading, setLoading] = useState(false)
    const [cellHeight, setCellHeight] = useState(22); // Default height
    const [cellWidth, setCellWidth] = useState(90); // Default width
    const [gridWidth, setGridWidth] = useState(1240); // Default grid width
    const Navigate = useNavigate()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/emails');
                if (response && response.data) {
                    const emails = response.data.data.map(user => user.username);
                    setTemp(emails);
                    setFilteredUsers(emails);
                }
            } catch (err) {
                console.log("Error in fetching collaborators");
            }
        };
        fetchUsers();
        return () => {
            // toast.loading("Loading... Emails")
            setLoading(true)
        }
    }, []);

    useEffect(() => {
        const filtered = temp.filter(email => email.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredUsers(filtered);
    }, [searchTerm, temp]);


    const handleSave = () => {
        console.log("hello data save")
        Navigate('/workspace')
        setNoti(true);
        setTimeout(() => setNoti(false), 3000);
    }; 

    const handleUndo = () => {
        if (undoStack.length > 0) {
            const lastAction = undoStack.pop();
            setRedoStack([lastAction, ...redoStack]);
            console.log('Undo action:', lastAction);
        }
    };

    const handleRedo = () => {
        if (redoStack.length > 0) {
            const lastUndo = redoStack.shift();
            setUndoStack([...undoStack, lastUndo]);
            console.log('Redo action:', lastUndo);
        }
    };

    

    const HandleSelectForEmail = async (email) => {
        setSearchTerm(`${email.slice(0, 4)}`);
        setSelectedEmail(email);
        try {
            const response = await axios.post('http://localhost:5000/share', {
                email,
                sheetId,
            });
    
            if (response.status === 200) {
                setShareMsg(`Successfully shared the sheet with ${email}!`);
                showCollabNoti(true);
                setTimeout(() => {
                    setShareMsg("");
                    setShowCollabNoti(false);
                }, 3000); // Hide notification after 3 seconds
                console.log("Successfully Shared with:", email);
                toast.success(`Successfully Shared with:  ${email}`)
            } else if (response.status === 404) {
                setFailedMsg("Email does not exist in the database or sheet not found.");
                console.log("Email does not exist or sheet not found:", email);
            } else {
                toast.error(`Unexpected error occurred while sharing with ${email}`)
                setFailedMsg(`Unexpected error occurred while sharing with ${email}`);
                console.log("Unexpected error:", response.status);
            }
        } catch (err) {
            setSearchTerm("");
            toast.error("Error occurred during sharing!! Not Shared ")
            // setFailedMsg(`Failed to share with ${email} due to a server error.`);
            console.log("Error adding collaborator:", err);
        }
    };
    useEffect(() => {
        console.log("Updated Cell Height:", cellHeight);
        // OnH(cellHeight); // Use updated height value
    }, [cellHeight]); // Dependency array to run effect on height change
    
    useEffect(() => {
        console.log("Updated Cell Width:", cellWidth);
        // OnW(cellWidth); // Use updated width value
    }, [cellWidth]); // Dependency array to run effect on width change


    return (
        <header className="bg-gray-800 text-white md:px-2 py-1 lg:py-3 flex flex-row md:flex-row md:justify-between min-w-full items-center space-y-0 md:space-y-0 sm:px-4">
            {/* Menu Button for Small Devices */}
            <button
                className="md:hidden text-white text-xl mb-4"
                onClick={() => {
                    setIsMenuOpen(!isMenuOpen);
                    // isMenuOpeN();
                }}
            >
                {isMenuOpen ? (
                    <FontAwesomeIcon className='ml-2 mt-4 w-8 h-8 sm:mr-0 mr-1' icon={faClose} />
                ) : (
                    <FaBars className='ml-2 mt-2 w-8 h-8 sm:mr-0 mr-1' />
                )}
            </button>

            {/* Dropdown Menu for Small Devices */}
            {isMenuOpen && (
                <div 
                className="md:hidden absolute top-16 left-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-2"
                style={{ zIndex: 1000, position: 'absolute' }} // Ensure a high z-index and positioning
                >
                    <CreateSSNewList/>
                    
                    <button onClick={handleSave} className="flex items-center bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded w-full text-sm">
                        <FaSave className="inline mr-1" />
                        Save & Back
                    </button>
                    <button className="flex items-center bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded w-full text-sm">
                        <FaFileImport className="inline mr-1" />
                        Import
                    </button>
                    <button className="flex items-center bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded w-full text-sm">
                        <FaFileExport className="inline mr-1" />
                        Export
                    </button>
                    {/* <button className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded w-full text-sm" onClick={handleUndo}>
                        <FaUndo className="inline mr-1" />
                        Undo
                    </button>
                    <button className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded w-full text-sm" onClick={handleRedo}>
                        <FaRedo className="inline mr-1" />
                        Redo
                    </button> */}
                </div>
            )}

            {/* Left side with buttons */}
            <div className="hidden md:flex flex-col md:flex-row space-x-2 md:space-x-2 mb-2 md:mb-0 w-full md:w-auto">

                <CreateSSNew />

                <button onClick={handleSave} className="flex items-center bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded w-full md:w-auto text-sm">
                    <FaSave className="inline mr-1" />
                    Save & Back
                </button>
                <button className="flex items-center bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded w-full md:w-auto text-sm">
                    <FaFileImport className="inline mr-1" />
                    Import
                </button>
                <button className="flex items-center bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded w-full md:w-auto text-sm">
                    <FaFileExport className="inline mr-1" />
                    Export
                </button>
                {/* <AddCollaboratorForm spreadsheetId={id}/> */}
                {/* <button className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded w-full md:w-auto text-sm" onClick={handleUndo}>
                    <FaUndo className="inline mr-1" />
                    Undo
                </button>
                <button className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded w-full md:w-auto text-sm" onClick={handleRedo}>
                    <FaRedo className="inline mr-1" />
                    Redo
                </button> */}

            </div>

            {/* <div className='relative  left-2 sm:left-2 md:left-2 lg:left-4 top-1' style={{ marginBottom: '10px' }}>
            </div> */}

            {/* Notification and Search */}
            {/* <div>
                { isMenuOpen ? <></> : <div className=" 0 text-sm sm:flex bg-gray-700 text-white p-2 rounded-md transition-transform transform hover:scale-105 ml-4 lg:w-auto sm:w-30 w-30  text-center">
                    Row: {showColumn}<span> _-_ </span> Col: {showRow}
                </div>}
            </div> */}
            <div className="flex-grow flex items-center justify-center relative">
                {noti && (
                    <>
                        <h1 className='absolute top-10 right-10 bg-blue text-3xl text-red-600'>Hiii Msg</h1>
                        <div className="absolute top-0 right-0 bg-green-500 text-white p-2 rounded-md">
                            Saved!
                        </div>
                    </>
                )}
                <CustomDropDown
                    items={filterUsers}
                    onSelect={HandleSelectForEmail}
                    placeholder="Share this Sheet"
                    searchValue={searchTerm}
                    onSearch={setSearchTerm}

                />
                {/* <span className='relative  text-xl font-medium text-gradient bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 hover:underline hover:decoration-red-500'>
                    ShareSheet
                </span> */}
                <div className='absolute right-0 sm:mr-0 mr-2'>
                    <FontAwesomeIcon className='relative right-0 ml-2 hover:cursor-pointer text-2xl' icon={faUser}></FontAwesomeIcon>
                </div>
            </div>
            {showCollabNoti && (
                <>
                <h1 className='absolute top-10 right-10 bg-blue text-3xl text-red-600'>Hiii Msg</h1>
                <CollabNoti
                    message= {ShareMsg} 
                    onClose={() => setShowCollabNoti(false)} 
                    />
                </>
            )}
            {
                ShareMsg && <div className="fixed bottom-4 left-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                                <FaCheckCircle className="text-2xl" />
                                <span>{ShareMsg}</span>
                                <button
                                    onClick={()=>setShareMsg("")}
                                    className="ml-auto bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                                >
                                    OK
                                </button>
                            </div>
            }
            {
                FailedMsg && <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                                <FaRegCheckCircle className="text-2xl" />
                                <span>{FailedMsg}</span>
                                <button
                                    onClick={()=>setFailedMsg("")}
                                    className="ml-auto bg-red-700 hover:bg-red-800 text-white font-bold py-1 px-2 rounded"
                                >
                                    OK
                                </button>
                            </div>
            }
            <Toaster/>
            {/* {
                Loading && ( 
                    <div className="fixed bottom-4 left-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                        <FaDownload className="text-2xl" />
                        <span>Loading...</span>
                        <button
                            onClick={()=> setLoading(false)}
                            className="ml-auto bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                        >
                            OK
                        </button>
                    </div>
                )
            } */}
            
            {/* Other components and logic */}
        </header>
    );
};

export default Header;
