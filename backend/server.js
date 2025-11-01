import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
// Chỉ parse JSON cho những request phù hợp (bỏ qua GET hoặc khi client gửi Content-Type nhưng body rỗng)
app.use(bodyParser.json({
  // skip parsing JSON for GET requests to avoid "Unexpected end of JSON input" when empty body sent
  type: (req) => {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (req.method === 'GET') return false;
    return ct.includes('application/json');
  },
  limit: '200kb'
}));

// Bắt lỗi parse JSON và trả JSON rõ ràng (thay vì HTML stack)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    console.error('Bad JSON body:', err.message || err);
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  next(err);
});

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "20041226",
  database: "login_db",
});
db.connect(err => {
  if (err) console.error("❌ MySQL connect error:", err);
  else {
    console.log("✅ MySQL connected");

    // Tạo bảng TodayList nếu chưa tồn tại để tránh lỗi khi insert/select
    const createTodayListTable = `
      CREATE TABLE IF NOT EXISTS TodayList (
        task_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        department_id INT NULL,
        task_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status VARCHAR(100) NULL,
        priority VARCHAR(100) NULL,
        deadline VARCHAR(50) NULL,
        estimate_time VARCHAR(100) NULL,
        attachments TEXT NULL,
        comments TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    db.query(createTodayListTable, (err2) => {
      if (err2) console.error("❌ Create TodayList table error:", err2);
      else console.log("✅ TodayList table ready");
    });
  }
});

// Upload folder
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// helper: normalize various date formats to MySQL DATETIME "YYYY-MM-DD HH:MM:SS"
const normalizeDeadline = (val) => {
  if (!val && val !== 0) return null;
  try {
    if (typeof val === 'number') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
      }
      return null;
    }
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null;
      const d = val;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    }
    if (typeof val === 'string') {
      // attempt parse via Date
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        const d = parsed;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
      }
      // fallback: transform ISO-ish "YYYY-MM-DDTHH:MM:SS(.sss)Z" -> "YYYY-MM-DD HH:MM:SS"
      const cleaned = val.replace('T', ' ').replace('Z', '').split('.')[0];
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleaned)) return cleaned;
      // otherwise return original string (DB may accept if column is VARCHAR)
      return val;
    }
  } catch (e) {
    return null;
  }
  return null;
};

// ----------------- Routes -----------------

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!result.length) return res.status(401).json({ message: "Sai username" });

    const user = result[0];
    if (password !== user.password) return res.status(401).json({ message: "Sai password" });

    const token = jwt.sign({ id: user.user_id, username: user.username }, "secret_key", { expiresIn: "1h" });
    const safeUser = { ...user, avatarUrl: user.avatar ? `http://localhost:${PORT}/uploads/${user.avatar}` : null };
    delete safeUser.password;
    res.json({ token, user: safeUser });
  });
});

// Get current user
app.get("/api/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ message: "No token" });

  try {
    const payload = jwt.verify(parts[1], "secret_key");
    db.query("SELECT *, avatar FROM users WHERE user_id = ?", [payload.id], (err, result) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!result.length) return res.status(404).json({ message: "User not found" });

      const user = result[0];
      user.superior_id = user.superior || null;
      user.phone = user.phone_number;
      user.avatarUrl = user.avatar ? `http://localhost:${PORT}/uploads/${user.avatar}` : null;
      if (user.year_birth && user.month_birth && user.date_birth) {
        user.birth_date = `${user.year_birth}-${user.month_birth.toString().padStart(2,"0")}-${user.date_birth.toString().padStart(2,"0")}`;
      }
      res.json({ user });
    });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
});

