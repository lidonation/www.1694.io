import { Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useState } from 'react';
import axiosInstance from "@/services/axiosInstance";

interface ProposalDownloadButtonProps {
  proposals: any[];
  searchQuery?: string;
  categoryFilter?: string | string[];
  committeeFilter?: string | string[];
}

export function ProposalDownloadButton({
  proposals,
  searchQuery,
  categoryFilter,
  committeeFilter,
}: ProposalDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';

    const headers = [
      'ID',
      'Title',
      'Author',
      'Budget Category',
      'Committee Name',
      'Budget Requested ( ₳ )',
      'Comments Count',
      'Funded Proposals',
      'Total Proposals',
      'Completed Proposals',
      'Outstanding Proposals',
      'Catalyst Proposals Link',
      'Created Date',
    ];

    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = data.map((proposal) => {
      const {
        govToolProposalId,
        proposalName,
        govToolUserName,
        budgetCat,
        committeeName,
        adaAmount,
        commentsCount,
        updatedAt,
        metrics = {},
      } = proposal;

      const username = govToolUserName || 'anonymous';

      const catalystLink =
        username !== 'anonymous' && Number(metrics.proposals) > 0
          ? `https://www.catalystexplorer.com/cardano/budget-proposals/${username}`
          : '';

      return [
        escapeCSV(govToolProposalId),
        escapeCSV(proposalName || 'Untitled Proposal'),
        escapeCSV(username),
        escapeCSV(budgetCat || 'Unspecified'),
        escapeCSV(committeeName || 'Unspecified'),
        escapeCSV(adaAmount || '0'),
        escapeCSV(commentsCount ?? 0),
        escapeCSV(metrics.funded_proposals || ''),
        escapeCSV(metrics.proposals || ''),
        escapeCSV(metrics.completed_proposals || ''),
        escapeCSV(metrics.outstanding_proposals || ''),
        escapeCSV(catalystLink),
        escapeCSV(updatedAt || ''),
      ];
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const enrichedProposals = await Promise.all(
        proposals.map(async (proposal) => {
          const username = proposal.govToolUserName;

          if (username && username !== 'anonymous') {
            try {
              const res = await axiosInstance.get(`/metrics/catalyst-proposals/${username}`);
              return { ...proposal, metrics: res.data };
            } catch (err) {
              console.warn(`Failed to fetch metrics for ${username}`);
            }
          }

          return proposal;
        })
      );

      const csvData = convertToCSV(enrichedProposals);
      if (!csvData) throw new Error('No proposal data available to download');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      let filename = 'proposals';
      if (searchQuery) filename += `_${searchQuery.slice(0, 20)}`;
      if (categoryFilter) {
        const categories = Array.isArray(categoryFilter)
          ? categoryFilter.join('-')
          : categoryFilter;
        filename += `_${categories}`;
      }
      if (committeeFilter) {
        const committees = Array.isArray(committeeFilter)
          ? committeeFilter.join('-')
          : committeeFilter;
        filename += `_${committees}`;
      }
      filename += `_${new Date().toISOString().split('T')[0]}.csv`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download proposals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<FileDownloadIcon />}
      onClick={handleDownload}
      disabled={isLoading || !proposals || proposals.length === 0}
    >
      {isLoading ? 'Preparing Download...' : 'Download Proposals (CSV)'}
    </Button>
  );
}
