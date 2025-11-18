import React, { useState, useEffect, useCallback } from 'react';
import './Report.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { Document, Page, Text, View, StyleSheet, Font, pdf, Image } from '@react-pdf/renderer';
import itg from '../../Assets/itg.png';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`,
      fontWeight: 400,
      fontStyle: 'normal'
    },
    {
      src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,
      fontWeight: 700,
      fontStyle: 'normal'
    }
  ]
});

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    marginTop: 0,
    fontSize: 11,
    fontFamily: 'NotoSans', // use registered font
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 100,
    height: 100,
    marginLeft: 20,
  },
  companyLogo: {
    fontSize: 16,
    fontWeight: 700, // use weight, not Helvetica-Bold name
    color: '#005E9C',
    marginBottom: 3,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#005E9C',
    marginBottom: 8,
  },
  companyAddress: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#005E9C',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#000',
    textAlign: 'center',
    fontWeight: 400,
  },
  table: {
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 35,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#000',
    borderLeftWidth: 1,
    borderLeftStyle: 'solid',
    borderLeftColor: '#000',
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#000',
  },
  tableRowLast: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#449fdc',
    fontWeight: 700,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 400,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#000',
  },
  tableCellLeft: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 400,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#000',
  },
  tableCellWide: {
    flex: 2,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 400,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#000',
  },
  tableCellStt: {
    width: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 400,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#000',
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLocation: {
    fontSize: 10,
    marginBottom: 15,
    textAlign: 'right',
    width: '100%',
    paddingRight: 35,
    fontWeight: 400,
  },
  signatureSpacer: {
    height: 14,
    marginBottom: 15,
  },
  signatureTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5,
  },
  signatureSubtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 50,
    fontWeight: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
    fontWeight: 300,
  },
});

// OKRs PDF Document
const OKRsPDFDocument = ({ data, startDate, endDate, title = "BÁO CÁO HIỆU SUẤT OKRs" }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getCurrentDate = () => {
    const now = new Date();
    return `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.companyLogo}>ITG TECHNOLOGY.,JSC</Text>
            <Text style={pdfStyles.companyName}>CÔNG TY CỔ PHẦN CÔNG NGHỆ ITG</Text>
            <Text style={pdfStyles.companyAddress}>
              Tầng 14, Tòa nhà Lilama 10, phố Tố Hữu, phường Đại Mỗ, Hà Nội
            </Text>
          </View>
          <Image src={itg} style={pdfStyles.logo} />
        </View>

        {/* Title */}
        <View style={pdfStyles.titleSection}>
          <Text style={pdfStyles.mainTitle}>{title}</Text>
          <Text style={pdfStyles.subtitle}>
            Từ ngày {formatDate(startDate)} đến hết ngày {formatDate(endDate)}
          </Text>
        </View>

        {/* Table */}
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={pdfStyles.tableCellStt}>STT</Text>
            <Text style={pdfStyles.tableCellWide}>Phòng ban</Text>
            <Text style={pdfStyles.tableCell}>Tổng OKR</Text>
            <Text style={pdfStyles.tableCell}>Chưa check-in</Text>
            <Text style={pdfStyles.tableCell}>Nháp</Text>
            <Text style={pdfStyles.tableCell}>Hoàn thành</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>Tiến độ TB</Text>
          </View>
          
          {data.map((dept, index) => (
            <View key={index} style={[pdfStyles.tableRow, index === data.length - 1 && pdfStyles.tableRowLast]}>
              <Text style={pdfStyles.tableCellStt}>{index + 1}</Text>
              <Text style={pdfStyles.tableCellWide}>{dept.department_name || 'N/A'}</Text>
              <Text style={pdfStyles.tableCell}>{dept.total_okrs || 0}</Text>
              <Text style={pdfStyles.tableCell}>{dept.not_checked_in || 0}</Text>
              <Text style={pdfStyles.tableCell}>{dept.draft || 0}</Text>
              <Text style={pdfStyles.tableCell}>{dept.completed || 0}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>{dept.avg_progress || 0}%</Text>
            </View>
          ))}
        </View>

        {/* Signature Section */}
        <View style={pdfStyles.signatureSection}>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureSpacer} />
            <Text style={pdfStyles.signatureTitle}>Giám đốc</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
          
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureLocation}>{getCurrentDate()}</Text>
            <Text style={pdfStyles.signatureTitle}>Người lập báo cáo</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          Báo cáo được tạo tự động từ Hệ thống quản lý hiệu suất công việc OKR - ITG Technology.,JSC
        </Text>
      </Page>
    </Document>
  );
};