// Update current user profile
app.put("/api/me/update", upload.single("avatar"), (req, res) => {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const payload = jwt.verify(parts[1], "secret_key");
    const userId = payload.id;
    
    console.log("=== UPDATE PROFILE DEBUG ===");
    console.log("User ID:", userId);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const updateData = {};
    
    // Chỉ update các field được gửi lên
    if (req.body.fullname) updateData.fullname = req.body.fullname;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone_number) updateData.phone_number = req.body.phone_number;
    if (req.body.gender) updateData.gender = req.body.gender;
    if (req.body.date_birth) updateData.date_birth = parseInt(req.body.date_birth);
    if (req.body.month_birth) updateData.month_birth = parseInt(req.body.month_birth);
    if (req.body.year_birth) updateData.year_birth = parseInt(req.body.year_birth);
    if (req.body.role) updateData.role = req.body.role;
    if (req.body.superior) updateData.superior = parseInt(req.body.superior) || null;
    if (req.body.department_id) updateData.department_id = parseInt(req.body.department_id);
    
    // Nếu có upload avatar mới
    if (req.file) {
      updateData.avatar = req.file.filename;
    }

    console.log("Update data:", updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Update database
    db.query("UPDATE users SET ? WHERE user_id = ?", [updateData, userId], (err, result) => {
      if (err) {
        console.error("❌ Update profile error:", err);
        return res.status(500).json({ message: "Update failed: " + err.message });
      }

      console.log("Update result:", result);

      // Lấy thông tin user sau khi update
      db.query(`
        SELECT u.*, d.department_name 
        FROM users u 
        LEFT JOIN departments d ON u.department_id = d.department_id 
        WHERE u.user_id = ?
      `, [userId], (err2, rows) => {
        if (err2) {
          console.error("❌ Fetch updated user error:", err2);
          return res.status(500).json({ message: "Fetch failed: " + err2.message });
        }

        if (!rows.length) {
          return res.status(404).json({ message: "User not found after update" });
        }

        const user = rows[0];
        user.avatarUrl = user.avatar ? `http://localhost:${PORT}/uploads/${user.avatar}` : null;
        delete user.password; // Không trả về password

        console.log("✅ Profile updated successfully");
        res.json({ 
          message: "Cập nhật thành công",
          user: user
        });
      });
    });

  } catch (err) {
    console.error("❌ Token verification error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
});

// Get departments
app.get("/api/departments", (req, res) => {
  db.query("SELECT department_id, department_name FROM departments ORDER BY department_name", (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

// Get all users (for superior selection)
app.get("/api/users", (req, res) => {
  db.query("SELECT user_id, fullname, role, department_id FROM users ORDER BY fullname", (err, result) => {
    if (err) {
      console.error("❌ Get users error:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
    res.json(result);
  });
});

// API lấy thông tin user bao gồm superior - PHẢI ĐẶT SAU /api/users
app.get("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  
  console.log("=== GET USER BY ID ===");
  console.log("Requested user_id:", userId);
  
  if (!userId || isNaN(userId)) {
    console.log("❌ Invalid user ID");
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const sql = `
    SELECT 
      u.user_id,
      u.username,
      u.fullname,
      u.email,
      u.phone_number,
      u.role,
      u.gender,
      u.date_birth,
      u.month_birth,
      u.year_birth,
      u.avatar,
      u.department_id,
      u.superior,
      s.user_id AS superior_user_id,
      s.fullname AS superior_name,
      s.role AS superior_role,
      d.department_name
    FROM users u
    LEFT JOIN users s ON u.superior = s.user_id
    LEFT JOIN departments d ON u.department_id = d.department_id
    WHERE u.user_id = ?
    LIMIT 1
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("❌ Get user error:", err);
      return res.status(500).json({ message: "Failed to fetch user: " + err.message });
    }

    console.log("Query result:", result);

    if (!result || result.length === 0) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];
    
    // Build response object
    const response = {
      user_id: user.user_id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      gender: user.gender,
      date_birth: user.date_birth,
      month_birth: user.month_birth,
      year_birth: user.year_birth,
      department_id: user.department_id,
      department_name: user.department_name,
      superior: user.superior,
      superior_user_id: user.superior_user_id || null,
      superior_name: user.superior_name || null,
      superior_role: user.superior_role || null,
      avatar: user.avatar,
      avatarUrl: user.avatar ? `http://localhost:${PORT}/uploads/${user.avatar}` : null
    };

    console.log("✅ User found:", response);
    res.json(response);
  });
});

// Create or update user
app.post("/api/users", (req, res) => {
  const { fullname, username, day, month, year, gender, phone, email, superior, department, role } = req.body;
  if (!fullname || !username || !phone || !email) return res.status(400).json({ message: "Missing required fields" });

  const birth = { date_birth: day ? parseInt(day) : null, month_birth: month ? parseInt(month) : null, year_birth: year ? parseInt(year) : null };
  const depId = department ? parseInt(department) : null;
  const supId = superior ? parseInt(superior) : null;

  db.query("SELECT user_id FROM users WHERE username = ?", [username], (err, existing) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (existing.length) {
      db.query(
        `UPDATE users SET fullname=?, phone_number=?, email=?, gender=?, role=?, department_id=?, superior=?, date_birth=?, month_birth=?, year_birth=? WHERE username=?`,
        [fullname, phone, email, gender, role, depId, supId, birth.date_birth, birth.month_birth, birth.year_birth, username],
        (err) => err ? res.status(500).json({ message: "Update failed" }) : res.json({ message: "Cập nhật thành công" })
      );
    } else {
      db.query(
        `INSERT INTO users (fullname, username, password, date_birth, month_birth, year_birth, gender, phone_number, email, department_id, superior, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullname, username, "123456", birth.date_birth, birth.month_birth, birth.year_birth, gender, phone, email, depId, supId, role],
        (err) => err ? res.status(500).json({ message: "Create user failed" }) : res.json({ message: "Tạo user thành công" })
      );
    }
  });
});

// Upload avatar
app.post("/api/users/avatar", upload.single("avatar"), (req, res) => {
  let { username } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ message: "Missing file" });

  if (!username) {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      try { username = jwt.verify(parts[1], "secret_key").username } catch {}
    }
  }
  if (!username) return res.status(400).json({ message: "Missing username" });

  db.query("UPDATE users SET avatar=? WHERE username=?", [file.filename, username], (err) => {
    if (err) return res.status(500).json({ message: "Avatar update failed" });
    res.json({ avatarUrl: `http://localhost:${PORT}/uploads/${file.filename}`, avatarFilename: file.filename });
  });
});

// Get TodayList (trả về các bản ghi mới nhất)
app.get("/api/todaylist", (req, res) => {
  let currentUserId = null;
  let currentRole = null;

  // Giải mã token (nếu có)
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const payload = jwt.verify(parts[1], "secret_key");
      currentUserId = payload.id;
    } catch (e) {
      console.warn("Invalid token:", e.message);
    }
  }

  // Nếu cần phân quyền:
  // - Admin / Trưởng phòng: xem tất cả
  // - Nhân viên: chỉ thấy task của mình hoặc trong cùng phòng ban
  // (hiện tại tạm cho xem tất cả)
  const sql = `
    SELECT 
      t.*, 
      u.user_id AS creator_user_id, 
      u.fullname AS creator_name, 
      u.avatar AS creator_avatar,
      u.department_id AS creator_department_id, 
      d.department_name AS creator_department_name,
      td.department_id AS task_department_id,
      td.department_name AS task_department_name
    FROM TodayList t
    LEFT JOIN users u ON t.user_id = u.user_id
    LEFT JOIN departments d ON u.department_id = d.department_id
    LEFT JOIN departments td ON t.department_id = td.department_id
    ORDER BY t.created_at DESC
    LIMIT 500
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Get TodayList error:", err);
      return res.status(500).json([]);
    }

    const out = (rows || []).map(r => {
      const avatarUrl = r.creator_avatar
        ? `http://localhost:${PORT}/uploads/${r.creator_avatar}`
        : null;
      return {
        ...r,
        task_department_id: r.task_department_id ?? null,
        task_department_name: r.task_department_name ?? null,
        creator_avatarUrl: avatarUrl,
        creator: {
          user_id: r.creator_user_id || null,
          fullname: r.creator_name || null,
          avatar: r.creator_avatar || null,
          avatarUrl,
          department_id: r.creator_department_id || null,
          department_name: r.creator_department_name || null
        }
      };
    });

    res.json(out);
  });
});

