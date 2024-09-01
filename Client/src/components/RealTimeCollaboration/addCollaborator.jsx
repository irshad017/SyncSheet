import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faShare, faUser } from '@fortawesome/free-solid-svg-icons';
import { FaRegChartBar } from 'react-icons/fa';



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
              className= "mb-0 border-1 border-black hover:border-2 hover:border-black relative left-8 top-1 lg:w-60 md:w-56 mr-3 h-8 -sm:w-52 w-56  text-black px-1 md:px-6 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setIsOpen(!isOpen)}
          />
          {/* <i class="fas fa-users fa-2x"></i> */}
          <FontAwesomeIcon className='relative  sm:top-2 md:-left-10 -left-6 text-lg text-gray-800 md:h-6 md:w-6 w-6 top-2 h-6 '  
            icon={faUser} >
            </FontAwesomeIcon>
          <span className='relative invisible sm:visible left-2 top-1 text-xl font-medium text-gradient bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 hover:underline hover:decoration-red-500'>
            Real Time Collaboration
            </span>
          {isOpen && (
              <div className=''>
              <ul className="absolute max-h-68 lg:left-10 md:left-12 left-10 sm:max-w-60 sm:min-w-36 min-w-44 bg-white border rounded-md shadow-lg mt-1 z-10 overflow-y-auto">
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



const AddCollaboratorForm = ({ spreadsheetId }) => {
  const [collaboratorUsername, setCollaboratorUsername] = useState('');
  const [filterUsers,setFilteredUsers] = useState([])
  const [temp,setTemp] = useState([])
  const [searchTerm,setSearchTerm] = useState('')
  const [bool,setBool] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
        try {
            toast.loading("Loading... Emails");
            const response = await axios.get('http://localhost:5000/api/emails');
            if (response && response.data) {
                const emails = response.data.data.map(user => user.username);
                setTemp(emails);
                setFilteredUsers(emails);
                toast.dismiss(); // Dismiss loading toast
            }
        } catch (err) {
            console.log("Error in fetching collaborators");
            toast.dismiss(); // Dismiss loading toast
            toast.error('Failed to fetch collaborators');
        }
    };
      fetchUsers();
      
  }, []);

  useEffect(() => {
    const filtered = temp.filter(email => email.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredUsers(filtered);
  }, [searchTerm, temp]);


  const handleSubmit = async (username) => {
    // e.preventDefault();
    console.log(username)
    if (username.trim()) {
      try {
        console.log('Submitting:', { spreadsheetId, username });
        const response = await axios.post('/api/add-collaborator', {
          spreadsheetId,
          collaboratorUsername: username,
        });
        console.log('Response:', response.data);
        toast.success(`Collaborator added successfully!! `);
        toast.success(`With ${username} `);
      } catch (error) {
        console.error('Error adding collaborator:', error);
        if (error.response) {
          console.log('Response error data:', error.response.data);
        }
        toast.error(error.response?.data?.error || 'Failed to add collaborator');
      }
      setCollaboratorUsername('');
    }else {
      toast.error('Username cannot be empty');
    }
  };

  return (
    <form  className="flex items-center space-x-2">
      {/* <CustomDropDown /> */}
      <CustomDropDown
                    items={filterUsers}
                    onSelect={handleSubmit}
                    placeholder="Collab Sheet with"
                    searchValue={searchTerm}
                    onSearch={setSearchTerm}

                />
      { bool ? <></> : <button
        className="fixed right-4 px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => handleSubmit(collaboratorUsername)}
      >
        Add Collaborator
      </button>}
      <Toaster/>
    </form>
  );
};



export default AddCollaboratorForm;