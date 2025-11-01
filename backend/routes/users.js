import React, { useState, useEffect } from 'react';
import './UserForm.css';

const UserForm = ({ user, departments, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    role: '',
    superior: '',
    phone_number: '',
    gender: 'Nam',
    email: '',
    department_id: '',
    date_birth: '01',
    month_birth: '01',
    year_birth: new Date().getFullYear().toString(),
    avatar: null
  });

  const [avatarPreview, setAvatarPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [superiors, setSuperiors] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '',
        superior: user.superior || '',
        date_birth: user.date_birth || '01',
        month_birth: user.month_birth || '01',
        year_birth: user.year_birth || new Date().getFullYear().toString()
      });
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      } else if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
    // Fetch danh sách cấp trên
    fetchSuperiors();
  }, [user]);

  const fetchSuperiors = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuperiors(data);
      }
    } catch (error) {
      console.error('Error fetching superiors:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Họ và tên không được để trống';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username không được để trống';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone_number && !/^[0-9]{10,11}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Số điện thoại không hợp lệ';
    }

    if (!formData.department_id) {
      newErrors.department_id = 'Vui lòng chọn phòng ban';
    }

    if (!formData.role) {
      newErrors.role = 'Vui lòng chọn chức vụ';
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

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push(i);
    }
    return years;
  };

  const generateDays = () => {
    return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  };

  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  };

  return (
    <div className="user-form-page">
      <div className="user-form-header-page">
        <h2>{user ? 'Thông tin cá nhân' : 'Thêm người dùng mới'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="user-form">
        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-preview">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" />
            ) : (
              <div className="no-avatar">
                <span>no avatar</span>
                <i className="camera-icon">📷</i>
              </div>
            )}
          </div>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="avatar-upload" className="upload-btn">
            Chọn ảnh
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Họ và tên <span className="required">*</span></label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Họ và tên"
              className={errors.fullname ? 'error' : ''}
            />
            {errors.fullname && <span className="error-message">{errors.fullname}</span>}
          </div>

          <div className="form-group">
            <label>Username <span className="required">*</span></label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              disabled={!!user}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
        </div>

        {!user && (
          <div className="form-row">
            <div className="form-group">
              <label>Mật khẩu <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
          </div>
        )}

        {/* Ngày sinh */}
        <div className="form-group">
          <label>Ngày sinh</label>
          <div className="date-group">
            <select name="date_birth" value={formData.date_birth} onChange={handleChange}>
              {generateDays().map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <select name="month_birth" value={formData.month_birth} onChange={handleChange}>
              {generateMonths().map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select name="year_birth" value={formData.year_birth} onChange={handleChange}>
              {generateYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Giới tính</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cấp trên</label>
            <select
              name="superior"
              value={formData.superior}
              onChange={handleChange}
            >
              <option value="">--- Chọn cấp trên ---</option>
              {superiors && superiors.map(sup => (
                <option key={sup.user_id} value={sup.user_id}>
                  {sup.fullname} ({sup.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Số điện thoại <span className="required">*</span></label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Số điện thoại"
              className={errors.phone_number ? 'error' : ''}
            />
            {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
          </div>

          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Chức vụ <span className="required">*</span></label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={errors.role ? 'error' : ''}
            >
              <option value="">--- Chọn chức vụ ---</option>
              <option value="Giám đốc">Giám đốc</option>
              <option value="Trưởng phòng">Trưởng phòng</option>
              <option value="Leader">Leader</option>
              <option value="Nhân viên">Nhân viên</option>
            </select>
            {errors.role && <span className="error-message">{errors.role}</span>}
          </div>

          <div className="form-group">
            <label>Phòng ban <span className="required">*</span></label>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              className={errors.department_id ? 'error' : ''}
            >
              <option value="">--- Chọn phòng ban ---</option>
              {departments && departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
            {errors.department_id && <span className="error-message">{errors.department_id}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {user ? 'Cập nhật thông tin' : 'Thêm mới'} →
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;