// --- ADDED: endpoint trả về chi tiết 1 task ---
app.get("/api/todaylist/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  const selSql = `
    SELECT t.*,
           u.user_id AS creator_user_id, u.fullname AS creator_name, u.avatar AS creator_avatar,
           u.department_id AS creator_department_id, d.department_name AS creator_department_name,
           td.department_id AS task_department_id, td.department_name AS task_department_name
    FROM TodayList t
    LEFT JOIN users u ON t.user_id = u.user_id
    LEFT JOIN departments d ON u.department_id = d.department_id
    LEFT JOIN departments td ON t.department_id = td.department_id
    WHERE t.task_id = ?
    LIMIT 1
  `;
  db.query(selSql, [id], (err, rows) => {
    if (err) {
      console.error("❌ Get TodayList detail error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
    if (!rows || !rows.length) return res.status(404).json({ message: "Not found" });
    const r = rows[0];
    const avatarUrl = r.creator_avatar ? `http://localhost:${PORT}/uploads/${r.creator_avatar}` : null;
    const out = {
      ...r,
      creator_avatarUrl: avatarUrl,
      creator: {
        user_id: r.creator_user_id || null,
        fullname: r.creator_name || null,
        avatar: r.creator_avatar || null,
        avatarUrl,
        department_id: r.creator_department_id || null,
        department_name: r.creator_department_name || null
      }
    };
    res.json(out);
  });
});

// Create TodayList item
app.post("/api/todaylist", (req, res) => {
  // debug log body để kiểm tra client gửi gì
  console.debug('POST /api/todaylist body:', req.body);

  // Lấy user_id từ token (nếu có)
  let userId = null;
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const payload = jwt.verify(parts[1], "secret_key");
      userId = payload.id;
    } catch (e) {
      // ignore -> userId sẽ là null
    }
  }

  // Hỗ trợ nhiều tên trường từ frontend: tiêu đề có thể là title hoặc task_name;
  // thời gian thực hiện có thể là duration hoặc estimate_time; phòng ban có thể là department hoặc department_id
  const body = req.body || {};
  const title = body.title || body.task_name || body.taskName || '';
  const department = body.department ?? body.department_id ?? body.departmentId ?? null;
  const depId = department ? parseInt(department) : null;
  const priority = body.priority || null;
  const status = body.status || null;
  const description = body.description || body.desc || null;
  // normalize incoming deadline to MySQL DATETIME string (or null)
  const rawDeadline = body.deadline ?? null;
  const deadline = normalizeDeadline(rawDeadline);
  const duration = body.duration || body.estimate_time || body.estimateTime || null;
  const attachments = body.attachments || body.files || null;
  const comments = body.comments || body.Comment || null;
  const attachStr = attachments && attachments.length ? JSON.stringify(attachments) : null;

  db.query(
    `INSERT INTO TodayList (user_id, department_id, task_name, description, status, priority, deadline, estimate_time, attachments, comments, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [userId, depId, title, description, status, priority, deadline || null, duration || null, attachStr, comments || null],
    (err, result) => {
      if (err) {
        console.error("❌ Insert TodayList error:", err);
        // trả về message chi tiết (an toàn cho dev), frontend sẽ hiển thị
        return res.status(500).json({ message: err.message || "Insert failed" });
      }
      const insertId = result.insertId;
      // return the inserted item with creator + department info
      const selSql = `
        SELECT t.*, 
               u.user_id AS creator_user_id, u.fullname AS creator_name, u.avatar AS creator_avatar,
               u.department_id AS creator_department_id, d.department_name AS creator_department_name,
               td.department_id AS task_department_id, td.department_name AS task_department_name
        FROM TodayList t
        LEFT JOIN users u ON t.user_id = u.user_id
        LEFT JOIN departments d ON u.department_id = d.department_id
        LEFT JOIN departments td ON t.department_id = td.department_id
        WHERE t.task_id = ?
      `;
      db.query(selSql, [insertId], (err2, rows) => {
        if (err2) {
          console.error("❌ Select inserted TodayList error:", err2);
          return res.status(500).json({ message: err2.message || "Fetch after insert failed" });
        }
        const row = (rows && rows[0]) || {};
        const avatarUrl = row.creator_avatar ? `http://localhost:${PORT}/uploads/${row.creator_avatar}` : null;
        row.creator_avatarUrl = avatarUrl;
        row.creator = {
          user_id: row.creator_user_id || null,
          fullname: row.creator_name || null,
          avatar: row.creator_avatar || null,
          avatarUrl,
          department_id: row.creator_department_id || null,
          department_name: row.creator_department_name || null
        };
        res.json(row);
      });
    }
  );
});

// Update TodayList item
app.put("/api/todaylist/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  // debug
  console.debug('PUT /api/todaylist body:', req.body);

  const body = req.body || {};
  const title = body.title ?? body.task_name ?? body.taskName;
  const department = body.department ?? body.department_id ?? body.departmentId;
  // don't coerce department yet — we decide based on whether client provided the field
  const priority = Object.prototype.hasOwnProperty.call(body, 'priority') ? body.priority : undefined;
  const status = Object.prototype.hasOwnProperty.call(body, 'status') ? body.status : undefined;
  const description = Object.prototype.hasOwnProperty.call(body, 'description') ? body.description : undefined;
  // normalize incoming deadline if provided
  const rawDeadline = Object.prototype.hasOwnProperty.call(body, 'deadline') ? body.deadline : undefined;
  const deadline = rawDeadline !== undefined ? normalizeDeadline(rawDeadline) : undefined;
  const estimate_time = Object.prototype.hasOwnProperty.call(body, 'estimate_time') ? body.estimate_time
                      : Object.prototype.hasOwnProperty.call(body, 'duration') ? body.duration
                      : undefined;
  const attachments = Object.prototype.hasOwnProperty.call(body, 'attachments') ? body.attachments : undefined;
  const comments = Object.prototype.hasOwnProperty.call(body, 'comments') ? body.comments : undefined;
  const attachStr = (attachments !== undefined && attachments && attachments.length) ? JSON.stringify(attachments) : (attachments === null ? null : undefined);

  // build dynamic SET clauses and params only for provided fields
  const setParts = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(body, 'department') || Object.prototype.hasOwnProperty.call(body, 'department_id') || Object.prototype.hasOwnProperty.call(body, 'departmentId')) {
    // if client provided but empty string -> treat as NULL, otherwise parse int (NaN -> NULL)
    let depVal = department === '' ? null : (department === null ? null : parseInt(department));
    if (isNaN(depVal)) depVal = null;
    setParts.push('department_id = ?');
    params.push(depVal);
  }

  if (title !== undefined) { setParts.push('task_name = ?'); params.push(title); }
  if (description !== undefined) { setParts.push('description = ?'); params.push(description); }
  if (status !== undefined) { setParts.push('status = ?'); params.push(status); }
  if (priority !== undefined) { setParts.push('priority = ?'); params.push(priority); }
  if (deadline !== undefined) { setParts.push('deadline = ?'); params.push(deadline); }
  if (estimate_time !== undefined) { setParts.push('estimate_time = ?'); params.push(estimate_time); }
  if (attachStr !== undefined) { setParts.push('attachments = ?'); params.push(attachStr); }
  if (comments !== undefined) { setParts.push('comments = ?'); params.push(comments); }

  if (setParts.length === 0) return res.status(400).json({ message: "No updatable fields provided" });

  const sql = `UPDATE TodayList SET ${setParts.join(', ')} WHERE task_id = ?`;
  params.push(id);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Update TodayList error:", err);
      return res.status(500).json({ message: err.message || "Update failed" });
    }
    const selSql2 = `
      SELECT t.*,
             u.user_id AS creator_user_id, u.fullname AS creator_name, u.avatar AS creator_avatar,
             u.department_id AS creator_department_id, d.department_name AS creator_department_name,
             td.department_id AS task_department_id, td.department_name AS task_department_name
      FROM TodayList t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.department_id
      LEFT JOIN departments td ON t.department_id = td.department_id
      WHERE t.task_id = ?
    `;
    db.query(selSql2, [id], (err2, rows) => {
      if (err2) {
        console.error("❌ Select updated TodayList error:", err2);
        return res.status(500).json({ message: err2.message || "Fetch after update failed" });
      }
      const row = (rows && rows[0]) || {};
      const avatarUrl = row.creator_avatar ? `http://localhost:${PORT}/uploads/${row.creator_avatar}` : null;
      row.creator_avatarUrl = avatarUrl;
      row.creator = {
        user_id: row.creator_user_id || null,
        fullname: row.creator_name || null,
        avatar: row.creator_avatar || null,
        avatarUrl,
        department_id: row.creator_department_id || null,
        department_name: row.creator_department_name || null
      };
      res.json(row);
    });
  });
});

