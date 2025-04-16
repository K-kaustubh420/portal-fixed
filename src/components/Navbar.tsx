"use client";

import { RxCross2 } from 'react-icons/rx';
import { useState, useEffect } from 'react'; // Import useEffect
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

const Navbar = () => {
    const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter(); // Initialize router using useRouter

    useEffect(() => {
        // Check for user authentication on component mount (e.g., from local storage or cookies)
        const checkAuthentication = () => {
            // Implement your authentication check here.  This is a placeholder.
            // For example:
            const storedToken = localStorage.getItem('authToken'); // or cookie
            if (storedToken) {
                setIsLoggedIn(true); // Replace with your actual check logic.
            }
        };

        checkAuthentication();
    }, []); // Empty dependency array ensures this runs only once on mount

    const toggleLoginPopup = () => {
        setIsLoginPopupOpen(!isLoginPopupOpen);
        setLoginError(null);
    };

    const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("Raw response:", response.status, data);

            if (response.ok) {
                // Login successful
                // Store authentication data (e.g., token, user info)
                localStorage.setItem('authToken', data.token); // Replace with your actual token key
                setIsLoggedIn(true);
                // Redirect to dashboard
                router.push("/dashboard");
                setIsLoginPopupOpen(false); // Close popup after successful login

            } else {
                // Login failed
                setLoginError(data.message || "Login failed"); // Display error message from server
            }


        } catch (error: any) {
            console.error("Error during manual sign-in:", error);
            setLoginError("Could not connect to server for sign-in."); // **Handling network errors**
        }
    };

    const handleLogout = async () => {
        // Clear authentication data (e.g., token)
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        router.push("/"); // Redirect to the home page or login page after logout.
    };


    return (

        <div className="navbar bg-[#0b4da1] text-white shadow-sm rounded-sm flex w-full h-16 items-center justify-between px-4 ">
            {/* ... Navbar Header ... */}
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost text-xl normal-case">
                    <div className="flex items-center">
                        <Image src="/Srmlogo.jpg" alt="SRM Logo" width={48} height={48} className="rounded-full mr-2 sm:mr-4" />
                        <span className="text-lg sm:text-xl">SRM Event Connect</span>
                    </div>
                </Link>
            </div>
            <div className="flex gap-2 items-center">
                {isLoggedIn ? (
                    <div>
                        <button onClick={handleLogout} className="bg-[#07336e] btn-ghost px-2 sm:px-3 py-2 rounded-2xl hover:bg-[#093f87] text-white font-semibold focus:outline-none focus:shadow-outline text-sm sm:text-base">
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={toggleLoginPopup}
                        className="bg-[#07336e] btn-ghost px-2 sm:px-3 py-2 rounded-2xl hover:bg-[#093f87] text-white font-semibold focus:outline-none focus:shadow-outline text-sm sm:text-base"
                    >
                        Login
                    </button>
                )}
            </div>

            {isLoginPopupOpen && (
                <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-blur-md z-50">
                    <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-10 w-full max-w-md relative m-4">
                        {/* ... Login Popup Content ... */}
                        <button
                            onClick={toggleLoginPopup}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
                            aria-label="Loginpopup"
                        >
                            <RxCross2 size={24} />
                        </button>

                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 w-20 h-20 bg-gradient-to-br from-blue-200 to-transparent rounded-full blur-xl"></div>

                        <div className="text-center mb-4">
                            <p className="text-gray-500 text-sm">Sign in with your SRMIST email</p>
                        </div>

                        <div className="flex items-center my-2">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="px-3 text-gray-400 text-sm">OR</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
                            {loginError && (
                                <div className="text-red-500 text-sm mb-2">{loginError}</div>
                            )}
                            <div>
                                <label className="block text-gray-900 text-sm font-medium"> Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 mt-1 border bg-inherit rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-600"
                                    placeholder="Your SRMIST Email Address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-gray-700 bg-inherit text-sm font-medium">Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 mt-1 border bg-inherit rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-600"
                                    placeholder="********"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-2xl  text-lg font-medium shadow-md hover:opacity-80 transition px-3  ">
                                Sign in
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Navbar;