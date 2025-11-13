import React, { useState, useEffect, useCallback } from 'react';
import './Report.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Report() {
  const [activeTab, setActiveTab] = useState('OKRs');
  const [departmentTableData, setDepartmentTableData] = useState([]);
  const [cfrTableData, setCfrTableData] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [individualStats, setIndividualStats] = useState({
    progress_0: 0,
    progress_1_40: 0,
    progress_41_70: 0,
    progress_70_plus: 0
  });
  const [hoveredSegment, setHoveredSegment] = useState(null);
  
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

  const fetchReportData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'OKRs') {
        const url = `${API_URL}/api/okrs/statistics?start_date=${startDate}&end_date=${endDate}`;
        console.log('Fetching OKR statistics from:', url);
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('OKR statistics data received:', data);
          setDepartmentTableData(data.departmentTable || []);
          
          // Sử dụng dữ liệu tiến độ thực tế từ API
          setDepartmentStats(data.departmentProgress || []);
          
          // Tính toán dữ liệu cho donut chart (tổng hợp tất cả phòng ban)
          const allProgress = data.departmentProgress || [];
          const totalProgress = allProgress.reduce((acc, dept) => ({
            progress_0: acc.progress_0 + dept.progress_0,
            progress_1_40: acc.progress_1_40 + dept.progress_1_40,
            progress_41_70: acc.progress_41_70 + dept.progress_41_70,
            progress_70_plus: acc.progress_70_plus + dept.progress_70_plus
          }), {
            progress_0: 0,
            progress_1_40: 0,
            progress_41_70: 0,
            progress_70_plus: 0
          });
          
          console.log('Individual stats calculated:', totalProgress);
          setIndividualStats(totalProgress);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch OKR statistics:', response.status, errorData);
          setDepartmentTableData([]);
          setDepartmentStats([]);
          setIndividualStats({
            progress_0: 0,
            progress_1_40: 0,
            progress_41_70: 0,
            progress_70_plus: 0
          });
        }
      } else if (activeTab === 'CFRs') {
        const url = `${API_URL}/api/cfrs/statistics?start_date=${startDate}&end_date=${endDate}`;
        console.log('Fetching CFR statistics from:', url);
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('CFR statistics data received:', data);
          setCfrTableData(data.cfrTable || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch CFR statistics:', response.status, errorData);
          setCfrTableData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setDepartmentTableData([]);
      setCfrTableData([]);
      setDepartmentStats([]);
      setIndividualStats({
        progress_0: 0,
        progress_1_40: 0,
        progress_41_70: 0,
        progress_70_plus: 0
      });
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

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
    
    if (total === 0) {
      return (
        <div className="no-data-chart">
          <p>Chưa có dữ liệu</p>
        </div>
      );
    }

    // Tính góc cho mỗi phần - chỉ thêm segments có giá trị > 0
    const segments = [
      { value: individualStats.progress_70_plus, color: '#10b981', label: individualStats.progress_70_plus, id: 'green' },
      { value: individualStats.progress_41_70, color: '#f97316', label: individualStats.progress_41_70, id: 'orange' },
      { value: individualStats.progress_1_40, color: '#ef4444', label: individualStats.progress_1_40, id: 'red' },
      { value: individualStats.progress_0, color: '#6b7280', label: individualStats.progress_0, id: 'gray' }
    ].filter(segment => segment.value > 0);

    let currentAngle = -90; // Bắt đầu từ đỉnh (12 giờ) - góc -90 độ
    const labels = [];

    segments.forEach((segment) => {
      const percentage = (segment.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const midAngle = currentAngle + (angle / 2);
      
      // Đặt số liệu bên ngoài vòng tròn
      const innerRadius = 75;
      const outerRadius = 110;
      
      const radians = (midAngle * Math.PI) / 180;
      
      const lineStartX = 100 + innerRadius * Math.cos(radians);
      const lineStartY = 100 + innerRadius * Math.sin(radians);
      
      const lineEndX = 100 + outerRadius * Math.cos(radians);
      const lineEndY = 100 + outerRadius * Math.sin(radians);
      
      const displayPercentage = percentage.toFixed(1);
      
      // Tính góc chuẩn hóa để xác định vị trí label (trái/phải)
      const normalizedAngle = ((midAngle % 360) + 360) % 360;
      
      labels.push({
        lineStartX,
        lineStartY,
        lineEndX,
        lineEndY,
        labelX: lineEndX,
        labelY: lineEndY,
        value: segment.label,
        percentage: displayPercentage,
        color: segment.color,
        id: segment.id,
        midAngle: normalizedAngle
      });
      
      currentAngle += angle;
    });

    return (
      <div className="donut-chart-container">
        <svg viewBox="0 0 240 240" className="donut-chart">
          {/* Donut segments */}
          <g transform="translate(20, 20)">
            <circle cx="100" cy="100" r="60" fill="none" stroke="#e0e0e0" strokeWidth="30"/>
            {renderDonutSegments(total)}
          </g>
          
          {/* Lines and labels - chỉ hiện khi hover */}
          <g transform="translate(20, 20)">
            {labels.map((label, index) => (
              <g 
                key={index}
                className={`donut-segment-group ${hoveredSegment === label.id ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredSegment(label.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                {hoveredSegment === label.id && (
                  <>
                    <line
                      x1={label.lineStartX}
                      y1={label.lineStartY}
                      x2={label.lineEndX}
                      y2={label.lineEndY}
                      stroke={label.color}
                      strokeWidth="2"
                      className="donut-line"
                    />
                    
                    <circle
                      cx={label.lineEndX}
                      cy={label.lineEndY}
                      r="3"
                      fill={label.color}
                      className="donut-line-dot"
                    />
                    
                    <g className="donut-label-group">
                      <rect
                        x={label.labelX + (label.midAngle > 90 && label.midAngle < 270 ? -70 : 5)}
                        y={label.labelY - 18}
                        width="65"
                        height="36"
                        fill="white"
                        stroke={label.color}
                        strokeWidth="2"
                        rx="4"
                        className="label-background"
                      />
                      
                      <text
                        x={label.labelX + (label.midAngle > 90 && label.midAngle < 270 ? -37.5 : 37.5)}
                        y={label.labelY - 4}
                        textAnchor="middle"
                        className="donut-label-percentage"
                        fill={label.color}
                        fontWeight="700"
                        fontSize="14"
                      >
                        {label.percentage}%
                      </text>
                      
                      <text
                        x={label.labelX + (label.midAngle > 90 && label.midAngle < 270 ? -37.5 : 37.5)}
                        y={label.labelY + 10}
                        textAnchor="middle"
                        className="donut-label-value"
                        fill="#374151"
                        fontWeight="600"
                        fontSize="12"
                      >
                        ({label.value})
                      </text>
                    </g>
                  </>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    );
  };

  const renderDonutSegments = (total) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    const segments = [
      { value: individualStats.progress_70_plus, color: '#10b981', id: 'green' },
      { value: individualStats.progress_41_70, color: '#f97316', id: 'orange' },
      { value: individualStats.progress_1_40, color: '#ef4444', id: 'red' },
      { value: individualStats.progress_0, color: '#6b7280', id: 'gray' }
    ].filter(segment => segment.value > 0);

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
          strokeWidth="30"
          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          className="donut-segment"
          style={{
            opacity: hoveredSegment === null || hoveredSegment === segment.id ? 1 : 0.3,
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={() => setHoveredSegment(segment.id)}
          onMouseLeave={() => setHoveredSegment(null)}
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
          <>
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

            {/* Biểu đồ OKRs */}
            <div className="report-grid">
              {/* Left side - Department Statistics */}
              <div className="statistics-card">
                <h3 className="card-title">THỐNG KÊ OKRS PHÒNG BAN</h3>
                
                <div className="departments-list">
                  {departmentStats.length > 0 ? (
                    departmentStats.map((dept, index) => {
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
                    })
                  ) : (
                    <div className="no-data">Chưa có dữ liệu</div>
                  )}
                </div>

                <div className="legend">
                  <div className="legend-item">
                    <span className="legend-dot gray"></span>
                    <span>OKRs tiến độ 0%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot red"></span>
                    <span>OKRs tiến độ 1-40%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot orange"></span>
                    <span>OKRs tiến độ 41-70%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot green"></span>
                    <span>OKRs tiến độ trên 70%</span>
                  </div>
                </div>
              </div>

              {/* Right side - Individual Statistics */}
              <div className="statistics-card">
                <h3 className="card-title">THỐNG KÊ OKRS THEO CÁ NHÂN</h3>
                
                {renderDonutChart()}

                <div className="legend">
                  <div className="legend-item">
                    <span className="legend-dot gray"></span>
                    <span>OKRs tiến độ 0%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot red"></span>
                    <span>OKRs tiến độ 1-40%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot orange"></span>
                    <span>OKRs tiến độ 41-70%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot green"></span>
                    <span>OKRs tiến độ trên 70%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bảng tổng điểm CFRs */}
        {activeTab === 'CFRs' && (
          <div className="report-table-container">
            <table className="report-table cfr-table">
              <thead>
                <tr>
                  <th>Phòng ban</th>
                  <th>Nhân viên</th>
                  <th>Điểm OKR</th>
                  <th>Điểm C</th>
                  <th>Điểm F</th>
                  <th>Điểm R</th>
                  <th>Tổng điểm</th>
                </tr>
              </thead>
              <tbody>
                {cfrTableData.length > 0 ? (
                  cfrTableData.map((row, index) => (
                    <tr key={index}>
                      <td className="department-cell">{row.department_name}</td>
                      <td className="employee-cell">{row.fullname}</td>
                      <td className="points-cell">{row.okr_points}</td>
                      <td className="points-cell">{row.conversation_points}</td>
                      <td className="points-cell">{row.feedback_points}</td>
                      <td className="points-cell">{row.recognition_points}</td>
                      <td className="total-points-cell">{row.total_points}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">Chưa có dữ liệu trong khoảng thời gian này</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