// API tạo OKR
app.post("/api/okrs", (req, res) => {
  const {
    type,
    cycle,
    o_relevant,
    objective,
    key_results,
    target,
    unit,
    link_plans,
    link_results,
    kr_relevant,
    o_cross,
    display,
    department_id,
  } = req.body;

  console.log("=== DEBUG OKR API ===");
  console.log("Full request body:", JSON.stringify(req.body, null, 2));

  // Lấy user_id từ token
  let userId = null;
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const payload = jwt.verify(parts[1], "secret_key");
      userId = payload.id;
      console.log("✅ User ID from token:", userId);
    } catch (e) {
      console.warn("❌ Invalid token:", e.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  } else {
    console.warn("❌ No authorization header found");
    return res.status(401).json({ message: "Cần đăng nhập để tạo OKR" });
  }

  // Kiểm tra dữ liệu đầu vào
  if (!type || typeof type !== 'string' || type.trim() === '') {
    return res.status(400).json({ message: "Missing or invalid type field" });
  }
  if (!objective || typeof objective !== 'string' || objective.trim() === '') {
    return res.status(400).json({ message: "Missing or invalid objective field" });
  }
  if (!Array.isArray(key_results) || key_results.length === 0) {
    return res.status(400).json({ message: "key_results must be a non-empty array" });
  }

  try {
    // Chỉ lấy description từ key_results và nối thành chuỗi
    const keyResultsDescriptions = key_results
      .map(kr => kr.description || '')
      .filter(desc => desc.trim() !== '')
      .join('; ');
    
    // Lấy dữ liệu từ key result đầu tiên và xử lý an toàn
    const firstKeyResult = key_results[0] || {};
    
    // Xử lý tất cả các giá trị, đảm bảo không có undefined và xử lý string rỗng
    const safeString = (value) => {
      if (value === null || value === undefined || value === '') return null;
      return String(value).trim() || null;
    };

    const safeNumber = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = parseInt(value);
      return isNaN(num) ? null : num;
    };

    const targetValue = safeString(firstKeyResult.target);
    const unitValue = safeString(firstKeyResult.unit);
    const linkPlansValue = safeString(firstKeyResult.planLink);
    const linkResultsValue = safeString(firstKeyResult.resultLink);
    const krRelevantValue = safeString(firstKeyResult.relatedOKRs);
    const displayValue = safeNumber(display) || 1;
    
    // Xử lý o_cross an toàn
    let oCrossValue = null;
    if (Array.isArray(o_cross) && o_cross.length > 0) {
      try {
        oCrossValue = JSON.stringify(o_cross);
      } catch (e) {
        console.error("Error stringifying o_cross:", e);
        oCrossValue = null;
      }
    }

    // Xử lý các trường khác
    const typeValue = safeString(type);
    const cycleValue = safeString(cycle);
    const oRelevantValue = safeString(o_relevant);

    console.log("Processed values:");
    console.log("userId:", userId);
    console.log("typeValue:", typeValue);
    console.log("cycleValue:", cycleValue);
    console.log("oRelevantValue:", oRelevantValue);
    console.log("keyResultsDescriptions:", keyResultsDescriptions);
    console.log("department_id:", department_id);

    // Chèn dữ liệu vào bảng `okrs`
    const sql = `
      INSERT INTO okrs (
        type, cycle, o_relevant, objective, key_results, target, unit, 
        link_plans, link_results, kr_relevant, o_cross, display, department_id, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      typeValue,
      cycleValue,
      oRelevantValue,
      objective.trim(),
      keyResultsDescriptions,
      targetValue,
      unitValue,
      linkPlansValue,
      linkResultsValue,
      krRelevantValue,
      oCrossValue,
      displayValue,
      department_id || null,
      userId, // Đảm bảo user_id được lưu
    ];

    console.log("Final SQL:", sql);
    console.log("Final params:", params.map((p, i) => `${i}: ${typeof p} = ${JSON.stringify(p)}`));

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("❌ Insert OKR error:", err);
        console.error("SQL that failed:", sql);
        console.error("Params that failed:", params);
        return res.status(500).json({ message: "Failed to create OKR: " + err.message });
      }
      console.log("✅ OKR created successfully with ID:", result.insertId, "by user:", userId);
      res.json({ 
        message: "OKR created successfully", 
        okr_id: result.insertId,
        created_by: userId 
      });
    });
  } catch (error) {
    console.error("❌ Error processing OKR data:", error);
    return res.status(500).json({ message: "Error processing data: " + error.message });
  }
});

// API lấy danh sách OKRs (với thông tin check-in mới nhất)
app.get("/api/okrs", (req, res) => {
  const sql = `
    SELECT 
      o.*,
      u.user_id AS creator_user_id,
      u.fullname AS creator_name,
      u.avatar AS creator_avatar,
      d.department_name AS department_name,
      cl.progress_percent AS latest_progress,
      cl.confidence_level AS latest_confidence,
      cl.checkin_date AS latest_checkin_date,
      cl.status AS latest_status,
      cl.checkin_id AS latest_checkin_id,
      prev.progress_percent AS previous_progress,
      checkin_count.total_checkins,
      cr.summary_comment AS latest_summary_comment
    FROM okrs o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN departments d ON o.department_id = d.department_id
    LEFT JOIN (
      SELECT 
        okr_id, 
        checkin_id,
        progress_percent, 
        confidence_level, 
        checkin_date,
        status,
        ROW_NUMBER() OVER (PARTITION BY okr_id ORDER BY checkin_date DESC, created_at DESC) as rn
      FROM checkin_form
    ) cl ON o.okr_id = cl.okr_id AND cl.rn = 1
    LEFT JOIN (
      SELECT 
        okr_id, 
        progress_percent,
        ROW_NUMBER() OVER (PARTITION BY okr_id ORDER BY checkin_date DESC, created_at DESC) as rn
      FROM checkin_form
    ) prev ON o.okr_id = prev.okr_id AND prev.rn = 2
    LEFT JOIN (
      SELECT 
        okr_id,
        COUNT(*) as total_checkins
      FROM checkin_form
      GROUP BY okr_id
    ) checkin_count ON o.okr_id = checkin_count.okr_id
    LEFT JOIN checkin_review cr ON cl.checkin_id = cr.checkin_id
    ORDER BY o.okr_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Get OKRs error:", err);
      return res.status(500).json({ message: "Failed to fetch OKRs" });
    }

    const okrs = result.map(okr => {
      // Parse key_results để đếm số lượng
      let keyResultsCount = 0;
      try {
        if (okr.key_results) {
          if (typeof okr.key_results === 'string') {
            keyResultsCount = okr.key_results.split(';').filter(kr => kr.trim() !== '').length;
          } else if (Array.isArray(okr.key_results)) {
            keyResultsCount = okr.key_results.length;
          }
        }
      } catch (e) {
        keyResultsCount = 0;
      }

      // Map confidence_level sang text
      let confidenceText = 'Rất tốt';
      if (okr.latest_confidence === 1) confidenceText = 'Không ổn lắm';
      else if (okr.latest_confidence === 2) confidenceText = 'Ổn';

      // Lấy progress từ checkin_form nếu có, không thì mặc định 0
      const progress = okr.latest_progress !== null ? okr.latest_progress : (okr.progress || 0);

      // Tính thay đổi tiến độ
      let change = null;
      if (okr.latest_progress !== null) {
        if (okr.previous_progress !== null) {
          // Có check-in trước đó, tính % thay đổi
          const diff = okr.latest_progress - okr.previous_progress;
          change = diff >= 0 ? `+${diff}%` : `${diff}%`;
        } else {
          // Check-in lần đầu, thay đổi = tiến độ hiện tại
          change = `+${okr.latest_progress}%`;
        }
      }

      // Xác định status: ưu tiên từ checkin_form, nếu không có thì mặc định not_checked
      const status = okr.latest_status || 'not_checked';

      // Tổng kết: lấy summary_comment từ checkin_review, nếu không có = 0
      const summary = okr.latest_summary_comment || 0;

      return {
        id: okr.okr_id,
        objective: okr.objective,
        type: okr.type,
        cycle: okr.cycle,
        o_relevant: okr.o_relevant || null, // Đảm bảo trả về o_relevant
        keyResultsCount: keyResultsCount,
        progress: progress,
        change: change,
        summary: summary,
        creator: {
          user_id: okr.creator_user_id,
          fullname: okr.creator_name,
          avatar: okr.creator_avatar,
          avatarUrl: okr.creator_avatar 
            ? `http://localhost:${PORT}/uploads/${okr.creator_avatar}` 
            : null
        },
        department_name: okr.department_name,
        display: okr.display,
        status: status,
        confidence: okr.confidence || confidenceText,
        latest_checkin_date: okr.latest_checkin_date,
        created_at: okr.created_at || new Date().toISOString()
      };
    });

    console.log("=== RETURNING OKRS ===");
    console.log("Total:", okrs.length);
    okrs.forEach(o => {
      console.log(`  ${o.id}: ${o.objective} | o_relevant: ${o.o_relevant}`);
    });

    res.json(okrs);
  });
});

