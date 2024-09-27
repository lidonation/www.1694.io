import { urls } from '@/constants';
import { convertString } from '@/lib';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Box } from "@mui/material";
import { MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { styled } from '@mui/system';
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

  useEffect(()=>{
    axios.get(item.url).
    then((response)=>{
      setGovActionName(response?.data?.body?.title)
    }).catch((error)=>{
      console.log(error)
    })
  }, [govActionName])

  const StyledInputLabel = styled(InputLabel)(() => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    transition: 'top 0.3s, transform 0.3s',
    '&.MuiInputLabel-shrink': {
      top: 0,
      transform: 'translateY(-90%)',
    },
    left: '20px',
    fontSize: '14px'
  }));

  
  return (
    <Box
      id="epoch-card"
      className="flex w-full flex-col gap-3 rounded-xl bg-white p-3 shadow-lg"
    >
      <VoteStatusChip date={item?.time_voted} vote={item?.vote} />
      <hr />
      <Box className="flex max-w-52 flex-col gap-1">
        <p className="text-lg font-bold">
          For {item?.description?.tag || null}
        </p>
        <p className="text-sm">Governance Action Name:</p>
        <p className="text-sm font-bold">{govActionName}</p>
        <p className="text-sm">Governance Action ID:</p>
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
      <FormControl style={{marginTop: '10px', width: '90%', marginBottom: '10px'}}>
      <StyledInputLabel id="demo-simple-select-label">View Governance Action</StyledInputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          label="View Governance Action"
        >
          <MenuItem>
            <Link
              href={`${urls.govToolUrl}/governance_actions/${item?.gov_action_proposal_id}#0`}
              target="_blank"
              className="text-blue-800"
            >
              Cardano Govtool
            </Link>
          </MenuItem>
          <MenuItem>
            <Link
              href={`${urls.adaStatusUrl}/governances/${item?.gov_action_proposal_id}`}
              target="_blank"
              className="text-blue-800"
            >
              Ada Status
            </Link>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default DrepVoteTimelineCard;
