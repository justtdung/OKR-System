import { Building2, User, Users } from 'lucide-react';

export const MOCK_DATA = {
  employeesNotCreated: ['Nguyễn Văn B', 'Trần Thị C', 'Lê Văn D', 'Phạm Thị E', 'Hoàng Văn F'],

  employeesCreated: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn E'],
  
  employeesCompleted: ['Nguyễn Văn A', 'Trần Thị B'],

  summaryCards: [
    { 
      icon: Building2, 
      count: 12, 
      label: 'OKRs', 
      title: 'OKRs Toàn Công Ty', 
      progress: 78, 
      status: 'Tốt', 
      statusColor: 'text-green-600', 
      bgColor: 'bg-blue-500', 
      progressColor: 'bg-blue-500' 
    },
    { 
      icon: User, 
      count: 24, 
      label: 'OKRs', 
      title: 'OKRs Cá Nhân', 
      progress: 65, 
      status: 'Trung bình', 
      statusColor: 'text-yellow-600', 
      bgColor: 'bg-green-500', 
      progressColor: 'bg-green-500' 
    },
    { 
      icon: Users, 
      count: 8, 
      label: 'OKRs', 
      title: 'OKRs Nhóm', 
      progress: 82, 
      status: 'Tốt', 
      statusColor: 'text-green-600', 
      bgColor: 'bg-purple-500', 
      progressColor: 'bg-purple-500' 
    }
  ],

  okrsList: [
    // dữ liệu OKRs mẫu đã bị xóa — sẽ load từ DB
  ],

  todayTasksData: [
    // dữ liệu TodayList mẫu đã bị xóa — sẽ load từ DB
  ],

  dashboardStats: [
    { label: 'Tổng OKRs', value: '44', change: '+12%', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Hoàn thành', value: '32', change: '+8%', color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Đang thực hiện', value: '8', change: '+3%', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { label: 'Chậm tiến độ', value: '4', change: '-2%', color: 'text-red-600', bgColor: 'bg-red-50' }
  ],

  todayListStats: {
    created: { count: 85, total: 100, percent: 85, employees: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'] },
    completed: { count: 72, total: 100, percent: 72, employees: ['Nguyễn Văn A', 'Trần Thị B'] },
    notCreated: ['Nguyễn Văn B', 'Trần Thị C', 'Lê Văn D', 'Phạm Thị E', 'Hoàng Văn F']
  }
};
