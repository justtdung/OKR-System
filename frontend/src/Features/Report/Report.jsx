import React, { useState, useEffect } from 'react';
import './Report.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Report() {
  const [activeTab, setActiveTab] = useState('OKRs');
  const [sortBy, setSortBy] = useState('cycle');
  const [filterBy, setFilterBy] = useState('all');
  const [departmentStats, setDepartmentStats] = useState([]);
  const [departmentTableData, setDepartmentTableData] = useState([]);
  
  // Thay đổi giá trị mặc định cho date filter - lấy tháng hiện tại
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };
  
  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  
  const [individualStats] = useState({
    progress_0: 0,
    progress_1_40: 0,
    progress_41_70: 0,
    progress_70_plus: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate]); // Thêm startDate, endDate vào dependencies

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'OKRs') {
        // ✅ THÊM query parameters start_date và end_date
        const url = `${API_URL}/api/okrs/statistics?start_date=${startDate}&end_date=${endDate}`;
        console.log('Fetching statistics from:', url);
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Statistics data received:', data);
          
          setDepartmentTableData(data.departmentTable || []);
          setDepartmentStats(data.departmentTable || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch statistics:', response.status, errorData);
          
          // Log chi tiết để debug
          console.log('Error details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          alert(`Không thể tải dữ liệu: ${errorData.message || errorData.error || response.statusText}`);
          setDepartmentTableData([]);
          setDepartmentStats([]);
        }
      } else if (activeTab === 'CFRs') {
        console.log('CFRs statistics not yet implemented');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      alert('Lỗi kết nối đến server: ' + error.message);
      setDepartmentTableData([]);
      setDepartmentStats([]);
    }
  };

  const calculateProgress = (dept) => {
    const total = dept.progress_0 + dept.progress_1_40 + dept.progress_41_70 + dept.progress_70_plus;
    if (total === 0) return { p0: 0, p1_40: 0, p41_70: 0, p70: 0 };
    
    return {
      p0: (dept.progress_0 / total) * 100,
      p1_40: (dept.progress_1_40 / total) * 100,
      p41_70: (dept.progress_41_70 / total) * 100,
      p70: (dept.progress_70_plus / total) * 100
    };
  };

  const renderDonutChart = () => {
    const total = individualStats.progress_0 + individualStats.progress_1_40 + 
                  individualStats.progress_41_70 + individualStats.progress_70_plus;
    
    if (total === 0) return null;

    return (
      <div className="donut-chart-container">
        <svg viewBox="0 0 200 200" className="donut-chart">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#e0e0e0" strokeWidth="40"/>
          {renderDonutSegments(total)}
        </svg>
        <div className="donut-labels">
          <div className="donut-label" style={{ top: '15%', right: '5%' }}>
            <span className="label-value">{individualStats.progress_1_40}</span>
          </div>
          <div className="donut-label" style={{ top: '25%', right: '25%' }}>
            <span className="label-value">{individualStats.progress_41_70}</span>
          </div>
          <div className="donut-label" style={{ bottom: '35%', right: '10%' }}>
            <span className="label-value">{individualStats.progress_70_plus}</span>
          </div>
          <div className="donut-label" style={{ bottom: '20%', left: '15%' }}>
            <span className="label-value">{individualStats.progress_0}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDonutSegments = (total) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    const segments = [
      { value: individualStats.progress_0, color: '#6b7280' },
      { value: individualStats.progress_1_40, color: '#ef4444' },
      { value: individualStats.progress_41_70, color: '#f97316' },
      { value: individualStats.progress_70_plus, color: '#10b981' }
    ];

    return segments.map((segment, index) => {
      const percentage = (segment.value / total) * 100;
      const dashLength = (percentage / 100) * circumference;
      const dashOffset = -currentOffset;
      
      currentOffset += dashLength;

      return (
        <circle
          key={index}
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={segment.color}
          strokeWidth="40"
          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
        />
      );
    });
  };

  return (
    <div className="report-container">
      <div className="report-tabs">
        <button
          className={`tab-button ${activeTab === 'CFRs' ? 'active' : ''}`}
          onClick={() => setActiveTab('CFRs')}
        >
          CFRs
        </button>
        <button
          className={`tab-button ${activeTab === 'OKRs' ? 'active' : ''}`}
          onClick={() => setActiveTab('OKRs')}
        >
          OKRs
        </button>
      </div>

      <div className="report-content">
        <h2 className="report-title">Tiến độ {activeTab}</h2>

        <div className="report-filters">
          {/* Thêm Date Range Picker */}
          <div className="date-filter">
            <label>Từ ngày:</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
            <label>Đến ngày:</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>

        {/* Bảng thống kê OKRs phòng ban */}
        {activeTab === 'OKRs' && (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Phòng ban</th>
                  <th>Tổng OKR chưa check-in</th>
                  <th>Tổng OKR đã check-in nháp</th>
                  <th>Tổng OKR đã hoàn thành</th>
                  <th>Tiến độ trung bình</th>
                </tr>
              </thead>
              <tbody>
                {departmentTableData.length > 0 ? (
                  departmentTableData.map((dept, index) => (
                    <tr key={dept.department_id || index}>
                      <td className="department-cell">{dept.department_name || 'N/A'}</td>
                      <td>{dept.not_checked_in || 0}</td>
                      <td>{dept.draft || 0}</td>
                      <td>{dept.completed || 0}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-mini">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${dept.avg_progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{dept.avg_progress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">Chưa có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="report-grid">
          {/* Left side - Department Statistics */}
          <div className="statistics-card">
            <h3 className="card-title">THỐNG KÊ {activeTab.toUpperCase()} PHÒNG BAN</h3>
            
            <div className="departments-list">
              {departmentStats.map((dept, index) => {
                const progress = calculateProgress(dept);
                return (
                  <div key={index} className="department-item">
                    <h4 className="department-name">{dept.department_name || `Phòng ${index + 1}`}</h4>
                    
                    <div className="progress-row">
                      <span className="progress-label">Tiến độ</span>
                      <div className="progress-bar">
                        <div className="progress-segment gray" style={{ width: `${progress.p0}%` }}></div>
                        <div className="progress-segment red" style={{ width: `${progress.p1_40}%` }}></div>
                        <div className="progress-segment orange" style={{ width: `${progress.p41_70}%` }}></div>
                        <div className="progress-segment green" style={{ width: `${progress.p70}%` }}></div>
                      </div>
                    </div>

                    <div className="progress-row">
                      <span className="progress-label">Tự tin</span>
                      <div className="progress-bar">
                        <div className="progress-segment gray" style={{ width: `${progress.p0}%` }}></div>
                        <div className="progress-segment red" style={{ width: `${progress.p1_40}%` }}></div>
                        <div className="progress-segment orange" style={{ width: `${progress.p41_70}%` }}></div>
                        <div className="progress-segment green" style={{ width: `${progress.p70}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="legend">
              <div className="legend-item">
                <span className="legend-dot gray"></span>
                <span>{activeTab} tiến độ 0%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot red"></span>
                <span>{activeTab} tiến độ 1-40%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot orange"></span>
                <span>{activeTab} tiến độ 41-70%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot green"></span>
                <span>{activeTab} tiến độ trên 70%</span>
              </div>
            </div>
          </div>

          {/* Right side - Individual Statistics */}
          <div className="statistics-card">
            <h3 className="card-title">THỐNG KÊ {activeTab.toUpperCase()} THEO CÁ NHÂN</h3>
            
            {renderDonutChart()}

            <div className="legend">
              <div className="legend-item">
                <span className="legend-dot gray"></span>
                <span>{activeTab} tiến độ 0%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot red"></span>
                <span>{activeTab} tiến độ 1-40%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot orange"></span>
                <span>{activeTab} tiến độ 41-70%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot green"></span>
                <span>{activeTab} tiến độ trên 70%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-footer">
          VNOKRs - Công cụ OKRs phù hợp với Doanh nghiệp Việt Nam
        </div>
      </div>
    </div>
  );
}
