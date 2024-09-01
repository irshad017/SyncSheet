import { faArrowAltCircleLeft, faSave, faTrash, faUser, faSignOut } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import React, { useCallback, useEffect, useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CreateSS from './CreateSS';
import { FaDownload } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
// import CreateSS from './createSS';






function WorkSpace() {
    const [isSliderOpen, setSliderOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    
    return (
        <div className="flex h-screen">
            <div className="flex-1 flex flex-col">
                <Header onProfileClick={() => setSliderOpen(!isSliderOpen)}  />
                <div className="p-4 flex-1 overflow-auto">
                    <Templates />
                    {/* <RecentFiles /> */}
                </div>
            </div>
            <ProfileSlider isOpen={isSliderOpen} onClose={() => setSliderOpen(false)} />
        </div>
    );
}






const Header = memo(({ onProfileClick }) => {
    console.log('Header re-rendered');
    return (
        <header className="flex justify-between items-center p-4 bg-white shadow-lg">
            <div className="flex items-center">
                <div className='absolute left-3 sm:left-4 flex sm:gap-1 items-center'>
                    <a href='/'>
                        <FontAwesomeIcon className='w-8 h-7 pt-1 text-blue-700' icon={faArrowAltCircleLeft} />
                    </a>
                    <h1 className="text-xl ml-2 font-semibold">Sheets</h1>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Search"
                    className="border rounded p-2 w-64"
                />
                <button onClick={onProfileClick} className="p-2">
                    <FontAwesomeIcon icon={faUser} className="w-8 h-8" />
                </button>
            </div>
        </header>
    );
});


const Templates = memo(() => {
    console.log('Templates re-rendered');
    const [temp, setTemp] = useState([]);
    const reversedTemp = [...temp].reverse();
    const id = localStorage.getItem('userId');
    const [user, setUser] = useState(null);
    const [spreadsheets, setSpreadsheets] = useState([]);
    const [Loading, setLoading] = useState(true);
    const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
    const Navigate = useNavigate()
    const [userDel, setUserDel] = useState('')


    useEffect(() => {
        const fetchUser = async () => {
            const userId = localStorage.getItem('userId');
                try {
                    const userResponse = await axios.get(`http://localhost:5000/api/user/${userId}`);
                    setUserDel(userResponse.data.username);
                    
                    // setLoading(false);
                } catch (error) {
                    console.error('Failed to fetch user details:', error);
                }
            };
        
            fetchUser();
            // return () => {
            //     // setTemp([])
            //     // setUser({});
            //     // toast.loading("Loading... sheets")
            //     // setLoading(true);
            // };
    }, []);

    useEffect(() => {
        const fetchUserDetails = async () => {
            const userId = localStorage.getItem('userId');
                try {
                    const userResponse = await axios.get(`http://localhost:5000/api/user/${userId}`);
                    setUser(userResponse.data);
                    // console.log("Hii",user)
                    setTemp(userResponse.data.spreadsheet);
                    setLoading(false);
                } catch (error) {
                    console.error('Failed to fetch user details:', error);
                }
            };
        
            fetchUserDetails();
            return () => {
                // toast.error("Loading...")
                setTemp([]);
                setLoading(true);
            };
    }, []);

    const handleOpenSpreadsheet = (spreadsheetId) => {
        Navigate(`/spreadsheet/${spreadsheetId}`);
        console.log(`Open spreadsheet with ID: ${spreadsheetId}`);
    };

    const blankSheet = { 
        name: 'Blank spreadsheet', 
        icon: 'https://img.icons8.com/ios-filled/50/000000/plus.png' 
    };

    const handleDelete = async ()=>{
        try{
            const response = await axios.get(`http://localhost:5000/delete/${userDel}`)
            if(response.ok){
                console.log("Deleted sheet", sheetId)
            }
        }catch(err){
            console.log("erroR:", err)
        }
    }

    return (
        <div className="mt-4 p-4">
            <h2 className="text-lg font-semibold mb-4">Start a new spreadsheet</h2>
            <div className="flex flex-wrap gap-4">
                {/* Blank Sheet Item */}
                <div className="hover:border-black hover:cursor-pointer w-full sm:w-60 md:w-72 lg:w-80 h-40 border rounded-lg flex flex-col items-center p-4 bg-white shadow-lg transition-all duration-200 ease-in-out">
                    <img src={blankSheet.icon} alt={blankSheet.name} className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">{blankSheet.name}</span>
                    {/* <CreateSS /> */}
                    <CreateSS />
                </div>

                {/* Templates List */}
                {reversedTemp.map((template, index) => (
                    <div key={index} className="relative hover:border-black hover:cursor-pointer w-full sm:w-60 md:w-72 lg:w-80 h-40 border rounded-lg flex flex-col items-center p-4 bg-white shadow-lg transition-all duration-200 ease-in-out">
                        <FontAwesomeIcon icon={faSave} className="w-14 h-14 mb-2" />
                        <span className="text-lg font-medium mb-2">{template.name}</span>
                        <div className="flex flex-col items-center w-full">
                            <button
                                onClick={() => handleOpenSpreadsheet(template._id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Open
                            </button>
                            <button
                                className="p-1 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 absolute top-3 right-2"
                                // onClick={() => handleDelete(template._id)}
                            >
                                <FontAwesomeIcon className='text-xl' icon={faTrash} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {/* <Toaster/> */}
            {
                Loading && ( 
                    <div className="fixed bottom-4 left-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                        <FaDownload className="text-2xl" />
                        <span >  Loading...Files! </span>
                        <button
                            onClick={()=> setLoading(false)}
                            className="ml-auto bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                        >
                            OK
                        </button>
                    </div>
                )
            }
        </div>
    );
});




const RecentFiles = memo(() => {
    console.log('RecentFiles re-rendered');
    const files = [
        { name: 'Todo_done_it', date: '26 Aug 2024' },
        { name: 'Untitled spreadsheet', date: '19 Aug 2024' },
        { name: 'hello', date: '19 Aug 2024' },
        { name: 'Todo', date: '19 Aug 2024' },
    ];

    return (
        <div className="mt-4">
            <h2 className="text-lg font-semibold">Recent files</h2>
            <ul className="mt-2">
                {files.map((file, index) => (
                    <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-100">
                        <div className="flex items-center">
                            <img src="https://img.icons8.com/ios-filled/50/000000/google-sheets.png" alt="File" className="w-6 h-6 mr-2" />
                            <span>{file.name}</span>
                        </div>
                        <span className="text-gray-500">{file.date}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
});



const ProfileSlider = memo(({ isOpen, onClose }) => {
    console.log('ProfileSlider re-rendered');
    const [user, setUser] = useState({});
    const [temp, setTemp] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('')

    useEffect(() => {
        const fetchUserDetails = async () => {
            const userId = localStorage.getItem('userId');
                try {
                    const userResponse = await axios.get(`http://localhost:5000/api/user/${userId}`);
                    setUser(userResponse.data);
                    const data = userResponse.data.username.split('@')[0]
                    setUserName(data)
                    setTemp(userResponse.data.spreadsheet);
                    setLoading(false);
                } catch (error) {
                    console.error('Failed to fetch user details:', error);
                }
            };
        
            fetchUserDetails();
            return () => {
                setTemp([])
                setUser({});
                toast.loading("Loading... sheets")
                setLoading(true);
            };
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('userId');
        localStorage.removeItem('authToken');
        navigate('/');
    }, [navigate]);

    if (!isOpen) return null;

    const reversedTemp = [...temp].reverse();

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-end z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 sm:w-96">
                <h2 className="text-xl font-semibold mb-4">Profile</h2>
                <div className="flex items-center mb-2">
                    <img 
                        src='data:image/png;base64,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'
                        alt="Profile" 
                        className="w-12 h-12 rounded-full mr-4" 
                    />
                    <div>
                        <p className="text-lg font-semibold">{userName}</p>
                        <p className="text-gray-600">{user.username}</p>
                    </div>
                </div>
                <div>
                    <p className='hover:cursor-pointer mb-2' onClick={handleLogout}>Logout <FontAwesomeIcon icon={faSignOut} /></p>
                    <h3 className="text-lg font-semibold mb-2">Your Spreadsheets</h3>
                    <div className="max-h-60 overflow-y-auto">
                        <ul>
                            {temp && reversedTemp.map((sheet, index) => (
                                <li key={index} className="mb-2 flex ">
                                    <a href={`/spreadsheet/${sheet._id}`} className="text-blue-600 hover:underline relative left-0">{sheet.name}</a>
                                    <p className='relative left-5'>{sheet.date.slice(0,10)}</p>
                                    {/* <p className='relative -right-5'>{sheet.spreadSheetDetails.date.slice(11,19)}</p> */}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            
        </div>
    );
});







export default WorkSpace;