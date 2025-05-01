// context/AuthContext.tsx
"use client";

import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode,
    useMemo,
    useCallback
} from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname

// Import updated functions and interface
import { User, saveAuthToken, saveUserDetails, loadAuthData, clearAuthData } from '@/lib/users'; // Adjust path

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/']; // Add any other public pages like /about, /contact etc.

// Define the shape/type of the data the context will provide
interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    // Updated login function signature - now takes only the token
    authenticateWithToken: (token: string) => Promise<boolean>; // Returns true on success, false on failure
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();
    const pathname = usePathname(); // Get current route

    // Effect 1: Load initial state from storage
    useEffect(() => {
        console.log("AuthProvider: Initializing - checking localStorage...");
        const loadedData = loadAuthData(); // Use the updated loading function

        if (loadedData.user && loadedData.token) {
            setToken(loadedData.token);
            setUser(loadedData.user); // Set both user and token
            console.log("AuthProvider: Auth data loaded from storage.");
        } else {
            setToken(null);
            setUser(null);
            console.log("AuthProvider: No valid complete auth data found in storage.");
        }
        setIsLoading(false);
    }, []);

    // Effect 2: Handle route protection based on auth state
    useEffect(() => {
        // Don't redirect until loading is complete
        if (isLoading) {
            return;
        }

        const pathIsPublic = PUBLIC_ROUTES.includes(pathname);

        // If user is NOT logged in and trying to access a non-public route
        if (!token && !pathIsPublic) {
            console.log(`AuthProvider: Not logged in, redirecting from protected route (${pathname}) to /`);
            router.push('/');
        }

        

    }, [token, isLoading, pathname, router]); // Rerun when auth state, loading state, or path changes

    // Function to fetch user details using a token and update state/storage
    const authenticateWithToken = useCallback(async (newToken: string): Promise<boolean> => {
        console.log("AuthProvider: authenticateWithToken called.");
        setIsLoading(true); 
        setToken(newToken); 
        
        saveAuthToken(newToken); 
        

        try {
            const userResponse = await fetch("https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/user", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${newToken}`,
                    "Accept": "application/json"
                }
            });

            const userData = await userResponse.json();
            console.log("AuthProvider: /api/user response:", userResponse.status, userData);

            if (userResponse.ok && userData) { // Check if user data is valid
                 // You might need to adjust the fields based on the actual API response structure for /api/user
                const fetchedUser: User = {
                    name: userData.name, // Adjust if nested e.g., userData.data.name
                    email: userData.email, // Adjust if nested
                    department: userData.dept_id, // Adjust if nested
                    role: userData.role, // Adjust if nested
                    designation: userData.designation || "N/A", // Adjust if nested or provide a default value
                    dept_id: userData.dept_id || 0, // Adjust if nested or provide a default value
                    
                };

                 // Validate fetched user data structure
                 if (fetchedUser.name && fetchedUser.email  && fetchedUser.role) {
                    setUser(fetchedUser); // Update user state
                    saveUserDetails(fetchedUser); // Save user details to storage
                    console.log("AuthProvider: User details fetched and saved successfully.");
                    console.log("AuthProvider: User details:", fetchedUser);
                    setIsLoading(false);
                    return true; // Indicate success
                 } else {
                     console.error("AuthProvider: Fetched user data structure is invalid.", fetchedUser);
                     throw new Error("Invalid user data received from server."); // Treat as error
                 }

            } else {
                // Handle non-ok response from /api/user (e.g., token expired, server error)
                console.error("AuthProvider: Failed to fetch user details.", userData?.message || `Status: ${userResponse.status}`);
                throw new Error(userData?.message || "Failed to fetch user details");
            }
        } catch (error) {
            console.error("AuthProvider: Error fetching user details:", error);
            // If fetching user fails, logout completely
            clearAuthData();
            setToken(null);
            setUser(null);
            setIsLoading(false);
            
            return false; // Indicate failure
        }
    }, []); 

    
    const logout = useCallback(() => {
        console.log("AuthProvider: logout function called.");
        clearAuthData();
        setUser(null);
        setToken(null);
        router.push('/');
    }, [router]);

    const isLoggedIn = useMemo(() => !!user && !!token, [user, token]);

    const contextValue = useMemo(() => ({
        user,
        token,
        isLoggedIn,
        isLoading,
        authenticateWithToken,
        logout,
    }), [user, token, isLoggedIn, isLoading, authenticateWithToken, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};