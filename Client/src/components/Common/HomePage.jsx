import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator, faDatabase, faFileCsv, faFileExcel, faTable } from "@fortawesome/free-solid-svg-icons";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { boolAtom } from "./Atom";
import {Toaster ,toast} from "react-hot-toast";
import axios from "axios";
import { jwtDecode } from "jwt-decode";






const HomePage = () => {
    const [username,setUsername] = useState('')
    const [SHOWusername,setSHOWUsername] = useState('')
    const [password,setPassword] = useState('')
    const [email,setEmail] = useState('')
    const [emailLog,setEmailLog] = useState('')
    const [passLog,setPassLog] = useState('')
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showSignupForm, setShowSignupForm] = useState(false);
    const [error,setError] = useState('')
    const [errorS,setErrorS] = useState('')
    const [errorEmail,setErrorEmail] = useState('')
    const [errorPass,setErrorPass] = useState('')
    const Navigate = useNavigate()
    const [MyBool,setMyBool] = useRecoilState(boolAtom)
    const verified = useRecoilValue(boolAtom)
    // const setUserID = useSetRecoilState(userIdAtom)
    const handleLoginClick = () => {
        setShowLoginForm(true);
        setShowSignupForm(false);
    };

    const handleSignupClick = () => {
        setShowSignupForm(true);
        setShowLoginForm(false);
    };

    const handleClose = () => {
        setShowLoginForm(false);
        setShowSignupForm(false);
    };

    const handleOverlayClick =(e)=> {
        if(e.target === e.currentTarget){
            handleClose()
        }
    }

    useEffect(() => {
        const Token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (Token && userId) {
            setMyBool(true);
        }
    }, []);

    const HandleLogout = ()=>{
        localStorage.removeItem('userId')
        localStorage.removeItem('token')
        setMyBool(false)
        Navigate('/')
    }

    const toggleBoolean = ()=>{
        // console.log(MyBool)
        setMyBool(prev => !prev)
        // console.log(MyBool)
    }
    
        // P - LOGin
        // P - LOGin
        const handleSubmitLog = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/login', { username, password });
            if (response.status === 200) {
            // console.log(response)
            localStorage.setItem('token', `Bearer ${response.data.token}`);
            const decodeToken = jwtDecode(response.data.token);
            localStorage.setItem('userId', decodeToken.userId);
            const data2 = username.split('@')[0]
            setSHOWUsername(data2)
            setUsername('');
            setPassword('');
            toast.success('Login successful');
            handleClose()
            toggleBoolean()
            Navigate('/')
            }
        } catch (error) {
            console.log(error)
            toast.error(`Failed to login: ${error.response.data.error}`);
        }
        };

        // // P - SIGNUP
        // // P - SIGNUP
        const handleSubmitSign = async (e) => {
        e.preventDefault();
            try {
            const response = await axios.post('http://localhost:5000/api/register', { username, password });
            if (response.status === 200) {
                toast.success('Registration successful');
                localStorage.setItem('token', `Bearer ${response.data.token}`);
                const decodeToken = jwtDecode(response.data.token);
                localStorage.setItem('userId', decodeToken.userId);
                const data2 = username.split('@')[0]
                setSHOWUsername(data2)
                setUsername('');
                setPassword('');
                handleClose()
                toggleBoolean()
                Navigate('/');
                
            }  
        } catch (error) {
            console.log(error)
            toast.error('Failed to register user');
        }
        };

    

    return (
        <div className="min-h-screen bg-white">
        
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center p-4 bg-gray-100">
            <div className="flex items-center space-x-4">
            <FontAwesomeIcon icon={faTable} className="h-7 text-gray-700" />
            <h1 className="text-xl font-semibold">Social Calc</h1>
            </div>
      
            <div className="space-x-4 flex">
            { MyBool ?  <>
                            <p onClick={HandleLogout} className="hover:cursor-pointer">Logout</p>
                            <a href="/workspace" className="relative inline-block text-lg font-medium text-blue-600 hover:text-blue-800">
                                WorkSpace
                                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 ease-in-out hover:w-full"></span>
                            </a>
                        </>
                :
                <>
                    <button
                        className="text-blue-600"
                        onClick={handleSignupClick}
                    >
                        Sign Up
                    </button>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={handleLoginClick}
                    >
                        Login
                    </button >
                </>
            }
            </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
            { verified ? <div className="px-4 py-6 md:px-8 lg:px-12">
                            <h1 className="text-lg md:text-xl lg:text-2xl font-medium mb-2 animate-loading text-sky-900">
                                Hi, {SHOWusername} you logged in!
                            </h1>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                                Effortless Data Management
                            </h2>
                            <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-6">
                                Streamline your data processes and enhance collaboration for faster, more efficient workflows.
                            </p>
                        </div>
                :
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Simplify Your Data Workflow
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Easily manage and analyze data with intuitive tools designed for seamless team collaboration.
                    </p>
                    <div className="space-x-0 space-y-4 sm:space-x-4 sm:space-y-0 sm:flex sm:justify-center">
                        <button
                        className="bg-blue-600 text-white px-6 py-2 rounded w-full sm:w-auto"
                        onClick={handleLoginClick}
                        >
                        Login
                        </button>
                        <button
                        className="text-blue-600 border border-blue-600 px-6 py-2 rounded w-full sm:w-auto"
                        onClick={handleSignupClick}
                        >
                        Sign Up
                        </button>
                    </div>
                </div>
            }

            {/* Mockup Spreadsheet */}
            <div className="mt-12 max-w-4xl mx-auto">
            <p className="pl-2 text-gray-500 font-medium text-center md:text-start md:pl-5 w-full text-lg transition-transform duration-500 ease-in-out transform hover:scale-105 hover:text-gray-800">
                Enhance Your Data Handling: Streamline and Save with Excel
            </p>
            <div className="bg-gray-50 border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Summer sale revenue</h3>
                <button className="text-blue-600">Share</button>
                </div>
                <table className="w-full text-left">
                <thead>
                    <tr>
                    <th className="border-b py-2">ID</th>
                    <th className="border-b py-2">Customer</th>
                    <th className="border-b py-2">Order number</th>
                    <th className="border-b py-2">RRP</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td className="border-b py-2">1</td>
                    <td className="border-b py-2">Leonel</td>
                    <td className="border-b py-2">#12345</td>
                    <td className="border-b py-2">$100</td>
                    </tr>
                    <tr>
                    <td className="border-b py-2">2</td>
                    <td className="border-b py-2">Daniel</td>
                    <td className="border-b py-2">#12346</td>
                    <td className="border-b py-2">$200</td>
                    </tr>
                    <tr>
                    <td className="border-b py-2">3</td>
                    <td className="border-b py-2">Michell Starc</td>
                    <td className="border-b py-2">#12347</td>
                    <td className="border-b py-2">$50</td>
                    </tr>
                    <tr>
                    <td className="border-b py-2">3</td>
                    <td className="border-b py-2">Harsh</td>
                    <td className="border-b py-2">#12348</td>
                    <td className="border-b py-2">$500</td>
                    </tr>
                    {/* Add more rows as needed */}
                </tbody>
                </table>
            </div>
            </div>
        </main>

{/* BOOL CONDITION SIGN-UP/PROFILE */}

        {
            MyBool ?  <></>
            :
        <>
         {/* Login Form */}
            {showLoginForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center " onClick={handleOverlayClick} >
                <div className="bg-white p-8 rounded-md shadow-md w-80" >
                    <h2 className="text-2xl text-center font-semibold mb-2">Login</h2>
                    {error && <p className="text-red-500 mb-2 text-sm text-center">{error}</p>}
                    <form onSubmit={handleSubmitLog}>
                        <input
                        type="text"
                        value={username}
                        onChange={(e)=>{setUsername(e.target.value)}}
                        placeholder="email"
                        className="border p-2 w-full mb-4"
                        />
                        <input
                        type="password"
                        value={password}
                        onChange={(e)=>{setPassword(e.target.value)}}
                        placeholder="Password"
                        className="border p-2 w-full mb-4"
                        />
                        <button 
                        type="submit"
                        className="bg-blue-600 text-white w-full py-2 rounded">
                        Login
                        </button>
                    </form>
                </div>
            </div>
            )}

        {/* Signup Form */}
            {showSignupForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={handleOverlayClick}>
                <div className="bg-white p-8 rounded-md shadow-md w-80">
                    <h2 className="text-2xl font-semibold mb-2 text-center">Sign Up</h2>
                    {errorS && <p className="text-red-500 text-sm text-center mb-2">{errorS}</p>}
                    {/* <input
                    type="text"
                    value={username}
                    onChange={(e)=>{setUsername(e.target.value)}}
                    placeholder="Username"
                    className="border p-2 w-full mb-4"
                    /> */}
                    <form onSubmit={handleSubmitSign}>
                        <input
                        type="email"
                        value={username}
                        onChange={(e)=> setUsername(e.target.value)}
                        
                        placeholder="Email"
                        className="border p-2 w-full mb-4"
                        />
                        <input
                        type="password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                        
                        placeholder="Password"
                        className="border p-2 w-full mb-4"
                        />
                        <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded">
                        Sign Up
                        </button>
                    </form>
                </div>
                </div>
            )}
        </>
            }


        {/* Footer with Extra Information */}
        <footer className="flex flex-wrap justify-center space-x-4 py-4 border-t mt-8">
            <button className="text-gray-600">Gemini in Sheets</button>
            <button className="text-gray-600">Create</button>
            <button className="text-gray-600">Refine</button>
            <button className="text-gray-600">Security</button>
            <button className="text-gray-600">Customers</button>
            <button className="text-gray-600">FAQ</button>
        </footer>
        <Toaster />
        </div>
    );
};

export default HomePage;
