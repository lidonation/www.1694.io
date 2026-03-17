import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

type EpochTimelineCardProps = {
  epoch: any;
};

const EpochTimelineCard = ({ epoch }: EpochTimelineCardProps) => {
  const getEpochDates = (epochNo: number) => {
    const CONWAY_EPOCH = 507;
    const CONWAY_START_UNIX = 1726003091 * 1000; // ms
    const EPOCH_DURATION = 432000 * 1000; // ms

    const diff = epochNo - CONWAY_EPOCH;
    const startTimeMs = CONWAY_START_UNIX + diff * EPOCH_DURATION;
    const endTimeMs = startTimeMs + EPOCH_DURATION;

    return {
      start: new Date(startTimeMs),
      end: new Date(endTimeMs),
      startTimeMs,
      endTimeMs,
      duration: EPOCH_DURATION
    };
  };

  const dates = epoch?.no ? getEpochDates(epoch.no) : null;
  const now = Date.now();
  const isCurrent = dates && now >= dates.startTimeMs && now <= dates.endTimeMs;
  const progress = isCurrent ? ((now - dates.startTimeMs) / dates.duration) * 100 : (dates && now > dates.endTimeMs ? 100 : 0);

  return (
    <div className={`w-full rounded-2xl p-4 shadow-sm border transition-all duration-300 ${isCurrent ? 'bg-gradient-to-br from-[#6FDFD8] to-[#98ece7] border-[#56c9c2] shadow-[0_4px_20px_rgba(111,223,216,0.3)]' : 'bg-[#f8ffff] border-[#d6f2f1]'}`}>
      <div className="w-full">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className={`flex w-fit flex-nowrap items-center gap-1.5 text-nowrap px-2.5 py-1 rounded-full border shadow-sm ${isCurrent ? 'bg-white border-[#e0fcfb]' : 'bg-gray-50 border-gray-100'}`}>
              {isCurrent ? (
                <AccessTimeIcon sx={{ fontSize: 16, color: '#3ba39d' }} />
              ) : (
                <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#84c3c0' }} />
              )}
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-[#3ba39d]' : 'text-[#84c3c0]'}`}>
                {isCurrent ? 'Active Epoch' : 'Epoch Completed'}
              </p>
            </div>
            {isCurrent && (
               <div className="flex items-center gap-2 px-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db9b0] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ba39d]"></span>
                  </span>
                  <p className="text-[10px] font-extrabold text-[#1a6e69] uppercase tracking-tight">Live Progress</p>
               </div>
            )}
          </div>
          <div className="text-right">
            {dates ? (
              <div className="flex flex-col items-end">
                <p className={`text-[11px] font-bold ${isCurrent ? 'text-[#1a6e69]' : 'text-[#649c99]'}`}>
                  {dates.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className={`text-[10px] font-medium opacity-60 ${isCurrent ? 'text-[#1a6e69]' : 'text-[#649c99]'}`}>
                  to {dates.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ) : epoch?.start_time && (
              <p className='text-xs font-semibold text-[#2d7a75] text-right'>{new Date(epoch?.start_time).toDateString()}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-baseline justify-between">
          <div className={`${isCurrent ? 'text-[#0a4d48]' : 'text-[#447a77]'}`}>
            <p className='text-3xl font-black tracking-tighter'>
              <span className="text-sm font-bold opacity-60 mr-1 uppercase">No.</span>
              {epoch?.no}
            </p>
          </div>
          {isCurrent && (
            <div className="text-right">
               <p className="text-[11px] font-black text-[#145753]">{Math.round(progress)}%</p>
            </div>
          )}
        </div>

        {/* Improved Progress Bar Container */}
        <div className={`mt-3 h-2.5 w-full rounded-full overflow-hidden border ${isCurrent ? 'bg-white/40 border-black/5 shadow-inner' : 'bg-gray-100 border-gray-100'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isCurrent ? 'bg-gradient-to-r from-[#26948e] to-[#3dbfb7]' : 'bg-[#bce6e4]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default EpochTimelineCard;
