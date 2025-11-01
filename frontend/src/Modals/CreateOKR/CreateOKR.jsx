import React, { useEffect, useState } from "react";
import { X, Plus, Edit, Eye, User } from "lucide-react";
import "./CreateOKR.css";

const CreateOKR = ({ 
  show, 
  onClose, 
  newOKR, 
  setNewOKR, 
  department, 
  readOnly = false,
  departments, 
  initialData = {},
  isViewMode = false,
  isEditMode = false,
  onEditToggle,
  canEdit = false,
  currentUser
}) => {
  const [departmentsList, setDepartmentsList] = useState([]);
  const [parentOKRsList, setParentOKRsList] = useState([]);

  useEffect(() => {
    if (show && !isViewMode) {
      // Chỉ reset form khi tạo mới, không reset khi view
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
        visibility: 'public',
        type: '',
        cycle: '',
        crossLinkedOKRs: [],
        department: ''
      });
    }

    if (show) {
      // Lấy danh sách phòng ban từ API
      fetchDepartments();
      // Lấy danh sách OKR cấp trên
      fetchParentOKRs();
    }
  }, [show, isViewMode, setNewOKR]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartmentsList(data);
      } else {
        console.error("Failed to fetch departments");
        setDepartmentsList([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartmentsList([]);
    }
  };

  const fetchParentOKRs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No token found");
        setParentOKRsList([]);
        return;
      }

      const response = await fetch("http://localhost:5000/api/okrs/parent-okrs", {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Parent OKRs loaded:", data);
        setParentOKRsList(data);
      } else {
        console.error("Failed to fetch parent OKRs");
        setParentOKRsList([]);
      }
    } catch (error) {
      console.error("Error fetching parent OKRs:", error);
      setParentOKRsList([]);
    }
  };

  // Đảm bảo newOKR luôn có giá trị mặc định
  const currentOKR = newOKR || {
    type: "",
    cycle: "",
    parentOKR: "",
    title: "",
    keyResults: [],
    crossLinkedOKRs: [],
    visibility: "public",
    relatedOKRsList: []
  };

  const addKeyResult = () => {
    console.log("Adding key result...", currentOKR.keyResults);
    const updatedKeyResults = [
      ...(currentOKR.keyResults || []),
      {
        description: "",
        target: "",
        unit: "Người",
        planLink: "",
        resultLink: "",
        relatedOKRs: "",
      },
    ];
    setNewOKR({ ...currentOKR, keyResults: updatedKeyResults });
  };

  const addCrossLinkedOKR = () => {
    console.log("Adding cross-linked OKR...", currentOKR.crossLinkedOKRs);
    const updatedCrossLinkedOKRs = [
      ...(currentOKR.crossLinkedOKRs || []),
      { search: "", showDropdown: false },
    ];
    setNewOKR({ ...currentOKR, crossLinkedOKRs: updatedCrossLinkedOKRs });
  };

  const removeKeyResult = (index) => {
    const updatedKeyResults = currentOKR.keyResults.filter((_, i) => i !== index);
    setNewOKR({ ...currentOKR, keyResults: updatedKeyResults });
  };

  const updateKeyResult = (index, field, value) => {
    const updated = [...(currentOKR.keyResults || [])];
    updated[index][field] = value;
    setNewOKR({ ...currentOKR, keyResults: updated });
  };

  const handleSubmit = async () => {
    if (!isEditMode && isViewMode) {
      // Nếu đang ở chế độ view, không cho submit
      return;
    }

    try {
      // Debug current state
      console.log("=== DEBUG FRONTEND SUBMIT ===");
      console.log("currentOKR:", currentOKR);
      console.log("isEditMode:", isEditMode);
      console.log("isViewMode:", isViewMode);
      console.log("currentOKR.id:", currentOKR.id);

      // Đảm bảo có ít nhất 1 key result
      const keyResults = currentOKR.keyResults && currentOKR.keyResults.length > 0 
        ? currentOKR.keyResults 
        : [{
            description: "",
            target: "",
            unit: "Người",
            planLink: "",
            resultLink: "",
            relatedOKRs: ""
          }];

      // Chuyển đổi visibility thành số
      const displayValue = currentOKR.visibility === "public" ? 1 : 0;

      // Lấy token từ localStorage để gửi kèm request
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Bạn cần đăng nhập để tạo OKR.");
        return;
      }

      // Chuẩn bị dữ liệu theo định dạng backend yêu cầu
      const payload = {
        type: currentOKR.type || "",
        cycle: currentOKR.cycle || currentOKR.quarter || "",
        o_relevant: currentOKR.parent || null,
        objective: currentOKR.objective || "",
        key_results: keyResults,
        target: null,
        unit: null,
        link_plans: null,
        link_results: null,
        kr_relevant: null,
        o_cross: currentOKR.crossLinkedOKRs || [],
        display: displayValue,
        department_id: currentOKR.department || null,
      };

      console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));

      // Kiểm tra các trường bắt buộc
      if (!payload.type) {
        alert("Vui lòng chọn Loại OKRs.");
        return;
      }
      if (!payload.objective) {
        alert("Vui lòng nhập Objective.");
        return;
      }
      if (!payload.key_results || payload.key_results.length === 0) {
        alert("Vui lòng thêm ít nhất một Key Result.");
        return;
      }

      // Xác định URL và method dựa trên chế độ
      const isUpdating = isViewMode && isEditMode && currentOKR.id;
      const url = isUpdating 
        ? `http://localhost:5000/api/okrs/${currentOKR.id}`
        : "http://localhost:5000/api/okrs";
      const method = isUpdating ? "PUT" : "POST";

      console.log("Request details:");
      console.log("URL:", url);
      console.log("Method:", method);
      console.log("Is updating:", isUpdating);

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Server error:", error);
        alert(`Lỗi: ${error.message}`);
        return;
      }

      const result = await response.json();
      console.log("Success:", result);
      alert(isUpdating ? "OKR đã được cập nhật thành công!" : "OKR đã được tạo thành công!");
      
      // Chuyển về chế độ view sau khi cập nhật thành công
      if (isUpdating && onEditToggle) {
        onEditToggle(); // Chuyển về chế độ view
      } else {
        onClose(); // Đóng modal nếu tạo mới
      }
      
      // Refresh danh sách OKRs nếu có callback
      if (window.refreshOKRsList) {
        window.refreshOKRsList();
      }
    } catch (err) {
      console.error("Lỗi khi tạo/cập nhật OKR:", err);
      alert("Đã xảy ra lỗi khi xử lý OKR.");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && e.type === 'click') {
      onClose();
    }
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!show) return null;

  const isReadOnlyMode = readOnly || (isViewMode && !isEditMode);

  return (
    <div className="okr-overlay" onClick={handleOverlayClick}>
      <div className="okr-modal" onMouseDown={handleMouseDown}>
        {/* Header */}
        <div className="okr-header">
          <h3>
            {isViewMode 
              ? (isEditMode ? "Chỉnh sửa OKR" : "Chi tiết OKR")
              : "Tạo OKR mới"
            }
          </h3>
          <div className="okr-header-actions">
            {/* Hiển thị thông tin người tạo trong view mode */}
            {isViewMode && currentOKR.creator && (
              <div className="okr-creator-info">
                <span className="okr-creator-label">Người tạo:</span>
                <div className="okr-creator">
                  <div className="okr-avatar">
                    {currentOKR.creator.avatarUrl ? (
                      <img src={currentOKR.creator.avatarUrl} alt={currentOKR.creator.fullname} />
                    ) : (
                      <User className="icon-sm" />
                    )}
                  </div>
                  <span>{currentOKR.creator.fullname}</span>
                </div>
              </div>
            )}
            
            {/* Nút chuyển đổi chế độ edit/view */}
            {isViewMode && canEdit && (
              <button onClick={onEditToggle} className="okr-edit-btn">
                {isEditMode ? <Eye size={16} /> : <Edit size={16} />}
                {isEditMode ? "Xem" : "Sửa"}
              </button>
            )}
            
            <button onClick={handleClose} className="okr-close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="okr-body">
          <div className="okr-field">
            <label>Chu kỳ</label>
            <select
              value={currentOKR.cycle || currentOKR.quarter || ""}
              onChange={(e) => setNewOKR({ ...currentOKR, cycle: e.target.value, quarter: e.target.value })}
              disabled={isReadOnlyMode}
            >
              <option value="">Chọn chu kỳ</option>
              <option value="Quý T34">Quý T34</option>
              <option value="Quý T35">Quý T35</option>
              <option value="Quý T36">Quý T36</option>
            </select>
          </div>

          <div className="okr-field">
            <label>OKRs cấp trên</label>
            <select
              value={currentOKR.parent || ""}
              onChange={(e) => setNewOKR({ ...currentOKR, parent: e.target.value })}
              disabled={isReadOnlyMode}
            >
              <option value="">Chọn OKR cấp trên</option>
              {parentOKRsList.map(okr => (
                <option 
                  key={okr.okr_id} 
                  value={okr.okr_id}
                >
                  {okr.objective} - {okr.creator_name} ({okr.cycle})
                </option>
              ))}
            </select>
          </div>

          <div className="okr-field">
            <label>Phòng ban</label>
            <select 
              value={currentOKR.department || ""} 
              onChange={(e) => setNewOKR({ ...currentOKR, department: e.target.value })} 
              disabled={isReadOnlyMode}
            >
              <option value="">-- Chọn phòng ban --</option>
              {departmentsList.map(dept => (
                <option 
                  key={dept.department_id} 
                  value={dept.department_id}
                >
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="okr-field">
            <label>Loại</label>
            <select
              value={currentOKR.type || ""}
              onChange={(e) => setNewOKR({ ...currentOKR, type: e.target.value })}
              disabled={isReadOnlyMode}
            >
              <option value="">-- Chọn loại OKRs --</option>
              <option value="Công ty">OKRs Công ty</option>
              <option value="Nhóm">OKRs Nhóm</option>
              <option value="Cá Nhân">OKRs Cá Nhân</option>
            </select>
          </div>

          <div className="okr-field">
            <label>Objective *</label>
            <input
              type="text"
              value={currentOKR.objective || ""}
              onChange={(e) => setNewOKR({ ...currentOKR, objective: e.target.value })}
              placeholder="Nhập mục tiêu của bạn"
              disabled={isReadOnlyMode}
            />
          </div>

          {/* Kết quả chính */}
          <div className="okr-field">
            <label>Key Results *</label>
            {currentOKR.keyResults?.map((kr, index) => (
              <div className="okr-keyresult" key={index}>
                <div className="okr-row">
                  <input
                    type="text"
                    value={kr.description}
                    onChange={(e) => updateKeyResult(index, "description", e.target.value)}
                    placeholder="Mô tả kết quả chính"
                    disabled={isReadOnlyMode}
                  />
                </div>
                <div className="okr-row">
                  <input
                    type="number"
                    value={kr.target}
                    onChange={(e) => updateKeyResult(index, "target", e.target.value)}
                    placeholder="Mục tiêu"
                    className="small-input"
                    disabled={isReadOnlyMode}
                  />
                  <select
                    value={kr.unit}
                    onChange={(e) => updateKeyResult(index, "unit", e.target.value)}
                    className="small-select"
                    disabled={isReadOnlyMode}
                  >
                    {["Người", "%", "Khách hàng", "Cái", "VNĐ"].map((u, i) => (
                      <option key={i} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="okr-row">
                  <input
                    type="text"
                    value={kr.planLink}
                    onChange={(e) => updateKeyResult(index, "planLink", e.target.value)}
                    placeholder="Link kế hoạch"
                    className="small-input"
                    disabled={isReadOnlyMode}
                  />
                  <input
                    type="text"
                    value={kr.resultLink}
                    onChange={(e) => updateKeyResult(index, "resultLink", e.target.value)}
                    placeholder="Link kết quả"
                    className="small-input"
                    disabled={isReadOnlyMode}
                  />
                </div>
                <div className="okr-row">
                  <input
                    type="text"
                    value={kr.relatedOKRs}
                    onChange={(e) => updateKeyResult(index, "relatedOKRs", e.target.value)}
                    placeholder="Kết quả chính liên quan (Cấp trên)"
                    disabled={isReadOnlyMode}
                  />
                </div>

                {!isReadOnlyMode && (
                  <button onClick={() => removeKeyResult(index)} className="delete-btn">
                    Xóa
                  </button>
                )}
              </div>
            ))}

            {/* Button thêm Kết quả chính */}
            {!isReadOnlyMode && (
              <button type="button" onClick={addKeyResult} className="add-btn">
                <Plus size={16} /> Thêm Kết quả chính
              </button>
            )}
          </div>

          {/* OKRs liên kết chéo */}
          <div className="okr-field">
            <label>OKRs liên kết chéo</label>
            {currentOKR.crossLinkedOKRs?.map((okr, index) => (
              <div key={index} className="okr-search-select">
                <div className="okr-search-row">
                  <div className="input-container">
                    <input
                      type="text"
                      placeholder="Tìm OKRs liên kết chéo"
                      value={okr.search || ""}
                      onChange={(e) => {
                        if (isReadOnlyMode) return;
                        const value = e.target.value;
                        const updated = [...(currentOKR.crossLinkedOKRs || [])];
                        updated[index].search = value;
                        updated[index].showDropdown = true;
                        setNewOKR({ ...currentOKR, crossLinkedOKRs: updated });
                      }}
                      disabled={isReadOnlyMode}
                    />
                  </div>
                </div>
              </div>
            ))}

            {!isReadOnlyMode && (
              <button type="button" onClick={addCrossLinkedOKR} className="add-btn">
                <Plus size={16} /> Thêm OKRs liên kết chéo
              </button>
            )}
          </div>

          <div className="okr-field">
            <label>Hiển thị</label>
            <div className="okr-radio">
              <label>
                <input
                  type="radio"
                  value="public"
                  checked={currentOKR.visibility === "public"}
                  onChange={(e) => setNewOKR({ ...currentOKR, visibility: e.target.value })}
                  disabled={isReadOnlyMode}
                />
                 Công khai
              </label>
              <label>
                <input
                  type="radio"
                  value="private"
                  checked={currentOKR.visibility === "private"}
                  onChange={(e) => setNewOKR({ ...currentOKR, visibility: e.target.value })}
                  disabled={isReadOnlyMode}
                />
                 Riêng tư
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="okr-footer">
          <button onClick={handleCancel} className="btn-cancel">
            {isViewMode ? "ĐÓNG" : "QUAY LẠI"}
          </button>
          {(!isViewMode || (isViewMode && isEditMode && canEdit)) && (
            <button onClick={handleSubmit} className="btn-save">
              {isViewMode && isEditMode ? "CẬP NHẬT" : "TẠO MỚI"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateOKR;
