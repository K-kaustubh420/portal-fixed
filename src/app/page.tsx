"use client"
import React from 'react'
import Navbar from '@/components/Navbar'
import LandingPage from '@/app/LandingPage'


const page = () => {
  return (
    <>
    <nav>
      <Navbar />
    </nav>
    <div>
    <LandingPage />
    </div></>
  )
}

export default page