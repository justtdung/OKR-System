import React, { useState, useEffect, useCallback } from 'react';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/departments`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [setDepartments]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      console.log('Fetching users from:', `${API_URL}/api/users/all`);
      
      const response = await fetch(`${API_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(errorData.message || 'Không thể tải danh sách users');
        
        if (response.status === 403) {
          alert('Bạn không có quyền truy cập. Chỉ admin mới có thể xem trang này.');
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Lỗi kết nối: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSubmitUser = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Chỉ gửi username và password
      const submitData = {
        username: formData.username,
        password: formData.password
      };

      const url = editingUser 
        ? `${API_URL}/api/users/admin-update/${editingUser.user_id}`
        : `${API_URL}/api/users/create`;
      
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        alert(editingUser ? 'Cập nhật thành công!' : 'Thêm user thành công!');
        setShowForm(false);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting user:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa user này?')) return;

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Xóa user thành công!');
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <div className="admin-users-page">
        <button className="btn-back" onClick={() => setShowForm(false)}>
          ← Quay lại
        </button>
        <AdminUserForm
          user={editingUser}
          onSubmit={handleSubmitUser}
          onBack={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h2>Quản lý tài khoản</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn-add-user" onClick={handleAddUser}>
            + Thêm user mới
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message-box">
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="no-data">
          {searchTerm ? 'Không tìm thấy user nào' : 'Chưa có user nào trong hệ thống'}
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Avatar</th>
                <th>Họ tên</th>
                <th>Username</th>
                <th>Mật khẩu</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Chức vụ</th>
                <th>Phòng ban</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.user_id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img 
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${user.avatar}`} 
                          alt={user.fullname}
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                  </td>
                  <td>{user.fullname || 'Chưa cập nhật'}</td>
                  <td>{user.username}</td>
                  <td>
                    <span className="password-display">{user.password || '******'}</span>
                  </td>
                  <td>{user.email || 'Chưa cập nhật'}</td>
                  <td>{user.phone_number || 'Chưa cập nhật'}</td>
                  <td>{user.role || 'Chưa cập nhật'}</td>
                  <td>{user.department_name || 'Chưa có'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user.user_id)}
                        title="Xóa"
                        disabled={user.username === 'admin'}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Component form đơn giản cho admin (chỉ username + password)
const AdminUserForm = ({ user, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username không được để trống';
    }
    if (!user && !formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    }
    if (user && formData.password && formData.password.length < 3) {
      newErrors.password = 'Mật khẩu phải có ít nhất 3 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="admin-user-form-container">
      <div className="user-form-header-page">
        <h2>{user ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="admin-user-form">
        <div className="form-group">
          <label>Username <span className="required">*</span></label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Nhập username"
            className={errors.username ? 'error' : ''}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="form-group">
          <label>
            Mật khẩu {user ? '(để trống nếu không đổi)' : <span className="required">*</span>}
          </label>
          <input
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={user ? "Nhập mật khẩu mới (hoặc để trống)" : "Nhập mật khẩu"}
            className={errors.password ? 'error' : ''}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onBack}>
            Hủy
          </button>
          <button type="submit" className="btn-submit">
            {user ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUsers;