// API lấy danh sách OKR Nhóm từ superior - PHẢI ĐẶT TRƯỚC /api/okrs/:id
app.get("/api/okrs/parent-okrs", (req, res) => {
  console.log("=== DEBUG PARENT OKRs API ===");
  
  // Lấy user_id từ token
  let userId = null;
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const payload = jwt.verify(parts[1], "secret_key");
      userId = payload.id;
      console.log("✅ User ID from token:", userId);
    } catch (e) {
      console.warn("❌ Invalid token:", e.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  } else {
    console.warn("❌ No authorization header found");
    return res.status(401).json({ message: "Cần đăng nhập" });
  }

  // Lấy thông tin superior của user hiện tại
  const userQuery = `
    SELECT superior 
    FROM users 
    WHERE user_id = ?
  `;
  
  db.query(userQuery, [userId], (err, userRows) => {
    if (err) {
      console.error("❌ Get user superior error:", err);
      return res.status(500).json({ message: "Database error: " + err.message });
    }

    if (!userRows || userRows.length === 0 || !userRows[0].superior) {
      console.log("User has no superior or not found");
      return res.json([]);
    }

    const superiorId = userRows[0].superior;
    console.log("Superior ID:", superiorId);

    // Lấy danh sách OKR Nhóm của superior
    const okrsQuery = `
      SELECT 
        o.okr_id,
        o.objective,
        o.cycle,
        u.fullname as creator_name
      FROM okrs o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.user_id = ? 
        AND o.type = 'Nhóm'
        AND o.display = 1
      ORDER BY o.okr_id DESC
    `;
    
    db.query(okrsQuery, [superiorId], (okrsErr, okrs) => {
      if (okrsErr) {
        console.error("❌ Get parent OKRs error:", okrsErr);
        return res.status(500).json({ message: "Failed to fetch parent OKRs: " + okrsErr.message });
      }

      console.log("✅ Found", okrs.length, "parent OKRs");
      res.json(okrs);
    });
  });
});

