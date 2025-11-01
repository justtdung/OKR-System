import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Descriptions, Progress, Tag, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;

const CheckinReview = ({ visible, onClose, checkinId, okrId, mode = 'create' }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkinData, setCheckinData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (visible && checkinId) {
      fetchCheckinData();
      if (mode === 'view') {
        fetchReviewData();
      }
    }
  }, [visible, checkinId, mode]);

  const fetchCheckinData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/checkins/${checkinId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCheckinData(response.data);
    } catch (error) {
      console.error('Error fetching checkin data:', error);
      message.error('Không thể tải thông tin check-in');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchReviewData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/checkin-reviews/checkin/${checkinId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewData(response.data);
      if (response.data) {
        form.setFieldsValue({
          personal_comment: response.data.personal_comment,
          team_comment: response.data.team_comment,
          summary_comment: response.data.summary_comment,
        });
      }
    } catch (error) {
      console.error('Error fetching review data:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/checkin-reviews',
        {
          checkin_id: checkinId,
          okr_id: okrId,
          personal_comment: values.personal_comment,
          team_comment: values.team_comment,
          summary_comment: values.summary_comment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Đã lưu nhận xét thành công');
      form.resetFields();
      onClose(true);
    } catch (error) {
      console.error('Error saving review:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể lưu nhận xét');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose(false);
  };

  const getConfidenceColor = (level) => {
    if (level === 1) return '#ff4d4f';
    if (level === 3) return '#52c41a';
    return '#faad14';
  };

  const getConfidenceText = (level) => {
    if (level === 1) return 'Không ổn lắm';
    if (level === 3) return 'Rất tốt';
    return 'Ổn';
  };

  const renderViewMode = () => {
    if (!reviewData) {
      return (
        <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
          <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>Chưa có nhận xét từ cấp trên</p>
        </div>
      );
    }

    return (
      <div>
        <Divider orientation="left">
          <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
          Nhận xét của cấp trên
        </Divider>
        
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Người đánh giá">
            {reviewData.reviewer_name}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày đánh giá">
            {new Date(reviewData.created_at).toLocaleString('vi-VN')}
          </Descriptions.Item>
          <Descriptions.Item label="Nhận xét cá nhân">
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 4,
              whiteSpace: 'pre-wrap'
            }}>
              {reviewData.personal_comment || 'Không có nhận xét'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Nhận xét team">
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 4,
              whiteSpace: 'pre-wrap'
            }}>
              {reviewData.team_comment || 'Không có nhận xét'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng kết">
            <div style={{ 
              padding: 12, 
              backgroundColor: '#fff3e0', 
              borderRadius: 4,
              whiteSpace: 'pre-wrap',
              fontWeight: 500
            }}>
              {reviewData.summary_comment || 'Không có nhận xét'}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  const renderCreateMode = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        name="personal_comment"
        label="Nhận xét cá nhân"
        rules={[
          { required: true, message: 'Vui lòng nhập nhận xét cá nhân' },
          { min: 10, message: 'Nhận xét phải có ít nhất 10 ký tự' }
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Đánh giá về tiến độ, chất lượng công việc của cá nhân..."
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="team_comment"
        label="Nhận xét team"
        rules={[
          { required: true, message: 'Vui lòng nhập nhận xét team' },
          { min: 10, message: 'Nhận xét phải có ít nhất 10 ký tự' }
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Đánh giá về sự phối hợp, hiệu quả làm việc của team..."
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="summary_comment"
        label="Tổng kết"
        rules={[
          { required: true, message: 'Vui lòng nhập tổng kết' },
          { min: 10, message: 'Tổng kết phải có ít nhất 10 ký tự' }
        ]}
      >
        <TextArea
          rows={5}
          placeholder="Đánh giá tổng quan, định hướng cho giai đoạn tiếp theo..."
          maxLength={1000}
          showCount
        />
      </Form.Item>
    </Form>
  );

  return (
    <Modal
      title={
        mode === 'create' ? (
          <span>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            Xác nhận Check-in
          </span>
        ) : (
          <span>
            <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Kết quả Check-in
          </span>
        )
      }
      open={visible}
      onCancel={handleCancel}
      footer={
        mode === 'create' ? [
          <Button key="cancel" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading} 
            onClick={handleSubmit}
          >
            Lưu
          </Button>,
        ] : [
          <Button key="close" type="primary" onClick={handleCancel}>
            Đóng
          </Button>
        ]
      }
      width={750}
    >
      {loadingData ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          Đang tải dữ liệu...
        </div>
      ) : (
        <div>
          {checkinData && (
            <>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Mục tiêu" span={2}>
                  {checkinData.okr_objective}
                </Descriptions.Item>
                <Descriptions.Item label="Người check-in">
                  {checkinData.user_name}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày check-in">
                  {new Date(checkinData.checkin_date).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Tiến độ">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Progress
                      type="circle"
                      percent={checkinData.progress_percent}
                      width={60}
                      strokeColor={
                        checkinData.progress_percent >= 80 ? '#52c41a' :
                        checkinData.progress_percent >= 50 ? '#faad14' : '#ff4d4f'
                      }
                    />
                    <Tag color="blue">
                      {checkinData.progress_value || 0} / {checkinData.progress_percent}%
                    </Tag>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Mức độ tự tin">
                  <Tag color={getConfidenceColor(checkinData.confidence_level)}>
                    {getConfidenceText(checkinData.confidence_level)}
                  </Tag>
                </Descriptions.Item>
                {checkinData.work_summary && (
                  <Descriptions.Item label="Tóm tắt công việc" span={2}>
                    {checkinData.work_summary}
                  </Descriptions.Item>
                )}
                {checkinData.slow_tasks && (
                  <Descriptions.Item label="Công việc chậm tiến độ" span={2}>
                    {checkinData.slow_tasks}
                  </Descriptions.Item>
                )}
                {checkinData.obstacles && (
                  <Descriptions.Item label="Vướng mắc" span={2}>
                    {checkinData.obstacles}
                  </Descriptions.Item>
                )}
                {checkinData.solutions && (
                  <Descriptions.Item label="Giải pháp" span={2}>
                    {checkinData.solutions}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider />
            </>
          )}

          {mode === 'create' ? renderCreateMode() : renderViewMode()}
        </div>
      )}
    </Modal>
  );
};

export default CheckinReview;
