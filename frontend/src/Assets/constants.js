import { Grid, CheckCircle, Target, MessageCircle, Store, Calendar, FileText } from 'lucide-react';

const CONSTANTS = {
  UNITS: ['Người', '%', 'VND', 'Lần'],
  PRIORITIES: ['Cao', 'Trung bình', 'Thấp'],
  TASK_STATUSES: ['Chưa xử lý', 'Đang tiến hành', 'Đang xem xét', 'Hủy TodayList', 'Đã đóng'],
  NAV_ITEMS: [
    { id: 'Dashboard', icon: Grid, label: 'Dashboard' },
    { id: 'TodayList', icon: Calendar, label: 'TodayList' },
    { id: 'OKRs', icon: Target, label: 'OKRs' },
    { id: 'Check-in', icon: CheckCircle, label: 'Check-in' },
    { id: 'CFRs', icon: MessageCircle, label: 'CFRs' },
    { id: 'Store', icon: Store, label: 'Store' },
    { id: 'Report', icon: FileText, label: 'Report' }
  ]
};

const STATUS_COLORS = {
  'Chưa xử lý': 'bg-gray-100 text-gray-700 border-gray-300',
  'Đang tiến hành': 'bg-blue-100 text-blue-700 border-blue-300',
  'Hủy TodayList': 'bg-red-100 text-red-700 border-red-300',
  'Đang xem xét': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Đã đóng': 'bg-green-100 text-green-700 border-green-300'
};

export default CONSTANTS;
export { STATUS_COLORS };