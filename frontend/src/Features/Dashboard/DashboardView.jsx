import React from 'react';
import { MOCK_DATA } from '../../Assets/mockData';
import SummaryCard from '../../Components/SummaryCard';
import { Calendar, CheckCircle, User } from 'lucide-react';

const DashboardView = () => {
  const { dashboardStats, summaryCards, todayListStats } = MOCK_DATA;

  return (
    // wrapper để tránh bị che bởi sidebar + header
    <div className="ml-56 mt-16 p-6">
      {/* Thống kê OKRs */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {dashboardStats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-gray-100`}>
            <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.change} từ tháng trước</div>
          </div>
        ))}
      </div>

      {/* Thống kê TodayList */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Nhân viên đã tạo TodayList</div>
              <div className="text-2xl font-bold text-gray-800">{todayListStats.created.count}/{todayListStats.created.total}</div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Tỷ lệ</span>
              <span className="font-semibold">{todayListStats.created.percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${todayListStats.created.percent}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Nhân viên hoàn thành TodayList</div>
              <div className="text-2xl font-bold text-gray-800">{todayListStats.completed.count}/{todayListStats.completed.total}</div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Tỷ lệ</span>
              <span className="font-semibold">{todayListStats.completed.percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${todayListStats.completed.percent}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Nhân viên chưa tạo TodayList</div>
              <div className="text-2xl font-bold text-red-600">{todayListStats.notCreated.length}</div>
            </div>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {todayListStats.notCreated.map((name, index) => (
              <div key={index} className="text-xs text-gray-700 px-2 py-1 bg-red-50 rounded">• {name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards OKRs */}
      <div className="grid grid-cols-3 gap-6">
        {summaryCards.map((card, index) => (
          <SummaryCard key={index} card={card} />
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
