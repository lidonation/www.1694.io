import React, { useState } from 'react';

const DrepTabGroup = () => {
  const [active, setActive] = useState(null);
  const activeClasses =
    'bg-white border-b-2 border-b-blue-800 rounded-t-xl text-blue-800 ';
  const inactiveClasses = 'text-gray-400 hover:text-gray-800 cursor-pointer';

  const handleClick = (id) => {
    setActive(id);
  };
  return (
    <div className="flex items-center gap-5 px-8 py-4">
      <div
        id="timeline"
        className={`px-8 py-4 ${active === 'timeline' ? activeClasses : inactiveClasses}`}
        onClick={() => handleClick('timeline')}
      >
        <p>Timeline</p>
      </div>
      <div
        id="delegators"
        className={`px-8 py-4 ${active === 'delegators' ? activeClasses : inactiveClasses}`}
        onClick={() => handleClick('delegators')}
      >
        <p>Delegators</p>
      </div>
      <div
        id="metrics"
        className={`px-8 py-4 ${active === 'metrics' ? activeClasses : inactiveClasses}`}
        onClick={() => handleClick('metrics')}
      >
        <p>Metrics</p>
      </div>
    </div>
  );
};

export default DrepTabGroup;