// API lấy chi tiết một OKR - ĐẶT SAU parent-okrs
app.get("/api/okrs/:id", (req, res) => {
  const okrId = parseInt(req.params.id);
  if (!okrId) {
    return res.status(400).json({ message: "Invalid OKR ID" });
  }

  const sql = `
    SELECT 
      o.*,
      u.user_id AS creator_user_id,
      u.fullname AS creator_name,
      u.avatar AS creator_avatar,
      d.department_name AS department_name
    FROM okrs o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN departments d ON o.department_id = d.department_id
    WHERE o.okr_id = ?
    LIMIT 1
  `;

  db.query(sql, [okrId], (err, result) => {
    if (err) {
      console.error("❌ Get OKR detail error:", err);
      return res.status(500).json({ message: "Failed to fetch OKR detail" });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "OKR not found" });
    }

    const okr = result[0];
    
    // Parse key_results để đếm số lượng
    let keyResultsCount = 0;
    try {
      if (okr.key_results) {
        if (typeof okr.key_results === 'string') {
          keyResultsCount = okr.key_results.split(';').filter(kr => kr.trim() !== '').length;
        } else if (Array.isArray(okr.key_results)) {
          keyResultsCount = okr.key_results.length;
        }
      }
    } catch (e) {
      keyResultsCount = 0;
    }

    const response = {
      id: okr.okr_id,
      objective: okr.objective,
      type: okr.type,
      cycle: okr.cycle,
      key_results: okr.key_results,
      keyResultsCount: keyResultsCount,
      progress: 0, // Mặc định 0% cho OKR mới tạo
      creator: {
        user_id: okr.creator_user_id,
        fullname: okr.creator_name,
        avatar: okr.creator_avatar,
        avatarUrl: okr.creator_avatar 
          ? `http://localhost:${PORT}/uploads/${okr.creator_avatar}` 
          : null
      },
      department_name: okr.department_name,
      display: okr.display,
      department_id: okr.department_id, // Thêm department_id
      o_relevant: okr.o_relevant,
      target: okr.target,
      unit: okr.unit,
      link_plans: okr.link_plans,
      link_results: okr.link_results,
      kr_relevant: okr.kr_relevant,
      o_cross: okr.o_cross,
      created_at: okr.created_at || new Date().toISOString()
    };
    res.json(response);
  });
});

// API cập nhật OKR
app.put("/api/okrs/:id", (req, res) => {
  const okrId = parseInt(req.params.id);
  if (!okrId) {
    return res.status(400).json({ message: "Invalid OKR ID" });
  }

  console.log("=== DEBUG UPDATE OKR API ===");
  console.log("OKR ID:", okrId);
  console.log("Full request body:", JSON.stringify(req.body, null, 2));

  // Lấy user_id từ token
  let userId = null;
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const payload = jwt.verify(parts[1], "secret_key");
      userId = payload.id;
      console.log("✅ User ID from token:", userId);
    } catch (e) {
      console.warn("❌ Invalid token:", e.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  } else {
    console.warn("❌ No authorization header found");
    return res.status(401).json({ message: "Cần đăng nhập để cập nhật OKR" });
  }

  // Kiểm tra quyền sở hữu OKR
  db.query("SELECT user_id FROM okrs WHERE okr_id = ?", [okrId], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ message: "Database error: " + err.message });
    }

    if (!result.length) {
      return res.status(404).json({ message: "OKR not found" });
    }

    const okrCreatorId = result[0].user_id;
    console.log("OKR Creator ID:", okrCreatorId, "Current User ID:", userId);

    if (okrCreatorId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa OKR này" });
    }

    // Tiến hành cập nhật
    const {
      type,
      cycle,
      o_relevant,
      objective,
      key_results,
      display,
      department_id,
    } = req.body;

    // Validation
    if (!type || typeof type !== 'string' || type.trim() === '') {
      return res.status(400).json({ message: "Missing or invalid type field" });
    }
    if (!objective || typeof objective !== 'string' || objective.trim() === '') {
      return res.status(400).json({ message: "Missing or invalid objective field" });
    }
    if (!Array.isArray(key_results) || key_results.length === 0) {
      return res.status(400).json({ message: "key_results must be a non-empty array" });
    }

    try {
      // Xử lý key_results
      const keyResultsDescriptions = key_results
        .map(kr => kr.description || '')
        .filter(desc => desc.trim() !== '')
        .join('; ');

      // Lấy dữ liệu từ key result đầu tiên
      const firstKeyResult = key_results[0] || {};

      // Safe string processing
      const safeString = (value) => {
        if (value === null || value === undefined || value === '') return null;
        return String(value).trim() || null;
      };

      const safeNumber = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = parseInt(value);
        return isNaN(num) ? null : num;
      };

      const typeValue = safeString(type);
      const cycleValue = safeString(cycle);
      const oRelevantValue = safeString(o_relevant);
      const displayValue = safeNumber(display) || 1;
      
      // Lấy target, unit, link từ key result đầu tiên
      const targetValue = safeString(firstKeyResult.target);
      const unitValue = safeString(firstKeyResult.unit);
      const linkPlansValue = safeString(firstKeyResult.planLink);
      const linkResultsValue = safeString(firstKeyResult.resultLink);
      const krRelevantValue = safeString(firstKeyResult.relatedOKRs);

      console.log("Processed update values:");
      console.log("typeValue:", typeValue);
      console.log("cycleValue:", cycleValue);
      console.log("oRelevantValue:", oRelevantValue);
      console.log("keyResultsDescriptions:", keyResultsDescriptions);
      console.log("department_id:", department_id);

      const updateSql = `
        UPDATE okrs SET 
        type = ?, 
        cycle = ?, 
        o_relevant = ?, 
        objective = ?, 
        key_results = ?, 
        target = ?,
        unit = ?,
        link_plans = ?,
        link_results = ?,
        kr_relevant = ?,
        display = ?, 
        department_id = ?
        WHERE okr_id = ?
      `;

      const updateParams = [
        typeValue,
        cycleValue,
        oRelevantValue,
        objective.trim(),
        keyResultsDescriptions,
        targetValue,
        unitValue,
        linkPlansValue,
        linkResultsValue,
        krRelevantValue,
        displayValue,
        department_id || null,
        okrId
      ];

      console.log("Final UPDATE SQL:", updateSql);
      console.log("Final UPDATE params:", updateParams.map((p, i) => `${i}: ${typeof p} = ${JSON.stringify(p)}`));

      db.query(updateSql, updateParams, (updateErr, updateResult) => {
        if (updateErr) {
          console.error("❌ Update OKR error:", updateErr);
          console.error("SQL that failed:", updateSql);
          console.error("Params that failed:", updateParams);
          return res.status(500).json({ message: "Failed to update OKR: " + updateErr.message });
        }

        console.log("✅ OKR updated successfully ID:", okrId, "by user:", userId);
        console.log("Update result:", updateResult);
        
        res.json({ 
          message: "OKR updated successfully", 
          okr_id: okrId,
          updated_by: userId,
          affected_rows: updateResult.affectedRows
        });
      });
    } catch (error) {
      console.error("❌ Error processing OKR update:", error);
      return res.status(500).json({ message: "Error processing data: " + error.message });
    }
  });
});

