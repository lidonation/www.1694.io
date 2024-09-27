import { urls } from '@/constants';
import { convertString } from '@/lib';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Box } from "@mui/material";
import axios from 'axios';

const VoteStatusChip = ({ date, vote }: { date: string, vote: string }) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="flex w-fit flex-row items-center gap-1 rounded-full bg-purple-500 px-2 py-1 text-sm">
        <img src="/svgs/file-check.svg" alt="" />
        <p className='text-sm'>{vote}</p>
      </div>
      <p className='text-sm'>{new Date(date).toLocaleDateString('en-GB')}</p>
    </div>
  );
};
const DrepVoteTimelineCard = ({ item }: { item: any }) => {
  const [govActionName, setGovActionName] = useState('')

  useEffect(() => {
    axios.get(item.url).
      then((response) => {
        setGovActionName(response?.data?.body?.title)
      }).catch((error) => {
        console.log(error)
      })
  }, [govActionName])

  return (
    <Box
      id="epoch-card"
      className="flex max-w-md flex-col gap-3 rounded-xl bg-white p-3 shadow-lg"
    >
      <VoteStatusChip date={item?.time_voted} vote={item?.vote} />
      <hr />
      <Box className="flex max-w-52 flex-col gap-1">
        <p className="text-lg font-bold">
          For {item?.description?.tag || null}
        </p>
        <p className="text-sm mt-2">Governance Action Name:</p>
        <p className="text-sm font-bold">{govActionName}</p>
        <p className="text-sm mt-2">Governance Action ID:</p>
        <div className="flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-sm">
          <p>
            {convertString(item?.gov_action_proposal_id + '#0', true) || null}
          </p>
          <CopyToClipboard
            text={item?.gov_action_proposal_id}
            onCopy={() => {
              console.log('copied!');
            }}
            className="clipboard-text cursor-pointer"
          >
            <img src="/svgs/copy.svg" alt="copy" />
          </CopyToClipboard>
        </div>
      </Box>
      <Box className="flex max-w-52 flex-col gap-1">
        <p className="text-sm">View Governance Action:</p>
        <Link
          href={`${urls.govToolUrl}/governance_actions/${item?.gov_action_proposal_id}#0`}
          target="_blank"
          className="text-blue-800 text-sm"
        >
          Cardano Govtool
        </Link>
        <Link
          href={`${urls.adaStatusUrl}/governances/${item?.gov_action_proposal_id}`}
          target="_blank"
          className="text-blue-800 text-sm mb-2"
        >
          Ada Status
        </Link>
      </Box>
    </Box>
  );
};

export default DrepVoteTimelineCard;
