// 🔹 React core
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🔹 Components & Features
import Login from './Features/Login/Login';
import Sidebar from './Components/Sidebar/Sidebar';
import Header from './Components/Header';
import OKRModal from './Modals/CreateOKR/CreateOKR';
import UserForm from './Modals/UserForm/UserForm';
import DashboardView from './Features/Dashboard/DashboardView';
import OKRsView from './Features/OKRs/OKRsView';
import TodayListView from './Features/TodayList/TodayListView';
import Checkin from './Features/Checkin/Checkin';
import CFRs from './Features/CFRs/CFRs';
import Report from './Features/Report/Report';
import Store from './Features/Store/Store';
import AdminUsers from './Pages/AdminUsers/AdminUsers';

// 🔹 Config
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ==================== COMPONENT ====================
export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [selectedQuarter, setSelectedQuarter] = useState('Quý T36');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([]);
  const [showOKRModal, setShowOKRModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [newOKR, setNewOKR] = useState({
    quarter: '',
    parent: '',
    objective: '',
    keyResults: [{
      description: '',
      target: '',
      unit: 'Người',
      planLink: '',
      resultLink: '',
      relatedOKRs: []
    }],
    visibility: 'public'
  });

  // Fetch departments khi authenticated
  useEffect(() => {
    if (authenticated) {
      fetchDepartments();
    }
  }, [authenticated]);

  // Giữ đăng nhập khi reload
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setAuthenticated(false);

    fetch(`${API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject('invalid token'))
      .then(async data => {
        const userData = data.user;
        userData.avatarUrl = userData.avatar ? `${API_URL}/uploads/${userData.avatar}` : null;
        setUser(userData);
        setAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));

        // Load TodayList từ server sau khi xác thực
        try {
          const res = await fetch(`${API_URL}/api/todaylist`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const rows = await res.json();
            const mapped = Array.isArray(rows) ? rows.map(r => {
              const creator = (r.user_id && userData && r.user_id === userData.user_id) ? {
                username: userData.username,
                avatar: userData.avatar,
                avatarUrl: userData.avatarUrl,
                department_name: userData.department_name || userData.department || ''
              } : null;
              return {
                id: r.task_id,
                text: r.task_name,
                status: r.status,
                time: r.created_at ? new Date(r.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
                priority: r.priority,
                description: r.description,
                deadline: r.deadline,
                duration: r.estimate_time,
                attachments: r.attachments ? JSON.parse(r.attachments) : [],
                comments: r.comments,
                department: r.department_id,
                creator
              };
            }) : [];
            setTasks(mapped);
          }
        } catch (err) {
          console.error('Load todaylist failed', err);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setAuthenticated(false);
      });
  }, []);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    setAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userInfo));
    // Always redirect to dashboard after login
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    setUser(null);
    setAuthenticated(false);
    setActiveNav('Dashboard');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  };

  const handleCreateOKR = () => {
    console.log('Creating OKR:', newOKR);
    setShowOKRModal(false);
    setNewOKR({
      quarter: '',
      parent: '',
      objective: '',
      keyResults: [{
        description: '',
        target: '',
        unit: 'Người',
        planLink: '',
        resultLink: '',
        relatedOKRs: []
      }],
      visibility: 'public'
    });
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleUpdateProfile = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });

      // Thử endpoint /api/me/update
      let response = await fetch(`${API_URL}/api/me/update`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      // Nếu endpoint trên không có, thử endpoint khác
      if (!response.ok && response.status === 404) {
        console.log('Trying alternative endpoint /api/profile/update');
        response = await fetch(`${API_URL}/api/profile/update`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: data
        });
      }

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const result = await response.json();
          const updatedUser = result.user || result;
          updatedUser.avatarUrl = updatedUser.avatar ? `${API_URL}/uploads/${updatedUser.avatar}` : null;
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          alert('Cập nhật thông tin thành công!');
          
          // Reload lại thông tin user
          const meResponse = await fetch(`${API_URL}/api/me`, { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            const userData = meData.user;
            userData.avatarUrl = userData.avatar ? `${API_URL}/uploads/${userData.avatar}` : null;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
          throw new Error('Server không trả về JSON');
        }
      } else {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        alert(`Cập nhật thất bại! Backend chưa có route /api/me/update. Vui lòng tạo route này trong backend.`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  return (
    <BrowserRouter>
      {!authenticated ? (
        // When not authenticated, only expose the /login route and redirect everything else to /login
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        // Authenticated app layout
        <div className="min-h-screen bg-gray-50 flex">
          {/* Modals */}
          <OKRModal
            show={showOKRModal}
            onClose={() => setShowOKRModal(false)}
            newOKR={newOKR}
            setNewOKR={setNewOKR}
            onSubmit={handleCreateOKR}
          />

          {/* Layout */}
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            onLogout={handleLogout}
            user={user}
          />

          <main className="flex-1 flex flex-col">
            <Header
              activeNav={activeNav}
              selectedQuarter={selectedQuarter}
              setSelectedQuarter={setSelectedQuarter}
              user={user}
              onLogout={handleLogout}
            />

            <div className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/dashboard" element={<DashboardView />} />
                <Route path="/okrs" element={<OKRsView onOpenModal={() => setShowOKRModal(true)} />} />
                <Route path="/checkin" element={<Checkin />} />
                <Route path="/check-in" element={<Checkin />} />
                <Route path="/cfrs" element={<CFRs />} />
                <Route path="/report" element={<Report />} />
                <Route path="/store" element={<Store />} />
                <Route path="/todaylist" element={
                  <TodayListView
                    tasks={tasks}
                    setTasks={setTasks}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                } />
                <Route path="/profile" element={
                  <UserForm
                    user={user}
                    departments={departments}
                    onSubmit={handleUpdateProfile}
                  />
                } />
                {/* Route Admin - CHỈ CHO ADMIN */}
                {user?.username === 'admin' && (
                  <Route path="/admin/users" element={<AdminUsers />} />
                )}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}
