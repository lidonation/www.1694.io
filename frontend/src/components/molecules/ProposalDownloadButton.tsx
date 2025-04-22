import { Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useState } from 'react';

interface ProposalDownloadButtonProps {
  proposals: any[];
  searchQuery?: string;
  categoryFilter?: string | string[];
}

export function ProposalDownloadButton({
  proposals,
  searchQuery,
  categoryFilter,
}: ProposalDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    // headers
    const headers = [
      'ID',
      'Title',
      'Author',
      'Budget Category',
      'Budget Requested ( ₳ )',
      'Comments Count', 
      'Funded / Total Proposals',
      'Completed / Outstanding Proposals',
      'Catalyst Proposals Link',
      'Created Date'
    ];

    // Process each proposal into a CSV row
    const rows = data.map(proposal => {
      const proposalDetail = proposal?.attributes?.bd_proposal_detail?.data?.attributes;
      const psapbData = proposal?.attributes?.bd_psapb?.data?.attributes;
      const costingData = proposal?.attributes?.bd_costing?.data?.attributes;
      const creator = proposal?.attributes?.creator?.data?.attributes;
      const furtherInfo = proposal?.attributes?.bd_further_information?.data?.attributes;
      const username = creator?.govtool_username || 'anonymous';
      
      // Get proposal links if they exist
      let links = '';
      if (furtherInfo?.proposal_links?.data) {
        links = furtherInfo.proposal_links.data
          .map(link => link.attributes?.url)
          .filter(url => url)
          .join(' | ');
      }

      // Get catalyst participation metrics
      const proposalMetrics = proposal?.metrics || {};
      const fundedProposals = proposalMetrics?.funded_proposals ?? 'Unknown';
      const totalProposals = proposalMetrics?.proposals ?? 'Unknown';
      const completedProposals = proposalMetrics?.completed_proposals ?? 'Unknown';
      const outstandingProposals = proposalMetrics?.outstanding_proposals ?? 'Unknown';

      const fundedTotal = 
        fundedProposals === 'Unknown' || totalProposals === 'Unknown' 
          ? 'Unknown' 
          : `${fundedProposals}/${totalProposals}`;
          
      const completedOutstanding = 
        completedProposals === 'Unknown' || outstandingProposals === 'Unknown' 
          ? 'Unknown' 
          : `${completedProposals}/${outstandingProposals}`;

      // Catalyst proposals link
      const catalystLink = username !== 'anonymous' 
        ? `https://www.catalystexplorer.com/cardano/budget-proposals/${username}`
        : 'No Catalyst profile available';

      return [
        proposal.id,
        proposalDetail?.proposal_name || 'Untitled Proposal',
        username,
        psapbData?.type_name?.data?.attributes?.type_name || 'Unspecified',
        costingData?.ada_amount || '0', 
        proposal?.attributes?.prop_comments_number || 0,
        fundedTotal,
        completedOutstanding,
        catalystLink, 
        `"${links}"`,
        proposal?.attributes?.createdAt || ''
      ];
    });

    // Generate CSV content
    let csvContent = headers.join(',') + '\r\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\r\n';
    });

    return csvContent;
  };

  const handleDownload = () => {
    setIsLoading(true);
    try {
      const csvData = convertToCSV(proposals);
      
      if (!csvData) {
        throw new Error('No proposal data available to download');
      }

      // download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // making filename 
      let filename = 'proposals';
      if (searchQuery) filename += `_${searchQuery.slice(0, 20)}`;
      if (categoryFilter) {
        const categories = Array.isArray(categoryFilter) 
          ? categoryFilter.join('-')
          : categoryFilter;
        filename += `_${categories}`;
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