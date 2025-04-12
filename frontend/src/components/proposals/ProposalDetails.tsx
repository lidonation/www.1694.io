import React, { useState } from 'react';
import BudgetDiscussionInfoSegment from './BudgetDiscussionInfoSegment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Button from '../atoms/Button';

type ProposalDetailsProps = {
  proposal: any;
  isProposalLoading?: boolean;
};
function ProposalDetails({
  proposal,
  isProposalLoading,
}: ProposalDetailsProps) {
  const [showFullText, setShowFullText] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Proposal Ownership</h2>
        <BudgetDiscussionInfoSegment
          question={
            'What social handles would you like to be used? E.g. Github, X'
          }
          answer={
            proposal?.attributes?.bd_proposal_ownership?.data?.attributes
              ?.social_handles
          }
          isLoading={isProposalLoading}
        />
      </div>
      <div className="rounded-md bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          Problem Statements and Proposal Benefits
        </h2>
        <div className="space-y-6">
          <BudgetDiscussionInfoSegment
            question={'Problem Statement'}
            answer={
              proposal?.attributes?.bd_psapb?.data?.attributes
                ?.problem_statement
            }
            isLoading={isProposalLoading}
          />

          <BudgetDiscussionInfoSegment
            question={'Proposal Benefit'}
            answer={
              proposal?.attributes?.bd_psapb?.data?.attributes?.proposal_benefit
            }
            isLoading={isProposalLoading}
          />

          <BudgetDiscussionInfoSegment
            question={
              'Does this proposal align to the Product Roadmap and Roadmap Goals?'
            }
            answer={
              proposal?.attributes?.bd_psapb?.data?.attributes?.roadmap_name
                ?.data?.attributes?.roadmap_name
            }
            show={showFullText}
            isLoading={isProposalLoading}
          />

          <BudgetDiscussionInfoSegment
            question={
              'Does your proposal align to any of the budget categories?'
            }
            answer={
              proposal?.attributes?.bd_psapb?.data?.attributes?.type_name?.data
                ?.attributes?.type_name
            }
            show={showFullText}
            isLoading={isProposalLoading}
          />

          <BudgetDiscussionInfoSegment
            question={
              'Does your proposal align with any of the Intersect Committees?'
            }
            answer={
              proposal?.attributes?.bd_psapb?.data?.attributes?.committee_name
                ?.data?.attributes?.committee_name
            }
            show={showFullText}
            isLoading={isProposalLoading}
          />

          <BudgetDiscussionInfoSegment
            question={
              'If possible provide evidence of wider community endorsement for this proposal?'
            }
            answer={
              proposal?.attributes?.bd_psapb?.data?.attributes
                ?.supplementary_endorsement
            }
            show={showFullText}
            isLoading={isProposalLoading}
          />
          <Button
            size="medium"
            className="flex items-center gap-1"
            handleClick={() => setShowFullText(!showFullText)}
          >
            {showFullText ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            <span>{showFullText ? 'Show less' : 'Read more'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProposalDetails;
