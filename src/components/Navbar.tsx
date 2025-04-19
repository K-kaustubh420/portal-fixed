"use client";

import { RxCross2 } from 'react-icons/rx';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';
import { BsThreeDotsVertical } from 'react-icons/bs'; // Import a suitable icon
import { RxDashboard } from "react-icons/rx";
import { LuGitPullRequestCreate } from "react-icons/lu";
import { BiLogOut } from "react-icons/bi";
const Navbar = () => {
    const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        
        const checkAuthentication = () => {
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                setIsLoggedIn(true); // Assume token presence means logged in for now
            } else {
                setIsLoggedIn(false);
            }
        };

        checkAuthentication();
        // Add event listener for storage changes to sync across tabs (optional)
        window.addEventListener('storage', checkAuthentication);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('storage', checkAuthentication);
        };
    }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount

    const toggleLoginPopup = () => {
        setIsLoginPopupOpen(!isLoginPopupOpen);
        setLoginError(null); // Reset error on popup toggle
        // Clear form fields when opening
        if (!isLoginPopupOpen) {
            setEmail('');
            setPassword('');
        }
    };

    const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);

        try {
            const response = await fetch("https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("Raw response:", response.status, data);

            if (response.ok && data.token) { // Check for token in response
                setIsLoggedIn(true);
                setIsLoginPopupOpen(false); // Close popup
                setUserName(data.userName || 'User');
                router.push("/dashboard"); // Redirect to dashboard
            } else {
                // Login failed - Use error message from API if available
                setLoginError(data.message || `Login failed with status: ${response.status}`);
                setLoginError(data.message || `Login failed with status: ${response.status}`);
            }
        } catch (error: any) {
            console.error("Error during manual sign-in:", error);
            // Handle network or other unexpected errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                 setLoginError("Network error: Could not connect to the server.");
            } else {
                 setLoginError("An unexpected error occurred during sign-in.");
            }
        }
    };

    const handleLogout = () => {
        // Clear authentication data
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        // Redirect to the home page after logout.
        router.push("/");
        // Optionally: Close any open dropdowns or popups if needed
    };

    return (
        <nav className="navbar bg-[#0b4da1] text-white shadow-sm rounded-sm flex w-full h-16 items-center justify-between px-4 sticky top-0 z-40">
            {/* Logo and Title */}
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost text-xl normal-case hover:bg-transparent">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <Image
                            src="/Srmlogo.jpg"
                            alt="SRM Logo"
                            width={40} // Slightly smaller for typical navbar height
                            height={40}
                            className="rounded-full"
                            priority // Prioritize loading the logo
                        />
                        <span className="text-base sm:text-lg md:text-xl font-semibold">SRM Event Connect</span>
                    </div>
                </Link>
            </div>

            {/* Actions: Login Button or User Dropdown */}
            <div className="flex-none gap-2">
                {isLoggedIn ? (
                    // DaisyUI Dropdown for logged-in users
                    <div className="dropdown dropdown-end">
                        {/* TabIndex makes the div focusable for dropdown toggle */}
                        <label tabIndex={0} className=" bg-inherit">
                            
                            <div className="w-8 items-center mt-0 flex justify-center h-8    cursor-pointer">
                                {/* Placeholder Icon or User Initial */}
                                <span className="text-xl">
                                     <BsThreeDotsVertical />
                                </span>
                                
                                
                             </div>
                        </label>
                        <ul
                            tabIndex={0}
                            // Dropdown menu content
                            className="menu menu-sm dropdown-content mt-3 z-[50] bg-slate-200 p-2 shadow  rounded-box w-52 text-black/90 " 
                        >
                            <li>
                                <Link href="/dashboard" className=" dropdown-center space-x-0 flex  hover:bg-slate-100 px-2 py-2 text-center ">
                                     <RxDashboard  size={18} />
                                    Dashboard
                                  
                                </Link>
                            </li>
                            <li>
                                <Link href="/proposal" className="hover:bg-slate-100 px-0 py-2 text-center flex space-x-0 ml-2">
                                <LuGitPullRequestCreate size={18} />
                                Proposal</Link>
                            </li>
                            <li>
                                {/* Use an anchor tag wrapping the button for consistent styling in menu */}
                                <a onClick={handleLogout} className="hover:bg-slate-100 px-2 pt-2 text-center flex  cursor-pointer">
                                  <BiLogOut size={18} />
                                   Logout
                                </a>
                                
                            </li>
                        </ul>
                    </div>
                ) : (
                    // Login Button for guests
                    <button
                        onClick={toggleLoginPopup}
                        className="btn btn-ghost bg-[#07336e] px-3 sm:px-4 py-1 h-auto min-h-0 rounded-lg hover:bg-[#093f87] text-white font-semibold focus:outline-none focus:shadow-outline text-sm sm:text-base"
                    >
                        Login
                    </button>
                )}
            </div>

            {/* Login Popup Modal */}
            {isLoginPopupOpen && (
                <div className="fixed inset-0 w-full h-full flex justify-center items-center bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300">
                    <div className="bg-white shadow-2xl rounded-lg p-6 md:p-8 w-full max-w-md relative m-4 transform transition-all duration-300 scale-100">
                        {/* Close Button */}
                        <button
                            onClick={toggleLoginPopup}
                            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                            aria-label="Close login popup"
                        >
                            <RxCross2 size={20} />
                        </button>

                      
                         <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-5 w-16 h-16 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-lg opacity-50"></div> 

                        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">Sign In</h2>
                        <p className="text-gray-500 text-sm text-center mb-4">Use your SRMIST credentials</p>

                    
                        <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="px-3 text-gray-400 text-xs font-medium">EMAIL LOGIN</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
                            {/* Login Error Display */}
                            {loginError && (
                                <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm">
                                    {loginError}
                                 </div>
                            )}
                            {/* Email Input */}
                            <div>
                                <label htmlFor="emailInput" className="block text-gray-700 text-sm font-medium mb-1"> Email Address</label>
                                <input
                                    id="emailInput"
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                    placeholder="your.email@srmist.edu.in"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {/* Password Input */}
                            <div>
                                <label htmlFor="passwordInput" className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                                <input
                                    id="passwordInput"
                                    type="password" // Keep type as password
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2.5 rounded-md text-base font-semibold shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Sign In
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;