// API tạo check-in log
app.post("/api/checkins", (req, res) => {
  console.log("=== DEBUG CHECKIN API ===");
  console.log("Full request body:", JSON.stringify(req.body, null, 2));

  // Lấy user_id từ token (nếu có)
  let userId = null;
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const payload = jwt.verify(parts[1], "secret_key");
      userId = payload.id;
      console.log("✅ User ID from token:", userId);
    } catch (e) {
      console.warn("❌ Invalid token:", e.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  } else {
    console.warn("❌ No authorization header found");
    return res.status(401).json({ message: "Cần đăng nhập để check-in" });
  }

  const {
    okr_id,
    checkinDate,
    achieved,
    total,
    progress,
    confidence,
    status,
    issues,
    obstacles,
    nextSteps,
    isDraft
  } = req.body;

  // Validation
  if (!okr_id) {
    return res.status(400).json({ message: "Missing okr_id" });
  }

  try {
    // Map confidence text sang số
    let confidenceLevel = 2; // mặc định: Ổn
    if (confidence === 'Không ổn lắm') confidenceLevel = 1;
    else if (confidence === 'Rất tốt') confidenceLevel = 3;

    // Parse values
    const progressValue = parseFloat(achieved) || 0;
    const progressPercent = parseFloat(progress) || 0;
    
    // Normalize checkin date to MySQL DATE format 'YYYY-MM-DD'
    let checkinDateValue = new Date().toISOString().split('T')[0];
    if (checkinDate) {
      try {
        const dateObj = new Date(checkinDate);
        if (!isNaN(dateObj.getTime())) {
          const yyyy = dateObj.getFullYear();
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dd = String(dateObj.getDate()).padStart(2, '0');
          checkinDateValue = `${yyyy}-${mm}-${dd}`;
        }
      } catch (e) {
        console.warn("Invalid checkin date, using today:", e);
      }
    }

    // Tạo work_summary từ các thông tin
    const workSummary = `Tiến độ tự tin: ${status}`;

    // Xác định trạng thái check-in: draft, waiting, hoặc checked
    // isDraft = true -> 'draft'
    // isDraft = false -> 'waiting' (chờ phản hồi)
    const checkinStatus = isDraft ? 'draft' : 'waiting';

    console.log("Processed checkin values:");
    console.log("okr_id:", okr_id);
    console.log("user_id:", userId);
    console.log("checkin_date:", checkinDateValue);
    console.log("progress_value:", progressValue);
    console.log("progress_percent:", progressPercent);
    console.log("confidence_level:", confidenceLevel);
    console.log("isDraft:", isDraft);
    console.log("checkinStatus:", checkinStatus);

    // Insert vào database
    const sql = `
      INSERT INTO checkin_form (
        okr_id, 
        user_id, 
        checkin_date, 
        progress_value, 
        progress_percent, 
        confidence_level, 
        status,
        work_summary, 
        slow_tasks, 
                obstacles, 
                solutions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      okr_id,
      userId,
      checkinDateValue,
      progressValue,
      progressPercent,
      confidenceLevel,
      checkinStatus,
      workSummary || null,
      issues || null,
      obstacles || null,
      nextSteps || null
    ];

    console.log("Final SQL:", sql);
    console.log("Final params:", params);

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("❌ Insert checkin log error:", err);
        return res.status(500).json({ message: "Failed to save check-in: " + err.message });
      }

      console.log("✅ Check-in saved successfully with ID:", result.insertId);

      res.json({
        message: isDraft ? "Lưu nháp thành công" : "Check-in thành công",
        checkin_id: result.insertId,
        okr_id: okr_id,
        progress: progressPercent,
        status: checkinStatus
      });
    });

  } catch (error) {
    console.error("❌ Error processing check-in:", error);
    return res.status(500).json({ message: "Error processing check-in: " + error.message });
  }
});

// API lấy lịch sử check-in của một OKR
app.get("/api/checkins/okr/:okr_id", (req, res) => {
  const okrId = parseInt(req.params.okr_id);
  if (!okrId) {
    return res.status(400).json({ message: "Invalid OKR ID" });
  }

  const sql = `
    SELECT 
      c.*,
      u.fullname AS user_name,
      u.avatar AS user_avatar,
      o.objective AS okr_objective
    FROM checkin_form c
    LEFT JOIN users u ON c.user_id = u.user_id
    LEFT JOIN okrs o ON c.okr_id = o.okr_id
    WHERE c.okr_id = ?
    ORDER BY c.checkin_date DESC, c.created_at DESC
  `;

  db.query(sql, [okrId], (err, result) => {
    if (err) {
      console.error("❌ Get checkin form error:", err);
      return res.status(500).json({ message: "Failed to fetch check-in forms" });
    }

    const logs = result.map(log => ({
      ...log,
      user_avatar_url: log.user_avatar ? `http://localhost:${PORT}/uploads/${log.user_avatar}` : null,
      confidence_text: log.confidence_level === 1 ? 'Không ổn lắm' : 
                       log.confidence_level === 3 ? 'Rất tốt' : 'Ổn'
    }));

    res.json(logs);
  });
});

