import { urls } from '@/constants';
import { convertString } from '@/lib';
import Link from 'next/link';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
const SubmittedChip = ({ date }: { date: string }) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="flex w-fit rounded-full bg-blue-800 px-3 py-1 text-white">
        <p className="text-xs font-light">Submitted a Governance Action</p>
      </div>
      <p>{new Date().toLocaleDateString('en-GB')}</p>
    </div>
  );
};
const DrepGovActionSubmitCard = ({
  actionType = '',
  item,
}: {
  actionType: string;
  item: any;
}) => {
    let style: any = {
        borderColor: 'border-[#D19471]',
        bgColor: 'bg-[#D19471]',
        imgSrc: '/svgs/exchange.svg',
        actionName:''
      };
    
      switch (true) {
        case actionType.includes('protocol parameter'):
          style = {
            borderColor: 'border-[#D19471]',
            bgColor: 'bg-[#D19471]',
            imgSrc: '/svgs/exchange.svg',
            actionName:'Protocol Parameter Changes'
          };
          break;
        case actionType.includes('info'):
          style = {
            borderColor: 'border-[#BB7AEE]',
            bgColor: 'bg-[#BB7AEE]',
            imgSrc: '/svgs/info-circle.svg',
            actionName:"Info"
          };
          break;
        case actionType.includes('hard-fork'):
          style = {
            borderColor: 'border-[#A3D96C]',
            bgColor: 'bg-[#A3D96C]',
            imgSrc: '/svgs/status-change.svg',
            actionName:"Hard-Fork Initiation"
          };
          break;
        case actionType.includes('update to the constitution'):
          style = {
            borderColor: 'border-[#D96CAE]',
            bgColor: 'bg-[#D96CAE]',
            imgSrc: '/svgs/notebook.svg',
            actionName:"Update to the Constitution or proposal policy"
          };
          break;
        case actionType.includes('new constitutional committee'):
          style = {
            borderColor: 'border-[#6FDF8E]',
            bgColor: 'bg-[#6FDF8E]',
            imgSrc: '/svgs/users-group.svg',
            actionName:"New Constitutional Committee"
          };
          break;
        default:
          // Handle other cases
          console.log('Default case');
          break;
      }

  return (
    <div
      id="epoch-card"
      className={`flex max-w-md flex-col gap-3 rounded-xl border-2 bg-white p-3 shadow-xl ${style.borderColor}`}
    >
      <SubmittedChip date={item?.time_voted} />
      <hr />
      <div className="flex flex-col gap-1">
        <div className={`rounded-full p-1 ${style.bgColor} w-fit`}>
          <img src={style.imgSrc} alt="" className="h-5 w-5" />
        </div>
        <p className="text-lg font-medium">{style.actionName}</p>
      </div>
      <Link
        href={`${urls.govToolUrl}/governance_actions/${item?.gov_action_proposal_id}`}
        target="_blank"
        className="text-sm text-blue-800"
      >
        View Governance Action
      </Link>
    </div>
  );
};

export default DrepGovActionSubmitCard;
