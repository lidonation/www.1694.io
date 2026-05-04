'use client';
import React, { useState } from 'react';
import { 
  CheckCircleOutline, 
  CancelOutlined, 
  GroupsOutlined, 
  BalanceOutlined, 
  HistoryEduOutlined,
  FiberManualRecord
} from '@mui/icons-material';
import { TermTooltip } from '../atoms/term-tooltip';

const GovernanceExplorer = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = [
    {
      actions: 'Motion of no-confidence',
      CC: { required: false, label: '-' },
      DReps: { required: true, label: '$P_1$' },
      SPOs: { required: true, label: '$Q_1$' },
      description: 'A motion to revoke the power of the constitutional committee.'
    },
    {
      actions: 'Update committee threshold (normal state)',
      CC: { required: false, label: '-' },
      DReps: { required: true, label: '$P_{2a}$' },
      SPOs: { required: true, label: '$Q_{2a}$' },
      description: 'Changes to the constitutional committee threshold during normal operations.'
    },
    {
      actions: 'Update committee threshold (no confidence)',
      CC: { required: false, label: '-' },
      DReps: { required: true, label: '$P_{2b}$' },
      SPOs: { required: true, label: '$Q_{2b}$' },
      description: 'Changes to the CC threshold while in a state of no confidence.'
    },
    {
      actions: 'New Constitution or Guardrails Script',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$P_3$' },
      SPOs: { required: false, label: '-' },
      description: 'Modifications to the core rules or scripts of governance.'
    },
    {
      actions: 'Hard-Fork Initiation',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$P_4$' },
      SPOs: { required: true, label: '$Q_4$' },
      description: 'Coordinated network upgrade requiring full consensus.'
    },
    {
      actions: 'Protocol Parameter Changes (Economic)',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$P_{5a}$' },
      SPOs: { required: false, label: '-' },
      description: 'Updates to economic parameters like transaction fees.'
    },
    {
      actions: 'Protocol Parameter Changes (Economic)',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$P_{5b}$' },
      SPOs: { required: false, label: '-' },
      description: 'Additional economic parameters requiring ratification.'
    },
    {
      actions: 'Protocol Parameter Changes (Technical)',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$P_{5c}$' },
      SPOs: { required: false, label: '-' },
      description: 'Updates to technical network settings and script execution.'
    },
    {
      actions: 'Protocol Parameter Changes (Governance)',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$P_{5d}$' },
      SPOs: { required: false, label: '-' },
      description: 'Changes to governance system parameters.'
    },
    {
      actions: 'Treasury Withdrawals',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$P_6$' },
      SPOs: { required: false, label: '-' },
      description: 'Transfer of funds from the treasury.'
    },
    {
      actions: 'Info',
      CC: { required: true, label: '✓' },
      DReps: { required: true, label: '$100$' },
      SPOs: { required: true, label: '$100$' },
      description: 'On-chain signals with no protocol effect (polling).'
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
        {data.map((item, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              hoveredIndex === index ? 'border-primary-500 ring-2 ring-primary-100' : 'border-zinc-200'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Action Number & Icon */}
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 text-sm font-bold">
                {index + 1}
              </span>
              <HistoryEduOutlined className="text-zinc-300 group-hover:text-primary-400 transition-colors" />
            </div>

            {/* Action Title */}
            <h3 className="text-lg font-bold text-zinc-900 mb-2 leading-tight min-h-[3rem]">
              {item.actions}
            </h3>

            {/* Ratifiers Visualization */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-50">
              <RatifierBadge 
                label="CC" 
                term="Constitutional Committee"
                info={item.CC} 
                icon={<BalanceOutlined sx={{ fontSize: 16 }} />} 
              />
              <RatifierBadge 
                label="DReps" 
                term="DRep"
                info={item.DReps} 
                icon={<GroupsOutlined sx={{ fontSize: 16 }} />} 
              />
              <RatifierBadge 
                label="SPOs" 
                term="SPO"
                info={item.SPOs} 
                icon={<FiberManualRecord sx={{ fontSize: 16 }} />} 
              />
            </div>

            {/* Tooltip Content (Optional overlay) */}
            <div className={`mt-4 text-xs text-zinc-500 transition-opacity duration-300 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface RatifierBadgeProps {
  label: string;
  term: string;
  info: { required: boolean; label: string };
  icon: React.ReactNode;
}

const RatifierBadge = ({ label, term, info, icon }: RatifierBadgeProps) => {
  return (
    <div className={`flex flex-col items-center flex-1 rounded-lg p-2 transition-all ${
      info.required 
        ? 'bg-violet-50 text-violet-700 border border-violet-100' 
        : 'bg-zinc-50 text-zinc-400 border border-transparent'
    }`}>
      <TermTooltip term={term}>
        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</span>
      </TermTooltip>
      <div className="flex items-center gap-1 font-mono text-sm leading-none">
        {info.required ? (
          <>
            <span className="font-bold underline italic decoration-dotted">{info.label.replace(/\$/g, '')}</span>
          </>
        ) : (
          <span className="text-zinc-300">-</span>
        )}
      </div>
    </div>
  );
};

export default GovernanceExplorer;
