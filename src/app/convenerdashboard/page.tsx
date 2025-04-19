// page.tsx (with basic auth check - adapt to your auth system)
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Correct import
import ConvenerDashboard from './convenerdahboard'; // Adjust path if needed

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Replace this with your actual authentication check
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Example: Check for a token in local storage or make an API call
        const token = localStorage.getItem('authToken');
        if (token) {
          setIsAuthenticated(true);
        } else {
          router.push('/login'); // Redirect to login page
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        // Handle authentication failure (e.g., redirect to login)
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return null; // Or a "Redirecting..." message if router.push doesn't immediately update
  }

  return (
    <div className="container mx-auto py-4">
      <ConvenerDashboard />
    </div>
  );
};

export default Page;