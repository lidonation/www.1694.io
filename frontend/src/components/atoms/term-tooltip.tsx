import React from 'react';
import { Tooltip, Typography, Box } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
const GLOSSARY_TERMS: Record<string, string> = {
  Lovelace: "The smallest unit of Ada. 1,000,000 Lovelace = 1 Ada.",
  DRep: "Delegated Representative: A role that represents the voting power of Ada holders who have delegated their stake.",
  SPO: "Stake Pool Operator: Entity that runs a stake pool and participates in the network's consensus and governance.",
  "Constitutional Committee": "A body that ensures governance actions follow the Cardano Constitution.",
  "Governance Action": "An on-chain proposal that can change the protocol or the constitution.",
  Ratification: "The process by which a governance action is approved by the required bodies.",
  Enactment: "The final execution of a ratified governance action on-chain.",
  Epoch: "A period of time in the Cardano network (typically 5 days on mainnet).",
  UTxO: "Unspent Transaction Output, the fundamental unit of Cardano's ledger.",
  "CIP-1694": "The Cardano Improvement Proposal that describes the on-chain governance system.",
  Voltaire: "The final era of Cardano, focusing on decentralized governance.",
  "Guardrails Script": "A script that enforces specific rules and conditions for governance actions.",
  Ada: "The native cryptocurrency of the Cardano blockchain.",
  "Threshold": "The minimum percentage of votes required to ratify a governance action.",
};

interface TermTooltipProps {
  term: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export const TermTooltip = ({ term, children, showIcon = false }: TermTooltipProps) => {
  const definition = GLOSSARY_TERMS[term];

  if (!definition) {
    return <>{children || term}</>;
  }

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {term}
          </Typography>
          <Typography variant="body2">{definition}</Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <span className="inline-flex items-center cursor-help border-b border-dotted border-primary-400 hover:text-primary-600 transition-colors">
        {children || term}
        {showIcon && <InfoOutlinedIcon sx={{ fontSize: 14, ml: 0.5, opacity: 0.6 }} />}
      </span>
    </Tooltip>
  );
};

