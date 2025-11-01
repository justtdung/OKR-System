import React, { useState } from "react";
import Logo from "../../Assets/logo.png";
import Background from "../../Assets/background.png";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==============================
  // Xử lý đăng nhập (GỌI API BACKEND)
  // ==============================
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          remember,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        alert("✅ Đăng nhập thành công!");

        // Lưu token nếu muốn duy trì đăng nhập
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Nếu có callback onLogin thì gọi
        if (typeof onLogin === "function") {
          onLogin(data.user); // This will trigger redirect to /dashboard in App.js
        } else {
          // hoặc chuyển sang dashboard
          window.location.href = "/dashboard";
        }
      } else {
        alert(data.message || "❌ Sai tên đăng nhập hoặc mật khẩu");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      setLoading(false);
      alert("🚫 Không kết nối được server!");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Overlay mờ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          zIndex: 1,
        }}
      ></div>

      {/* Form */}
      <div
        style={{
          width: 720,
          maxWidth: "90%",
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: 12,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          padding: "28px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        <img src={Logo} alt="Logo" style={{ width: 160, marginBottom: 10 }} />

        <form onSubmit={onSubmit} style={{ width: "100%" }}>
          {/* Username */}
          <div style={{ marginBottom: 12 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #d0d7e0",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              type="password"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #d0d7e0",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {/* Remember + Forgot */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
              fontSize: 13,
              color: "#333",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ mật khẩu
            </label>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              style={{
                color: "#0b4d97",
                textDecoration: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Quên mật khẩu?
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#0b4d97",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
