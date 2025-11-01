import React, { useEffect, useState, useMemo } from 'react';
import { User, ChevronDown, ChevronRight } from 'lucide-react';
import CheckinForm from '../../Modals/CheckinForm/CheckinForm';
import CheckinHistory from './CheckinHistory';
import CheckinReview from '../../Modals/CheckinReview/CheckinReview';
import './Checkin.css';

// Map database status values to Vietnamese display text
const STATUS_MAP = {
  'not_checked': 'Chưa check-in',
  'draft': 'Nháp',
  'checked': 'Đã check-in',
  'waiting': 'Chờ phản hồi'
};

const STATUS_COLOR = {
  'not_checked': '#ef4444', // red
  'draft': '#f59e0b',       // amber
  'waiting': '#3b82f6',     // blue
  'checked': '#10b981'      // green
};

const Checkin = () => {
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [selectedOkr, setSelectedOkr] = useState(null);
  const [activeTab, setActiveTab] = useState('checkin');
  const [currentUser, setCurrentUser] = useState(null);

  // new states for search + quarter filter
  const [search, setSearch] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('Tất cả quý');
  const [selectedOwner, setSelectedOwner] = useState('Tất cả người phụ trách');

  // New states for CheckinReview modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewMode, setReviewMode] = useState('create');
  const [selectedCheckinId, setSelectedCheckinId] = useState(null);
  const [okrOwnerInfo, setOkrOwnerInfo] = useState(null);

  // New states for expand/collapse
  const [expandedOkrs, setExpandedOkrs] = useState(new Set());
  const [childOkrs, setChildOkrs] = useState({});
  const [hasChildrenMap, setHasChildrenMap] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [allOkrs, setAllOkrs] = useState([]); // Store ALL OKRs including children

  useEffect(() => {
    fetchCurrentUser();
    fetchOKRs();
    fetchAllUsers();
    window.refreshCheckinOKRs = fetchOKRs;
    return () => { delete window.refreshCheckinOKRs; };
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/me', { method: 'GET', headers });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/users', { method: 'GET', headers });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
  };

  const fetchOKRs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/okrs', { method: 'GET', headers });
      if (!res.ok) {
        setOkrs([]);
        setAllOkrs([]);
        return;
      }
      const data = await res.json();
      console.log("=== ALL OKRS FROM API ===");
      console.log("Total OKRs:", data.length);
      data.forEach(okr => {
        console.log(`OKR ${okr.id}: "${okr.objective}" - o_relevant: ${okr.o_relevant} (type: ${typeof okr.o_relevant})`);
      });
      
      // normalize status - đảm bảo có giá trị mặc định
      const normalized = data.map(o => ({
        ...o,
        status: o.status || 'not_checked'
      }));
      
      // Store ALL OKRs (including children)
      setAllOkrs(normalized);
      
      // Chỉ hiển thị OKR cấp cao (không có o_relevant hoặc o_relevant là null/0)
      const topLevelOkrs = normalized.filter(o => !o.o_relevant || o.o_relevant === null || o.o_relevant === 0);
      console.log("Top level OKRs:", topLevelOkrs.length);
      topLevelOkrs.forEach(okr => {
        console.log(`  - ${okr.id}: ${okr.objective}`);
      });
      setOkrs(topLevelOkrs);

      // Check which OKRs have children
      const childrenMap = {};
      topLevelOkrs.forEach(okr => {
        const children = normalized.filter(o => {
          // So sánh cả string và number
          return o.o_relevant && (o.o_relevant === okr.id || parseInt(o.o_relevant) === okr.id);
        });
        childrenMap[okr.id] = children.length > 0;
        console.log(`OKR ${okr.id} (${okr.objective}) has ${children.length} children:`, children.map(c => c.objective));
      });
      setHasChildrenMap(childrenMap);

    } catch (err) {
      console.error('Error fetching OKRs for Checkin:', err);
      setOkrs([]);
      setAllOkrs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch child OKRs
  const fetchChildOkrs = async (parentId) => {
    try {
      console.log("=== FETCHING CHILDREN FOR PARENT ===", parentId);
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/okrs', { method: 'GET', headers });
      if (!res.ok) return [];
      
      const data = await res.json();
      const normalized = data.map(o => ({
        ...o,
        status: o.status || 'not_checked'
      }));
      
      // Lọc các OKR có o_relevant = parentId (so sánh cả string và number)
      const children = normalized.filter(o => {
        const match = o.o_relevant && (o.o_relevant === parentId || parseInt(o.o_relevant) === parentId);
        if (match) {
          console.log(`  ✅ Found child: ${o.id} "${o.objective}" with o_relevant=${o.o_relevant}`);
        }
        return match;
      });
      
      console.log(`Total children found for parent ${parentId}:`, children.length);
      return children;
    } catch (err) {
      console.error('Error fetching child OKRs:', err);
      return [];
    }
  };

  // Toggle expand/collapse
  const handleToggleExpand = async (okrId) => {
    const newExpanded = new Set(expandedOkrs);
    
    if (newExpanded.has(okrId)) {
      // Collapse
      newExpanded.delete(okrId);
      const newChildOkrs = { ...childOkrs };
      delete newChildOkrs[okrId];
      setChildOkrs(newChildOkrs);
    } else {
      // Expand - fetch children
      newExpanded.add(okrId);
      const children = await fetchChildOkrs(okrId);
      setChildOkrs({
        ...childOkrs,
        [okrId]: children
      });
    }
    
    setExpandedOkrs(newExpanded);
  };

  const handleOpenCheckinForm = async (okr) => {
    // Kiểm tra quyền: chỉ người phụ trách OKR mới được mở form
    if (!currentUser || currentUser.user_id !== okr.creator?.user_id) {
      alert('Chỉ người phụ trách OKR mới có thể thực hiện check-in!');
      return;
    }

    try {
      // Fetch chi tiết đầy đủ của OKR từ API
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`http://localhost:5000/api/okrs/${okr.id}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const detailedOkr = await response.json();
        console.log("=== DETAILED OKR FROM API ===");
        console.log("Detailed OKR:", detailedOkr);
        
        // Nếu là draft, fetch dữ liệu draft
        if (okr.status === 'draft') {
          const historyResponse = await fetch(`http://localhost:5000/api/checkins/okr/${okr.id}`, {
            method: 'GET',
            headers
          });
          
          if (historyResponse.ok) {
            const history = await historyResponse.json();
            // Lấy draft mới nhất
            const latestDraft = history.find(h => h.status === 'draft');
            if (latestDraft) {
              detailedOkr.draftData = latestDraft;
            }
          }
        }
        
        setSelectedOkr(detailedOkr);
        setShowCheckinForm(true);
      } else {
        console.error('Failed to fetch OKR detail');
        alert('Không thể tải chi tiết OKR!');
      }
    } catch (error) {
      console.error('Error fetching OKR detail:', error);
      alert('Có lỗi khi tải chi tiết OKR!');
    }
  };

  const handleCloseCheckinForm = () => {
    setShowCheckinForm(false);
    setSelectedOkr(null);
  };

  const handleSubmitCheckin = async (checkinData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log("=== SENDING CHECKIN TO SERVER ===");
      console.log("Checkin data:", checkinData);

      // Gửi dữ liệu check-in lên server
      const response = await fetch('http://localhost:5000/api/checkins', {
        method: 'POST',
        headers,
        body: JSON.stringify(checkinData)
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Check-in result:", result);
        
        const statusText = checkinData.isDraft ? 'Lưu nháp' : 'Check-in';
        const newStatus = result.status || (checkinData.isDraft ? 'draft' : 'waiting');
        
        alert(`${statusText} thành công!`);
        
        // Cập nhật trạng thái OKR trong danh sách
        setOkrs(prev => prev.map(o => 
          o.id === selectedOkr.id 
            ? { 
                ...o, 
                status: newStatus,
                progress: checkinData.progress,
                confidence: checkinData.confidence
              }
            : o
        ));
        
        handleCloseCheckinForm();
        
        // Refresh danh sách OKRs
        fetchOKRs();
      } else {
        const error = await response.json();
        console.error("Check-in error:", error);
        alert(`${checkinData.isDraft ? 'Nháp' : 'Check-in'} thất bại: ${error.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Error submitting checkin:', error);
      alert(`Có lỗi xảy ra khi ${checkinData.isDraft ? 'Nháp' : 'Check-in'}!`);
    }
  };

  // Xử lý khi click vào trạng thái "Chờ phản hồi"
  const handleWaitingClick = async (okr) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log("=== WAITING CLICK DEBUG ===");
      console.log("OKR:", okr);
      console.log("OKR Creator User ID:", okr.creator?.user_id);
      console.log("Current User:", currentUser);

      // Kiểm tra xem có creator user_id không
      if (!okr.creator?.user_id) {
        alert('Không tìm thấy thông tin người phụ trách OKR!');
        return;
      }

      // Lấy thông tin user owner của OKR bao gồm superior
      const ownerResponse = await fetch(`http://localhost:5000/api/users/${okr.creator.user_id}`, {
        method: 'GET',
        headers
      });

      console.log("Owner Response Status:", ownerResponse.status);

      if (!ownerResponse.ok) {
        const errorText = await ownerResponse.text();
        console.error("Owner Response Error:", errorText);
        alert(`Không thể tải thông tin người phụ trách OKR! (Status: ${ownerResponse.status})`);
        return;
      }

      const ownerData = await ownerResponse.json();
      console.log("Owner Data:", ownerData);
      console.log("Owner Superior ID:", ownerData.superior_user_id);
      console.log("Current User ID:", currentUser?.user_id);
      
      // Kiểm tra quyền: chỉ superior của owner mới được đánh giá
      if (!currentUser) {
        alert('Vui lòng đăng nhập!');
        return;
      }

      if (!ownerData.superior_user_id) {
        alert('Người phụ trách OKR chưa được gán cấp trên!');
        return;
      }

      if (currentUser.user_id !== ownerData.superior_user_id) {
        alert(`Chỉ cấp trên của người phụ trách OKR mới có thể đánh giá check-in!\n\nBạn: ${currentUser.fullname} (ID: ${currentUser.user_id})\nCấp trên cần thiết: ${ownerData.superior_name} (ID: ${ownerData.superior_user_id})`);
        return;
      }

      // Lấy check-in mới nhất của OKR này
      const response = await fetch(`http://localhost:5000/api/checkins/okr/${okr.id}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const checkins = await response.json();
        console.log("Checkins:", checkins);
        const waitingCheckin = checkins.find(c => c.status === 'waiting');
        
        if (waitingCheckin) {
          console.log("✅ Found waiting checkin:", waitingCheckin);
          setSelectedCheckinId(waitingCheckin.checkin_id);
          setSelectedOkr(okr);
          setOkrOwnerInfo(ownerData);
          setReviewMode('create');
          setShowReviewModal(true);
        } else {
          alert('Không tìm thấy check-in đang chờ phản hồi!');
        }
      } else {
        alert('Không thể tải thông tin check-in!');
      }
    } catch (error) {
      console.error('Error fetching waiting checkin:', error);
      alert('Có lỗi khi tải thông tin check-in!');
    }
  };

  // Xử lý khi click vào trạng thái "Đã Check-in" - mọi người đều được xem
  const handleCheckedClick = async (okr) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Lấy check-in mới nhất của OKR này
      const response = await fetch(`http://localhost:5000/api/checkins/okr/${okr.id}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const checkins = await response.json();
        const checkedCheckin = checkins.find(c => c.status === 'checked');
        
        if (checkedCheckin) {
          setSelectedCheckinId(checkedCheckin.checkin_id);
          setSelectedOkr(okr);
          setOkrOwnerInfo(null); // không cần check quyền khi xem
          setReviewMode('view');
          setShowReviewModal(true);
        } else {
          alert('Không tìm thấy thông tin đánh giá!');
        }
      } else {
        alert('Không thể tải thông tin check-in!');
      }
    } catch (error) {
      console.error('Error fetching checked checkin:', error);
      alert('Có lỗi khi tải thông tin check-in!');
    }
  };

  const handleCloseReviewModal = (refreshNeeded) => {
    setShowReviewModal(false);
    setSelectedCheckinId(null);
    setSelectedOkr(null);
    setOkrOwnerInfo(null);
    setReviewMode('create');
    
    if (refreshNeeded) {
      fetchOKRs();
    }
  };

  const getProgressColor = (p) => {
    const progress = Number(p) || 0;
    if (progress >= 80) return '#10b981';
    if (progress >= 50) return '#f59e0b';
    if (progress >= 20) return '#f97316';
    return '#ef4444';
  };

  const getChangeColor = (change) => {
    if (!change) return '#6b7280';
    const value = parseFloat(change);
    if (value > 0) return '#10b981';
    if (value < 0) return '#ef4444';
    return '#6b7280';
  };

  const quarters = useMemo(() => {
    const q = new Set(['Tất cả quý']);
    okrs.forEach(o => { if (o.cycle) q.add(o.cycle); });
    return Array.from(q);
  }, [okrs]);

  const owners = useMemo(() => {
    return ['Tất cả người phụ trách', ...allUsers.map(u => u.fullname)];
  }, [allUsers]);

  const filteredOkrs = useMemo(() => {
    const txt = (search || '').trim().toLowerCase();
    
    // Nếu không có filter owner đặc biệt, chỉ filter bình thường
    if (selectedOwner === 'Tất cả người phụ trách') {
      return okrs.filter(o => {
        if (selectedQuarter && selectedQuarter !== 'Tất cả quý' && o.cycle !== selectedQuarter) return false;
        if (!txt) return true;
        const obj = (o.objective || '').toString().toLowerCase();
        const owner = (o.owner_name || o.responsible || o.owner?.name || o.responsible_name || '').toString().toLowerCase();
        return obj.includes(txt) || owner.includes(txt);
      });
    }
    
    // Khi có filter owner, cần check cả parent có child thuộc owner không
    return okrs.filter(o => {
      // Filter theo quarter
      if (selectedQuarter && selectedQuarter !== 'Tất cả quý' && o.cycle !== selectedQuarter) return false;
      
      // Nếu OKR này thuộc về owner được chọn
      if (o.creator?.fullname === selectedOwner) {
        // Filter theo search text nếu có
        if (txt) {
          const obj = (o.objective || '').toString().toLowerCase();
          const owner = (o.owner_name || o.responsible || o.owner?.name || o.responsible_name || '').toString().toLowerCase();
          return obj.includes(txt) || owner.includes(txt);
        }
        return true;
      }
      
      // Nếu OKR này có children thuộc về owner được chọn, cũng hiển thị
      const children = childOkrs[o.id] || [];
      const hasMatchingChild = children.some(child => child.creator?.fullname === selectedOwner);
      if (hasMatchingChild) {
        return true;
      }
      
      return false;
    });
  }, [okrs, search, selectedQuarter, selectedOwner, childOkrs]);

  // Auto-expand parent OKRs when filtering by owner finds child OKRs
  useEffect(() => {
    const autoExpandParents = async () => {
      if (selectedOwner === 'Tất cả người phụ trách') {
        // Reset expansion when no filter
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch('http://localhost:5000/api/okrs', { method: 'GET', headers });
        if (!res.ok) return;
        
        const data = await res.json();
        const normalized = data.map(o => ({
          ...o,
          status: o.status || 'not_checked'
        }));

        // Tìm tất cả OKR con thuộc về người được chọn
        const childOkrsOfSelectedOwner = normalized.filter(o => 
          o.o_relevant && 
          o.creator?.fullname === selectedOwner
        );

        if (childOkrsOfSelectedOwner.length === 0) return;

        // Lấy danh sách parent IDs cần expand
        const parentIdsToExpand = new Set();
        const childrenByParent = {};

        childOkrsOfSelectedOwner.forEach(child => {
          const parentId = parseInt(child.o_relevant);
          if (parentId) {
            parentIdsToExpand.add(parentId);
            if (!childrenByParent[parentId]) {
              childrenByParent[parentId] = [];
            }
            childrenByParent[parentId].push(child);
          }
        });

        // Expand các parent và load children
        if (parentIdsToExpand.size > 0) {
          setExpandedOkrs(parentIdsToExpand);
          setChildOkrs(childrenByParent);
        }
      } catch (err) {
        console.error('Error auto-expanding parents:', err);
      }
    };

    autoExpandParents();
  }, [selectedOwner]);

  // Render OKR row with optional indent
  const renderOkrRow = (okr, isChild = false, depth = 0) => {
    const statusValue = okr.status || 'not_checked';
    const statusDisplay = STATUS_MAP[statusValue] || STATUS_MAP['not_checked'];
    const statusColor = STATUS_COLOR[statusValue] || STATUS_COLOR['not_checked'];
    
    let isClickable = false;
    let clickHandler = null;
    
    if (statusValue === 'not_checked' || statusValue === 'draft') {
      isClickable = true;
      clickHandler = () => handleOpenCheckinForm(okr);
    } else if (statusValue === 'waiting') {
      isClickable = true;
      clickHandler = () => handleWaitingClick(okr);
    } else if (statusValue === 'checked') {
      isClickable = true;
      clickHandler = () => handleCheckedClick(okr);
    }

    const hasChildren = hasChildrenMap[okr.id];
    const isExpanded = expandedOkrs.has(okr.id);
    const paddingLeft = 10 + (depth * 30);

    const keyResultsCount = okr.key_results ? okr.key_results.split(';').filter(Boolean).length : (okr.keyResultsCount || 0);

    return (
      <React.Fragment key={okr.id}>
        <div className={`checkin-row ${isChild ? 'child-row' : ''}`}>
          <div className="col goal">
            <div className="goal-title" style={{ 
              paddingLeft: `${paddingLeft}px`,
              display: 'flex',
              alignItems: 'center'
            }}>
              {hasChildren ? (
                <button 
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(okr.id);
                  }}
                  style={{ marginRight: '8px' }}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <span style={{ width: '24px', display: 'inline-block' }}></span>
              )}
              {okr.objective}
            </div>
          </div>

          <div className="col person">
            <div className="okr-owner">
              <div className="okr-avatar">
                {okr.creator?.avatarUrl ? (
                  <img 
                    src={okr.creator.avatarUrl} 
                    alt={okr.creator.fullname}
                    className="avatar-img"
                  />
                ) : (
                  <User className="icon-sm" />
                )}
              </div>
              <span className="okr-owner-name">{okr.creator?.fullname || 'Không xác định'}</span>
            </div>
          </div>

          <div className="col key">
            <button className="key-result-btn">
              {keyResultsCount} Kết quả
            </button>
          </div>

          <div className="col progress">
            <div className="progress-wrap">
              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: `${okr.progress || 0}%`, background: getProgressColor(okr.progress) }}
                />
              </div>
              <div className="progress-text">{okr.progress || 0}%</div>
            </div>
          </div>

          <div className="col change">
            <div 
              className="change-value"
              style={{ 
                color: getChangeColor(okr.change),
                fontWeight: okr.change ? '600' : '400'
              }}
            >
              {okr.change || '--'}
            </div>
          </div>

          <div className="col confidence">
            <div className="confidence-pill">{okr.confidence || 'Rất tốt'}</div>
          </div>

          <div className="col summary">
            <button className="summary-btn">
              {okr.summary || 0}
            </button>
          </div>

          <div className="col checkin">
            <div className="checkin-control">
              <div 
                className={`status-pill ${isClickable ? 'status-clickable' : 'status-static'}`}
                style={{ borderColor: statusColor }}
                onClick={clickHandler}
              >
                <span className="status-dot" style={{ background: statusColor }} />
                {statusDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Render child OKRs if expanded */}
        {isExpanded && childOkrs[okr.id] && childOkrs[okr.id].length > 0 && (
          <>
            {childOkrs[okr.id].map(child => renderOkrRow(child, true, depth + 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="checkin-page">
      <div className="checkin-header">
        <div className="header-tabs">
          <button 
            className={`tab-btn ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => setActiveTab('checkin')}
          >
            Check-in OKRs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Lịch sử Check-in
          </button>
        </div>
        {activeTab === 'checkin' && (
          <div className="header-controls">
            <input
              className="search-input"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="quarter-select" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
              {quarters.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <select className="owner-select" value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)}>
              {owners.map(owner => <option key={owner} value={owner}>{owner}</option>)}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'checkin' ? (
        <div className="checkin-table">
          <div className="checkin-row header">
            <div className="col goal">Mục tiêu</div>
            <div className="col person">Người phụ trách</div>
            <div className="col key">Kết quả chính</div>
            <div className="col progress">Tiến độ</div>
            <div className="col change">Thay đổi</div>
            <div className="col confidence">Mức độ tự tin</div>
            <div className="col summary">Tổng kết</div>
            <div className="col checkin">Trạng thái</div>
          </div>

          {loading ? (
            <div className="checkin-row loading">Đang tải...</div>
          ) : okrs.length === 0 ? (
            <div className="checkin-row empty">Không có OKRs.</div>
          ) : (
            filteredOkrs.map(okr => renderOkrRow(okr, false))
          )}
        </div>
      ) : (
        <CheckinHistory okrs={allOkrs} allUsers={allUsers} />
      )}

      {showCheckinForm && (
        <CheckinForm
          okr={selectedOkr}
          onClose={handleCloseCheckinForm}
          onSubmit={handleSubmitCheckin}
        />
      )}

      {showReviewModal && (
        <CheckinReview
          visible={showReviewModal}
          onClose={handleCloseReviewModal}
          checkinId={selectedCheckinId}
          okrId={selectedOkr?.id}
          mode={reviewMode}
          currentUserId={currentUser?.user_id}
          isOkrOwner={currentUser?.user_id === selectedOkr?.creator?.user_id}
          isSuperior={okrOwnerInfo ? currentUser?.user_id === okrOwnerInfo.superior_user_id : false}
        />
      )}
    </div>
  );
};

export default Checkin;
