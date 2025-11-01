import React from 'react';

const SummaryCard = ({ card }) => {
  const Icon = card.icon;
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-800">{card.count}</div>
          <div className="text-sm text-gray-500">{card.label}</div>
        </div>
      </div>
      <h3 className="font-semibold text-gray-800 mb-3">{card.title}</h3>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Tiến độ</span>
          <span className="font-semibold">{card.progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${card.progressColor}`} style={{ width: `${card.progress}%` }}></div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <span className={`${card.statusColor} font-medium`}>
          {card.status === 'Tốt' ? '↑' : '→'} {card.status}
        </span>
      </div>
    </div>
  );
};

export default SummaryCard;