// CFRs PDF Document
const CFRsPDFDocument = ({ data, startDate, endDate }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getCurrentDate = () => {
    const now = new Date();
    return `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.companyLogo}>ITG TECHNOLOGY.,JSC</Text>
            <Text style={pdfStyles.companyName}>CÔNG TY CỔ PHẦN CÔNG NGHỆ ITG</Text>
            <Text style={pdfStyles.companyAddress}>
              Tầng 14, Tòa nhà Lilama 10, phố Tố Hữu, phường Đại Mỗ, Hà Nội
            </Text>
          </View>
          <Image src={itg} style={pdfStyles.logo} />
        </View>

        {/* Title */}
        <View style={pdfStyles.titleSection}>
          <Text style={pdfStyles.mainTitle}>BÁO CÁO HIỆU SUẤT CFRs</Text>
          <Text style={pdfStyles.subtitle}>
            Từ ngày {formatDate(startDate)} đến hết ngày {formatDate(endDate)}
          </Text>
        </View>

        {/* Table */}
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={pdfStyles.tableCellStt}>STT</Text>
            <Text style={pdfStyles.tableCellWide}>Phòng ban</Text>
            <Text style={pdfStyles.tableCellWide}>Nhân viên</Text>
            <Text style={pdfStyles.tableCell}>OKR</Text>
            <Text style={pdfStyles.tableCell}>C</Text>
            <Text style={pdfStyles.tableCell}>F</Text>
            <Text style={pdfStyles.tableCell}>R</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>Tổng</Text>
          </View>
          
          {data.map((row, index) => (
            <View key={index} style={[pdfStyles.tableRow, index === data.length - 1 && pdfStyles.tableRowLast]}>
              <Text style={pdfStyles.tableCellStt}>{index + 1}</Text>
              <Text style={pdfStyles.tableCellWide}>{row.department_name}</Text>
              <Text style={pdfStyles.tableCellWide}>{row.fullname}</Text>
              <Text style={pdfStyles.tableCell}>{row.okr_points}</Text>
              <Text style={pdfStyles.tableCell}>{row.conversation_points}</Text>
              <Text style={pdfStyles.tableCell}>{row.feedback_points}</Text>
              <Text style={pdfStyles.tableCell}>{row.recognition_points}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>{row.total_points}</Text>
            </View>
          ))}
        </View>

        {/* Signature Section */}
        <View style={pdfStyles.signatureSection}>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureSpacer} />
            <Text style={pdfStyles.signatureTitle}>Giám đốc</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
          
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureLocation}>{getCurrentDate()}</Text>
            <Text style={pdfStyles.signatureTitle}>Người lập báo cáo</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          Báo cáo được tạo tự động từ Hệ thống quản lý hiệu suất công việc OKR - ITG Technology.,JSC
        </Text>
      </Page>
    </Document>
  );
};

export default function Report() {
  const [activeTab, setActiveTab] = useState('OKRs');
  const [reportType, setReportType] = useState('quantity');
  const [showDepartmentTable, setShowDepartmentTable] = useState(true);
  const [showIndividualTable, setShowIndividualTable] = useState(false);
  const [departmentTableData, setDepartmentTableData] = useState([]);
  const [individualTableData, setIndividualTableData] = useState([]); // THÊM
  const [cfrTableData, setCfrTableData] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [individualStats, setIndividualStats] = useState({
    progress_0: 0,
    progress_1_40: 0,
    progress_41_70: 0,
    progress_70_plus: 0
  });
  const [individualStatsData, setIndividualStatsData] = useState([]); // THÊM
  
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
          setDepartmentStats(data.departmentProgress || []);
          
          // Tính toán dữ liệu cho donut chart
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

        // Fetch dữ liệu cá nhân
        const individualUrl = `${API_URL}/api/okrs/individual-statistics?start_date=${startDate}&end_date=${endDate}`;
        console.log('Fetching individual OKR statistics from:', individualUrl);
        
        const individualResponse = await fetch(individualUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (individualResponse.ok) {
          const individualData = await individualResponse.json();
          console.log('Individual OKR statistics data received:', individualData);
          setIndividualTableData(individualData.individualTable || []);
          setIndividualStatsData(individualData.individualProgress || []);
        } else {
          console.error('Failed to fetch individual OKR statistics');
          setIndividualTableData([]);
          setIndividualStatsData([]);
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
      setIndividualTableData([]);
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

    const data = {
      labels: [
        `OKRs tiến độ trên 70% (${individualStats.progress_70_plus})`,
        `OKRs tiến độ 41-70% (${individualStats.progress_41_70})`,
        `OKRs tiến độ 1-40% (${individualStats.progress_1_40})`,
        `OKRs tiến độ 0% (${individualStats.progress_0})`
      ],
      datasets: [
        {
          data: [
            individualStats.progress_70_plus,
            individualStats.progress_41_70,
            individualStats.progress_1_40,
            individualStats.progress_0
          ],
          backgroundColor: [
            '#10b981',
            '#f97316',
            '#ef4444',
            '#6b7280'
          ],
          borderColor: [
            '#10b981',
            '#f97316',
            '#ef4444',
            '#6b7280'
          ],
          borderWidth: 2,
          hoverOffset: 15
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'white',
          titleColor: '#1f2937',
          bodyColor: '#6b7280',
          borderColor: '#e5e7eb',
          borderWidth: 2,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              const value = context.parsed || 0;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${percentage}% (${value} OKRs)`;
            }
          }
        }
      },
      cutout: '60%'
    };

    return (
      <div className="donut-chart-container">
        <Doughnut data={data} options={options} />
      </div>
    );
  };

  const renderDepartmentChart = () => {
    if (departmentStats.length === 0) {
      return (
        <div className="no-data-chart">
          <p>Chưa có dữ liệu</p>
        </div>
      );
    }

    const labels = departmentStats.map(dept => dept.department_name || 'N/A');
    
    const data = {
      labels: labels,
      datasets: [
        {
          label: 'OKRs tiến độ 0%',
          data: departmentStats.map(dept => dept.progress_0),
          backgroundColor: '#6b7280',
          borderColor: '#6b7280',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'OKRs tiến độ 1-40%',
          data: departmentStats.map(dept => dept.progress_1_40),
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'OKRs tiến độ 41-70%',
          data: departmentStats.map(dept => dept.progress_41_70),
          backgroundColor: '#f97316',
          borderColor: '#f97316',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'OKRs tiến độ trên 70%',
          data: departmentStats.map(dept => dept.progress_70_plus),
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }
      ]
    };

    const options = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'white',
          titleColor: '#1f2937',
          bodyColor: '#6b7280',
          borderColor: '#e5e7eb',
          borderWidth: 2,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.x || 0;
              const dataIndex = context.dataIndex;
              
              const total = departmentStats[dataIndex].progress_0 + 
                           departmentStats[dataIndex].progress_1_40 + 
                           departmentStats[dataIndex].progress_41_70 + 
                           departmentStats[dataIndex].progress_70_plus;
              
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              
              return `${label}: ${value} OKRs (${percentage}%)`;
            },
            title: function(context) {
              return context[0].label;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          display: false
        },
        y: {
          stacked: true,
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12,
              weight: '600'
            },
            color: '#1f2937'
          }
        }
      }
    };

    return (
      <div className="bar-chart-container">
        <Bar data={data} options={options} />
      </div>
    );
  };

  const exportOKRsToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Hàm tạo header và footer cho sheet
    const addHeaderFooter = (ws, title, startDate, endDate) => {
      // Chèn các dòng header ở đầu
      XLSX.utils.sheet_add_aoa(ws, [
        ['ITG TECHNOLOGY.,JSC'],
        ['CÔNG TY CỔ PHẦN CÔNG NGHỆ ITG'],
        ['Tầng 14, Tòa nhà Lilama 10, phố Tố Hữu, phường Đại Mỗ, Hà Nội'],
        [],
        [title],
        [`Từ ngày ${new Date(startDate).toLocaleDateString('vi-VN')} đến hết ngày ${new Date(endDate).toLocaleDateString('vi-VN')}`],
        []
      ], { origin: 'A1' });

      // Merge cells cho header
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Row 1: Company short name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Row 2: Company full name
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Row 3: Address
        { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // Row 5: Title
        { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } }  // Row 6: Date range
      );

      // Style cho header công ty
      const companyStyle = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: 'left', vertical: 'center' }
      };

      // Style cho tiêu đề báo cáo: căn giữa + in đậm
      const titleStyle = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // Style cho ngày tháng: căn giữa
      const dateStyle = {
        font: { sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // Apply styles
      ws['A1'].s = companyStyle;
      ws['A2'].s = companyStyle;
      ws['A3'].s = { alignment: { horizontal: 'left', vertical: 'center' } };
      ws['A5'].s = titleStyle; // Tiêu đề in đậm + căn giữa
      ws['A6'].s = dateStyle;  // Ngày tháng căn giữa

      return 7; // Vị trí bắt đầu cho header bảng
    };

    // Hàm thêm border cho bảng
    const addTableBorders = (ws, startRow, endRow, numCols) => {
      const borderStyle = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      };

      for (let R = startRow; R <= endRow; R++) {
        for (let C = 0; C < numCols; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          
          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          ws[cellAddress].s.border = borderStyle;
          
          // Header row: thêm background màu xanh
          if (R === startRow) {
            ws[cellAddress].s.fill = { fgColor: { rgb: '449fdc' } };
            ws[cellAddress].s.font = { bold: true, sz: 11 };
            ws[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' };
          }
        }
      }
    };

    // Hàm thêm chữ ký
    const addSignature = (ws, dataRowCount, startRow) => {
      const now = new Date();
      const signatureRow = startRow + dataRowCount + 3;
      const locationText = `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

      XLSX.utils.sheet_add_aoa(ws, [
        [],
        [],
        ['Giám đốc', '', '', '', '', '', locationText],
        ['(Ký và ghi rõ họ tên)', '', '', '', '', '', 'Người lập báo cáo'],
        ['', '', '', '', '', '', '(Ký và ghi rõ họ tên)'],
        [],
        ['Báo cáo được tạo tự động từ Hệ thống quản lý hiệu suất công việc OKR - ITG Technology.,JSC']
      ], { origin: `A${signatureRow}` });

      // Merge footer
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: signatureRow + 5, c: 0 }, e: { r: signatureRow + 5, c: 6 } }
      );

      // Style cho footer
      const footerCell = XLSX.utils.encode_cell({ r: signatureRow + 5, c: 0 });
      if (ws[footerCell]) {
        ws[footerCell].s = {
          alignment: { horizontal: 'center' },
          font: { sz: 9, color: { rgb: '999999' } }
        };
      }

      // Style cho chữ ký bên trái (Giám đốc)
      const directorCell = XLSX.utils.encode_cell({ r: signatureRow + 1, c: 0 });
      if (ws[directorCell]) {
        ws[directorCell].s = {
          font: { bold: true, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Style cho chữ ký bên phải (Người lập báo cáo)
      const reporterCell = XLSX.utils.encode_cell({ r: signatureRow + 1, c: 6 });
      if (ws[reporterCell]) {
        ws[reporterCell].s = {
          font: { sz: 10 },
          alignment: { horizontal: 'right', vertical: 'center' }
        };
      }

      const reporterLabelCell = XLSX.utils.encode_cell({ r: signatureRow + 2, c: 6 });
      if (ws[reporterLabelCell]) {
        ws[reporterLabelCell].s = {
          font: { bold: true, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    };
    
    if (reportType === 'quantity') {
      // Sheet 1: Phòng ban
      if (showDepartmentTable && departmentTableData.length > 0) {
        const ws = XLSX.utils.aoa_to_sheet([]);
        const startRow = addHeaderFooter(
          ws, 
          'BÁO CÁO HIỆU SUẤT OKRs THEO PHÒNG BAN', 
          startDate, 
          endDate
        );

        // Thêm header bảng
        XLSX.utils.sheet_add_aoa(ws, [[
          'STT',
          'Phòng ban',
          'Tổng OKR đã tạo',
          'Tổng OKR chưa check-in',
          'Tổng OKR đã check-in nháp',
          'Tổng OKR đã hoàn thành',
          'Tiến độ trung bình (%)'
        ]], { origin: `A${startRow}` });

        // Thêm dữ liệu
        const data = departmentTableData.map((dept, index) => [
          index + 1,
          dept.department_name || 'N/A',
          dept.total_okrs || 0,
          dept.not_checked_in || 0,
          dept.draft || 0,
          dept.completed || 0,
          dept.avg_progress || 0
        ]);
        XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${startRow + 1}` });

        // Thêm border cho bảng
        addTableBorders(ws, startRow - 1, startRow + data.length, 7);

        // Set column widths
        ws['!cols'] = [
          { wch: 5 }, { wch: 25 }, { wch: 18 }, 
          { wch: 22 }, { wch: 26 }, { wch: 24 }, { wch: 22 }
        ];

        // Thêm chữ ký
        addSignature(ws, data.length + 1, startRow);

        XLSX.utils.book_append_sheet(wb, ws, 'Phòng ban - Số lượng');
      }

      // Sheet 2: Cá nhân
      if (showIndividualTable && individualTableData.length > 0) {
        const ws = XLSX.utils.aoa_to_sheet([]);
        const startRow = addHeaderFooter(
          ws, 
          'BÁO CÁO HIỆU SUẤT OKRs THEO CÁ NHÂN', 
          startDate, 
          endDate
        );

        XLSX.utils.sheet_add_aoa(ws, [[
          'STT',
          'Phòng ban',
          'Nhân viên',
          'Tổng OKR đã tạo',
          'Tổng OKR chưa check-in',
          'Tổng OKR đã check-in nháp',
          'Tổng OKR đã hoàn thành',
          'Tiến độ trung bình (%)'
        ]], { origin: `A${startRow}` });

        const data = individualTableData.map((person, index) => [
          index + 1,
          person.department_name || 'N/A',
          person.fullname || 'N/A',
          person.total_okrs || 0,
          person.not_checked_in || 0,
          person.draft || 0,
          person.completed || 0,
          person.avg_progress || 0
        ]);
        XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${startRow + 1}` });

        // Thêm border
        addTableBorders(ws, startRow - 1, startRow + data.length, 8);

        ws['!cols'] = [
          { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, 
          { wch: 22 }, { wch: 26 }, { wch: 24 }, { wch: 22 }
        ];

        addSignature(ws, data.length + 1, startRow);
        XLSX.utils.book_append_sheet(wb, ws, 'Cá nhân - Số lượng');
      }
    } else {
      // Báo cáo tiến độ - Sheet 1: Phòng ban
      if (showDepartmentTable && departmentStats.length > 0) {
        const ws = XLSX.utils.aoa_to_sheet([]);
        const startRow = addHeaderFooter(
          ws, 
          'BÁO CÁO TIẾN ĐỘ OKRs THEO PHÒNG BAN', 
          startDate, 
          endDate
        );

        XLSX.utils.sheet_add_aoa(ws, [[
          'STT',
          'Phòng ban',
          'OKRs tiến độ 0%',
          'OKRs tiến độ 1-40%',
          'OKRs tiến độ 41-70%',
          'OKRs tiến độ trên 70%',
          'Tiến độ trung bình (%)'
        ]], { origin: `A${startRow}` });

        const data = departmentStats.map((dept, index) => {
          const matchedDept = departmentTableData.find(d => d.department_id === dept.department_id);
          const avgProgress = matchedDept ? matchedDept.avg_progress : 0;
          
          return [
            index + 1,
            dept.department_name || 'N/A',
            dept.progress_0 || 0,
            dept.progress_1_40 || 0,
            dept.progress_41_70 || 0,
            dept.progress_70_plus || 0,
            avgProgress
          ];
        });
        XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${startRow + 1}` });

        // Thêm border
        addTableBorders(ws, startRow - 1, startRow + data.length, 7);

        ws['!cols'] = [
          { wch: 5 }, { wch: 25 }, { wch: 18 }, 
          { wch: 20 }, { wch: 22 }, { wch: 24 }, { wch: 22 }
        ];

        addSignature(ws, data.length + 1, startRow);
        XLSX.utils.book_append_sheet(wb, ws, 'Phòng ban - Tiến độ');
      }

      // Sheet 2: Cá nhân
      if (showIndividualTable && individualStatsData.length > 0) {
        const ws = XLSX.utils.aoa_to_sheet([]);
        const startRow = addHeaderFooter(
          ws, 
          'BÁO CÁO TIẾN ĐỘ OKRs THEO CÁ NHÂN', 
          startDate, 
          endDate
        );

        XLSX.utils.sheet_add_aoa(ws, [[
          'STT',
          'Phòng ban',
          'Nhân viên',
          'OKRs tiến độ 0%',
          'OKRs tiến độ 1-40%',
          'OKRs tiến độ 41-70%',
          'OKRs tiến độ trên 70%',
          'Tiến độ trung bình (%)'
        ]], { origin: `A${startRow}` });

        const data = individualStatsData.map((person, index) => {
          const matchedPerson = individualTableData.find(p => p.user_id === person.user_id);
          const avgProgress = matchedPerson ? matchedPerson.avg_progress : 0;
          
          return [
            index + 1,
            person.department_name || 'N/A',
            person.fullname || 'N/A',
            person.progress_0 || 0,
            person.progress_1_40 || 0,
            person.progress_41_70 || 0,
            person.progress_70_plus || 0,
            avgProgress
          ];
        });
        XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${startRow + 1}` });

        // Thêm border
        addTableBorders(ws, startRow - 1, startRow + data.length, 8);

        ws['!cols'] = [
          { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, 
          { wch: 20 }, { wch: 22 }, { wch: 24 }, { wch: 22 }
        ];

        addSignature(ws, data.length + 1, startRow);
        XLSX.utils.book_append_sheet(wb, ws, 'Cá nhân - Tiến độ');
      }
    }

    // Kiểm tra có sheet nào không
    if (wb.SheetNames.length === 0) {
      alert('Không có dữ liệu để xuất. Vui lòng chọn ít nhất 1 loại thống kê.');
      return;
    }

    const fileName = `Bao_cao_OKRs_${reportType === 'quantity' ? 'so_luong' : 'tien_do'}_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportCFRsToExcel = () => {
    if (cfrTableData.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Header công ty
    XLSX.utils.sheet_add_aoa(ws, [
      ['ITG TECHNOLOGY.,JSC'],
      ['CÔNG TY CỔ PHẦN CÔNG NGHỆ ITG'],
      ['Tầng 14, Tòa nhà Lilama 10, phố Tố Hữu, phường Đại Mỗ, Hà Nội'],
      [],
      ['BÁO CÁO HIỆU SUẤT CFRs'],
      [`Từ ngày ${new Date(startDate).toLocaleDateString('vi-VN')} đến hết ngày ${new Date(endDate).toLocaleDateString('vi-VN')}`],
      []
    ], { origin: 'A1' });

    // Merge cells cho header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 7 } }
    ];

    // Style cho header
    const companyStyle = {
      font: { bold: true, sz: 12 },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
    const titleStyle = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    ws['A1'].s = companyStyle;
    ws['A2'].s = companyStyle;
    ws['A3'].s = { alignment: { horizontal: 'left', vertical: 'center' } };
    ws['A5'].s = titleStyle;
    ws['A6'].s = { font: { sz: 11 }, alignment: { horizontal: 'center', vertical: 'center' } };

    const startRow = 7;

    // Header bảng
    XLSX.utils.sheet_add_aoa(ws, [[
      'STT',
      'Phòng ban',
      'Nhân viên',
      'Điểm OKR',
      'Điểm C',
      'Điểm F',
      'Điểm R',
      'Tổng điểm'
    ]], { origin: `A${startRow}` });

    // Dữ liệu
    const data = cfrTableData.map((row, index) => [
      index + 1,
      row.department_name,
      row.fullname,
      row.okr_points,
      row.conversation_points,
      row.feedback_points,
      row.recognition_points,
      row.total_points
    ]);
    XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${startRow + 1}` });

    // Thêm border
    const borderStyle = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };

    for (let R = startRow - 1; R <= startRow + data.length; R++) {
      for (let C = 0; C < 8; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        ws[cellAddress].s.border = borderStyle;
        
        if (R === startRow - 1) {
          ws[cellAddress].s.fill = { fgColor: { rgb: '449fdc' } };
          ws[cellAddress].s.font = { bold: true, sz: 11 };
          ws[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' };
        }
      }
    }

    // Column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 25 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];

    // Chữ ký
    const signatureRow = startRow + data.length + 3;
    const now = new Date();
    const locationText = `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    XLSX.utils.sheet_add_aoa(ws, [
      [],
      [],
      ['Giám đốc', '', '', '', '', '', '', locationText],
      ['(Ký và ghi rõ họ tên)', '', '', '', '', '', '', 'Người lập báo cáo'],
      ['', '', '', '', '', '', '', '(Ký và ghi rõ họ tên)'],
      [],
      ['Báo cáo được tạo tự động từ Hệ thống quản lý hiệu suất công việc OKR - ITG Technology.,JSC']
    ], { origin: `A${signatureRow}` });

    // Merge footer
    ws['!merges'].push(
      { s: { r: signatureRow + 5, c: 0 }, e: { r: signatureRow + 5, c: 7 } }
    );

    // Style cho chữ ký
    const directorCell = XLSX.utils.encode_cell({ r: signatureRow + 1, c: 0 });
    if (ws[directorCell]) {
      ws[directorCell].s = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    const reporterCell = XLSX.utils.encode_cell({ r: signatureRow + 1, c: 7 });
    if (ws[reporterCell]) {
      ws[reporterCell].s = {
        font: { sz: 10 },
        alignment: { horizontal: 'right', vertical: 'center' }
      };
    }

    const reporterLabelCell = XLSX.utils.encode_cell({ r: signatureRow + 2, c: 7 });
    if (ws[reporterLabelCell]) {
      ws[reporterLabelCell].s = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo CFRs');
    
    const fileName = `Bao_cao_CFRs_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExport = () => {
    if (activeTab === 'OKRs') {
      exportOKRsToExcel();
    } else if (activeTab === 'CFRs') {
      exportCFRsToExcel();
    }
  };

  const handleExportPDF = async () => {
    try {
      let doc;
      if (activeTab === 'OKRs') {
        // Xác định loại PDF cần xuất
        if (showDepartmentTable && !showIndividualTable) {
          // Chỉ xuất Phòng ban
          if (reportType === 'quantity') {
            if (departmentTableData.length === 0) {
              alert('Không có dữ liệu phòng ban để xuất');
              return;
            }
            doc = <OKRsPDFDocument 
              data={departmentTableData} 
              startDate={startDate} 
              endDate={endDate}
              title="BÁO CÁO HIỆU SUẤT OKRs THEO PHÒNG BAN"
            />;
          } else {
            if (departmentStats.length === 0) {
              alert('Không có dữ liệu phòng ban để xuất');
              return;
            }
            const enrichedData = departmentStats.map(dept => {
              const matchedDept = departmentTableData.find(d => d.department_id === dept.department_id);
              return {
                ...dept,
                avg_progress: matchedDept ? matchedDept.avg_progress : 0
              };
            });
            doc = <OKRsProgressPDFDocument 
              data={enrichedData} 
              startDate={startDate} 
              endDate={endDate}
              title="BÁO CÁO TIẾN ĐỘ OKRs THEO PHÒNG BAN"
            />;
          }
        } else if (!showDepartmentTable && showIndividualTable) {
          // Chỉ xuất Cá nhân
          if (reportType === 'quantity') {
            if (individualTableData.length === 0) {
              alert('Không có dữ liệu cá nhân để xuất');
              return;
            }
            doc = <OKRsIndividualPDFDocument 
              data={individualTableData} 
              startDate={startDate} 
              endDate={endDate}
              title="BÁO CÁO HIỆU SUẤT OKRs THEO CÁ NHÂN"
            />;
          } else {
            if (individualStatsData.length === 0) {
              alert('Không có dữ liệu cá nhân để xuất');
              return;
            }
            const enrichedData = individualStatsData.map(person => {
              const matchedPerson = individualTableData.find(p => p.user_id === person.user_id);
              return {
                ...person,
                avg_progress: matchedPerson ? matchedPerson.avg_progress : 0
              };
            });
            doc = <OKRsIndividualProgressPDFDocument 
              data={enrichedData} 
              startDate={startDate} 
              endDate={endDate}
              title="BÁO CÁO TIẾN ĐỘ OKRs THEO CÁ NHÂN"
            />;
          }
        } else if (showDepartmentTable && showIndividualTable) {
          alert('Vui lòng chọn chỉ 1 loại (Phòng ban HOẶC Cá nhân) để xuất PDF');
          return;
        } else {
          alert('Vui lòng chọn ít nhất 1 loại thống kê để xuất PDF');
          return;
        }
      } else {
        // CFRs
        if (cfrTableData.length === 0) {
          alert('Không có dữ liệu để xuất');
          return;
        }
        doc = <CFRsPDFDocument data={cfrTableData} startDate={startDate} endDate={endDate} />;
      }

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getPDFFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Có lỗi khi tạo file PDF');
    }
  };

  const getPDFFileName = () => {
    if (activeTab === 'OKRs') {
      const type = reportType === 'quantity' ? 'so_luong' : 'tien_do';
      const scope = showDepartmentTable && !showIndividualTable ? 'phong_ban' :
                    !showDepartmentTable && showIndividualTable ? 'ca_nhan' : 'tong_hop';
      return `Bao_cao_${type}_${scope}_${startDate}_${endDate}.pdf`;
    }
    return `Bao_cao_CFRs_${startDate}_${endDate}.pdf`;
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

            {activeTab === 'OKRs' && (
              <>
                <label>Loại:</label>
                <select 
                  className="report-type-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="quantity">Thống kê theo số lượng OKR</option>
                  <option value="progress">Thống kê theo tiến độ OKR</option>
                </select>

                <div className="chart-filter-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showDepartmentTable}
                      onChange={(e) => setShowDepartmentTable(e.target.checked)}
                    />
                    Phòng ban
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={showIndividualTable}
                      onChange={(e) => setShowIndividualTable(e.target.checked)}
                    />
                    Cá nhân
                  </label>
                </div>
              </>
            )}
          </div>
          
          <div className="export-buttons-group">
            <button 
              className="export-button"
              onClick={handleExport}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Xuất Excel
            </button>

            {((activeTab === 'OKRs' && departmentTableData.length > 0) || 
              (activeTab === 'CFRs' && cfrTableData.length > 0)) && (
              <button
                className="export-button pdf-button"
                onClick={handleExportPDF}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Xuất PDF
              </button>
            )}
          </div>
        </div>

        {/* Bảng thống kê OKRs */}
        {activeTab === 'OKRs' && (
          <>
            {/* Bảng phòng ban */}
            {showDepartmentTable && reportType === 'quantity' && (
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Phòng ban</th>
                      <th>Tổng OKR đã tạo</th>
                      <th>Tổng OKR chưa check-in</th>
                      <th>Tổng OKR đã check-in nháp</th>
                      <th>Tổng OKR đã hoàn thành</th>
                      <th>Tiến độ trung bình (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentTableData.length > 0 ? (
                      departmentTableData.map((dept, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{dept.department_name || 'N/A'}</td>
                          <td>{dept.total_okrs || 0}</td>
                          <td>{dept.not_checked_in || 0}</td>
                          <td>{dept.draft || 0}</td>
                          <td>{dept.completed || 0}</td>
                          <td>{dept.avg_progress || 0}%</td>
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

            {showDepartmentTable && reportType === 'progress' && (
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Phòng ban</th>
                      <th>OKRs tiến độ 0%</th>
                      <th>OKRs tiến độ 1-40%</th>
                      <th>OKRs tiến độ 41-70%</th>
                      <th>OKRs tiến độ trên 70%</th>
                      <th>Tiến độ trung bình (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.length > 0 ? (
                      departmentStats.map((dept, index) => {
                        const matchedDept = departmentTableData.find(d => d.department_id === dept.department_id);
                        const avgProgress = matchedDept ? matchedDept.avg_progress : 0;
                        
                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{dept.department_name || 'N/A'}</td>
                            <td>{dept.progress_0 || 0}</td>
                            <td>{dept.progress_1_40 || 0}</td>
                            <td>{dept.progress_41_70 || 0}</td>
                            <td>{dept.progress_70_plus || 0}</td>
                            <td>{avgProgress}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-data">Chưa có dữ liệu trong khoảng thời gian này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bảng cá nhân */}
            {showIndividualTable && reportType === 'quantity' && (
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Phòng ban</th>
                      <th>Nhân viên</th>
                      <th>Tổng OKR đã tạo</th>
                      <th>Tổng OKR chưa check-in</th>
                      <th>Tổng OKR đã check-in nháp</th>
                      <th>Tổng OKR đã hoàn thành</th>
                      <th>Tiến độ trung bình (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualTableData.length > 0 ? (
                      individualTableData.map((person, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{person.department_name || 'N/A'}</td>
                          <td>{person.fullname || 'N/A'}</td>
                          <td>{person.total_okrs || 0}</td>
                          <td>{person.not_checked_in || 0}</td>
                          <td>{person.draft || 0}</td>
                          <td>{person.completed || 0}</td>
                          <td>{person.avg_progress || 0}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-data">Chưa có dữ liệu trong khoảng thời gian này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {showIndividualTable && reportType === 'progress' && (
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Phòng ban</th>
                      <th>Nhân viên</th>
                      <th>OKRs tiến độ 0%</th>
                      <th>OKRs tiến độ 1-40%</th>
                      <th>OKRs tiến độ 41-70%</th>
                      <th>OKRs tiến độ trên 70%</th>
                      <th>Tiến độ trung bình (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualStatsData.length > 0 ? (
                      individualStatsData.map((person, index) => {
                        const matchedPerson = individualTableData.find(p => p.user_id === person.user_id);
                        const avgProgress = matchedPerson ? matchedPerson.avg_progress : 0;
                        
                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{person.department_name || 'N/A'}</td>
                            <td>{person.fullname || 'N/A'}</td>
                            <td>{person.progress_0 || 0}</td>
                            <td>{person.progress_1_40 || 0}</td>
                            <td>{person.progress_41_70 || 0}</td>
                            <td>{person.progress_70_plus || 0}</td>
                            <td>{avgProgress}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-data">Chưa có dữ liệu trong khoảng thời gian này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Biểu đồ OKRs - CHỈ HIỆN KHI CÓ CHECKBOX TÍCH */}
            {(showDepartmentTable || showIndividualTable) && (
              <div className={`report-grid ${
                (showDepartmentTable && !showIndividualTable) || (!showDepartmentTable && showIndividualTable) 
                  ? 'single-chart' 
                  : ''
              }`}>
                {/* Department Chart - chỉ hiện khi tick Phòng ban */}
                {showDepartmentTable && (
                  <div className="statistics-card">
                    <h3 className="card-title">THỐNG KÊ OKRS PHÒNG BAN</h3>
                    
                    {renderDepartmentChart()}

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
                )}

                {/* Individual Chart - chỉ hiện khi tick Cá nhân */}
                {showIndividualTable && (
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
                )}
              </div>
            )}
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

// Thêm component PDF mới cho báo cáo tiến độ
const OKRsProgressPDFDocument = ({ data, startDate, endDate, title = "BÁO CÁO TIẾN ĐỘ OKRs" }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getCurrentDate = () => {
    const now = new Date();
    return `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.companyLogo}>ITG TECHNOLOGY.,JSC</Text>
            <Text style={pdfStyles.companyName}>CÔNG TY CỔ PHẦN CÔNG NGHỆ ITG</Text>
            <Text style={pdfStyles.companyAddress}>
              Tầng 14, Tòa nhà Lilama 10, phố Tố Hữu, phường Đại Mỗ, Hà Nội
            </Text>
          </View>
          <Image src={itg} style={pdfStyles.logo} />
        </View>

        {/* Title */}
        <View style={pdfStyles.titleSection}>
          <Text style={pdfStyles.mainTitle}>{title}</Text>
          <Text style={pdfStyles.subtitle}>
            Từ ngày {formatDate(startDate)} đến hết ngày {formatDate(endDate)}
          </Text>
        </View>

        {/* Table */}
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={pdfStyles.tableCellStt}>STT</Text>
            <Text style={pdfStyles.tableCellWide}>Phòng ban</Text>
            <Text style={pdfStyles.tableCell}>0%</Text>
            <Text style={pdfStyles.tableCell}>1-40%</Text>
            <Text style={pdfStyles.tableCell}>41-70%</Text>
            <Text style={pdfStyles.tableCell}>Trên 70%</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>Tiến độ TB</Text>
          </View>
          
          {data.map((dept, index) => {
            // Dùng avg_progress từ dept thay vì tính lại
            const avgProgress = dept.avg_progress || 0;
            
            return (
              <View key={index} style={[pdfStyles.tableRow, index === data.length - 1 && pdfStyles.tableRowLast]}>
                <Text style={pdfStyles.tableCellStt}>{index + 1}</Text>
                <Text style={pdfStyles.tableCellWide}>{dept.department_name || 'N/A'}</Text>
                <Text style={pdfStyles.tableCell}>{dept.progress_0 || 0}</Text>
                <Text style={pdfStyles.tableCell}>{dept.progress_1_40 || 0}</Text>
                <Text style={pdfStyles.tableCell}>{dept.progress_41_70 || 0}</Text>
                <Text style={pdfStyles.tableCell}>{dept.progress_70_plus || 0}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>{avgProgress}%</Text>
              </View>
            );
          })}
        </View>

        {/* Signature Section */}
        <View style={pdfStyles.signatureSection}>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureSpacer} />
            <Text style={pdfStyles.signatureTitle}>Giám đốc</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
          
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureLocation}>{getCurrentDate()}</Text>
            <Text style={pdfStyles.signatureTitle}>Người lập báo cáo</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          Báo cáo được tạo tự động từ Hệ thống quản lý hiệu suất công việc OKR - ITG Technology.,JSC
        </Text>
      </Page>
    </Document>
  );
};

