import { useCardano } from '@/context/walletContext';
import { useGetAdaHolderCurrentDelegationQuery } from '@/hooks/useGetAdaHolderCurrentDelegationQuery';
import { useGetSingleDRepViaVoterIdQuery } from '@/hooks/useGetSingleDRepViaVoterIdQuery';
import { formattedAda, shortenAddress } from '@/lib';
import { Box, Button, Typography } from '@mui/material';

type DelegatedToProps = {
  className?: string;
};
const DelegatedTo = ({ className }: DelegatedToProps) => {
  const { stakeKey } = useCardano();
  const { currentDelegation } = useGetAdaHolderCurrentDelegationQuery(stakeKey);
  const { DRep } = useGetSingleDRepViaVoterIdQuery(
    currentDelegation?.drep_view,
  );

  return (
    <Box
      className={`flex flex-col space-y-2 bg-blue-800 px-4 py-2 text-white md:px-10 ${className}`}
    >
      <Box className="flex w-full justify-start">
        <Typography className="w-auto rounded-3xl bg-gray-800 px-2 py-1 text-sm">
          {!!currentDelegation?.drep_view ? 'Delegating' : 'Not Delegating'}
        </Typography>
      </Box>
      <Box>
        {currentDelegation && DRep && (
          <>
            <Box>
              <Typography fontWeight={600}>Delegated to:</Typography>
              <Typography
                fontWeight={600}
                className="overflow-hidden text-sm text-gray-300"
              >
                {shortenAddress(currentDelegation?.drep_view, 12)}
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={600}>Voting Power</Typography>

              <Typography
                fontWeight={600}
                className="overflow-hidden text-sm text-gray-300"
              >
                ₳ {formattedAda(DRep?.cexplorerDetails?.amount, 2)}
              </Typography>
            </Box>
          </>
        )}
        {!currentDelegation && (
          <Box className="space-y-2">
            <Box>
              <Typography fontWeight={600}>No DRep data available.</Typography>
              <Typography className="w-full text-wrap text-sm font-bold tracking-wide text-gray-300">
                You have not yet delegated to a DRep.
              </Typography>
              <Typography className="w-full text-wrap text-sm font-bold tracking-wide text-gray-300">
                Consider selecting one on the GovTool website.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              className="rounded-3xl px-2 capitalize text-white hover:bg-blue-900"
              onClick={() =>
                window.open(
                  'https://sanchogov.tools',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              Explore DReps
            </Button>
          </Box>
        )}
      </Box>
      {currentDelegation && (
        <Button
          size="small"
          variant="outlined"
          className="rounded-3xl capitalize text-white hover:bg-blue-900"
        >
          View Profile
        </Button>
      )}
    </Box>
  );
};
export default DelegatedTo;
