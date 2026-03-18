import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

type EpochTimelineCardProps = {
  epoch: any;
  minimal?: boolean;
};

const EpochTimelineCard = ({ epoch, minimal = false }: EpochTimelineCardProps) => {
  const EPOCH_DURATION_MS = 432000 * 1000;
  const startTimeMs = epoch?.start_time ? new Date(epoch.start_time).getTime() : 0;
  const endTimeMs = epoch?.end_time ? new Date(epoch.end_time).getTime() : (startTimeMs ? startTimeMs + EPOCH_DURATION_MS : 0);
  const duration = endTimeMs - startTimeMs;

  const dates = startTimeMs && (endTimeMs || startTimeMs) ? {
    start: new Date(startTimeMs),
    end: new Date(endTimeMs),
    startTimeMs,
    endTimeMs,
    duration
  } : null;

  const now = Date.now();
  const isCurrent = dates && now >= dates.startTimeMs && now <= dates.endTimeMs;
  const progress = isCurrent ? ((now - dates.startTimeMs) / dates.duration) * 100 : (dates && now > dates.endTimeMs ? 100 : 0);

  return (
    <div className={`w-full rounded-2xl ${minimal ? 'p-3' : 'p-4'} shadow-sm border transition-all duration-300 ${isCurrent ? 'bg-gradient-to-br from-[#6FDFD8] to-[#98ece7] border-[#56c9c2] shadow-[0_4px_20px_rgba(111,223,216,0.3)]' : 'bg-[#f8ffff] border-[#d6f2f1]'}`}>
      <div className="w-full">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className={`flex w-fit flex-nowrap items-center gap-1.5 text-nowrap ${minimal ? 'px-2 py-0.5' : 'px-2.5 py-1'} rounded-full border shadow-sm ${isCurrent ? 'bg-white border-[#e0fcfb]' : 'bg-gray-50 border-gray-100'}`}>
              {isCurrent ? (
                <AccessTimeIcon sx={{ fontSize: minimal ? 14 : 16, color: '#3ba39d' }} />
              ) : (
                <CheckCircleOutlineIcon sx={{ fontSize: minimal ? 14 : 16, color: '#84c3c0' }} />
              )}
              <p className={`${minimal ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-widest ${isCurrent ? 'text-[#3ba39d]' : 'text-[#84c3c0]'}`}>
                {isCurrent ? 'Active' : 'Completed'}
              </p>
            </div>
            {isCurrent && (
               <div className="flex items-center gap-2 px-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db9b0] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ba39d]"></span>
                  </span>
                  <p className={`${minimal ? 'text-[9px]' : 'text-[10px]'} font-extrabold text-[#1a6e69] uppercase tracking-tight`}>Live</p>
               </div>
            )}
          </div>
          <div className="text-right">
            {dates ? (
              <div className="flex flex-col items-end">
                <p className={`${minimal ? 'text-[10px]' : 'text-[11px]'} font-bold ${isCurrent ? 'text-[#1a6e69]' : 'text-[#649c99]'}`}>
                  {dates.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className={`${minimal ? 'text-[9px]' : 'text-[10px]'} font-medium opacity-60 ${isCurrent ? 'text-[#1a6e69]' : 'text-[#649c99]'}`}>
                  to {dates.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ) : epoch?.start_time && (
              <p className={`${minimal ? 'text-[10px]' : 'text-xs'} font-semibold text-[#2d7a75] text-right`}>{new Date(epoch?.start_time).toDateString()}</p>
            )}
          </div>
        </div>
        
        <div className={`${minimal ? 'mt-2' : 'mt-4'} flex items-baseline justify-between`}>
          <div className={`${isCurrent ? 'text-[#0a4d48]' : 'text-[#447a77]'}`}>
            <p className={`${minimal ? 'text-2xl' : 'text-3xl'} font-black tracking-tighter`}>
              <span className={`${minimal ? 'text-[10px]' : 'text-sm'} font-bold opacity-60 mr-1 uppercase`}>No.</span>
              {epoch?.no}
            </p>
          </div>
          {isCurrent && (
            <div className="text-right">
               <p className={`${minimal ? 'text-[10px]' : 'text-[11px]'} font-black text-[#145753]`}>{Math.round(progress)}%</p>
            </div>
          )}
        </div>

        {/* Improved Progress Bar Container */}
        <div className={`${minimal ? 'mt-2 h-2' : 'mt-3 h-2.5'} w-full rounded-full overflow-hidden border ${isCurrent ? 'bg-white/40 border-black/5 shadow-inner' : 'bg-gray-100 border-gray-100'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isCurrent ? 'bg-gradient-to-r from-[#26948e] to-[#3dbfb7]' : 'bg-[#bce6e4]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Section Header Hint */}
        <div className={`${minimal ? 'mt-2.5 pt-2.5' : 'mt-4 pt-4'} border-t ${isCurrent ? 'border-[#56c9c2]/30' : 'border-gray-200/50'} flex items-center justify-between`}>
          <div className="flex items-center gap-2 opacity-80">
            <div className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-[#156e69] animate-pulse' : 'bg-[#84c3c0]'}`} />
            <p className={`${minimal ? 'text-[8px]' : 'text-[9px]'} font-bold uppercase tracking-widest ${isCurrent ? 'text-[#156e69]' : 'text-[#649c99]'}`}>
              Events in this Epoch
            </p>
          </div>
          <img src="/svgs/chevron-down.svg" className={`h-3 w-3 opacity-40 ${isCurrent ? 'text-[#156e69]' : 'text-[#649c99]'}`} alt="Below" />
        </div>
      </div>
    </div>
  );
};

export default EpochTimelineCard;
