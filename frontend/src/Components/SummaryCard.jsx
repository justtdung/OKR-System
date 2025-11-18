import React from 'react';
import { Building2, User, Users } from 'lucide-react';

const SummaryCard = ({ card }) => {
  const getIcon = () => {
    switch (card.icon) {
      case 'building':
        return <Building2 className="w-6 h-6" />;
      case 'user':
        return <User className="w-6 h-6" />;
      case 'users':
        return <Users className="w-6 h-6" />;
      default:
        return <Building2 className="w-6 h-6" />;
    }
  };

  const getColorClass = () => {
    switch (card.color) {
      case 'blue':
        return 'bg-blue-500';
      case 'green':
        return 'bg-green-500';
      case 'purple':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getProgressBarColor = () => {
    switch (card.color) {
      case 'blue':
        return '#3b82f6';
      case 'green':
        return '#10b981';
      case 'purple':
        return '#a855f7';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${getColorClass()} rounded-lg flex items-center justify-center text-white`}>
            {getIcon()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">{card.title}</div>
            <div className="text-xs text-gray-500 mt-1">Tiến độ</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">{card.count}</div>
          <div className="text-xs text-gray-500">OKRs</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Tiến độ trung bình</span>
          <span className="font-semibold">{card.progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${card.progress}%`,
              backgroundColor: getProgressBarColor()
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;