// API lấy chi tiết 1 check-in form
app.get("/api/checkins/:id", (req, res) => {
  const checkinId = parseInt(req.params.id);
  if (!checkinId) {
    return res.status(400).json({ message: "Invalid checkin ID" });
  }

  const sql = `
    SELECT 
      c.*,
      u.fullname AS user_name,
      u.avatar AS user_avatar,
      o.objective AS okr_objective
    FROM checkin_form c
    LEFT JOIN users u ON c.user_id = u.user_id
    LEFT JOIN okrs o ON c.okr_id = o.okr_id
    WHERE c.checkin_id = ?
    LIMIT 1
  `;

  db.query(sql, [checkinId], (err, result) => {
    if (err) {
      console.error("❌ Get checkin detail error:", err);
      return res.status(500).json({ message: "Failed to fetch check-in detail" });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Check-in not found" });
    }

    const checkin = result[0];
    checkin.user_avatar_url = checkin.user_avatar 
      ? `http://localhost:${PORT}/uploads/${checkin.user_avatar}` 
      : null;
    checkin.confidence_text = checkin.confidence_level === 1 ? 'Không ổn lắm' : 
                              checkin.confidence_level === 3 ? 'Rất tốt' : 'Ổn';

    res.json(checkin);
  });
});

// API tạo review cho check-in
app.post("/api/checkin-reviews", (req, res) => {
  console.log("=== DEBUG CHECKIN REVIEW API ===");
  console.log("Full request body:", JSON.stringify(req.body, null, 2));

  // Lấy user_id từ token
  let userId = null;
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const payload = jwt.verify(parts[1], "secret_key");
      userId = payload.id;
      console.log("✅ Reviewer User ID from token:", userId);
    } catch (e) {
      console.warn("❌ Invalid token:", e.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  } else {
    console.warn("❌ No authorization header found");
    return res.status(401).json({ message: "Cần đăng nhập để đánh giá" });
  }

  const {
    checkin_id,
    okr_id,
    personal_comment,
    team_comment,
    summary_comment
  } = req.body;

  // Validation
  if (!checkin_id) {
    return res.status(400).json({ message: "Missing checkin_id" });
  }
  if (!okr_id) {
    return res.status(400).json({ message: "Missing okr_id" });
  }
  if (!personal_comment || !team_comment || !summary_comment) {
    return res.status(400).json({ message: "Missing required comments" });
  }

  try {
    // Kiểm tra xem đã có review chưa
    db.query(
      "SELECT review_id FROM checkin_review WHERE checkin_id = ?",
      [checkin_id],
      (err, existing) => {
        if (err) {
          console.error("❌ Check existing review error:", err);
          return res.status(500).json({ message: "Database error: " + err.message });
        }

        if (existing && existing.length > 0) {
          return res.status(400).json({ message: "Check-in này đã được đánh giá rồi" });
        }

        // Insert review
        const insertSql = `
          INSERT INTO checkin_review (
            checkin_id,
            okr_id,
            user_id,
            personal_comment,
            team_comment,
            summary_comment
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
          checkin_id,
          okr_id,
          userId,
          personal_comment,
          team_comment,
          summary_comment
        ];

        console.log("Final SQL:", insertSql);
        console.log("Final params:", params);

        db.query(insertSql, params, (insertErr, result) => {
          if (insertErr) {
            console.error("❌ Insert review error:", insertErr);
            return res.status(500).json({ message: "Failed to save review: " + insertErr.message });
          }

          // Cập nhật status của checkin_form thành 'checked'
          db.query(
            "UPDATE checkin_form SET status = 'checked' WHERE checkin_id = ?",
            [checkin_id],
            (updateErr) => {
              if (updateErr) {
                console.error("❌ Update checkin status error:", updateErr);
              }

              console.log("✅ Review saved successfully with ID:", result.insertId);
              res.json({
                message: "Đã lưu nhận xét thành công",
                review_id: result.insertId,
                checkin_id: checkin_id
              });
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("❌ Error processing review:", error);
    return res.status(500).json({ message: "Error processing review: " + error.message });
  }
});

// API lấy review của một check-in
app.get("/api/checkin-reviews/checkin/:checkin_id", (req, res) => {
  const checkinId = parseInt(req.params.checkin_id);
  if (!checkinId) {
    return res.status(400).json({ message: "Invalid checkin ID" });
  }

  const sql = `
    SELECT 
      r.*,
      u.fullname AS reviewer_name,
      u.avatar AS reviewer_avatar
    FROM checkin_review r
    LEFT JOIN users u ON r.user_id = u.user_id
    WHERE r.checkin_id = ?
    LIMIT 1
  `;

  db.query(sql, [checkinId], (err, result) => {
    if (err) {
      console.error("❌ Get review error:", err);
      return res.status(500).json({ message: "Failed to fetch review" });
    }

    if (!result || result.length === 0) {
      return res.json(null);
    }

    const review = result[0];
    review.reviewer_avatar_url = review.reviewer_avatar 
      ? `http://localhost:${PORT}/uploads/${review.reviewer_avatar}` 
      : null;

    res.json(review);
  });
});

// API lấy tất cả reviews của một OKR
app.get("/api/checkin-reviews/okr/:okr_id", (req, res) => {
  const okrId = parseInt(req.params.okr_id);
  if (!okrId) {
    return res.status(400).json({ message: "Invalid OKR ID" });
  }

  const sql = `
    SELECT 
      r.*,
      u.fullname AS reviewer_name,
      u.avatar AS reviewer_avatar,
      c.checkin_date,
      c.progress_percent
    FROM checkin_review r
    LEFT JOIN users u ON r.user_id = u.user_id
    LEFT JOIN checkin_form c ON r.checkin_id = c.checkin_id
    WHERE r.okr_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(sql, [okrId], (err, result) => {
    if (err) {
      console.error("❌ Get OKR reviews error:", err);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }

    const reviews = (result || []).map(review => ({
      ...review,
      reviewer_avatar_url: review.reviewer_avatar 
        ? `http://localhost:${PORT}/uploads/${review.reviewer_avatar}` 
        : null
    }));

    res.json(reviews);
  });
});

// Thêm error handler cuối cùng để trả JSON cho mọi lỗi (tránh HTML stack trace)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err));
  if (res.headersSent) {
    return next(err);
  }
  const status = (err && err.status) || 500;
  const message = (err && (err.message || String(err))) || 'Server error';
  res.status(status).json({ message });
});

// Listen
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));