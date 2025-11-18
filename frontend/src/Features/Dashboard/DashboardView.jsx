import React, { useState, useEffect } from 'react';
import SummaryCard from '../../Components/SummaryCard';
import { Calendar, CheckCircle, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DashboardView = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [todayListStats, setTodayListStats] = useState({
    created: { count: 0, total: 0, percent: 0 },
    completed: { count: 0, total: 0, percent: 0 },
    notCreated: []
  });

  // State cho bộ lọc ngày (dùng chung cho cả OKRs và TodayList)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const [okrsRes, usersRes, todayListRes] = await Promise.all([
        fetch(`${API_URL}/api/okrs`, { headers }),
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/todaylist`, { headers })
      ]);

      const okrsData = okrsRes.ok ? await okrsRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const todayListData = todayListRes.ok ? await todayListRes.json() : [];

      // Tính toán thống kê OKRs với bộ lọc ngày
      calculateOKRStats(okrsData);

      // Tính toán thống kê Summary Cards với bộ lọc ngày
      calculateSummaryCards(okrsData);

      // Tính toán thống kê TodayList với bộ lọc ngày
      calculateTodayListStats(todayListData, usersData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOKRStats = (okrs) => {
    // Lọc OKRs theo khoảng thời gian
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredOkrs = okrs.filter(okr => {
      const createdDate = okr.created_at ? new Date(okr.created_at) : null;
      const updatedDate = okr.updated_at ? new Date(okr.updated_at) : null;
      
      // Bao gồm OKR nếu được tạo hoặc cập nhật trong khoảng thời gian
      const createdInRange = createdDate && createdDate >= start && createdDate <= end;
      const updatedInRange = updatedDate && updatedDate >= start && updatedDate <= end;
      
      return createdInRange || updatedInRange;
    });

    const total = filteredOkrs.length;
    
    // Tính OKRs hoàn thành (progress >= 100)
    const completed = filteredOkrs.filter(okr => Number(okr.progress) >= 100).length;
    
    // Tính OKRs đang thực hiện (0 < progress < 100)
    const inProgress = filteredOkrs.filter(okr => {
      const progress = Number(okr.progress);
      return progress > 0 && progress < 100;
    }).length;
    
    // Tính OKRs chậm tiến độ (progress < 30)
    const delayed = filteredOkrs.filter(okr => Number(okr.progress) < 30).length;

    const stats = [
      {
        label: 'Tổng OKRs',
        value: total,
        bgColor: 'bg-blue-50',
        color: 'text-blue-600',
        change: '+12%'
      },
      {
        label: 'Hoàn thành',
        value: completed,
        bgColor: 'bg-green-50',
        color: 'text-green-600',
        change: '+8%'
      },
      {
        label: 'Đang thực hiện',
        value: inProgress,
        bgColor: 'bg-yellow-50',
        color: 'text-yellow-600',
        change: '+3%'
      },
      {
        label: 'Chậm tiến độ',
        value: delayed,
        bgColor: 'bg-red-50',
        color: 'text-red-600',
        change: '-2%'
      }
    ];

    setDashboardStats(stats);
  };

  const calculateSummaryCards = (okrs) => {
    // Lọc OKRs theo khoảng thời gian
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredOkrs = okrs.filter(okr => {
      const createdDate = okr.created_at ? new Date(okr.created_at) : null;
      const updatedDate = okr.updated_at ? new Date(okr.updated_at) : null;
      
      const createdInRange = createdDate && createdDate >= start && createdDate <= end;
      const updatedInRange = updatedDate && updatedDate >= start && updatedDate <= end;
      
      return createdInRange || updatedInRange;
    });

    const types = [
      { key: 'Công ty', title: 'OKRs Toàn Công Ty', color: 'blue' },
      { key: 'Cá Nhân', title: 'OKRs Cá Nhân', color: 'green' },
      { key: 'Nhóm', title: 'OKRs Nhóm', color: 'purple' }
    ];

    const cards = types.map(type => {
      const typeOKRs = filteredOkrs.filter(okr => (okr.type || '').trim() === type.key);
      const count = typeOKRs.length;
      const totalProgress = typeOKRs.reduce((sum, okr) => sum + (Number(okr.progress) || 0), 0);
      const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;

      return {
        title: type.title,
        count,
        progress: avgProgress,
        bgColor: `bg-${type.color}-50`,
        color: type.color,
        icon: type.key === 'Công ty' ? 'building' : type.key === 'Cá Nhân' ? 'user' : 'users'
      };
    });

    setSummaryCards(cards);
  };

  const calculateTodayListStats = (todayList, users) => {
    // Chuyển đổi startDate và endDate sang Date objects
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Lọc tasks trong khoảng thời gian được chọn
    const filteredTasks = todayList.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= start && taskDate <= end;
    });

    console.log('Filtered tasks:', filteredTasks);
    console.log('Total users:', users.length);

    // Đếm số nhân viên đã tạo TodayList trong khoảng thời gian (có ít nhất 1 task)
    const createdByUsersSet = new Set();
    filteredTasks.forEach(task => {
      // Lấy user_id từ task (theo cấu trúc bảng todaylist)
      const userId = task.user_id;
      if (userId) {
        createdByUsersSet.add(Number(userId));
      }
    });
    
    const createdCount = createdByUsersSet.size;
    const totalUsers = users.length;
    const createdPercent = totalUsers > 0 ? Math.round((createdCount / totalUsers) * 100) : 0;

    console.log('Users who created tasks:', Array.from(createdByUsersSet));
    console.log('Created count:', createdCount);

    // Đếm số nhân viên hoàn thành TodayList (có ít nhất 1 task với status "Đã đóng")
    const completedUsersSet = new Set();
    filteredTasks.forEach(task => {
      // Kiểm tra status = "Đã đóng" (theo bảng todaylist)
      if (task.status === 'Đã đóng') {
        const userId = task.user_id;
        if (userId) {
          completedUsersSet.add(Number(userId));
        }
      }
    });
    
    const completedCount = completedUsersSet.size;
    const completedPercent = totalUsers > 0 ? Math.round((completedCount / totalUsers) * 100) : 0;

    console.log('Users who completed tasks:', Array.from(completedUsersSet));
    console.log('Completed count:', completedCount);

    // Danh sách nhân viên chưa tạo TodayList (không có task nào trong khoảng thời gian)
    const notCreatedUsers = users
      .filter(user => {
        const userId = Number(user.user_id || user.id);
        return !createdByUsersSet.has(userId);
      })
      .map(user => user.fullname || user.username)
      .slice(0, 10); // Tăng giới hạn lên 10 người để hiển thị

    console.log('Users who did not create tasks:', notCreatedUsers);

    setTodayListStats({
      created: {
        count: createdCount,
        total: totalUsers,
        percent: createdPercent
      },
      completed: {
        count: completedCount,
        total: totalUsers,
        percent: completedPercent
      },
      notCreated: notCreatedUsers
    });
  };

  if (loading) {
    return (
      <div className="ml-56 mt-16 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-56 mt-16 p-6">
      {/* Bộ lọc ngày chung cho OKRs và TodayList */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Lọc theo thời gian:</label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Hôm nay
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              setStartDate(firstDay.toISOString().split('T')[0]);
              setEndDate(lastDay.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
          >
            Tháng này
          </button>
        </div>
      </div>

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
              <div className="text-2xl font-bold text-gray-800">
                {todayListStats.created.count}/{todayListStats.created.total}
              </div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Tỷ lệ</span>
              <span className="font-semibold">{todayListStats.created.percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${todayListStats.created.percent}%` }}
              ></div>
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
              <div className="text-2xl font-bold text-gray-800">
                {todayListStats.completed.count}/{todayListStats.created.count}
              </div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Tỷ lệ</span>
              <span className="font-semibold">{todayListStats.completed.percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${todayListStats.completed.percent}%` }}
              ></div>
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
              <div className="text-2xl font-bold text-red-600">
                {todayListStats.notCreated.length}
              </div>
            </div>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {todayListStats.notCreated.length > 0 ? (
              todayListStats.notCreated.map((name, index) => (
                <div key={index} className="text-xs text-gray-700 px-2 py-1 bg-red-50 rounded">
                  • {name}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 px-2 py-1">
                Tất cả đã tạo TodayList
              </div>
            )}
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
