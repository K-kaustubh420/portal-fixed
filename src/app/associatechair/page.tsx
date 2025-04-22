"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ViceDashboard from './ViceDashboard';
import { useAuth } from '@/context/AuthContext';

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (token && user?.role === 'vice') {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-lg loading-spinner text-primary"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-4">
      <ViceDashboard />
    </div>
  );
};

export default Page;