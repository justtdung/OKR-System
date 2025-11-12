import React, { useState, useEffect } from 'react';
import './Store.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Store() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [setPointsBreakdown] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGifts();
    fetchUserPoints();
  }, []);

  const fetchGifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/store`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGifts(data);
      } else {
        setError('Không thể tải danh sách quà');
      }
    } catch (err) {
      console.error('Error fetching gifts:', err);
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/store/user-points`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.total_points || 0);
        setPointsBreakdown(data);
      }
    } catch (err) {
      console.error('Error fetching user points:', err);
    }
  };

  const handleRedeem = async (giftId, giftPoints, giftName) => {
    if (userPoints < giftPoints) {
      alert('Bạn không đủ điểm để đổi quà này!');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn đổi "${giftName}" với ${giftPoints} điểm?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/store/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gift_id: giftId })
      });

      if (response.ok) {
        alert('Đổi quà thành công!');
        fetchUserPoints(); // Refresh points
      } else {
        const data = await response.json();
        alert(data.message || 'Đổi quà thất bại!');
      }
    } catch (err) {
      console.error('Error redeeming gift:', err);
      alert('Lỗi kết nối server');
    }
  };

  if (loading) {
    return (
      <div className="store-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="store-container">
      <div className="store-header">
        <h1>🎁 Cửa hàng quà tặng</h1>
        <div className="user-points-section">
          <div className="user-points">
            <span className="points-label">Tổng điểm:</span>
            <span className="points-value">{userPoints}</span>
            <span className="points-icon">⭐</span>
          </div>
        </div>
      </div>

      {gifts.length === 0 ? (
        <div className="no-gifts">
          <p>Hiện chưa có quà nào trong cửa hàng</p>
        </div>
      ) : (
        <div className="gifts-grid">
          {gifts.map(gift => (
            <div key={gift.store_id} className="gift-card">
              <div className="gift-icon">🎁</div>
              <h3 className="gift-name">{gift.gift_name}</h3>
              <p className="gift-description">{gift.gift_description}</p>
              <div className="gift-footer">
                <div className="gift-points">
                  <span className="points-icon">⭐</span>
                  <span className="points-text">{gift.gift_points} điểm</span>
                </div>
                <button
                  className={`redeem-btn ${userPoints < gift.gift_points ? 'disabled' : ''}`}
                  onClick={() => handleRedeem(gift.store_id, gift.gift_points, gift.gift_name)}
                  disabled={userPoints < gift.gift_points}
                >
                  {userPoints >= gift.gift_points ? 'Đổi quà' : 'Không đủ điểm'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
