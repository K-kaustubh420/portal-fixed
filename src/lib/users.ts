// lib/users.ts

export interface User {
    name: string;
    department: number | string; // Use department ID from API
    email: string;
    role: string;
    designation: string;
    dept_id: number ; 
  
}
    
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';


export const saveAuthToken = (token: string): void => {
    if (typeof window === 'undefined' || !window.localStorage) {
        console.warn("localStorage is not available. Cannot save auth token.");
        return;
    }
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log('User lib: Auth token saved to localStorage.');
    } catch (error) {
        console.error("User lib: Error saving auth token to localStorage:", error);
    }
};

/**
 * Saves only the user data object to localStorage.
 * @param user - The user object matching the User interface.
 */
export const saveUserDetails = (user: User): void => {
     if (typeof window === 'undefined' || !window.localStorage) {
        console.warn("localStorage is not available. Cannot save user details.");
        return;
    }
    try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        console.log('User lib: User details saved to localStorage.');
    } catch (error) {
        console.error("User lib: Error saving user details to localStorage:", error);
    }
};


/**
 * Loads user data and auth token from localStorage.
 * Checks for both token and user data.
 * @returns An object containing the loaded user data and token, or nulls if either is not found/invalid.
 */
export const loadAuthData = (): { user: User | null; token: string | null } => {
     if (typeof window === 'undefined' || !window.localStorage) {
        console.warn("localStorage is not available. Cannot load auth data.");
        return { user: null, token: null };
    }
    let user: User | null = null;
    let token: string | null = null;
    let dataIsValid = true;

    try {
        token = localStorage.getItem(AUTH_TOKEN_KEY);
        const userDataString = localStorage.getItem(USER_DATA_KEY);

        if (userDataString) {
            user = JSON.parse(userDataString) as User;
            // Validate loaded user data
            if (!(user && typeof user.name === 'string' && typeof user.email === 'string' && user.role !== undefined && user.department !== undefined)) {
                console.warn("User lib: Stored user data is invalid.");
                user = null; // Invalidate user data
                dataIsValid = false;
            }
        } else {
            // If user data is missing, it's not a fully logged-in state
             dataIsValid = false;
             user = null;
        }

        if (!token) {
             dataIsValid = false;
             user = null; // If no token, user data doesn't matter
        }

        if (!dataIsValid) {
             console.log('User lib: Incomplete or invalid auth data found in storage. Clearing.');
             clearAuthData(); // Clear inconsistent state
             return { user: null, token: null };
        }

        console.log('User lib: Auth data loaded from localStorage.');
        return { user, token };

    } catch (error) {
        console.error("User lib: Error loading or parsing auth data from localStorage:", error);
        clearAuthData(); // Clear potentially corrupted data
        return { user: null, token: null };
    }
};

/**
 * Clears user data and auth token from localStorage.
 */
export const clearAuthData = (): void => {
     if (typeof window === 'undefined' || !window.localStorage) {
        console.warn("localStorage is not available. Cannot clear auth data.");
        return;
    }
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        console.log('User lib: Auth data cleared from localStorage.');
    } catch (error) {
        console.error("User lib: Error clearing auth data from localStorage:", error);
    }
};