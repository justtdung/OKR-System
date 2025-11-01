import React, { useState, useMemo, useEffect } from 'react';
import { User, ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';
import './CheckinHistory.css';

// Helper functions moved outside component to avoid eslint warnings
const getChildOkrsHelper = (okrs, parentId) => {
  return okrs.filter(okr => {
    const oRelevant = okr.o_relevant;
    return oRelevant && (oRelevant === parentId || parseInt(oRelevant) === parentId);
  });
};

const hasChildrenHelper = (okrs, okrId) => {
  return okrs.some(okr => {
    const oRelevant = okr.o_relevant;
    return oRelevant && (oRelevant === okrId || parseInt(oRelevant) === okrId);
  });
};

const CheckinHistory = ({ okrs, allUsers }) => {
  const [expandedOkr, setExpandedOkr] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [loading, setLoading] = useState({});
  const [expandedParents, setExpandedParents] = useState(new Set());

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('Tất cả quý');
  const [selectedOwner, setSelectedOwner] = useState('Tất cả người phụ trách');

  const quarters = useMemo(() => {
    const q = new Set(['Tất cả quý']);
    okrs.forEach(o => { if (o.cycle) q.add(o.cycle); });
    return Array.from(q);
  }, [okrs]);

  const owners = useMemo(() => {
    return ['Tất cả người phụ trách', ...allUsers.map(u => u.fullname)];
  }, [allUsers]);

  const toggleExpand = async (okrId) => {
    if (expandedOkr === okrId) {
      setExpandedOkr(null);
    } else {
      setExpandedOkr(okrId);
      
      // Fetch history nếu chưa có
      if (!historyData[okrId]) {
        await fetchHistory(okrId);
      }
    }
  };

  const toggleParentExpand = (okrId, e) => {
    e.stopPropagation();
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(okrId)) {
        newSet.delete(okrId);
      } else {
        newSet.add(okrId);
      }
      return newSet;
    });
  };

  const fetchHistory = async (okrId) => {
    try {
      setLoading(prev => ({ ...prev, [okrId]: true }));
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`http://localhost:5000/api/checkins/okr/${okrId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryData(prev => ({ ...prev, [okrId]: data }));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(prev => ({ ...prev, [okrId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': { text: 'Nháp', color: '#f59e0b' },
      'checked': { text: 'Đã check-in', color: '#10b981' },
      'waiting': { text: 'Chờ phản hồi', color: '#3b82f6' },
    };
    const { text, color } = statusMap[status] || { text: status, color: '#6b7280' };
    return <span className="status-badge" style={{ background: color }}>{text}</span>;
  };

  const getConfidenceBadge = (text) => {
    const colorMap = {
      'Không ổn lắm': '#ef4444',
      'Ổn': '#f59e0b',
      'Rất tốt': '#10b981'
    };
    return (
      <span className="confidence-badge" style={{ background: colorMap[text] || '#6b7280' }}>
        {text}
      </span>
    );
  };

  // Get child OKRs
  const getChildOkrs = (parentId) => {
    return getChildOkrsHelper(okrs, parentId);
  };

  // Check if has children
  const hasChildren = (okrId) => {
    return hasChildrenHelper(okrs, okrId);
  };

  const filteredOkrs = useMemo(() => {
    const txt = search.trim().toLowerCase();
    let filtered = okrs;

    // Filter by quarter first
    if (selectedQuarter !== 'Tất cả quý') {
      filtered = filtered.filter(o => o.cycle === selectedQuarter);
    }

    // Filter by search text
    if (txt) {
      filtered = filtered.filter(o => {
        const obj = (o.objective || '').toLowerCase();
        const owner = (o.creator?.fullname || '').toLowerCase();
        return obj.includes(txt) || owner.includes(txt);
      });
    }

    // Filter by owner - show OKR if it matches OR if it has matching children
    if (selectedOwner !== 'Tất cả người phụ trách') {
      filtered = filtered.filter(o => {
        // Direct match
        if (o.creator?.fullname === selectedOwner) {
          return true;
        }
        // Check if has matching children
        const children = getChildOkrsHelper(okrs, o.id);
        return children.some(child => child.creator?.fullname === selectedOwner);
      });
    }

    return filtered;
  }, [okrs, search, selectedQuarter, selectedOwner]);

  // Filter to show only top-level OKRs after filtering
  const topLevelOkrs = useMemo(() => {
    // Get top level from filtered list
    const topLevel = filteredOkrs.filter(o => !o.o_relevant || o.o_relevant === null || o.o_relevant === 0);
    
    // If filtering by owner, also include parent OKRs that have matching children
    if (selectedOwner !== 'Tất cả người phụ trách') {
      const allTopLevel = okrs.filter(o => !o.o_relevant || o.o_relevant === null || o.o_relevant === 0);
      const additionalParents = allTopLevel.filter(parent => {
        // Check if this parent has children matching the owner filter
        const children = getChildOkrsHelper(okrs, parent.id);
        const hasMatchingChild = children.some(child => {
          // Apply all filters to children
          let match = child.creator?.fullname === selectedOwner;
          
          if (match && selectedQuarter !== 'Tất cả quý') {
            match = child.cycle === selectedQuarter;
          }
          
          if (match && search.trim()) {
            const txt = search.trim().toLowerCase();
            const obj = (child.objective || '').toLowerCase();
            const owner = (child.creator?.fullname || '').toLowerCase();
            match = obj.includes(txt) || owner.includes(txt);
          }
          
          return match;
        });
        
        // Only add if not already in topLevel and has matching children
        return hasMatchingChild && !topLevel.find(o => o.id === parent.id);
      });
      
      return [...topLevel, ...additionalParents];
    }
    
    return topLevel;
  }, [filteredOkrs, okrs, selectedOwner, selectedQuarter, search]);

  // Auto-expand parent OKRs when filtering by owner finds child OKRs
  useEffect(() => {
    const autoExpandParents = () => {
      if (selectedOwner === 'Tất cả người phụ trách') {
        // Reset expansion when no filter
        setExpandedParents(new Set());
        return;
      }

      // Tìm tất cả OKR con thuộc về người được chọn
      const childOkrsOfSelectedOwner = okrs.filter(o => 
        o.o_relevant && 
        o.creator?.fullname === selectedOwner
      );

      if (childOkrsOfSelectedOwner.length === 0) {
        setExpandedParents(new Set());
        return;
      }

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
        setExpandedParents(parentIdsToExpand);
      }
    };

    autoExpandParents();
  }, [selectedOwner, okrs]);

  const renderOkrItem = (okr, isChild = false, depth = 0) => {
    const isExpanded = expandedOkr === okr.id;
    const isParentExpanded = expandedParents.has(okr.id);
    const history = historyData[okr.id] || [];
    const isLoading = loading[okr.id];
    const hasChildOkrs = hasChildren(okr.id);
    const childOkrs = getChildOkrs(okr.id);
    const paddingLeft = depth * 24;

    
    return (
      <React.Fragment key={okr.id}>
        <div className={`history-item ${isChild ? 'child-history-item' : ''}`} style={{ marginLeft: `${paddingLeft}px` }}>
          <div className="history-header" onClick={() => toggleExpand(okr.id)}>
            <div className="history-header-left">
              {hasChildOkrs && (
                <button 
                  className="expand-parent-btn"
                  onClick={(e) => toggleParentExpand(okr.id, e)}
                  style={{ marginRight: '8px' }}
                >
                  {isParentExpanded ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              )}
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <div className="okr-info-compact">
                <div className="okr-title">{okr.objective}</div>
                <div className="okr-meta">
                  <span className="okr-type">{okr.type}</span>
                  <span className="okr-cycle">{okr.cycle}</span>
                  <span className="okr-owner">
                    <User size={14} />
                    {okr.creator?.fullname}
                  </span>
                </div>
              </div>
            </div>
            <div className="history-header-right">
              <div className="history-count">
                {history.length} lần check-in
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="history-content">
              {isLoading ? (
                <div className="history-loading">Đang tải...</div>
              ) : history.length === 0 ? (
                <div className="history-empty">Chưa có lịch sử check-in</div>
              ) : (
                <div className="history-timeline">
                  {history.map((item, index) => (
                    <div key={item.checkin_id} className="timeline-item">
                      <div className="timeline-marker" />
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <div className="timeline-date">
                            {new Date(item.checkin_date).toLocaleDateString('vi-VN')}
                          </div>
                          {getStatusBadge(item.status)}
                        </div>

                        <div className="timeline-body">
                          <div className="timeline-row">
                            <div className="timeline-label">Người check-in:</div>
                            <div className="timeline-value">
                              {item.user_avatar_url ? (
                                <img src={item.user_avatar_url} alt="" className="user-avatar-small" />
                              ) : (
                                <User size={16} />
                              )}
                              {item.user_name}
                            </div>
                          </div>

                          <div className="timeline-row">
                            <div className="timeline-label">Tiến độ:</div>
                            <div className="timeline-value">
                              <div className="progress-mini">
                                <div 
                                  className="progress-fill-mini" 
                                  style={{ width: `${item.progress_percent}%` }}
                                />
                              </div>
                              <span className="progress-text-mini">{item.progress_percent}%</span>
                            </div>
                          </div>

                          <div className="timeline-row">
                            <div className="timeline-label">Mức độ tự tin:</div>
                            <div className="timeline-value">
                              {getConfidenceBadge(item.confidence_text)}
                            </div>
                          </div>

                          {item.work_summary && (
                            <div className="timeline-row">
                              <div className="timeline-label">Tóm tắt:</div>
                              <div className="timeline-value">{item.work_summary}</div>
                            </div>
                          )}

                          {item.slow_tasks && (
                            <div className="timeline-row">
                              <div className="timeline-label">Công việc chậm:</div>
                              <div className="timeline-value">{item.slow_tasks}</div>
                            </div>
                          )}

                          {item.obstacles && (
                            <div className="timeline-row">
                              <div className="timeline-label">Trở ngại:</div>
                              <div className="timeline-value">{item.obstacles}</div>
                            </div>
                          )}

                          {item.solutions && (
                            <div className="timeline-row">
                              <div className="timeline-label">Giải pháp:</div>
                              <div className="timeline-value">{item.solutions}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Render child OKRs if parent is expanded */}
        {isParentExpanded && childOkrs.map(child => renderOkrItem(child, true, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="history-container">
      {/* Filter Controls */}
      <div className="history-filters">
        <input
          className="search-input"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select 
          className="quarter-select" 
          value={selectedQuarter} 
          onChange={e => setSelectedQuarter(e.target.value)}
        >
          {quarters.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        <select 
          className="owner-select" 
          value={selectedOwner} 
          onChange={e => setSelectedOwner(e.target.value)}
        >
          {owners.map(owner => <option key={owner} value={owner}>{owner}</option>)}
        </select>
      </div>

      <div className="history-list">
        {topLevelOkrs.length === 0 ? (
          <div className="history-empty-state">
            Không có OKRs nào phù hợp với bộ lọc
          </div>
        ) : (
          topLevelOkrs.map(okr => renderOkrItem(okr, false, 0))
        )}
      </div>
    </div>
  );
};

export default CheckinHistory;
