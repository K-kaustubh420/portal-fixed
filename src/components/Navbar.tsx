"use client";
import { RxCross2 } from 'react-icons/rx';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { RxDashboard } from "react-icons/rx";
import { LuGitPullRequestCreate } from "react-icons/lu";
import { BiLogOut } from "react-icons/bi";

import { useAuth } from '@/context/AuthContext'; // Adjust path if necessary

const Navbar = () => {
    const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user, isLoggedIn, isLoading, authenticateWithToken, logout } = useAuth();
    const router = useRouter();

    const toggleLoginPopup = () => {
        setIsLoginPopupOpen(!isLoginPopupOpen);
        setLoginError(null);
        if (!isLoginPopupOpen) {
            setEmail('');
            setPassword('');
        }
    };

    const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        setIsSubmitting(true);

        try {
            const apiBaseUril = process.env.NEXT_PUBLIC_API_BASE_URL!;
            const response = await fetch(`${apiBaseUril}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("Navbar Login: Raw /api/login response:", response.status, data);

            if (response.ok && data.token) {
                console.log("Navbar Login: Token received successfully.");
                const authSuccessful = await authenticateWithToken(data.token);

                if (authSuccessful) {
                    console.log("Navbar Login: Authentication via context successful.");
                    setIsLoginPopupOpen(false);
                    router.push("/dashboard"); // Redirect to dashboard on successful login
                } else {
                    console.error("Navbar Login: Context authentication failed.");
                    setLoginError("Login succeeded but failed to fetch user details. Please try again.");
                }

            } else {
                const errorMessage = data?.message || `Login failed with status: ${response.status}`;
                console.error("Navbar Login: /api/login call failed:", errorMessage, data);
                setLoginError(errorMessage);
            }
        } catch (error) {
            console.error("Navbar Login: Error during sign-in process:", error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                 setLoginError("Network error: Could not connect to the server.");
            } else {
                 setLoginError("An unexpected error occurred during sign-in.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout(); // Clear auth state via context
        // Redirect immediately after logout completes. router.push is already fast.
        router.push('/');
    };

    const getUserInitial = () => user?.name ? user.name.charAt(0).toUpperCase() : '?';

    const restrictedRolesForProposal = ['hod', 'dean', 'chair', 'vice_chair' ,'accounts'];

    // Loading state based on context's isLoading
    if (isLoading) {
        return (
             <nav className="navbar bg-[#0b4da1] text-white shadow-sm rounded-sm flex w-full h-16 items-center justify-between px-4 sticky top-0 z-40 animate-pulse">
                <div className="flex-1 h-8 bg-blue-500 rounded w-1/3"></div>
                <div className="flex-none">
                     <div className="w-20 h-8 bg-blue-500 rounded-lg"></div>
                 </div>
             </nav>
        );
    }

    return (
        <nav className="navbar bg-[#0b4da1] text-white shadow-sm rounded-sm flex w-full h-16 items-center justify-between px-4 sticky top-0 z-40">
            {/* Logo and Title */}
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost text-xl normal-case hover:bg-transparent px-0 sm:px-2">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <Image src="/Srmlogo.jpg" alt="SRM Logo" width={40} height={40} className="rounded-full" priority />
                        <span className="text-base sm:text-lg md:text-xl font-semibold">SRM Event Connect</span>
                    </div>
                </Link>
            </div>

            {/* Actions */}
            <div className="flex-none gap-2">
                {isLoggedIn && user ? (
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder hover:bg-[#093f87]">
                             <div className="flex items-center justify-center">
                                <BsThreeDotsVertical size={20} />
                            </div>
                         </label>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[50] p-2 shadow bg-slate-200 rounded-box w-56 text-black/90">
                            <li className="flex items-center space-x-3 px-4 py-2 border-b border-base-300 mb-1">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-xl font-semibold text-white">{getUserInitial()}</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="text-sm font-medium text-gray-800 truncate" title={user.name}>{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
                                </div>
                            </li>
                            <li>
                                <Link href="/dashboard" className="flex items-center space-x-2 hover:bg-white py-2">
                                    <RxDashboard size={16} /><span>Dashboard</span>
                                </Link>
                            </li>
                            {!restrictedRolesForProposal.includes(user.role) && (
                                <li>
                                    <Link href="/proposal" className="flex items-center space-x-2 hover:bg-white py-2">
                                        <LuGitPullRequestCreate size={16} />
                                        <span>Proposal</span>
                                    </Link>
                                </li>
                            )}
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center space-x-2 hover:bg-red-100 hover:text-red-600 text-red-500 py-2 rounded-md"
                                >
                                    <BiLogOut size={16} /><span>Logout</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                ) : (
                    <button onClick={toggleLoginPopup} className="btn btn-ghost bg-[#07336e] px-3 sm:px-4 py-1 h-auto min-h-0 rounded-lg hover:bg-[#093f87] text-white font-semibold focus:outline-none focus:shadow-outline text-sm sm:text-base">
                        Login
                    </button>
                )}
            </div>


            {/* Login Popup */}
            {isLoginPopupOpen && (
                <div className="fixed inset-0 w-full h-full flex justify-center items-center backdrop-blur-sm z-50 transition-opacity duration-300">
                    <div className="bg-white shadow-2xl rounded-lg p-6 md:p-8 w-full max-w-md relative m-4 transform transition-all duration-300 scale-100">
                        <button onClick={toggleLoginPopup} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full" aria-label="Close login popup"><RxCross2 size={20} /></button>
                        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">Sign In</h2>
                        <p className="text-gray-500 text-sm text-center mb-4">Use your SRMIST credentials</p>
                        <div className="flex items-center my-4"><div className="flex-grow border-t border-gray-200"></div><span className="px-3 text-gray-400 text-xs font-medium uppercase">Email Login</span><div className="flex-grow border-t border-gray-200"></div></div>
                        <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
                            {loginError && (<div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm" role="alert">{loginError}</div>)}
                            <div>
                                <label htmlFor="emailInput" className="block text-gray-700 text-sm font-medium mb-1"> Email Address</label>
                                <input id="emailInput" type="email" className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-gray-700 placeholder-gray-400" placeholder="your.email@srmist.edu.in" required autoComplete='email' value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting}/>
                            </div>
                            <div>
                                <label htmlFor="passwordInput" className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                                <input id="passwordInput" type="password" className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-gray-700 placeholder-gray-400" placeholder="••••••••" required autoComplete='current-password' value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting}/>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-md text-base font-semibold shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50" disabled={isSubmitting}>{isSubmitting ? 'Signing In...' : 'Sign In'}</button>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;