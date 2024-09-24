import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  Skeleton,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import HoverText from '../atoms/HoverText';
import { convertString, formatAsCurrency, formattedAda, lovelaceToAda } from '@/lib';
import Link from 'next/link';
import CopyToClipBoardIcon from '../atoms/svgs/CopyToClipBoardIcon';
import { useScreenDimension } from '@/hooks';

interface VoterDelegationHistoryProps {
  voterData: any;
  isVoterDataLoading: boolean;
}

const VoterDelegationHistory: React.FC<VoterDelegationHistoryProps> = ({
  voterData,
  isVoterDataLoading,
}) => {
  const delegationHistory = voterData?.delegationHistory || [];
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const {isMobile, screenWidth} = useScreenDimension();

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isVoterDataLoading) {
    return (
      <Box sx={{ px: 3 }}>
        <Typography variant="h5" gutterBottom>
          Voter Delegation History
        </Typography>
        {Array.from({ length: 3 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Skeleton width={'100%'} height={50} />
            <Skeleton width={'100%'} height={50} />
            <Skeleton width={'100%'} height={50} />
          </Box>
        ))}
      </Box>
    );
  }

  if (delegationHistory.length === 0) {
    return (
      <Box sx={{ px: 3 }}>
        <Typography variant="h5" gutterBottom>
          Voter Delegation History
        </Typography>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 200,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No delegation history found.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3 }}>
      <Typography variant="h5" gutterBottom>
        Voter Delegation History
      </Typography>
      <TableContainer>
        <Table>
          <TableBody>
            {delegationHistory.map((item: any, index: number) => (
              <TableRow
                key={index}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {index === 0 && 'Current'} DRep
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant='body2'>
                      <Link prefetch={false} href={`/dreps/${item.drep_id}`}>
                        {
                          convertString(item.drep_id, isMobile || screenWidth < 1024)
                        }
                      </Link>
                    </Typography>
                    {hoveredRow === index && (
                      <Tooltip
                        title={
                          copiedId === item.drep_id ? 'Copied!' : 'Copy DRep ID'
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(item.drep_id)}
                          sx={{ ml: 1 }}
                        >
                          <CopyToClipBoardIcon width={18} height={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Voting power
                  </Typography>
                  <HoverText
                    shortText={formattedAda(item?.voting_power, 2)}
                    longText={formatAsCurrency(
                      lovelaceToAda(item?.voting_power),
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Epoch
                  </Typography>
                  <Typography>{item.delegation_epoch}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VoterDelegationHistory;
