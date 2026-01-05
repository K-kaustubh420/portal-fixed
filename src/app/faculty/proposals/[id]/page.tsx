"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProposalFileUpload from '@/components/ProposalFileUpload';

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = Number(params.id);
  const [proposal, setProposal] = useState<any>(null);

  useEffect(() => {
    // Fetch proposal details
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faculty/proposals/${proposalId}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setProposal(data))
      .catch(console.error);
  }, [proposalId]);

  if (!proposal) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{proposal.title}</h1>
      
      {/* Proposal details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="mb-2"><strong>Description:</strong> {proposal.description}</p>
        <p className="mb-2"><strong>Status:</strong> {proposal.status}</p>
        {/* Add more proposal details */}
      </div>

      {/* File Upload Component */}
      <ProposalFileUpload proposalId={proposalId} />
    </div>
  );
}