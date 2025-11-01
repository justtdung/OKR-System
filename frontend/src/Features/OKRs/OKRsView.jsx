import React, { useState, useEffect } from 'react';
import { Plus, User, ChevronDown, Building2, Users, ChevronRight } from 'lucide-react';
import CreateOKR from '../../Modals/CreateOKR/CreateOKR';
import './OKRsView.css';

// Helper functions moved outside component to avoid eslint warnings
const getChildOkrsHelper = (allOkrs, parentId) => {
  return allOkrs.filter(okr => {
    const oRelevant = okr.o_relevant;
    return oRelevant && (oRelevant === parentId || parseInt(oRelevant) === parentId);
  });
};

const hasChildrenHelper = (allOkrs, okrId) => {
  return allOkrs.some(okr => {
    const oRelevant = okr.o_relevant;
    return oRelevant && (oRelevant === okrId || parseInt(oRelevant) === okrId);
  });
};

const OKRsView = ({ onOpenModal }) => {
  const [okrsList, setOkrsList] = useState([]);
  const [filteredOkrsList, setFilteredOkrsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableQuarters, setAvailableQuarters] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);
  const [showQuarterFilter, setShowQuarterFilter] = useState(false);
  const [showOwnerFilter, setShowOwnerFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOKR, setSelectedOKR] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // NEW: dynamic summary cards + selected summary state
  const [summaryCards, setSummaryCards] = useState([]);
  // default to empty string = "Tất cả OKRs"
  const [selectedSummaryType, setSelectedSummaryType] = useState('');

  // NEW: states for expand/collapse hierarchy
  const [expandedOkrs, setExpandedOkrs] = useState(new Set());
  const [allOkrs, setAllOkrs] = useState([]); // Store ALL OKRs including children

  useEffect(() => {
    fetchOKRs();
    fetchCurrentUser();
    fetchDepartments();
    fetchAllUsers();
    // Đăng ký callback để refresh từ modal
    window.refreshOKRsList = fetchOKRs;
    
    return () => {
      // Cleanup callback khi component unmount
      delete window.refreshOKRsList;
    };
  }, []);

  // Extract unique quarters from OKRs data
  useEffect(() => {
    const quarters = [...new Set(okrsList.map(okr => okr.cycle).filter(cycle => cycle))];
    setAvailableQuarters(quarters.sort());
  }, [okrsList]);

  // NEW: compute summary cards whenever allOkrs changes (not just okrsList)
  useEffect(() => {
    const types = [
      { key: 'Công ty', title: 'OKRs Toàn Công Ty', color: 'blue' },
      { key: 'Cá Nhân', title: 'OKRs Cá Nhân', color: 'green' },
      { key: 'Nhóm', title: 'OKRs Nhóm', color: 'purple' },
    ];

    const cards = types.map(t => {
      // Đếm TẤT CẢ OKRs (bao gồm cả child) theo type
      const items = allOkrs.filter(o => (o.type || '').trim() === t.key);
      const count = items.length;
      const avgProgress = count === 0 ? 0 : Math.round(items.reduce((s, it) => s + (Number(it.progress) || 0), 0) / count);
      return {
        typeKey: t.key,
        title: t.title,
        count,
        progress: avgProgress,
        color: t.color
      };
    });

    // Also include 'Tất cả' card - đếm TẤT CẢ
    const totalCount = allOkrs.length;
    const totalAvg = totalCount === 0 ? 0 : Math.round(allOkrs.reduce((s, it) => s + (Number(it.progress) || 0), 0) / totalCount);
    setSummaryCards([{ typeKey: '', title: 'Tất cả OKRs', count: totalCount, progress: totalAvg, color: 'gray' }, ...cards]);
  }, [allOkrs]); // Đổi dependency từ okrsList sang allOkrs

  // Filter OKRs when department or quarter selection or selectedSummaryType changes
  useEffect(() => {
    let filtered = okrsList;

    // Filter by department
    if (selectedDepartment !== '') {
      filtered = filtered.filter(okr => okr.department_name === selectedDepartment);
    }

    // Filter by quarter
    if (selectedQuarter !== '') {
      filtered = filtered.filter(okr => okr.cycle === selectedQuarter);
    }

    // Filter by owner - show parent if it matches OR has matching children
    if (selectedOwner !== '') {
      filtered = filtered.filter(okr => {
        // Direct match
        if (okr.creator?.fullname === selectedOwner) {
          return true;
        }
        // Has matching children
        const children = getChildOkrsHelper(allOkrs, okr.id);
        return children.some(child => child.creator?.fullname === selectedOwner);
      });
    }

    // Filter by selected summary card type
    if (selectedSummaryType !== null && selectedSummaryType !== '') {
      filtered = filtered.filter(okr => (okr.type || '').trim() === selectedSummaryType);
    }

    setFilteredOkrsList(filtered);
  }, [okrsList, selectedDepartment, selectedQuarter, selectedOwner, selectedSummaryType, allOkrs]);

  // Auto-expand parent OKRs when filtering by owner finds child OKRs
  useEffect(() => {
    if (selectedOwner === '') {
      // Reset expansion when no filter
      return;
    }

    // Tìm tất cả OKR con thuộc về người được chọn
    const childOkrsOfSelectedOwner = allOkrs.filter(o => 
      o.o_relevant && 
      o.creator?.fullname === selectedOwner
    );

    if (childOkrsOfSelectedOwner.length === 0) return;

    // Lấy danh sách parent IDs cần expand
    const parentIdsToExpand = new Set();

    childOkrsOfSelectedOwner.forEach(child => {
      const parentId = parseInt(child.o_relevant);
      if (parentId) {
        parentIdsToExpand.add(parentId);
      }
    });

    // Expand các parent
    if (parentIdsToExpand.size > 0) {
      setExpandedOkrs(parentIdsToExpand);
    }
  }, [selectedOwner, allOkrs]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:5000/api/departments", {
        method: "GET",
        headers: headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error("Failed to fetch departments");
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
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
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:5000/api/okrs", {
        method: "GET",
        headers: headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("=== ALL OKRS FROM API ===");
        console.log("Total OKRs:", data.length);
        
        // Store ALL OKRs
        setAllOkrs(data);
        
        // Filter top-level OKRs (no parent or o_relevant is null/0)
        const topLevelOkrs = data.filter(o => !o.o_relevant || o.o_relevant === null || o.o_relevant === 0 || o.o_relevant === '');
        console.log("Top level OKRs:", topLevelOkrs.length);
        
        setOkrsList(topLevelOkrs);
        setFilteredOkrsList(topLevelOkrs);
      } else {
        console.error("Failed to fetch OKRs");
        setOkrsList([]);
        setFilteredOkrsList([]);
        setAllOkrs([]);
      }
    } catch (error) {
      console.error("Error fetching OKRs:", error);
      setOkrsList([]);
      setFilteredOkrsList([]);
      setAllOkrs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOKRDetail = async (okrId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/okrs/${okrId}`, {
        method: "GET",
        headers: headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log("=== DEBUG OKR DETAIL DATA ===");
        console.log("Raw data from backend:", data);
        
        // Chuyển đổi dữ liệu từ backend sang format của CreateOKR modal
        const formattedOKR = {
          id: data.id,
          type: data.type || '',
          cycle: data.cycle || '',
          parent: data.o_relevant || '',
          objective: data.objective || '',
          department: data.department_id || '',
          visibility: data.display === 1 ? 'public' : 'private',
          keyResults: data.key_results ? 
            data.key_results.split(';').map((kr, index) => ({
              description: kr.trim(),
              target: data.target || '', 
              unit: data.unit || 'Người', 
              planLink: data.link_plans || '', 
              resultLink: data.link_results || '', 
              relatedOKRs: data.kr_relevant || '' 
            })) : [{
              description: '',
              target: data.target || '',
              unit: data.unit || 'Người',
              planLink: data.link_plans || '',
              resultLink: data.link_results || '',
              relatedOKRs: data.kr_relevant || ''
            }],
          crossLinkedOKRs: data.o_cross ? 
            (typeof data.o_cross === 'string' ? 
              JSON.parse(data.o_cross).map(item => ({ search: item, showDropdown: false })) : 
              []) : [],
          creator: data.creator,
          department_name: data.department_name
        };

        console.log("Formatted OKR for modal:", formattedOKR);

        setSelectedOKR(formattedOKR);
        setIsEditMode(false); // Mặc định là view mode
        setShowDetailModal(true);
      } else {
        console.error("Failed to fetch OKR detail");
      }
    } catch (error) {
      console.error("Error fetching OKR detail:", error);
    }
  };

  const handleOKRClick = (okr) => {
    fetchOKRDetail(okr.id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOKR(null);
    setIsEditMode(false);
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'progress-green';
    if (progress >= 50) return 'progress-yellow';
    if (progress >= 20) return 'progress-orange';
    return 'progress-red';
  };

  const canUserEdit = (okr) => {
    return currentUser && okr.creator && currentUser.user_id === okr.creator.user_id;
  };

  const handleSummaryClick = (typeKey) => {
    // toggle selection: deselect => '' (Tất cả), select => typeKey
    if (selectedSummaryType === typeKey) {
      setSelectedSummaryType(''); // back to "Tất cả"
    } else {
      setSelectedSummaryType(typeKey);
    }
  };

  const handleDepartmentChange = (departmentName) => {
    setSelectedDepartment(departmentName);
    setShowDepartmentFilter(false);
  };

  const handleQuarterChange = (quarter) => {
    setSelectedQuarter(quarter);
    setShowQuarterFilter(false);
  };

  const handleOwnerChange = (ownerName) => {
    setSelectedOwner(ownerName);
    setShowOwnerFilter(false);
  };

  // Determine header title based on selection
  const headerInfo = selectedSummaryType === null
    ? { title: 'OKRs Cá Nhân' } // default original title
    : (summaryCards.find(c => c.typeKey === selectedSummaryType) || { title: 'OKRs' });

  // NEW helper: map progress -> status label + color + arrow direction
  const getStatusFromProgress = (p) => {
    const progress = Number(p) || 0;
    if (progress >= 80) return { label: 'Tốt', color: '#10b981', arrow: '↑' };
    if (progress >= 50) return { label: 'Trung bình', color: '#f59e0b', arrow: '→' };
    if (progress >= 20) return { label: 'Cần chú ý', color: '#f97316', arrow: '→' };
    return { label: 'Kém', color: '#ef4444', arrow: '↓' };
  };

  // NEW: icon mapping for summary cards
  const summaryIconFor = (typeKey) => {
    if (!typeKey) return Building2; // default for "Tất cả"
    if (typeKey.includes('Công')) return Building2;
    if (typeKey.includes('Cá Nhân') || typeKey.includes('Cá Nhân')) return User;
    if (typeKey.includes('Nhóm')) return Users;
    return Building2;
  };

  // NEW: Get child OKRs of a parent
  const getChildOkrs = (parentId) => {
    return getChildOkrsHelper(allOkrs, parentId);
  };

  // NEW: Check if OKR has children
  const hasChildren = (okrId) => {
    return hasChildrenHelper(allOkrs, okrId);
  };

  // NEW: Toggle expand/collapse
  const toggleExpand = (okrId, e) => {
    e.stopPropagation(); // Prevent row click
    setExpandedOkrs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(okrId)) {
        newSet.delete(okrId);
      } else {
        newSet.add(okrId);
      }
      return newSet;
    });
  };

  return (
    <div className="ml-56 mt-16 p-6">
      {/* Summary Cards (dynamic) */}
      <div className="okrs-summary-grid mb-6">
        {summaryCards.map((card, index) => {
          const Icon = summaryIconFor(card.typeKey);
          const status = getStatusFromProgress(card.progress);
          return (
            <div
              key={index}
              className={`summary-card ${selectedSummaryType === card.typeKey ? 'summary-selected' : ''}`}
              onClick={() => handleSummaryClick(card.typeKey)}
              role="button"
              tabIndex={0}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <div className={`summary-icon bg-${card.color}-500`} style={{width:48, height:48, borderRadius:12}}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{fontSize:14, fontWeight:700, color:'#111827'}}>{card.title}</div>
                    <div style={{fontSize:12, color:'#6b7280', marginTop:6}}>{/* subtitle if needed */}</div>
                  </div>
                </div>

                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:20, fontWeight:800, color:'#111827'}}>{card.count}</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>OKRs</div>
                </div>
              </div>

              <div style={{marginTop:12}}>
                <div style={{height:8, background:'#eef2f7', borderRadius:999, overflow:'hidden'}}>
                  <div style={{width:`${card.progress}%`, height:'100%', background: status.color, borderRadius:999, transition:'width 0.3s'}} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, color: status.color, fontWeight:600}}>
                    <span style={{fontSize:14}}>{status.arrow}</span>
                    <span style={{fontSize:13}}>{status.label}</span>
                  </div>
                  <div style={{fontSize:13, color:'#6b7280'}}>{card.progress}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* If a summary is selected, show its header card above the OKR table */}
      {selectedSummaryType !== null && (
        <div className="selected-header-card mb-4 p-4 rounded-md bg-white border">
          {(() => {
            const c = summaryCards.find(s => s.typeKey === selectedSummaryType) || {};
            return (
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:18, fontWeight:700}}>{c.title}</div>
                  <div style={{fontSize:13, color:'#888'}}>{c.count} OKRs</div>
                </div>
                <div style={{flex:1, marginLeft:20}}>
                  <div style={{height:10, background:'#f1f1f1', borderRadius:6, overflow:'hidden'}}>
                    <div style={{width:`${c.progress || 0}%`, height:'100%', background:'#4caf50'}} />
                  </div>
                  <div style={{fontSize:12, color:'#666', marginTop:6}}>{c.progress}% tiến độ trung bình</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main Table */}
      <div className="okrs-container">
        <div className="okrs-header mb-3">
          <div className="okrs-header-top">
            <h2 className="okrs-title text-lg font-semibold">{headerInfo.title}</h2>
            <div className="okrs-header-actions">
              {/* Owner Filter Dropdown */}
              <div className="relative">
                <button 
                  className="okrs-btn-filter text-sm px-3 py-1.5 flex items-center gap-2"
                  onClick={() => setShowOwnerFilter(!showOwnerFilter)}
                >
                  {selectedOwner || 'Tất cả người phụ trách'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showOwnerFilter && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-48 max-h-60 overflow-y-auto">
                    <div 
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      onClick={() => handleOwnerChange('')}
                    >
                      Tất cả người phụ trách
                    </div>
                    {allUsers.map((user) => (
                      <div 
                        key={user.user_id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-t border-gray-100"
                        onClick={() => handleOwnerChange(user.fullname)}
                      >
                        {user.fullname}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quarter Filter Dropdown */}
              <div className="relative">
                <button 
                  className="okrs-btn-filter text-sm px-3 py-1.5 flex items-center gap-2"
                  onClick={() => setShowQuarterFilter(!showQuarterFilter)}
                >
                  {selectedQuarter || 'Tất cả quý'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showQuarterFilter && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-32">
                    <div 
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      onClick={() => handleQuarterChange('')}
                    >
                      Tất cả quý
                    </div>
                    {availableQuarters.map((quarter) => (
                      <div 
                        key={quarter}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-t border-gray-100"
                        onClick={() => handleQuarterChange(quarter)}
                      >
                        {quarter}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Department Filter Dropdown */}
              <div className="relative">
                <button 
                  className="okrs-btn-filter text-sm px-3 py-1.5 flex items-center gap-2"
                  onClick={() => setShowDepartmentFilter(!showDepartmentFilter)}
                >
                  {selectedDepartment || 'Tất cả phòng ban'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showDepartmentFilter && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-48">
                    <div 
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      onClick={() => handleDepartmentChange('')}
                    >
                      Tất cả phòng ban
                    </div>
                    {departments.map((dept) => (
                      <div 
                        key={dept.department_id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-t border-gray-100"
                        onClick={() => handleDepartmentChange(dept.department_name)}
                      >
                        {dept.department_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={onOpenModal} className="okrs-btn-add text-sm px-3 py-1.5">
                <Plus className="icon-sm w-4 h-4" />
                Thêm OKR
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="okrs-table overflow-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {/* Header row */}
          <div className="okrs-table-header">
            <div className="col col-goal">Mục tiêu</div>
            <div className="col col-owner">Người phụ trách</div>
            <div className="col col-key text-center">Kết quả then chốt</div>
            <div className="col col-progress text-center">Tiến độ</div>
            <div className="col col-change text-center">Thay đổi</div>
          </div>

          {/* Data rows */}
          {loading ? (
            <div className="okrs-loading">Đang tải...</div>
          ) : filteredOkrsList && filteredOkrsList.length > 0 ? (
            filteredOkrsList.map((okr) => {
              const children = getChildOkrs(okr.id);
              const isExpanded = expandedOkrs.has(okr.id);
              const showExpandBtn = hasChildren(okr.id);

              return (
                <React.Fragment key={okr.id}>
                  {/* Parent Row */}
                  <div 
                    className="okrs-row"
                    onClick={() => handleOKRClick(okr)}
                  >
                    <div className="col col-goal">
                      <div className="okr-objective">
                        {/* Mũi tên ở đầu ô, bên trái hoàn toàn */}
                        {showExpandBtn ? (
                          <button
                            className="expand-btn-okr"
                            onClick={(e) => toggleExpand(okr.id, e)}
                            title={isExpanded ? "Thu gọn" : "Mở rộng"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        ) : (
                          <div style={{ width: '28px' }} /> // Placeholder để giữ alignment
                        )}
                        <div style={{ flex: 1 }}>
                          <p className="okr-title">{okr.objective}</p>
                          <span className="okr-type">{okr.type} • {okr.cycle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col col-owner">
                      <div className="okr-owner">
                        <div className="okr-avatar">
                          {okr.creator.avatarUrl ? (
                            <img 
                              src={okr.creator.avatarUrl} 
                              alt={okr.creator.fullname}
                              className="avatar-img"
                            />
                          ) : (
                            <User className="icon-sm" />
                          )}
                        </div>
                        <span className="okr-owner-name">{okr.creator.fullname || 'Không xác định'}</span>
                      </div>
                    </div>

                    <div className="col col-key text-center">
                      <span className="okr-krs">{okr.keyResultsCount} KRs</span>
                    </div>

                    <div className="col col-progress">
                      <div className="okr-progress-container">
                        <div className="okr-progress-bar">
                          <div className="okr-progress-track">
                            <div
                              className={`okr-progress-fill ${getProgressColor(okr.progress)}`}
                              style={{ width: `${okr.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="okr-progress-text">{okr.progress}%</span>
                      </div>
                    </div>

                    <div className="col col-change text-center">
                      <span className="okr-change">{okr.change || '--'}</span>
                    </div>
                  </div>

                  {/* Child Rows (if expanded) */}
                  {isExpanded && children.map((childOkr) => (
                    <div 
                      key={childOkr.id}
                      className="okrs-row child-row"
                      onClick={() => handleOKRClick(childOkr)}
                      style={{ marginLeft: '0', marginTop: '0.5rem' }}
                    >
                      <div className="col col-goal">
                        <div className="okr-objective">
                          {/* Indent cho child bằng khoảng trắng */}
                          <div style={{ width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '1.2rem', color: '#9ca3af' }}>↳</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p className="okr-title">{childOkr.objective}</p>
                            <span className="okr-type">{childOkr.type} • {childOkr.cycle}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col col-owner">
                        <div className="okr-owner">
                          <div className="okr-avatar">
                            {childOkr.creator.avatarUrl ? (
                              <img 
                                src={childOkr.creator.avatarUrl} 
                                alt={childOkr.creator.fullname}
                                className="avatar-img"
                              />
                            ) : (
                              <User className="icon-sm" />
                            )}
                          </div>
                          <span className="okr-owner-name">{childOkr.creator.fullname || 'Không xác định'}</span>
                        </div>
                      </div>

                      <div className="col col-key text-center">
                        <span className="okr-krs">{childOkr.keyResultsCount} KRs</span>
                      </div>

                      <div className="col col-progress">
                        <div className="okr-progress-container">
                          <div className="okr-progress-bar">
                            <div className="okr-progress-track">
                              <div
                                className={`okr-progress-fill ${getProgressColor(childOkr.progress)}`}
                                style={{ width: `${childOkr.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="okr-progress-text">{childOkr.progress}%</span>
                        </div>
                      </div>

                      <div className="col col-change text-center">
                        <span className="okr-change">{childOkr.change || '--'}</span>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              );
            })
          ) : (
            <div className="okrs-empty">
              {(selectedDepartment || selectedQuarter || selectedSummaryType) 
                ? `Không có OKRs nào cho ${selectedSummaryType ? `thẻ "${headerInfo.title}"` : ''}${selectedQuarter ? ` quý "${selectedQuarter}"` : ''}${selectedDepartment && (selectedQuarter || selectedSummaryType) ? ' và ' : ''}${selectedDepartment ? `phòng ban "${selectedDepartment}"` : ''}.`
                : "Không có OKRs nào."
              }
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showDepartmentFilter || showQuarterFilter || showOwnerFilter) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDepartmentFilter(false);
            setShowQuarterFilter(false);
            setShowOwnerFilter(false);
          }}
        />
      )}

      {/* OKR Detail Modal - Sử dụng CreateOKR component */}
      {showDetailModal && selectedOKR && (
        <CreateOKR
          show={showDetailModal}
          onClose={closeDetailModal}
          newOKR={selectedOKR}
          setNewOKR={setSelectedOKR}
          readOnly={!isEditMode}
          isViewMode={true}
          isEditMode={isEditMode}
          onEditToggle={handleEditToggle}
          canEdit={canUserEdit(selectedOKR)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default OKRsView;