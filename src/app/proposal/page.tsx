import React, { Suspense } from 'react'
import Proposal from './proposal'
import Navbar from '@/components/Navbar'
const page = () => {
  return (
    <div>
      <div> 
    <Navbar/>
    </div>
      <Suspense fallback={<div className="p-6 text-gray-600">Loading proposal...</div>}>
        <Proposal/>
      </Suspense>
    </div> 
  )
}

export default page
