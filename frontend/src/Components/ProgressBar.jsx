import React from 'react';

const ProgressBar = ({ progress, color }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${progress}%` }}></div>
    </div>
    <span className="text-xs font-semibold text-gray-700 w-8">{progress}%</span>
  </div>
);

export default ProgressBar;