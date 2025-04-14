import React, { useState } from 'react';
import BudgetDiscussionInfoSegment from './BudgetDiscussionInfoSegment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Button from '../atoms/Button';
import { Box, Typography, Button as MuiButton } from '@mui/material';
import { Link } from '@mui/icons-material';
import { openInNewTab } from '@/lib';

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
    <Box className="space-y-6 rounded-md bg-white p-6 shadow-sm">
      <Box className="space-y-4">
        <h2 className="text-xl font-semibold">Proposal Ownership</h2>
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
      </Box>

      <Box className="space-y-4">
        <h2 className="text-xl font-semibold">
          Problem Statements and Proposal Benefits
        </h2>
        <BudgetDiscussionInfoSegment
          question={'Problem Statement'}
          answer={
            proposal?.attributes?.bd_psapb?.data?.attributes?.problem_statement
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
            proposal?.attributes?.bd_psapb?.data?.attributes?.roadmap_name?.data
              ?.attributes?.roadmap_name
          }
          show={showFullText}
          isLoading={isProposalLoading}
        />

        <BudgetDiscussionInfoSegment
          question={'Does your proposal align to any of the budget categories?'}
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
      </Box>

      {showFullText && (
        <Box className="space-y-4">
          <h2 className="text-xl font-semibold">Proposal Details</h2>

          <BudgetDiscussionInfoSegment
            question={
              'What is your proposed name to be used to reference this proposal publicly?'
            }
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.proposal_name
            }
            show={showFullText}
            isLoading={isProposalLoading}
          />

          <BudgetDiscussionInfoSegment
            question={'Proposal Description'}
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.proposal_description
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={
              'Please list any key dependencies (if any) for this proposal?'
            }
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.key_dependencies
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={
              'How will this proposal be maintained and supported after initial development?'
            }
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.maintain_and_support
            }
            show={showFullText}
          />
          <BudgetDiscussionInfoSegment
            question={
              'Key Proposal Deliverable(s) and Definition of Done: What tangible milestones or outcomes are to be delivered and what will the community ultimately receive?'
            }
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.key_proposal_deliverables
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={
              'Resourcing & Duration Estimates: Please provide estimates of team size and duration to achieve the Key Proposal Deliverables outlined above.'
            }
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.resourcing_duration_estimates
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={
              'Experience: Please provide previous experience relevant to complete this project.'
            }
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.experience
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={
              'Contracting: Please describe how you expect to be contracted.'
            }
            answer={
              proposal?.attributes?.bd_proposal_detail?.data?.attributes
                ?.contract_type_name?.data?.attributes?.contract_type_name
            }
            show={showFullText}
          />
        </Box>
      )}

      {showFullText && (
        <Box className="space-y-4">
          <h2 className="text-xl font-semibold">Costing</h2>

          <BudgetDiscussionInfoSegment
            question={'ADA Amount'}
            answer={
              proposal?.attributes?.bd_costing?.data?.attributes?.ada_amount
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={'USD to ADA Conversion Rate'}
            answer={
              proposal?.attributes?.bd_costing?.data?.attributes
                ?.usd_to_ada_conversion_rate
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={'Preferred currency'}
            answer={
              proposal?.attributes?.bd_costing?.data?.attributes
                ?.preferred_currency?.data?.attributes?.currency_name
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={'Amount in preferred currency'}
            answer={
              proposal?.attributes?.bd_costing?.data?.attributes
                ?.amount_in_preferred_currency
            }
            show={showFullText}
          />

          <BudgetDiscussionInfoSegment
            question={'Cost breakdown'}
            answer={
              proposal?.attributes?.bd_costing?.data?.attributes?.cost_breakdown
            }
            show={showFullText}
          />
        </Box>
      )}

      {showFullText && (
        <Box className="space-y-4">
          <h2 className="text-xl font-semibold"> Further information</h2>

          {proposal?.attributes?.bd_further_information?.data?.attributes
            ?.proposal_links?.length > 0 && (
            <Box>
              <Typography className="text-lg leading-relaxed text-gray-500">
                Supporting links
              </Typography>

              <Box>
                {proposal?.attributes?.bd_further_information?.data?.attributes?.proposal_links?.map(
                  (item, index) =>
                    item?.prop_link && (
                      <MuiButton
                        key={index}
                        sx={{
                          marginRight: 2,
                          marginBottom: 2,
                        }}
                        startIcon={<Link width="18" height="18" />}
                        onClick={() => openInNewTab(item?.prop_link)}
                      >
                        <Typography
                          component={'p'}
                          variant="body2"
                          style={{
                            margin: 0,
                          }}
                        >
                          {item?.prop_link_text}
                        </Typography>
                      </MuiButton>
                    ),
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {showFullText && (
        <Box className="space-y-4">
          <h2 className="text-xl font-semibold">
            Administration and Auditing
          </h2>

          <BudgetDiscussionInfoSegment
            question={
              'Would you like Intersect to be your named Administrator, including acting as the auditor, as per the Cardano Constitution?*'
            }
            answer={
              proposal?.attributes?.intersect_named_administrator ? 'Yes' : 'No'
            }
            show={showFullText}
          />
          {proposal?.attributes?.intersect_named_administrator ? (
            ''
          ) : (
            <BudgetDiscussionInfoSegment
              question="Please provide further information to help inform DReps. Who is the vendor and what services are they providing?"
              answer={proposal?.attributes?.intersect_admin_further_text || ''}
              show={showFullText}
            />
          )}
        </Box>
      )}

      <Box>
        <Button
          size="medium"
          className="flex items-center gap-1"
          handleClick={() => setShowFullText(!showFullText)}
        >
          {showFullText ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          <span>{showFullText ? 'Show less' : 'Read more'}</span>
        </Button>
      </Box>
    </Box>
  );
}

export default ProposalDetails;
