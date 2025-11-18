import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, SquareCheckBig, ListTodo, MessageCircle, Target, Store, BarChart, User, LogOut } from 'lucide-react';
import Logo from '../../Assets/logo.png';
import './Sidebar.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Sidebar = ({ activeNav, setActiveNav, onLogout, user }) => {
  const navigate = useNavigate();

  const doNavigate = (path) => {
    if (navigate) {
      navigate(path);
    } else {
      // fallback (shouldn't be needed if react-router-dom is installed)
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('locationchange'));
    }
  };

  const navTo = (id) => {
    const path =
      id === 'Dashboard' ? '/dashboard' :
      id === 'OKRs' ? '/okrs' :
      (id === 'Check-in' || id === 'Checkin') ? '/checkin' :
      id === 'TodayList' ? '/todaylist' :
      id === 'Admin' ? '/admin/users' :
      `/${id.toLowerCase()}`;
    doNavigate(path);
    if (typeof setActiveNav === 'function') setActiveNav(id);
  };

  // Thêm item mới vào danh sách menu:
  const menuItems = [
    { name: 'DASHBOARD', icon: <LayoutDashboard /> },
    { name: 'OKRS', icon: <Target /> },
    { name: 'CHECK-IN', icon: <SquareCheckBig /> },
    { name: 'TODAYLIST', icon: <ListTodo /> },
    { name: 'CFRS', icon: <MessageCircle /> },
    { name: 'STORE', icon: <Store /> },
    { name: 'REPORT', icon: <BarChart /> }
  ];

  return (
    // aside cố định bên trái, z-index cao để không bị nội dung chồng lấn
    <aside className="fixed left-0 top-0 w-56 bg-white border-r border-gray-200 flex flex-col h-screen z-50 overflow-auto">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-center">
        <img src={Logo} alt="Company Logo" className="h-auto w-auto" />
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 overflow-auto">
        {menuItems.map(({ name, icon }, index) => (
          <button
            key={name}
            onClick={() => navTo(name)}
            className={`sidebar-btn ${activeNav === name ? 'sidebar-btn-active' : ''}`}
          >
            {icon}
            <span>{name}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        {/* khu vực profile: bấm vào sẽ navigate đến /profile */}
        <button
          type="button"
          onClick={() => {
            doNavigate('/profile');
            if (typeof setActiveNav === 'function') setActiveNav('Profile');
          }}
          className="w-full flex items-center gap-3 mb-3 text-left focus:outline-none hover:bg-gray-50 p-2 rounded-lg transition"
          aria-label="Mở thông tin người dùng"
        >
          <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
            {user?.avatar || user?.avatarUrl ? (
              <img 
                src={user.avatarUrl || `${API_URL}/uploads/${user.avatar}`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              {user?.username || 'Người dùng'}
            </div>
            <div className="text-xs text-gray-500">
              {user?.role || 'Nhân viên'}
            </div>
          </div>
        </button>

        {/* Button Quản lý tài khoản - CHỈ HIỆN VỚI ADMIN */}
        {user?.username === 'admin' && (
          <button
            type="button"
            onClick={() => {
              doNavigate('/admin/users');
              if (typeof setActiveNav === 'function') setActiveNav('Admin');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 mb-2 text-blue-600 hover:text-white hover:bg-blue-500 rounded-lg transition border border-blue-600"
            aria-label="Quản lý tài khoản"
          >
            <span>👥</span>
            <span>Quản lý tài khoản</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (typeof onLogout === 'function') {
              onLogout();
            } else {
              // fallback: remove token and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          }}
          aria-label="Đăng xuất"
          className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition border border-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

