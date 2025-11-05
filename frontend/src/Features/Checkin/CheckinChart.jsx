import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './CheckinChart.css';

const CheckinChart = ({ history, okrObjective }) => {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Sort by date ascending
    const sorted = [...history].sort((a, b) => 
      new Date(a.checkin_date) - new Date(b.checkin_date)
    );
    
    return sorted.map(item => ({
      date: new Date(item.checkin_date).toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      progress: item.progress_percent,
      fullDate: new Date(item.checkin_date).toLocaleDateString('vi-VN'),
      confidence: item.confidence_text,
      user: item.user_name
    }));
  }, [history]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-date">{data.fullDate}</p>
          <p className="tooltip-progress">Tiến độ: <strong>{data.progress}%</strong></p>
          <p className="tooltip-confidence">Tự tin: <strong>{data.confidence}</strong></p>
          <p className="tooltip-user">Bởi: {data.user}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-empty">
        Chưa có dữ liệu để hiển thị biểu đồ
      </div>
    );
  }

  return (
    <div className="checkin-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Biểu đồ tiến độ</h3>
        <p className="chart-subtitle">{okrObjective}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: '%', position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '13px', fontWeight: '600' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="progress" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            activeDot={{ r: 7 }}
            name="Tiến độ (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CheckinChart;
