import React, { useState, useEffect } from 'react';
import './CFRs.css';

const CFRs = () => {
  const [activeTab, setActiveTab] = useState('conversation');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  
  // Form states
  const [conversationForm, setConversationForm] = useState({
    manager_id: '',
    participant_id: '',
    topic: '',
    content: '',
    action: '',
    trust_score: 5
  });

  const [feedbackForm, setFeedbackForm] = useState({
    sender_id: '',
    receiver_id: '',
    type: 'Khen ngợi',
    content: '',
    evidence_file: null,
    level_impact: 'Cao'
  });

  const [recognitionForm, setRecognitionForm] = useState({
    sender_id: '',
    receiver_id: '',
    reason: '',
    evidence_file: null,
    bonus_points: 0
  });

  const [conversations, setConversations] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [recognitions, setRecognitions] = useState([]);

  // Get current user on mount
  useEffect(() => {
    fetchCurrentUser();
    fetchAllUsers();
    fetchConversations();
    fetchFeedbacks();
    fetchRecognitions();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        // Set sender_id to current user
        setFeedbackForm(prev => ({ ...prev, sender_id: data.user.user_id }));
        setRecognitionForm(prev => ({ ...prev, sender_id: data.user.user_id }));
        setConversationForm(prev => ({ ...prev, manager_id: data.user.user_id }));
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...');
      const response = await fetch('http://localhost:5000/api/conversations');
      console.log('Conversations response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Conversations data:', data);
        setConversations(data);
      } else {
        const error = await response.json();
        console.error('Failed to fetch conversations:', error);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      console.log('Fetching feedbacks...');
      const response = await fetch('http://localhost:5000/api/feedback');
      console.log('Feedbacks response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Feedbacks data:', data);
        setFeedbacks(data);
      } else {
        const error = await response.json();
        console.error('Failed to fetch feedbacks:', error);
      }
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  const fetchRecognitions = async () => {
    try {
      console.log('Fetching recognitions...');
      const response = await fetch('http://localhost:5000/api/recognitions');
      console.log('Recognitions response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Recognitions data:', data);
        setRecognitions(data);
      } else {
        const error = await response.json();
        console.error('Failed to fetch recognitions:', error);
      }
    } catch (error) {
      console.error('Failed to fetch recognitions:', error);
    }
  };

  const handleConversationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(conversationForm)
      });

      if (response.ok) {
        alert('Conversation created successfully!');
        setConversationForm({
          manager_id: currentUser?.user_id || '',
          participant_id: '',
          topic: '',
          content: '',
          action: '',
          trust_score: 5
        });
        fetchConversations();
      } else {
        const error = await response.json();
        alert('Failed to create conversation: ' + error.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('sender_id', feedbackForm.sender_id);
      formData.append('receiver_id', feedbackForm.receiver_id);
      formData.append('type', feedbackForm.type);
      formData.append('content', feedbackForm.content);
      formData.append('level_impact', feedbackForm.level_impact);
      if (feedbackForm.evidence_file) {
        formData.append('evidence_file', feedbackForm.evidence_file);
      }

      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // Không set Content-Type, để browser tự động set với boundary
        },
        body: formData
      });

      if (response.ok) {
        alert('Feedback sent successfully!');
        setFeedbackForm({
          sender_id: currentUser?.user_id || '',
          receiver_id: '',
          type: 'Khen ngợi',
          content: '',
          evidence_file: null,
          level_impact: 'Cao'
        });
        // Reset file input
        const fileInput = document.querySelector('input[name="feedback_evidence"]');
        if (fileInput) fileInput.value = '';
        fetchFeedbacks();
      } else {
        const error = await response.json();
        alert('Failed to send feedback: ' + error.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecognitionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('sender_id', recognitionForm.sender_id);
      formData.append('receiver_id', recognitionForm.receiver_id);
      formData.append('reason', recognitionForm.reason);
      formData.append('bonus_points', recognitionForm.bonus_points);
      if (recognitionForm.evidence_file) {
        formData.append('evidence_file', recognitionForm.evidence_file);
      }

      const response = await fetch('http://localhost:5000/api/recognitions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Recognition given successfully!');
        setRecognitionForm({
          sender_id: currentUser?.user_id || '',
          receiver_id: '',
          reason: '',
          evidence_file: null,
          bonus_points: 0
        });
        // Reset file input
        const fileInput = document.querySelector('input[name="recognition_evidence"]');
        if (fileInput) fileInput.value = '';
        fetchRecognitions();
      } else {
        const error = await response.json();
        alert('Failed to give recognition: ' + error.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getBadgeClass = (type) => {
    const typeMap = {
      'Khen ngợi': 'praise',
      'Cải thiện': 'improve',
      'Cao': 'high',
      'Trung bình': 'medium',
      'Thấp': 'low'
    };
    return typeMap[type] || type.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="cfr-container">
      <div className="cfr-tabs">
        <button
          className={`cfr-tab ${activeTab === 'conversation' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          Conversation
        </button>
        <button
          className={`cfr-tab ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </button>
        <button
          className={`cfr-tab ${activeTab === 'recognition' ? 'active' : ''}`}
          onClick={() => setActiveTab('recognition')}
        >
          Recognition
        </button>
      </div>

      <div className="cfr-content">
        {activeTab === 'conversation' && (
          <>
            <div className="cfr-form-section">
              <h2>Cuộc trò chuyện mới</h2>
              <form className="cfr-form" onSubmit={handleConversationSubmit}>
                <div className="form-group">
                  <label>Người quản lý</label>
                  <select
                    value={conversationForm.manager_id}
                    onChange={(e) => setConversationForm({...conversationForm, manager_id: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn người quản lý --</option>
                    {allUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.fullname} ({user.role || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Người tham gia</label>
                  <select
                    value={conversationForm.participant_id}
                    onChange={(e) => setConversationForm({...conversationForm, participant_id: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn người tham gia --</option>
                    {allUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.fullname} ({user.role || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Chủ đề</label>
                  <input
                    type="text"
                    value={conversationForm.topic}
                    onChange={(e) => setConversationForm({...conversationForm, topic: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nội dung</label>
                  <textarea
                    value={conversationForm.content}
                    onChange={(e) => setConversationForm({...conversationForm, content: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Kế hoạch hành động</label>
                  <textarea
                    value={conversationForm.action}
                    onChange={(e) => setConversationForm({...conversationForm, action: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Mức độ hài lòng (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={conversationForm.trust_score}
                    onChange={(e) => setConversationForm({...conversationForm, trust_score: Number(e.target.value)})}
                  />
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Tạo cuộc trò chuyện'}
                </button>
              </form>
            </div>

            <div className="cfr-list-section">
              <h2>Cuộc trò chuyện gần đây</h2>
              {conversations.length === 0 ? (
                <div className="empty-state">Chưa có cuộc trò chuyện nào</div>
              ) : 
                conversations.map((conv) => (
                  <div key={conv.conversation_id} className="cfr-card">
                    <div className="card-header">
                      <div className="user-info">
                        <div className="avatar-group">
                          {conv.manager_avatar_url && (
                            <img src={conv.manager_avatar_url} alt={conv.manager_name} className="user-avatar" />
                          )}
                          {conv.participant_avatar_url && (
                            <img src={conv.participant_avatar_url} alt={conv.participant_name} className="user-avatar user-avatar-second" />
                          )}
                        </div>
                        <div>
                          <strong>{conv.manager_name}</strong>
                          <span className="text-muted"> → {conv.participant_name}</span>
                        </div>
                      </div>
                      <div className="card-meta-right">
                        <span className="badge badge-trust">Độ hài lòng: {conv.trust_score}/10</span>
                        <span className="badge badge-week">Tuần {conv.conversation_week}</span>
                        <span className="date-text">{formatDate(conv.conversation_date)}</span>
                      </div>
                    </div>
                    <h3>{conv.topic}</h3>
                    <p>{conv.content}</p>
                    {conv.action && (
                      <div className="action-items">
                        <strong>Action Items:</strong> {conv.action}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </>
        )}

        {activeTab === 'feedback' && (
          <>
            <div className="cfr-form-section">
              <h2>Gửi đánh giá, phản hồi</h2>
              <form className="cfr-form" onSubmit={handleFeedbackSubmit}>
                <div className="form-group">
                  <label>Người gửi</label>
                  <select
                    value={feedbackForm.sender_id}
                    onChange={(e) => setFeedbackForm({...feedbackForm, sender_id: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn người gửi --</option>
                    {allUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.fullname} ({user.role || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Người nhận</label>
                  <select
                    value={feedbackForm.receiver_id}
                    onChange={(e) => setFeedbackForm({...feedbackForm, receiver_id: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn người nhận --</option>
                    {allUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.fullname} ({user.role || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Loại đánh giá</label>
                  <select
                    value={feedbackForm.type}
                    onChange={(e) => setFeedbackForm({...feedbackForm, type: e.target.value})}
                  >
                    <option value="Khen ngợi">Khen ngợi</option>
                    <option value="Cải thiện">Cải thiện</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nội dung</label>
                  <textarea
                    value={feedbackForm.content}
                    onChange={(e) => setFeedbackForm({...feedbackForm, content: e.target.value})}
                    placeholder="Nội dung feedback..."
                  />
                </div>
                <div className="form-group">
                  <label>Minh chứng (Tệp đính kèm)</label>
                  <input
                    type="file"
                    name="feedback_evidence"
                    onChange={(e) => setFeedbackForm({...feedbackForm, evidence_file: e.target.files[0]})}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  {feedbackForm.evidence_file && (
                    <span className="file-name">{feedbackForm.evidence_file.name}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Mức độ tác động</label>
                  <select
                    value={feedbackForm.level_impact}
                    onChange={(e) => setFeedbackForm({...feedbackForm, level_impact: e.target.value})}
                  >
                    <option value="Cao">Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Gửi đánh giá'}
                </button>
              </form>
            </div>

            <div className="cfr-list-section">
              <h2>Đánh giá gần đây</h2>
              {feedbacks.length === 0 ? (
                <div className="empty-state">Chưa có đánh giá nào</div>
              ) : (
                feedbacks.map((fb) => (
                  <div key={fb.feedback_id} className="cfr-card">
                    <div className="card-header">
                      <div className="user-info">
                        <div className="avatar-group">
                          {fb.sender_avatar_url && (
                            <img src={fb.sender_avatar_url} alt={fb.sender_name} className="user-avatar" />
                          )}
                          {fb.receiver_avatar_url && (
                            <img src={fb.receiver_avatar_url} alt={fb.receiver_name} className="user-avatar user-avatar-second" />
                          )}
                        </div>
                        <div>
                          <strong>{fb.sender_name}</strong>
                          <span className="text-muted"> → {fb.receiver_name}</span>
                        </div>
                      </div>
                      <div className="card-meta-right">
                        <span className={`badge badge-${getBadgeClass(fb.type)}`}>{fb.type}</span>
                        <span className={`badge badge-${getBadgeClass(fb.level_impact)}`}>{fb.level_impact}</span>
                        <span className="badge badge-week">Tuần {fb.feedback_week}</span>
                        <span className="date-text">{formatDate(fb.feedback_date)}</span>
                      </div>
                    </div>
                    {fb.content && <h3>{fb.content}</h3>}
                    {fb.evidence && (
                      <div className="evidence-file">
                        <a 
                          href={`http://localhost:5000/uploads/${fb.evidence}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          📎 Xem minh chứng
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'recognition' && (
          <>
            <div className="cfr-form-section">
              <h2>Khen thưởng công khai</h2>
              <form className="cfr-form" onSubmit={handleRecognitionSubmit}>
                <div className="form-group">
                  <label>Người gửi</label>
                  <select
                    value={recognitionForm.sender_id}
                    onChange={(e) => setRecognitionForm({...recognitionForm, sender_id: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn người gửi --</option>
                    {allUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.fullname} ({user.role || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Người nhận</label>
                  <select
                    value={recognitionForm.receiver_id}
                    onChange={(e) => setRecognitionForm({...recognitionForm, receiver_id: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn người nhận --</option>
                    {allUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.fullname} ({user.role || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Lý do</label>
                  <input
                    type="text"
                    value={recognitionForm.reason}
                    onChange={(e) => setRecognitionForm({...recognitionForm, reason: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Minh chứng (Tệp đính kèm)</label>
                  <input
                    type="file"
                    name="recognition_evidence"
                    onChange={(e) => setRecognitionForm({...recognitionForm, evidence_file: e.target.files[0]})}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  {recognitionForm.evidence_file && (
                    <span className="file-name">{recognitionForm.evidence_file.name}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Số điểm thưởng</label>
                  <input
                    type="number"
                    min="0"
                    value={recognitionForm.bonus_points}
                    onChange={(e) => setRecognitionForm({...recognitionForm, bonus_points: Number(e.target.value)})}
                  />
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Giving...' : 'Gửi khen thưởng'}
                </button>
              </form>
            </div>

            <div className="cfr-list-section">
              <h2>Khen thưởng gần đây</h2>
              {recognitions.length === 0 ? (
                <div className="empty-state">Chưa có khen thưởng nào</div>
              ) : (
                recognitions.map((rec) => (
                  <div key={rec.recognition_id} className="cfr-card">
                    <div className="card-header">
                      <div className="user-info">
                        <div className="avatar-group">
                          {rec.sender_avatar_url && (
                            <img src={rec.sender_avatar_url} alt={rec.sender_name} className="user-avatar" />
                          )}
                          {rec.receiver_avatar_url && (
                            <img src={rec.receiver_avatar_url} alt={rec.receiver_name} className="user-avatar user-avatar-second" />
                          )}
                        </div>
                        <div>
                          <strong>{rec.sender_name}</strong>
                          <span className="text-muted"> → {rec.receiver_name}</span>
                        </div>
                      </div>
                      <div className="card-meta-right">
                        {rec.bonus_points > 0 && (
                          <span className="badge badge-points">{rec.bonus_points} pts</span>
                        )}
                        <span className="badge badge-week">Tuần {rec.recognition_week}</span>
                        <span className="date-text">{formatDate(rec.recognition_date)}</span>
                      </div>
                    </div>
                    <h3>{rec.reason}</h3>
                    {rec.evidence && (
                      <div className="evidence-file">
                        <a 
                          href={`http://localhost:5000/uploads/${rec.evidence}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          📎 Xem minh chứng
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CFRs;
