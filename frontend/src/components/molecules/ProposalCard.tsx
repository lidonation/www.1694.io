import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Menu,
  Stack,
  Tooltip,
  Badge,
  styled,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import React, {useState, useEffect} from 'react';
import {format} from 'date-fns';
import {
  Chat as ChatIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import {useUserParticipationQuery} from '@/hooks/useUserCatalystParticipationQuery';
import { useGetActionProposalPollQuery } from '@/hooks/useGetActionProposalPollQuery';
import ProposalVotesBadge from './proposalVotesBadge';
import { useWallet } from '@/context/globalContext';

const StyledBadge = styled(Badge)(({theme}) => ({
  '& .MuiBadge-badge': {
    transform: 'translate(50%, -50%)',
    backgroundColor: theme.palette.error.main,
    color: 'white',
    fontSize: '0.7rem',
  },
}));

const TruncatedText = styled(Typography)(({theme}) => ({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

function ProposalCard({proposal}: { proposal: any }) {
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [disableShare, setDisableShare] = useState(false);
  const openShare = Boolean(shareAnchorEl);
  const { poll } = useGetActionProposalPollQuery(proposal?.id);
  const { wallet } = useWallet();
  
  const proposalDetail =
  proposal?.attributes?.bd_proposal_detail?.data?.attributes;
  const psapbData = proposal?.attributes?.bd_psapb?.data?.attributes;
  const costingData = proposal?.attributes?.bd_costing?.data?.attributes;
  const creator = proposal?.attributes?.creator?.data?.attributes;

  const title = proposalDetail?.proposal_name || 'Untitled Proposal';
  const budgetCategory =
        proposal?.attributes?.bd_psapb?.data?.attributes?.type_name?.data
            ?.attributes?.type_name || 'Unspecified';
  const rawBudget = costingData?.ada_amount || '0';
  const budgetRequested = Number(rawBudget);
  const formattedBudget = new Intl.NumberFormat('en-US').format(budgetRequested);
  const proposalBenefit = psapbData?.proposal_benefit || 'No benefit info';
  const username = creator?.govtool_username || 'anonymous';
  const commentsCount = proposal?.attributes?.prop_comments_number || 0;
  const {data: proposalMetrics} = useUserParticipationQuery(username);

  const proposedDate = proposal?.attributes?.createdAt
    ? format(new Date(proposal.attributes.createdAt), 'dd MMM yyyy')
    : 'Unknown date';

  const handleShareClick = (event) => setShareAnchorEl(event.currentTarget);
  const handleShareClose = () => setShareAnchorEl(null);
  const disableShareClick = () => {
    setDisableShare(true);
    setTimeout(() => setDisableShare(false), 2000);
  };

  function copyToClipboard(value) {
    navigator.clipboard.writeText(value);
  }

  return (
    <Card
      sx={{
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 3,
        },
      }}
    >
      <Box sx={{flexGrow: 1}}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: 2,
            height: '100%',
          }}
        >
          <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          >
            <Box>
              <Link href={`/proposals/${proposal?.id}`} passHref legacyBehavior>
                <Typography
                  component="a"
                  variant="h6"
                  fontWeight="bold"
                  display="block"
                  style={{textDecoration: 'none', color: 'inherit'}}
                >
                  {title}
                </Typography>
              </Link>
              <Typography variant="caption" color="text.secondary" display="block">
                @{username}
              </Typography>
            </Box>

            <Tooltip title="Share">
              <span>
                <IconButton
                  size="small"
                  onClick={handleShareClick}
                  aria-controls={openShare ? 'share-menu-card' : undefined}
                  aria-haspopup="true"
                  aria-expanded={openShare ? 'true' : undefined}
                >
                  <ShareIcon fontSize="small"/>
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Box className="flex items-center justify-between w-full mb-2">
              <Box>
                  <Typography variant="subtitle2" fontWeight="semi-bold">
                  Budget Category
              </Typography>
                  <Typography variant="body2" color="text.secondary">
                  {budgetCategory}
              </Typography>
              </Box>
              <Box className="flex justify-end mr-2">
                {poll?.data?.[0]?.id && wallet?.dRepId && (                  
                    <ProposalVotesBadge 
                      pollId={poll.data[0].id} 
                      dRepId={wallet.dRepId} 
                    />
                  )}
              </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" fontWeight="semi-bold">
              Budget Requested
            </Typography>
            <Typography
              variant="body2"
              component="p"
              color="text.darkPurple"
              data-testid="budget-requested-amount"
            >
              ₳ {formattedBudget}
            </Typography>
          </Box>

          {proposalBenefit && (
            <Box>
              <Typography variant="subtitle2" fontWeight="semi-bold">
                Proposal Benefit
              </Typography>

              <Box
                sx={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordWrap: 'break-word',
                }}
              >
                <ReactMarkdown
                  components={{
                    p({children}) {
                      return (
                        <Typography
                        variant="body2"
                        component="div"
                        sx={{display: 'inline'}}
                >
                          {children}
                        </Typography>
                      );
                    },
                  }}
                >
                  {proposalBenefit?.toString() || '-'}
                </ReactMarkdown>
              </Box>
            </Box>
          )}
                    <Box className='mt-auto'>
                        {(!proposalMetrics || typeof proposalMetrics === 'undefined' || !proposalMetrics?.proposals) ? (
                            <Box className='border border-gray-100 p-0 rounded-lg'>
                              <Typography className='bg-gray-100 p-1 rounded-t-lg'
                                          variant="subtitle2">
                  Catalyst Participation
                </Typography>
                                <Box className='flex flex-col gap-1 items-center justify-center divide-y divide-gray-100 py-4 px-1'>
                  <Typography variant="subtitle2" fontWeight="semi-bold">
                    Unknown
                  </Typography>
                </Box>
              </Box>
            ) : (
                            <Box className='border border-gray-100 p-0 rounded-lg'>
                                <Typography className='bg-gray-100 p-1 rounded-t-lg' variant="subtitle2"
                                            fontWeight="semi-bold">
                  Catalyst Participation:
                </Typography>
                                <Box className='flex flex-col gap-1 divide-y divide-gray-100 py-0.5 px-1'>
                                    <Box className='flex flex-row justify-between items-center'>
                                        <div className='text-xs inline-flex gap-0.5 flex-nowra'>
                                          <span className='font-bold font-lg'>
                                            Funded
                                          </span>
                      <span>/</span>
                      <span>Total Proposals</span>
                    </div>
                                        <Typography>
                                            <Typography className='inline-flex gap-0.5 flex-nowrap'>
                                            <span className='font-semibold'>
                                              {proposalMetrics.funded_proposals}
                                            </span>
                      <span>/</span>
                      <span>{proposalMetrics.proposals}</span>
                                            </Typography>
                    </Typography>
                  </Box>
                                    <Box className='flex flex-row justify-between items-center'>
                                        <div className='text-xs inline-flex gap-0.5 flex-nowra'>
                                          <span className='font-bold font-lg'>
                                            Completed
                                          </span>
                      <span>/</span>
                      <span>Outstanding Proposals</span>
                    </div>
                                        <Typography className='inline-flex gap-0.5 flex-nowrap'>
                                            <span className='font-semibold'>
                                              {proposalMetrics.completed_proposals}
                                            </span>
                      <span>/</span>
                      <span>{proposalMetrics.outstanding_proposals}</span>
                    </Typography>
                  </Box>
                                    <Box className='flex flex-row justify-between items-center'>
                                        <div className='text-xs flex justify-center py-3 px-2 items-center w-full'>
                                            <a target='_blank'
                                               className='font-bold text-primary-400 text-center inline-flex'
                                               href={`https://www.catalystexplorer.com/cardano/budget-proposals/${username}`}>
                        View {username} related Proposals.
                      </a>
                    </div>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Box>

            <Divider sx={{m: 2}}/>

      <CardActions
        sx={{
          px: 2,
          pb: 2,
          mt: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <InfoIcon fontSize="small" color="action"/>
          <Typography variant="caption" color="text.secondary">
            {proposedDate}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Comments">
            <span>
              <IconButton size="small" disabled>
                <StyledBadge badgeContent={commentsCount}>
                  <ChatIcon fontSize="small"/>
                </StyledBadge>
              </IconButton>
            </span>
          </Tooltip>
          <Link href={`/proposals/${proposal?.id}`}>
            <Button variant="contained" size="small">
              View Details
            </Button>
          </Link>
        </Box>
      </CardActions>

      <Menu
        id="share-menu-card"
        anchorEl={shareAnchorEl}
        open={openShare}
        onClose={handleShareClose}
        transformOrigin={{vertical: 'top', horizontal: 'right'}}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        sx={{mt: 1}}
      >
        <Stack spacing={1} px={2} py={1}>
          <Typography variant="subtitle2">Share Link</Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              copyToClipboard(window.location.href);
              disableShareClick();
            }}
            disabled={disableShare}
          >
            <LinkIcon/>
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {disableShare ? 'Link copied!' : 'Copy proposal link'}
          </Typography>
        </Stack>
      </Menu>
    </Card>
  );
}

export default ProposalCard;
