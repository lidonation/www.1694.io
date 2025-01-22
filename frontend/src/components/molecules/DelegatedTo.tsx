import { useCardano } from '@/context/walletContext';
import { useGetAdaHolderCurrentDelegationQuery } from '@/hooks/useGetAdaHolderCurrentDelegationQuery';
import {
  convertHexToCIP129,
  formattedAda,
  handleCopyText,
  shortenAddress,
} from '@/lib';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ViewDRepTableBtn from './ViewDRepTableButton';
import Button from '../atoms/Button';
import Link from 'next/link';
import CopyToClipBoardIcon from '../atoms/svgs/CopyToClipBoardIcon';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';

type DelegatedToProps = {
  className?: string;
};

export const DelegatedTo = ({ className }: DelegatedToProps) => {
  const { stakeKey, stakeKeyBech32 } = useCardano();
  const { addSuccessAlert } = useGlobalNotifications();
  const { currentDelegation } = useGetAdaHolderCurrentDelegationQuery(stakeKey);
  const { dRep } = useGetSingleDRepQuery(currentDelegation?.drep_view);

  const cip129Identifier = convertHexToCIP129(
    currentDelegation?.has_script,
    currentDelegation?.drep_raw,
  );

  return (
    <Box
      className={`flex flex-col space-y-2 bg-blue-800 px-3 py-3 text-white md:px-3 ${className}`}
    >
      <Box className="flex w-full justify-start">
        <Typography
          fontSize="0.85rem"
          fontWeight={500}
          className="w-auto rounded-3xl bg-gray-800 px-2 py-1"
        >
          {!!currentDelegation?.drep_view ? 'Delegating' : 'Not Delegating'}
        </Typography>
      </Box>
      <Box>
        {currentDelegation && dRep && (
          <>
            <Box>
              <Typography fontSize="0.85rem" fontWeight={600}>
                Delegated
              </Typography>
              <Box className="flex items-center overflow-hidden text-gray-300">
                <Link href={`/dreps/${cip129Identifier}`}>
                  <Typography fontSize="0.75rem" fontWeight={600}>
                    (CIP-129) {shortenAddress(cip129Identifier, 12)}
                  </Typography>
                </Link>
                <Tooltip title="Copy DRep ID">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleCopyText(cip129Identifier, addSuccessAlert)
                    }
                  >
                    <CopyToClipBoardIcon
                      color="#d1d5db"
                      width={16}
                      height={16}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box className="flex items-center overflow-hidden text-gray-300">
                <Link href={`/dreps/${currentDelegation?.drep_view}`}>
                  <Typography fontSize="0.75rem" fontWeight={600}>
                    (Legacy) {shortenAddress(currentDelegation?.drep_view, 12)}
                  </Typography>
                </Link>
                <Tooltip title="Copy DRep ID">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleCopyText(
                        currentDelegation?.drep_view,
                        addSuccessAlert,
                      )
                    }
                  >
                    <CopyToClipBoardIcon
                      color="#d1d5db"
                      width={16}
                      height={16}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box>
              <Typography fontSize="0.85rem" fontWeight={600}>
                Voting Power
              </Typography>

              <Typography
                fontSize="0.75rem"
                fontWeight={600}
                className="overflow-hidden text-gray-300"
              >
                ₳ {formattedAda(dRep?.voting_power, 2)}
              </Typography>
            </Box>
          </>
        )}
        {!currentDelegation && (
          <Box className="space-y-2">
            <Box className="space-y-1">
              <Typography
                fontSize="0.75rem"
                fontWeight={600}
                className="w-full text-wrap tracking-wide text-gray-300"
              >
                You have not yet delegated to a DRep, consider selecting one on
                the GovTool website.
              </Typography>
            </Box>
            <Box className="flex justify-end">
              <Link href="/dreps/list">
                <ViewDRepTableBtn size="small"></ViewDRepTableBtn>
              </Link>
            </Box>
          </Box>
        )}
      </Box>
      <Link href={stakeKeyBech32 ? `/voters/${stakeKeyBech32}` : '#'}>
        <Button
          variant="outlined"
          size="small"
          className="w-full"
          sx={{
            color: 'white',
            borderColor: 'white',
          }}
        >
          View Profile
        </Button>
      </Link>
    </Box>
  );
};
