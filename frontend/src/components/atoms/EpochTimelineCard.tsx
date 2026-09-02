'use client';
import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

type EpochTimelineCardProps = {
  epoch: any;
  minimal?: boolean;
  hasEvents?: boolean;
};

const EpochTimelineCard = ({
  epoch,
  minimal = false,
  hasEvents = true,
}: EpochTimelineCardProps) => {
  const EPOCH_DURATION_MS = 432000 * 1000;
  const startTimeMs = epoch?.start_time
    ? new Date(epoch.start_time).getTime()
    : 0;
  const endTimeMs = epoch?.end_time
    ? new Date(epoch.end_time).getTime()
    : startTimeMs
      ? startTimeMs + EPOCH_DURATION_MS
      : 0;
  const duration = endTimeMs - startTimeMs;

  const dates =
    startTimeMs && (endTimeMs || startTimeMs)
      ? {
          start: new Date(startTimeMs),
          end: new Date(endTimeMs),
          startTimeMs,
          endTimeMs,
          duration,
        }
      : null;

  const now = Date.now();
  const isCurrent = dates && now >= dates.startTimeMs && now <= dates.endTimeMs;
  const progress = isCurrent
    ? ((now - dates.startTimeMs) / dates.duration) * 100
    : dates && now > dates.endTimeMs
      ? 100
      : 0;

  return (
    <div
      className={`w-full rounded-2xl ${minimal ? 'p-3' : hasEvents || isCurrent ? 'p-4' : 'p-2.5'} border shadow-sm transition-all duration-300 ${isCurrent ? 'border-[#56c9c2] bg-gradient-to-br from-[#6FDFD8] to-[#98ece7] shadow-[0_4px_20px_rgba(111,223,216,0.3)]' : 'border-[#d6f2f1] bg-[#f8ffff]'}`}
    >
      <div className="w-full">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-2">
            <div
              className={`flex w-fit flex-nowrap items-center gap-1.5 text-nowrap ${minimal ? 'px-2 py-0.5' : 'px-2.5 py-1'} rounded-full border shadow-sm ${isCurrent ? 'border-[#e0fcfb] bg-white' : 'border-gray-100 bg-gray-50'}`}
            >
              {isCurrent ? (
                <AccessTimeIcon
                  sx={{ fontSize: minimal ? 14 : 16, color: '#3ba39d' }}
                />
              ) : (
                <CheckCircleOutlineIcon
                  sx={{ fontSize: minimal ? 14 : 16, color: '#84c3c0' }}
                />
              )}
              <p
                className={`${minimal ? 'text-[9px]' : 'text-[10px]'} font-bold tracking-widest uppercase ${isCurrent ? 'text-[#3ba39d]' : 'text-[#84c3c0]'}`}
              >
                {isCurrent ? 'Active' : 'Completed'}
              </p>
            </div>
            {isCurrent && (
              <div className="flex items-center gap-2 px-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1db9b0] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3ba39d]"></span>
                </span>
                <p
                  className={`${minimal ? 'text-[9px]' : 'text-[10px]'} font-extrabold tracking-tight text-[#1a6e69] uppercase`}
                >
                  Live
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            {dates ? (
              <div className="flex flex-col items-end">
                <p
                  className={`${minimal ? 'text-[10px]' : hasEvents || isCurrent ? 'text-[11px]' : 'text-[10px]'} font-bold ${isCurrent ? 'text-[#1a6e69]' : 'text-[#649c99]'}`}
                >
                  {dates.start.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p
                  className={`${minimal ? 'text-[9px]' : 'text-[10px]'} font-medium opacity-60 ${isCurrent ? 'text-[#1a6e69]' : 'text-[#649c99]'}`}
                >
                  to{' '}
                  {dates.end.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            ) : (
              epoch?.start_time && (
                <p
                  className={`${minimal ? 'text-[10px]' : 'text-xs'} text-right font-semibold text-[#2d7a75]`}
                >
                  {new Date(epoch?.start_time).toDateString()}
                </p>
              )
            )}
          </div>
        </div>

        <div
          className={`${minimal ? 'mt-2' : hasEvents || isCurrent ? 'mt-4' : 'mt-2'} flex items-baseline justify-between`}
        >
          <div className={`${isCurrent ? 'text-[#0a4d48]' : 'text-[#447a77]'}`}>
            <p
              className={`${minimal ? 'text-2xl' : hasEvents || isCurrent ? 'text-3xl' : 'text-xl'} font-black tracking-tighter`}
            >
              <span
                className={`${minimal ? 'text-[10px]' : 'text-sm'} mr-1 font-bold uppercase opacity-60`}
              >
                No.
              </span>
              {epoch?.epoch_no || epoch?.epochNo || epoch?.no}
            </p>
          </div>
          {isCurrent && (
            <div className="text-right">
              <p
                className={`${minimal ? 'text-[10px]' : 'text-[11px]'} font-black text-[#145753]`}
              >
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        {/* Improved Progress Bar Container */}
        <div
          className={`${minimal ? 'mt-2 h-2' : hasEvents || isCurrent ? 'mt-3 h-2.5' : 'mt-2 h-1.5'} w-full overflow-hidden rounded-full border ${isCurrent ? 'border-black/5 bg-white/40 shadow-inner' : 'border-gray-100 bg-gray-100'}`}
        >
          <div
            className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${isCurrent ? 'bg-gradient-to-r from-[#26948e] to-[#3dbfb7]' : 'bg-[#bce6e4]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Section Header Hint - Only visible if has events or is current */}
        {(hasEvents || isCurrent) && (
          <div
            className={`${minimal ? 'mt-2.5 pt-2.5' : 'mt-4 pt-4'} border-t ${isCurrent ? 'border-[#56c9c2]/30' : 'border-gray-200/50'} flex items-center justify-between`}
          >
            <div className="flex items-center gap-2 opacity-80">
              <div
                className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'animate-pulse bg-[#156e69]' : 'bg-[#84c3c0]'}`}
              />
              <p
                className={`${minimal ? 'text-[8px]' : 'text-[9px]'} font-bold tracking-widest uppercase ${isCurrent ? 'text-[#156e69]' : 'text-[#649c99]'}`}
              >
                Events in this Epoch
              </p>
            </div>
            <img
              src="/svgs/chevron-down.svg"
              className={`h-3 w-3 opacity-40 ${isCurrent ? 'text-[#156e69]' : 'text-[#649c99]'}`}
              alt="Below"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EpochTimelineCard;
