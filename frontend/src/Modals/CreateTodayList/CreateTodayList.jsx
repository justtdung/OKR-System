import React, { useState, useEffect } from 'react';
import { X } from "lucide-react";
import './CreateTodayList.css';

const CreateTodayList = ({ show, onClose, onCreate, onUpdate, departments = [], initialTitle = '', mode = 'create', initialData = null, readOnly = false }) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState('Trung bình');
  const [status, setStatus] = useState('Chưa xử lý');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (show) {
      if (mode === 'edit' && initialData) {
        const normalizeDateForInput = (val) => {
          if (!val) return '';
          if (typeof val === 'string') {
            if (val.includes('T')) return val.split('T')[0];
            if (val.includes(' ')) return val.split(' ')[0];
            // already yyyy-mm-dd
            return val.slice(0,10);
          }
          if (val instanceof Date && !isNaN(val.getTime())) return val.toISOString().slice(0,10);
          return '';
        };

        setTitle(initialData.title || '');
        setDepartment(initialData.department ?? initialData.department_id ?? initialData.task_department_id ?? '');
        setPriority(initialData.priority || 'Trung bình');
        setStatus(initialData.status || 'Chưa xử lý');
        setDescription(initialData.description || '');
        setDeadline(normalizeDateForInput(initialData.deadline));
        setDuration(initialData.duration || initialData.estimate_time || '');
        setAttachments(initialData.attachments || []);
        setComments(initialData.comments || '');
      } else {
        setTitle(initialTitle || '');
        setDepartment('');
        setPriority('Trung bình');
        setStatus('Chưa xử lý');
        setDescription('');
        setDeadline('');
        setDuration('');
        setAttachments([]);
        setComments('');
      }
    }
  }, [show, initialTitle, mode, initialData]);

  if (!show) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const list = files.map(f => ({ name: f.name, file: f, url: URL.createObjectURL(f) }));
    setAttachments(prev => [...prev, ...list]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }
    const taskData = {
      title: title.trim(),
      department,
      priority,
      status,
      description,
      deadline,
      duration,
      attachments, // note: these are local File wrappers; upload handling can be added later
      comments
    };
    if (readOnly) {
      // phòng vệ: nếu modal chỉ đọc thì không gửi update/create
      onClose && onClose();
      return;
    }
    if (mode === 'edit' && initialData && onUpdate) {
      onUpdate(initialData.id, taskData);
    } else {
      onCreate && onCreate(taskData);
    }
  };

  return (
  <div className="ct-modal-overlay" onClick={onClose}>
    <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ct-title">
          {mode === 'edit' ? (readOnly ? 'Thông tin TodayList' : 'Cập nhật TodayList') : (readOnly ? 'Thông tin TodayList' : 'Tạo TodayList mới')}
        </h3>
        <button onClick={onClose} className="tdl-close-btn">
            <X size={20} />
        </button>
        <form className="ct-form" onSubmit={handleSave}>
          <label>Tiêu đề *</label>
          {/* đảm bảo có khung giống các ô khác */}
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={readOnly} />

          <label>Phòng ban</label>
          <select value={department} onChange={e => setDepartment(e.target.value)} disabled={readOnly}>
            <option value="">-- Chọn phòng ban --</option>
            {Array.isArray(departments) && departments.map(d => (
              <option key={d.department_id ?? d.id ?? d.department_name} value={d.department_id ?? d.id ?? d.department_name}>
                {d.department_name ?? d.name}
              </option>
            ))}
          </select>

          <div className="ct-grid-3">
            <div>
              <label>Độ ưu tiên</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} disabled={readOnly}>
                <option>Trung bình</option>
                <option>Cao</option>
                <option>Thấp</option>
              </select>
            </div>
            <div>
              <label>Trạng thái</label>
              <select value={status} onChange={e => setStatus(e.target.value)} disabled={readOnly}>
                <option>Chưa xử lý</option>
                <option>Đang tiến hành</option>
                <option>Đang xem xét</option>
                <option>Hủy TodayList</option>
                <option>Đã đóng</option>
              </select>
            </div>
            <div>
              <label>Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} disabled={readOnly} />
            </div>
          </div>

          <label>Mô tả</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} disabled={readOnly}></textarea>

          <div className="ct-grid-2">
            <div>
              <label>Thời gian thực hiện (h) (ví dụ: 2, 5)</label>
              {/* thêm type để áp dụng style giống các ô khác */}
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} disabled={readOnly} />
            </div>
            <div>
              {/* giữ ô trống bên cạnh để layout cân đối */}
            </div>
          </div>

          {/* Di chuyển phần Đính kèm xuống dưới cùng, trước nút hành động */}
          <div>
            <label>Đính kèm</label>
            {/* nếu chỉ đọc thì ẩn input file để không cho thêm file */}
            {!readOnly && <input type="file" multiple onChange={handleFileChange} />}
            <div className="ct-attachments">
              {attachments.map((a, i) => (
                <div key={i} className="ct-attachment">
                  <span className="ct-attach-name">{a.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="ct-attach-remove" disabled={readOnly}>X</button>
                </div>
              ))}
            </div>
          </div>

          <label>Bình luận</label>
          <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} disabled={readOnly}></textarea>

          <div className="ct-actions">
            {/* nếu chỉ đọc: chỉ hiện nút Đóng (onClose). Nếu không: hiện Hủy + Lưu/Cập nhật */}
            {readOnly ? (
              <button type="button" className="btn-save" onClick={onClose}>Đóng</button>
            ) : (
              <>
                <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                <button type="submit" className="btn-save">{mode === 'edit' ? 'Cập nhật' : 'Lưu'}</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTodayList;
