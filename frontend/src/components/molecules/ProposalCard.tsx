import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
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
import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Chat as ChatIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    transform: 'translate(50%, -50%)',
    backgroundColor: theme.palette.error.main,
    color: 'white',
    fontSize: '0.7rem',
  },
}));

const TruncatedText = styled(Typography)(({ theme }) => ({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

function ProposalCard({ proposal }: { proposal: any }) {
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [disableShare, setDisableShare] = useState(false);
  const openShare = Boolean(shareAnchorEl);

  const proposalDetail = proposal?.attributes?.bd_proposal_detail?.data?.attributes;
  const psapbData = proposal?.attributes?.bd_psapb?.data?.attributes;
  const costingData = proposal?.attributes?.bd_costing?.data?.attributes;
  const creator = proposal?.attributes?.creator?.data?.attributes;
  
  const title = proposalDetail?.proposal_name || 'Untitled Proposal';
  const budgetCategory =
  proposal?.attributes?.bd_psapb?.data?.attributes?.type_name?.data?.attributes?.type_name || 'Unspecified';
  const budgetRequested = costingData?.ada_amount || 'N/A';
  const proposalBenefit = psapbData?.proposal_benefit || 'No benefit info';
  const username = creator?.govtool_username || 'anonymous';
  const commentsCount = proposal?.attributes?.prop_comments_number || 0;
  
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
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" fontWeight="bold" noWrap>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
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
                <ShareIcon fontSize="small" />
              </IconButton>
            </span>    
          </Tooltip>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            Budget Category
          </Typography>
          <Typography variant="body2" color="text.secondary">
          {budgetCategory}
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            Budget Requested
          </Typography>
          <Typography
            variant='body2'
            component='p'
            color='text.darkPurple'
            data-testid='budget-requested-amount'
          >
            ₳ {budgetRequested}
          </Typography>
        </Box>

        {proposalBenefit && (
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Proposal Benefit
            </Typography>
            <TruncatedText variant="body2">
              {proposalBenefit}
            </TruncatedText>
          </Box>
        )}

      </CardContent>

      <Divider sx={{ mx: 2 }} />

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
          <InfoIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {proposedDate}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Comments">
            <span>
              <IconButton size="small" disabled>
                <StyledBadge badgeContent={commentsCount}>
                  <ChatIcon fontSize="small" />
                </StyledBadge>
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              console.log('View Details clicked for proposal:', proposal?.id);
            }}
          >
            View Details
          </Button>
        </Box>
      </CardActions>

      <Menu
        id="share-menu-card"
        anchorEl={shareAnchorEl}
        open={openShare}
        onClose={handleShareClose}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ mt: 1 }}
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
            <LinkIcon />
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
