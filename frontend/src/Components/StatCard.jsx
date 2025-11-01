import React from 'react';

const StatCard = ({ stat }) => (
  <div className={`${stat.bgColor} rounded-xl p-6 border border-gray-100`}>
    <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
    <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
    <div className="text-sm text-gray-500">{stat.change} từ tháng trước</div>
  </div>
);

export default StatCard;