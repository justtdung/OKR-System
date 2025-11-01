import React, { useState, useEffect } from 'react';
import './CheckinForm.css';

const CheckinForm = ({ okr, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    result: '', // Kết quả chính
    achieved: '0',
    total: '0',
    progress: '0',
    confidence: 'Rất tốt',
    status: 'Ổn',
    issues: '', // Công việc nào đang & sẽ chậm tiến độ?
    obstacles: '', // Trở ngại, khó khăn là gì?
    nextSteps: '', // Cần làm gì để vượt qua trở ngại?
    checkinDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (okr) {
      console.log("=== DEBUG OKR DATA ===");
      console.log("Full OKR object:", okr);
      console.log("draftData:", okr.draftData);

      // Lấy key_results text
      let keyResultText = '';
      if (okr.key_results) {
        if (typeof okr.key_results === 'string') {
          const parts = okr.key_results.split(';').filter(Boolean);
          keyResultText = parts[0]?.trim() || okr.key_results;
        } else if (Array.isArray(okr.key_results)) {
          keyResultText = okr.key_results[0] || '';
        }
      }
      
      const targetValue = okr.target ? okr.target.toString() : '0';
      const unitValue = okr.unit || 'Người';

      // Nếu có draftData, load dữ liệu từ draft
      if (okr.draftData) {
        const draft = okr.draftData;
        setFormData(prev => ({
          ...prev,
          okrId: okr.id,
          objective: okr.objective,
          result: keyResultText,
          total: targetValue,
          unit: unitValue,
          achieved: draft.progress_value?.toString() || '0',
          progress: draft.progress_percent?.toString() || '0',
          confidence: draft.confidence_text || 'Rất tốt',
          status: draft.work_summary?.includes('Ổn') ? 'Ổn' : 
                  draft.work_summary?.includes('Không ổn') ? 'Không ổn lắm' : 'Rất tốt',
          issues: draft.slow_tasks || '',
          obstacles: draft.obstacles || '',
          nextSteps: draft.solutions || '',
          checkinDate: draft.checkin_date || new Date().toISOString().split('T')[0]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          okrId: okr.id,
          objective: okr.objective,
          result: keyResultText,
          total: targetValue,
          unit: unitValue,
          achieved: '0',
          progress: '0'
        }));
      }
    }
  }, [okr]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Chỉ cho phép thay đổi achieved
    if (name === 'achieved') {
      const newAchieved = parseFloat(value) || 0;
      const newTotal = parseFloat(formData.total) || 0;
      const newProgress = newTotal > 0 ? Math.round((newAchieved / newTotal) * 100) : 0;
      
      setFormData(prev => ({
        ...prev,
        achieved: value,
        progress: newProgress.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Hàm lấy màu tiến độ theo phần trăm
  const getProgressColor = (progress) => {
    const p = Number(progress) || 0;
    if (p === 0) return '#ef4444'; // Đỏ (0%)
    if (p <= 25) return '#eab308'; // Vàng (1-25%)
    if (p <= 50) return '#f97316'; // Cam (26-50%)
    if (p <= 75) return '#3b82f6'; // Xanh dương (51-75%)
    return '#10b981'; // Xanh lá (76-100%)
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.achieved) {
      newErrors.achieved = 'Vui lòng nhập số đạt được';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Format dữ liệu trước khi gửi
      const submitData = {
        okr_id: okr.id,
        checkinDate: formData.checkinDate,
        achieved: formData.achieved,
        total: formData.total,
        progress: formData.progress,
        confidence: formData.confidence,
        status: formData.status,
        issues: formData.issues,
        obstacles: formData.obstacles,
        nextSteps: formData.nextSteps,
        isDraft: false // Check-in hoàn tất
      };

      console.log("=== SUBMITTING CHECKIN DATA ===");
      console.log("Submit data:", submitData);

      onSubmit(submitData);
    }
  };

  const handleSaveDraft = () => {
    // Lưu nháp không cần validate achieved
    const submitData = {
      okr_id: okr.id,
      checkinDate: formData.checkinDate,
      achieved: formData.achieved || '0',
      total: formData.total,
      progress: formData.progress,
      confidence: formData.confidence,
      status: formData.status,
      issues: formData.issues,
      obstacles: formData.obstacles,
      nextSteps: formData.nextSteps,
      isDraft: true // Đánh dấu là nháp
    };

    console.log("=== SAVING DRAFT ===");
    console.log("Draft data:", submitData);

    onSubmit(submitData);
  };

  return (
    <div className="checkin-form-overlay">
      <div className="checkin-form-container">
        <div className="checkin-form-header">
          <h2>Check-in OKRs hàng tuần</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="checkin-form">
          {/* Thông tin OKR - 2 cột */}
          {okr && (
            <div className="okr-info">
              <div className="info-row">
                <strong>Mục tiêu:</strong> {okr.objective}
              </div>
              <div className="info-row">
                <strong>Ngày cần Check-in:</strong> {formData.checkinDate}
              </div>
            </div>
          )}

          {/* Kết quả chính */}
          <div className="form-section">
            <h3>Kết quả chính</h3>
            <div className="result-grid">
              <div className="form-group">
                <label>Kết quả chính </label>
                <textarea
                  name="result"
                  value={formData.result}
                  readOnly
                  disabled
                  className="readonly-input"
                  rows="2"
                />
              </div>

              <div className="progress-group">
                <div className="form-group small">
                  <label>Số đạt được <span className="required">*</span></label>
                  <input
                    type="number"
                    name="achieved"
                    value={formData.achieved}
                    onChange={handleChange}
                    className={errors.achieved ? 'error' : ''}
                    placeholder="0"
                  />
                  {formData.unit && <div className="unit-label">{formData.unit}</div>}
                  {errors.achieved && <span className="error-message">{errors.achieved}</span>}
                </div>

                <div className="form-group small">
                  <label>Mục tiêu</label>
                  <input
                    type="text"
                    name="total"
                    value={formData.total}
                    readOnly
                    disabled
                    className="readonly-input"
                  />
                  {formData.unit && <div className="unit-label">{formData.unit}</div>}
                </div>

                <div className="form-group small">
                  <label>Tiến độ</label>
                  <div className="progress-badge" style={{ background: getProgressColor(formData.progress) }}>
                    {formData.progress}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tiến độ tự tin hoàn thành */}
          <div className="form-section">
            <h3>Tiến độ tự tin hoàn thành</h3>
            <div className="confidence-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="confidence"
                  value="Không ổn lắm"
                  checked={formData.confidence === 'Không ổn lắm'}
                  onChange={handleChange}
                />
                <span>Không ổn lắm</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="confidence"
                  value="Ổn"
                  checked={formData.confidence === 'Ổn'}
                  onChange={handleChange}
                />
                <span>Ổn</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="confidence"
                  value="Rất tốt"
                  checked={formData.confidence === 'Rất tốt'}
                  onChange={handleChange}
                />
                <span>Rất tốt</span>
              </label>
            </div>
          </div>

          {/* Mức độ tự tin hoàn thành mục tiêu */}
          <div className="form-section">
            <h3>Chọn mức độ tự tin hoàn thành của mục tiêu:</h3>
            <div className="confidence-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="status"
                  value="Không ổn lắm"
                  checked={formData.status === 'Không ổn lắm'}
                  onChange={handleChange}
                />
                <span>Không ổn lắm</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="status"
                  value="Ổn"
                  checked={formData.status === 'Ổn'}
                  onChange={handleChange}
                />
                <span>Ổn</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="status"
                  value="Rất tốt"
                  checked={formData.status === 'Rất tốt'}
                  onChange={handleChange}
                />
                <span>Rất tốt</span>
              </label>
            </div>
          </div>

          {/* Tiến độ, kết quả công việc */}
          <div className="form-section">
            <h3>Tiến độ, kết quả công việc</h3>
            
            <div className="form-group">
              <label>Công việc nào đang & sẽ chậm tiến độ?</label>
              <textarea
                name="issues"
                value={formData.issues}
                onChange={handleChange}
                placeholder="Nhập nội dung..."
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Trở ngại, khó khăn là gì?</label>
              <textarea
                name="obstacles"
                value={formData.obstacles}
                onChange={handleChange}
                placeholder="Nhập nội dung..."
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Cần làm gì để vượt qua trở ngại?</label>
              <textarea
                name="nextSteps"
                value={formData.nextSteps}
                onChange={handleChange}
                placeholder="Nhập nội dung..."
                rows="2"
              />
            </div>
          </div>

          {/* Checkbox hoàn thành */}
          <div className="form-section">
            <label className="checkbox-option">
              <input type="checkbox" name="complete" />
              <span>HOÀN THÀNH OKRS</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit-checkin">
              CHECK-IN XONG
            </button>
            <button type="button" className="btn-save" onClick={handleSaveDraft}>
              LƯU NHÁP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckinForm;
