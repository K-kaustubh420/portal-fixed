'use client'; // Required because we use localStorage (client-side) and hooks (useState, useEffect)

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

// Import the function to load data and the User type
import { loadAuthData, User as UserType } from '@/lib/users'; // Renamed User to UserType to avoid conflict

// --- Import the conditional components ---
// IMPORTANT: Adjust these paths to match your actual file structure.
import Hod from '@/app/hod/HODdasbaord';
import DeanDashboard from '../deandash/deandash';// <<< ADJUST PATH IF NECESSARY
import ConvenerDashboard from '@/app/convenerdashboard/convenerdahboard';
import ChairDashboard from '../chairperson/ChairDashboard';
import ViceChairDashboard from '../associatechair/ViceDashboard';

// React component names should be PascalCase
const Page = () => {
  // State to hold the loaded user data
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Optional: manage loading state

  useEffect(() => {
    // Load user data when the component mounts (client-side only)
    const authData = loadAuthData();
    setUser(authData.user); // Set the user state
    setIsLoading(false); // Loading finished
    console.log("Loaded user:", authData.user); // Debug log
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Determine which dashboard component to render ---
  let DashboardComponent = null; // Default to null or a loading indicator

  if (isLoading) {
    // Optional: Show a loading indicator while fetching data
    DashboardComponent = <div className="flex justify-center items-center h-screen bg-white text-gray-300">
      <span className="loading loading-bars loading-xl"></span>
    </div>;
  } else if (user) {
    // Get the role from the user state object
    const role = user.role;
    console.log("User role:", role); // Debug log

    if (role === 'hod') {
      DashboardComponent = <Hod />;
    } else if (role === 'dean') {
      DashboardComponent = <DeanDashboard />;
    } else if(role ==='chair'){ 

      DashboardComponent = <ChairDashboard />;
    }
    else if (role=='vice_chair'){
      DashboardComponent = <ViceChairDashboard />;
    }
     else {
      // Assuming 'convener' or any other role falls here
      DashboardComponent = <ConvenerDashboard />;
    }
  } else {

    DashboardComponent = <div>User not authenticated or data not found.</div>;
   
  }

  return (
    <div>
      <Navbar />
      <main>
        {DashboardComponent}
      </main>
    </div>
  );
};

export default Page;