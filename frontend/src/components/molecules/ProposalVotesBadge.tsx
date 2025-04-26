import { Badge, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface ProposalVotesBadgeProps {
    poll: any; 
}

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: -8,
        top: 8,
        border: `2px solid ${theme.palette.background.paper}`,
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        fontWeight: 'bold',
        padding: '0 4px',
    },
}));

const ProposalVotesBadge: React.FC<ProposalVotesBadgeProps> = ({ poll }) => {
    // Calculate total votes 
    const voteData = poll?.[0]?.attributes;
    const totalVotes = (voteData?.poll_yes || 0) + (voteData?.poll_no || 0);

    return (
        <Box className="flex flex-col items-center justify-center">
            <Typography variant="subtitle2" fontWeight="semi-bold">
                Votes
            </Typography>

            <StyledBadge
                badgeContent={totalVotes}
                color="primary"
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <Box
                    sx={{
                        width: 32,
                        height: 40,
                        backgroundColor: 'transparent',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        borderRadius: '6px 6px 0 0',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                        fontWeight: 'bold',
                    }}
                >
                    <Typography variant="body2" fontWeight="bold">
                        {totalVotes}
                    </Typography>

                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -1,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 16,
                            height: 16,
                            backgroundColor: 'white',
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                            borderTop: '2px solid',
                            borderColor: 'primary.main',
                        }}
                    />
                </Box>
            </StyledBadge>
        </Box>
    );
};

export default ProposalVotesBadge;