// Thêm component PDF cho Cá nhân - Số lượng
const OKRsIndividualPDFDocument = ({ data, startDate, endDate, title }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getCurrentDate = () => {
    const now = new Date();
    return `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.companyLogo}>ITG TECHNOLOGY.,JSC</Text>
            <Text style={pdfStyles.companyName}>CÔNG TY CỔ PHẦN CÔNG NGHỆ ITG</Text>
            <Text style={pdfStyles.companyAddress}>
              Tầng 14, Tòa nhà Lilama 10, phố Tố Hữu, phường Đại Mỗ, Hà Nội
            </Text>
          </View>
          <Image src={itg} style={pdfStyles.logo} />
        </View>

        <View style={pdfStyles.titleSection}>
          <Text style={pdfStyles.mainTitle}>{title}</Text>
          <Text style={pdfStyles.subtitle}>
            Từ ngày {formatDate(startDate)} đến hết ngày {formatDate(endDate)}
          </Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={pdfStyles.tableCellStt}>STT</Text>
            <Text style={pdfStyles.tableCellWide}>Nhân viên</Text>
            <Text style={pdfStyles.tableCell}>Tổng OKR</Text>
            <Text style={pdfStyles.tableCell}>Chưa check-in</Text>
            <Text style={pdfStyles.tableCell}>Nháp</Text>
            <Text style={pdfStyles.tableCell}>Hoàn thành</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>Tiến độ TB</Text>
          </View>
          
          {data.map((person, index) => (
            <View key={index} style={[pdfStyles.tableRow, index === data.length - 1 && pdfStyles.tableRowLast]}>
              <Text style={pdfStyles.tableCellStt}>{index + 1}</Text>
              <Text style={pdfStyles.tableCellWide}>{person.fullname || 'N/A'}</Text>
              <Text style={pdfStyles.tableCell}>{person.total_okrs || 0}</Text>
              <Text style={pdfStyles.tableCell}>{person.not_checked_in || 0}</Text>
              <Text style={pdfStyles.tableCell}>{person.draft || 0}</Text>
              <Text style={pdfStyles.tableCell}>{person.completed || 0}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>{person.avg_progress || 0}%</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.signatureSection}>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureSpacer} />
            <Text style={pdfStyles.signatureTitle}>Giám đốc</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
          
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureLocation}>{getCurrentDate()}</Text>
            <Text style={pdfStyles.signatureTitle}>Người lập báo cáo</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
        </View>

        <Text style={pdfStyles.footer}>
          Báo cáo được tạo tự động từ Hệ thống quản lý hiệu suất công việc OKR - ITG Technology.,JSC
        </Text>
      </Page>
    </Document>
  );
};

// Thêm component PDF cho Cá nhân - Tiến độ
const OKRsIndividualProgressPDFDocument = ({ data, startDate, endDate, title }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getCurrentDate = () => {
    const now = new Date();
    return `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.companyLogo}>ITG TECHNOLOGY.,JSC</Text>
            <Text style={pdfStyles.companyName}>CÔNG TY CỔ PHẦN CÔNG NGHỆ ITG</Text>
            <Text style={pdfStyles.companyAddress}>
              Tầng 14, Tòa nhà Lilama 10, phố Tố Hữu, phường Đại Mỗ, Hà Nội
            </Text>
          </View>
          <Image src={itg} style={pdfStyles.logo} />
        </View>

        <View style={pdfStyles.titleSection}>
          <Text style={pdfStyles.mainTitle}>{title}</Text>
          <Text style={pdfStyles.subtitle}>
            Từ ngày {formatDate(startDate)} đến hết ngày {formatDate(endDate)}
          </Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={pdfStyles.tableCellStt}>STT</Text>
            <Text style={pdfStyles.tableCellWide}>Nhân viên</Text>
            <Text style={pdfStyles.tableCell}>0%</Text>
            <Text style={pdfStyles.tableCell}>1-40%</Text>
            <Text style={pdfStyles.tableCell}>41-70%</Text>
            <Text style={pdfStyles.tableCell}>Trên 70%</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>Tiến độ TB</Text>
          </View>
          
          {data.map((person, index) => {
            const avgProgress = person.avg_progress || 0;
            
            return (
              <View key={index} style={[pdfStyles.tableRow, index === data.length - 1 && pdfStyles.tableRowLast]}>
                <Text style={pdfStyles.tableCellStt}>{index + 1}</Text>
                <Text style={pdfStyles.tableCellWide}>{person.fullname || 'N/A'}</Text>
                <Text style={pdfStyles.tableCell}>{person.progress_0 || 0}</Text>
                <Text style={pdfStyles.tableCell}>{person.progress_1_40 || 0}</Text>
                <Text style={pdfStyles.tableCell}>{person.progress_41_70 || 0}</Text>
                <Text style={pdfStyles.tableCell}>{person.progress_70_plus || 0}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast]}>{avgProgress}%</Text>
              </View>
            );
          })}
        </View>

        <View style={pdfStyles.signatureSection}>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureSpacer} />
            <Text style={pdfStyles.signatureTitle}>Giám đốc</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
          
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureLocation}>{getCurrentDate()}</Text>
            <Text style={pdfStyles.signatureTitle}>Người lập báo cáo</Text>
            <Text style={pdfStyles.signatureSubtitle}>(Ký và ghi rõ họ tên) </Text>
          </View>
        </View>

        <Text style={pdfStyles.footer}>
          Báo cáo được tạo tự động từ Hệ thống quản lý hiệu suất công việc OKR - ITG Technology.,JSC
        </Text>
      </Page>
    </Document>
  );
};
