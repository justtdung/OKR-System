import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, Clock, Star, AlertCircle } from 'lucide-react';
import './CheckinReview.css';

const CheckinReview = ({ 
  visible, 
  onClose, 
  checkinId, 
  okrId, 
  mode = 'create',
  currentUserId,
  isOkrOwner = false,
  isSuperior = false
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [checkinData, setCheckinData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  
  const [formData, setFormData] = useState({
    personal_comment: '',
    team_comment: '',
    summary_comment: ''
  });

  const [errors, setErrors] = useState({});

  const fetchCheckinData = useCallback(async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/checkins/${checkinId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCheckinData(data);
      } else {
        alert('Không thể tải thông tin check-in');
      }
    } catch (error) {
      console.error('Error fetching checkin data:', error);
      alert('Không thể tải thông tin check-in');
    } finally {
      setLoadingData(false);
    }
  }, [checkinId]);

  const fetchReviewData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/checkin-reviews/checkin/${checkinId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setReviewData(data);
        if (data) {
          setFormData({
            personal_comment: data.personal_comment || '',
            team_comment: data.team_comment || '',
            summary_comment: data.summary_comment || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching review data:', error);
    }
  }, [checkinId]);

  useEffect(() => {
    if (visible && checkinId) {
      fetchCheckinData();
      if (mode === 'view') {
        fetchReviewData();
      }
    }
  }, [visible, checkinId, mode, fetchCheckinData, fetchReviewData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.personal_comment || formData.personal_comment.trim().length < 1) {
      newErrors.personal_comment = 'Nhận xét cá nhân phải có ít nhất 1 ký tự';
    }
    
    if (!formData.team_comment || formData.team_comment.trim().length < 1) {
      newErrors.team_comment = 'Nhận xét team phải có ít nhất 1 ký tự';
    }
    
    if (!formData.summary_comment || formData.summary_comment.trim().length < 1) {
      newErrors.summary_comment = 'Tổng kết phải có ít nhất 1 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/checkin-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          checkin_id: checkinId,
          okr_id: okrId,
          personal_comment: formData.personal_comment,
          team_comment: formData.team_comment,
          summary_comment: formData.summary_comment
        })
      });

      if (response.ok) {
        alert('Đã lưu nhận xét thành công');
        handleCancel(true);
      } else {
        const error = await response.json();
        alert(error.message || 'Không thể lưu nhận xét');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Không thể lưu nhận xét');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (refreshNeeded = false) => {
    setFormData({
      personal_comment: '',
      team_comment: '',
      summary_comment: ''
    });
    setErrors({});
    onClose(refreshNeeded);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getConfidenceColor = (level) => {
    if (level === 1) return '#ef4444';
    if (level === 3) return '#10b981';
    return '#f59e0b';
  };

  const getConfidenceText = (level) => {
    if (level === 1) return 'Không ổn lắm';
    if (level === 3) return 'Rất tốt';
    return 'Ổn';
  };

  if (!visible) return null;

  // Kiểm tra quyền truy cập
  const canAccessModal = () => {
    // Mode 'create': Chỉ superior mới được điền form review
    if (mode === 'create') {
      return isSuperior;
    }
    // Mode 'view': Tất cả mọi người đều được xem
    return true;
  };

  // Kiểm tra quyền truy cập
  if (!canAccessModal()) {
    return (
      <div className="checkin-review-overlay" onClick={() => handleCancel(false)}>
        <div className="checkin-review-modal" onClick={(e) => e.stopPropagation()}>
          <div className="checkin-review-header">
            <div className="header-title">
              <AlertCircle size={20} color="#ef4444" />
              <span>Không có quyền truy cập</span>
            </div>
            <button className="close-btn" onClick={() => handleCancel(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="checkin-review-body">
            <div className="empty-state">
              <AlertCircle size={48} color="#ef4444" />
              <p>Bạn không có quyền truy cập chức năng này</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Chỉ cấp trên mới có thể đánh giá check-in
              </p>
            </div>
          </div>
          <div className="checkin-review-footer">
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => handleCancel(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-review-overlay" onClick={() => handleCancel(false)}>
      <div className="checkin-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkin-review-header">
          <div className="header-title">
            {mode === 'create' ? (
              <>
                <CheckCircle size={20} color="#10b981" />
                <span>Xác nhận Check-in</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} color="#3b82f6" />
                <span>Kết quả Check-in</span>
              </>
            )}
          </div>
          <button className="close-btn" onClick={() => handleCancel(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="checkin-review-body">
          {loadingData ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : (
            <>
              {/* Thông tin check-in */}
              {checkinData && (
                <div className="checkin-info">
                  <div className="info-grid">
                    <div className="info-row full">
                      <label>Mục tiêu:</label>
                      <span>{checkinData.okr_objective}</span>
                    </div>
                    <div className="info-row">
                      <label>Người check-in:</label>
                      <span>{checkinData.user_name}</span>
                    </div>
                    <div className="info-row">
                      <label>Ngày check-in:</label>
                      <span>{new Date(checkinData.checkin_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="info-row">
                      <label>Tiến độ:</label>
                      <span className="progress-badge">
                        {checkinData.progress_percent}%
                      </span>
                    </div>
                    <div className="info-row">
                      <label>Mức độ tự tin:</label>
                      <span 
                        className="confidence-badge"
                        style={{ 
                          backgroundColor: getConfidenceColor(checkinData.confidence_level) + '20',
                          color: getConfidenceColor(checkinData.confidence_level)
                        }}
                      >
                        {getConfidenceText(checkinData.confidence_level)}
                      </span>
                    </div>
                    {checkinData.work_summary && (
                      <div className="info-row full">
                        <label>Tóm tắt công việc:</label>
                        <span>{checkinData.work_summary}</span>
                      </div>
                    )}
                    {checkinData.slow_tasks && (
                      <div className="info-row full">
                        <label>Công việc chậm tiến độ:</label>
                        <span>{checkinData.slow_tasks}</span>
                      </div>
                    )}
                    {checkinData.obstacles && (
                      <div className="info-row full">
                        <label>Vướng mắc:</label>
                        <span>{checkinData.obstacles}</span>
                      </div>
                    )}
                    {checkinData.solutions && (
                      <div className="info-row full">
                        <label>Giải pháp:</label>
                        <span>{checkinData.solutions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="divider"></div>

              {/* Form hoặc view nhận xét */}
              {mode === 'create' ? (
                <form className="review-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>
                      Nhận xét cá nhân <span className="required">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Đánh giá về tiến độ, chất lượng công việc của cá nhân..."
                      maxLength={500}
                      value={formData.personal_comment}
                      onChange={(e) => handleInputChange('personal_comment', e.target.value)}
                      className={errors.personal_comment ? 'error' : ''}
                    />
                    <div className="char-count">{formData.personal_comment.length}/500</div>
                    {errors.personal_comment && (
                      <div className="error-message">
                        <AlertCircle size={14} />
                        {errors.personal_comment}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Nhận xét team <span className="required">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Đánh giá về sự phối hợp, hiệu quả làm việc của team..."
                      maxLength={500}
                      value={formData.team_comment}
                      onChange={(e) => handleInputChange('team_comment', e.target.value)}
                      className={errors.team_comment ? 'error' : ''}
                    />
                    <div className="char-count">{formData.team_comment.length}/500</div>
                    {errors.team_comment && (
                      <div className="error-message">
                        <AlertCircle size={14} />
                        {errors.team_comment}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Tổng kết <span className="required">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Điểm dành cho OKR này"
                      maxLength={1000}
                      value={formData.summary_comment}
                      onChange={(e) => handleInputChange('summary_comment', e.target.value)}
                      className={errors.summary_comment ? 'error' : ''}
                    />
                    <div className="char-count">{formData.summary_comment.length}/1000</div>
                    {errors.summary_comment && (
                      <div className="error-message">
                        <AlertCircle size={14} />
                        {errors.summary_comment}
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="review-view">
                  {!reviewData ? (
                    <div className="empty-state">
                      <Clock size={48} color="#9ca3af" />
                      <p>Chưa có nhận xét từ cấp trên</p>
                    </div>
                  ) : (
                    <>
                      <div className="review-header">
                        <Star size={18} color="#f59e0b" />
                        <span>Nhận xét của cấp trên</span>
                      </div>
                      
                      <div className="review-content">
                        <div className="review-item">
                          <label>Người đánh giá:</label>
                          <span>{reviewData.reviewer_name}</span>
                        </div>
                        <div className="review-item">
                          <label>Ngày đánh giá:</label>
                          <span>{new Date(reviewData.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="review-item">
                          <label>Nhận xét cá nhân:</label>
                          <div className="comment-box">
                            {reviewData.personal_comment || 'Không có nhận xét'}
                          </div>
                        </div>
                        <div className="review-item">
                          <label>Nhận xét team:</label>
                          <div className="comment-box">
                            {reviewData.team_comment || 'Không có nhận xét'}
                          </div>
                        </div>
                        <div className="review-item">
                          <label>Tổng kết:</label>
                          <div className="comment-box summary">
                            {reviewData.summary_comment || 'Không có nhận xét'}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="checkin-review-footer">
          {mode === 'create' ? (
            <>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => handleCancel(false)}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn-submit" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </>
          ) : (
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => handleCancel(false)}
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckinReview;
