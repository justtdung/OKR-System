import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import CONSTANTS, { STATUS_COLORS } from "../../Assets/constants";
import "./TodayListView.css";
import CreateTodayList from "../../Modals/CreateTodayList/CreateTodayList";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const resolveApi = (path) => {
	let base = API_URL;
	if (!base || base === "/") base = "http://localhost:5000";
	base = base.replace(/\/+$/, "");
	try {
		if (typeof window !== "undefined") {
			const origin =
				window.location.origin ||
				`${window.location.protocol}//${window.location.hostname}${
					window.location.port ? ":" + window.location.port : ""
				}`;
			if (base === origin || base.includes("localhost:3000")) {
				console.warn(
					"[TodayList] Detected API base pointing to frontend. Fallback to :5000"
				);
				base = "http://localhost:5000";
			}
		}
	} catch (e) {}
	return base + (path.startsWith("/") ? path : `/${path}`);
};

const TodayListView = () => {
	const [tasks, setTasks] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [selectedDept, setSelectedDept] = useState("");
	// NEW: Thay đổi từ selectedDate sang startDate/endDate
	const [startDate, setStartDate] = useState(() => {
		const today = new Date();
		return today.toISOString().split('T')[0];
	});
	const [endDate, setEndDate] = useState(() => {
		const today = new Date();
		return today.toISOString().split('T')[0];
	});
	const [loading, setLoading] = useState(true);

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editInitial, setEditInitial] = useState(null);

	// state để xử lý hover / focus visual
	const [hoveredTaskId, setHoveredTaskId] = useState(null);

	// Thêm state cho tìm kiếm và lọc độ ưu tiên
	const [searchText, setSearchText] = useState("");
	const [priorityFilter, setPriorityFilter] = useState("all");
	// Thêm state cho lọc theo status từ status cards
	const [statusFilter, setStatusFilter] = useState("all");

	// current user (từ localStorage) để kiểm tra quyền sửa
	const [currentUser, setCurrentUser] = useState(null);
	// modal readonly flag: true = chỉ xem, false = có thể sửa (creator)
	const [modalReadOnly, setModalReadOnly] = useState(false);

	// helper: đọc user từ localStorage (dự kiến backend lưu 'user' JSON)
	useEffect(() => {
		try {
			const raw = localStorage.getItem("user");
			if (raw) {
				const u = JSON.parse(raw);
				setCurrentUser(u);
			}
		} catch (e) {
			// ignore
		}
	}, []);

	// --- NEW: disable page scrollbar while this view is mounted, keep task-list scrollable ---
	useEffect(() => {
		const CLASS = "todaylist-disable-body-scroll";
		const STYLE_ID = "todaylist-disable-body-scroll-style";

		// add class to body
		document.body.classList.add(CLASS);

		// inject style only once
		if (!document.getElementById(STYLE_ID)) {
			const style = document.createElement("style");
			style.id = STYLE_ID;
			style.innerHTML = `
				/* hide body's scrollbar but keep inner scrollbars (like .todaylist-task-list) visible */
				body.${CLASS} {
					overflow: hidden !important;
					-ms-overflow-style: none; /* IE 10+ */
					scrollbar-width: none; /* Firefox */
				}
				body.${CLASS}::-webkit-scrollbar {
					display: none; /* WebKit */
				}
			`;
			document.head.appendChild(style);
		}

		return () => {
			// cleanup: remove class (keep style node for potential reuse by other mounts)
			document.body.classList.remove(CLASS);
			// optionally remove style element to fully cleanup (uncomment to enable)
			// const s = document.getElementById(STYLE_ID); if (s) s.remove();
		};
	}, []);
	// --- end NEW ---

	// Fetch tasks
	useEffect(() => {
		const fetchTasks = async () => {
			try {
				const res = await fetch(resolveApi("/api/todaylist"));
				if (!res.ok) throw new Error("Không thể tải danh sách công việc");
				const data = await res.json();

				const formatted = data.map((t) => ({
					id: t.task_id,
					text: t.task_name,
					status: t.status,
					priority: t.priority,
					createdAt: t.created_at,
					time: t.created_at
						? new Date(t.created_at).toLocaleTimeString("vi-VN", {
								hour: "2-digit",
								minute: "2-digit",
						  })
						: "",
					deadline: t.deadline,
					department_id: t.task_department_id ?? t.department_id ?? null,
					department_name: t.task_department_name ?? t.creator_department_name,
					creator_name: t.creator_name,
					creator_avatar: t.creator_avatar,
					creator_department_name: t.creator_department_name,
					// cố gắng map các trường id người tạo từ backend nếu có
					creator_id: t.creator_id ?? t.created_by ?? t.user_id ?? t.task_creator_id ?? null,
				}));

				setTasks(formatted);
				// NOTE: phòng ban load riêng
			} catch (err) {
				console.error("Lỗi:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchTasks();
	}, []);

	// helper kiểm tra quyền chỉnh sửa: chỉ creator mới được
	const canEdit = (task) => {
		if (!currentUser) return false;
		// try compare explicit id fields first
		const uid = currentUser.id ?? currentUser.user_id ?? currentUser.userId ?? currentUser.uid ?? currentUser.id_user;
		if (uid != null && task?.creator_id != null) {
			return String(uid) === String(task.creator_id);
		}
		// fallback: so sánh tên user
		if (task?.creator_name && (currentUser.username || currentUser.name)) {
			return String(task.creator_name).trim() === String(currentUser.username || currentUser.name).trim();
		}
		return false;
	};

	// Fetch departments
	useEffect(() => {
		const fetchDepartments = async () => {
			try {
				const res = await fetch(resolveApi("/api/departments"));
				if (!res.ok) throw new Error("Không thể tải danh sách phòng ban");
				const data = await res.json();

				const list = (data || [])
					.map((d) => ({
						department_id: d.department_id ?? d.id ?? null,
						department_name: d.department_name ?? d.name ?? d.department ?? "",
					}))
					.filter((d) => d.department_name);

				setDepartments(list);
			} catch (e) {
				console.error("Lỗi khi tải phòng ban:", e);
			}
		};
		fetchDepartments();
	}, []);

	const handleStatusChange = async (id, newStatus) => {
		const token = localStorage.getItem("token");
		// kiểm tra quyền nhanh: chỉ creator mới được cập nhật trạng thái
		const task = tasks.find(t => String(t.id) === String(id));
		if (!canEdit(task)) {
			alert("Bạn chỉ có thể thay đổi trạng thái nếu bạn là người tạo công việc này.");
			return;
		}
		try {
			const res = await fetch(resolveApi(`/api/todaylist/${id}`), {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
			setTasks((prev) =>
				prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
			);
		} catch (e) {
			console.error(e);
			alert(e.message);
		}
	};

	const openCreateModal = () => {
		setEditInitial(null);
		setModalReadOnly(false);
		setShowCreateModal(true);
	};

	// Mở modal edit: gọi API lấy chi tiết từ DB rồi mới open modal
	const openEditModal = async (e, task) => {
		// tránh mở khi click vào control bên trong item
		// selector sửa lại cho hợp lệ: dùng các phần tử riêng rẽ (không dùng '/')
		if (e?.target?.closest && e.target.closest("button,select,input,svg,path,img")) return;
		// không quyết định readOnly dựa trên item hiển thị sơ bộ.
		const id = task.id;
		try {
			// gọi API lấy chi tiết công việc
			const res = await fetch(resolveApi(`/api/todaylist/${id}`));
			if (!res.ok) throw new Error("Không thể tải chi tiết công việc");
			const t = await res.json();

			console.log('=== LOADED TASK DETAIL ===');
			console.log('Full task data:', t);
			console.log('okr_id from API:', t.okr_id);

			// xác định quyền dựa trên dữ liệu chi tiết trả về (ưu tiên id, fallback tên)
			try {
				const detailCreatorId = t.creator_id ?? t.created_by ?? t.user_id ?? t.task_creator_id ?? null;
				const detailCreatorName = t.creator_name ?? t.creator_username ?? t.creator?.username ?? null;
				const uid = currentUser?.id ?? currentUser?.user_id ?? currentUser?.userId ?? currentUser?.uid ?? null;
				let isCreatorDetail = false;
				if (uid != null && detailCreatorId != null) {
					isCreatorDetail = String(uid) === String(detailCreatorId);
				} else if (detailCreatorName && (currentUser?.username || currentUser?.name)) {
					isCreatorDetail = String(detailCreatorName).trim() === String(currentUser.username || currentUser.name).trim();
				}
				setModalReadOnly(!isCreatorDetail);
			} catch (ex) {
				// fallback: nếu lỗi khi check quyền thì mặc định readOnly = true để an toàn
				setModalReadOnly(true);
			}

			// Chuẩn hoá dữ liệu trả về thành shape CreateTodayList cần
			const initial = {
				id: t.task_id ?? t.id ?? id,
				task_id: t.task_id ?? t.id ?? id, // ✅ Thêm task_id
				title: t.task_name ?? t.title ?? task.text ?? "",
				department: t.department_id ?? t.department ?? t.creator_department_id ?? task.department_name ?? "",
				priority: t.priority ?? task.priority ?? "Trung bình",
				status: t.status ?? task.status ?? "Chưa xử lý",
				description: t.description ?? t.note ?? "",
				deadline: t.deadline ?? task.deadline ?? "",
				duration: t.estimate_time ?? t.duration ?? "",
				attachments: t.attachments ?? t.files ?? [],
				comments: t.comments ?? t.comment ?? "",
				okr_id: t.okr_id || '', // ✅ Đảm bảo okr_id được map
				okrId: t.okr_id || '', // ✅ Thêm alias cho chắc chắn
				createdAt: t.created_at ?? t.createdAt ?? null,
				time: t.created_at ? new Date(t.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
				creator_id: t.creator_id ?? t.created_by ?? t.user_id ?? t.task_creator_id ?? null,
				creator_name: t.creator_name ?? t.creator_username ?? null,
			};

			console.log('=== INITIAL DATA FOR MODAL ===');
			console.log('initial.okr_id:', initial.okr_id);
			console.log('Full initial:', initial);

			setEditInitial(initial);
			setShowCreateModal(true);
		} catch (err) {
			console.error("Lỗi tải chi tiết:", err);
			alert(err.message || "Không thể tải dữ liệu công việc");
		}
	};
	// hỗ trợ mở nhanh khi nhấn Enter trên item
	const handleItemKeyDown = (e, task) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			openEditModal(e, task);
		}
	};

	// Gộp create + update (hỗ trợ optional id)
	const handleSave = async (taskData, id = null) => {
		try {
			const token = localStorage.getItem("token");
			const payload = {
				task_name: taskData.title,
				department_id: taskData.department,
				priority: taskData.priority,
				status: taskData.status,
				description: taskData.description,
				deadline: taskData.deadline,
				estimate_time: taskData.duration,
				okr_id: taskData.okr_id || null // ✅ THÊM DÒNG NÀY
			};

			console.log('=== HANDLE SAVE IN PARENT ===');
			console.log('Task Data received:', taskData);
			console.log('Payload to send:', payload);

			const targetId = id || (editInitial && editInitial.id);
			if (targetId) {
				// kiểm tra quyền update: chỉ creator mới được update
				const exist = tasks.find(t => String(t.id) === String(targetId));
				if (!canEdit(exist)) {
					alert("Bạn không có quyền cập nhật công việc này.");
					return;
				}
				// update
				const res = await fetch(resolveApi(`/api/todaylist/${targetId}`), {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: JSON.stringify(payload),
				});
				if (!res.ok) throw new Error("Cập nhật công việc thất bại");
				const updated = await res.json();
				const formatted = {
					id: updated.task_id ?? editInitial.id,
					text: updated.task_name ?? payload.task_name,
					status: updated.status ?? payload.status,
					priority: updated.priority ?? payload.priority,
					deadline: updated.deadline ?? payload.deadline,
					createdAt: updated.created_at ?? updated.createdAt ?? editInitial.createdAt ?? null,
					time: (updated.created_at ?? updated.createdAt ?? editInitial.createdAt) ? new Date(updated.created_at ?? updated.createdAt ?? editInitial.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
					creator_name: updated.creator_name ?? editInitial.creator_name,
					creator_avatar: updated.creator_avatar ?? editInitial.creator_avatar,
					creator_department_name: updated.creator_department_name ?? taskData.department,
					// prefer task_department_name returned by backend; fallback to lookup by id in departments
					department_id: updated.task_department_id ?? updated.department_id ?? taskData.department ?? null,
					department_name:
						updated.task_department_name ??
						(updated.creator_department_name) ??
						(departments.find(d => String(d.department_id) === String(taskData.department))?.department_name) ??
						editInitial.department ?? null,
					creator_id: updated.creator_id ?? updated.created_by ?? updated.user_id ?? editInitial.creator_id ?? null,
				};
				setTasks((prev) => prev.map((t) => (t.id === formatted.id ? { ...t, ...formatted } : t)));
			} else {
				// create
				const res = await fetch(resolveApi("/api/todaylist"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: JSON.stringify(payload),
				});
				if (!res.ok) throw new Error("Tạo công việc thất bại");
				const saved = await res.json();
				// đảm bảo hiển thị createdAt/time và creator id/name (dùng currentUser nếu backend không trả)
				const createdAtVal = saved.created_at ?? saved.createdAt ?? new Date().toISOString();
				const formatted = {
					id: saved.task_id ?? saved.id,
					text: saved.task_name ?? saved.title ?? payload.task_name,
					status: saved.status ?? payload.status,
					priority: saved.priority ?? payload.priority,
					deadline: saved.deadline ?? payload.deadline ?? null,
					department_id: saved.task_department_id ?? saved.department_id ?? payload.department_id ?? null,
					department_name: saved.task_department_name ?? saved.creator_department_name ?? (departments.find(d => String(d.department_id) === String(payload.department_id))?.department_name) ?? null,
					creator_name: saved.creator_name ?? currentUser?.username ?? currentUser?.name ?? null,
					creator_avatar: saved.creator_avatar ?? null,
					creator_department_name: saved.creator_department_name ?? null,
					creator_id: saved.creator_id ?? saved.created_by ?? saved.user_id ?? currentUser?.id ?? null,
					createdAt: createdAtVal,
					time: createdAtVal ? new Date(createdAtVal).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
				};
				setTasks((prev) => [...prev, formatted]);
			}

			setShowCreateModal(false);
			setEditInitial(null);
		} catch (err) {
			console.error(err);
			alert(err.message);
		}
	};

	// wrapper để truyền vào CreateTodayList
	const handleCreate = async (taskData) => {
		await handleSave(taskData, null);
	};

	const handleUpdate = async (id, taskData) => {
		await handleSave(taskData, id);
	};

	// Thay đổi: lọc tasks kết hợp dept + priority + searchText
	// helper: convert various date values to YYYY-MM-DD (or null)

	// Handler cho click status card
	const handleStatusCardClick = (status) => {
		if (statusFilter === status) {
			// Nếu đã chọn status này rồi thì bỏ chọn (về "all")
			setStatusFilter("all");
		} else {
			// Chọn status mới
			setStatusFilter(status);
		}
	};

	const filteredTasks = tasks
		.filter((t) => (!selectedDept ? true : t.department_name === selectedDept))
		// filter by date range: match createdAt or deadline within range
		.filter((t) => {
			if (!startDate && !endDate) return true;
			
			const start = new Date(startDate);
			start.setHours(0, 0, 0, 0);
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			
			const createdDate = t.createdAt ? new Date(t.createdAt) : null;
			const deadlineDate = t.deadline ? new Date(t.deadline) : null;
			
			const createdInRange = createdDate && createdDate >= start && createdDate <= end;
			const deadlineInRange = deadlineDate && deadlineDate >= start && deadlineDate <= end;
			
			return createdInRange || deadlineInRange;
		})
		.filter((t) =>
			priorityFilter === "all"
				? true
				: (t.priority || "").toLowerCase() === priorityFilter.toLowerCase()
		)
		.filter((t) =>
			statusFilter === "all"
				? true
				: t.status === statusFilter
		)
		.filter((t) =>
			!searchText ? true : (t.text || "").toLowerCase().includes(searchText.trim().toLowerCase())
		);

	if (loading) return <p>Đang tải...</p>;

	return (
		// dịch nội dung sang phải (sau sidebar w-56) và xuống dưới (sau header h-16)
		// NOTE: giảm mt-16 -> mt-12 để đẩy màn lên 1 tí
		<div className="todaylist-container ml-56 mt-12 p-6">
			{/* card chiếm viewport còn lại; dùng flex column để chỉ task-list scroll */}
			<div
				className="todaylist-card bg-white p-6 rounded-lg shadow flex flex-col"
				// điều chỉnh chiều cao: bớt trừ 4rem -> 3rem do margin-top giảm
				style={{ height: "calc(95vh - 3rem - 1.5rem)" }} // 3rem = header khoảng nhỏ hơn, trừ chút padding
			>
				{/* Header trong card (title + date range filter) */}
				<div className="todaylist-header">
					<h2 className="todaylist-title">Danh sách công việc</h2>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<select
							className="todaylist-dept-filter"
							value={selectedDept}
							onChange={(e) => setSelectedDept(e.target.value)}
							title="Lọc theo phòng ban"
						>
							<option value="">Tất cả phòng ban</option>
							{departments.map((d) => (
								<option key={d.department_id ?? d.id ?? d.department_name} value={d.department_name ?? d.name}>
									{d.department_name ?? d.name}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Bộ lọc ngày cho TodayList */}
				<div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
					<div className="flex items-center gap-4">
						<label className="text-sm font-semibold text-gray-700">Lọc TodayList:</label>
						<div className="flex items-center gap-2">
							<label className="text-sm text-gray-600">Từ ngày:</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm text-gray-600">Đến ngày:</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<button
							onClick={() => {
								const today = new Date().toISOString().split('T')[0];
								setStartDate(today);
								setEndDate(today);
							}}
							className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
						>
							Hôm nay
						</button>
						<button
							onClick={() => {
								const today = new Date();
								const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
								const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
								setStartDate(firstDay.toISOString().split('T')[0]);
								setEndDate(lastDay.toISOString().split('T')[0]);
							}}
							className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
						>
							Tháng này
						</button>
					</div>
				</div>

				{/* Controls */}
				<div className="todaylist-controls">
					<div className="controls-box">
						<input
							type="text"
							placeholder="Tìm công việc..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							className="todaylist-search"
						/>

						<select
							className="todaylist-priority-filter"
							value={priorityFilter}
							onChange={(e) => setPriorityFilter(e.target.value)}
						>
							<option value="all">Tất cả độ ưu tiên</option>
							{CONSTANTS.PRIORITIES?.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					</div>

					<div className="controls-right">
						<button className="todaylist-btn-add" onClick={openCreateModal}>
							<Plus className="icon" /> Thêm
						</button>
					</div>
				</div>

				{/* Thống kê - giữ ở trên cùng của card (không scroll) */}
				<div className="todaylist-status-summary">
					{CONSTANTS.TASK_STATUSES.map((status) => {
						const isSelected = statusFilter === status;
						const statusColorClass = STATUS_COLORS[status] || '';
						return (
							<div 
								key={status} 
								className={`todaylist-status-box ${isSelected ? `selected ${statusColorClass}` : ''}`}
								onClick={() => handleStatusCardClick(status)}
								style={{ 
									cursor: 'pointer',
									...(isSelected && {
										// Loại bỏ style cũ để sử dụng màu từ STATUS_COLORS
										transform: 'scale(1.02)',
										boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
									})
								}}
								title={`Click để lọc theo trạng thái: ${status}`}
							>
								<div className="todaylist-status-number">
									{filteredTasks.filter((t) => t.status === status).length}
								</div>
								<div className="todaylist-status-label">{status}</div>
							</div>
						);
					})}
				</div>

				{/* Danh sách công việc - khu vực duy nhất scrollable */}
				<div className="todaylist-task-list overflow-auto flex-1 mt-4">
					{filteredTasks.length === 0 ? (
						<p>Không có công việc nào.</p>
					) : (
						filteredTasks.map((task) => {
							const avatarUrl = task.creator_avatar ? `${API_URL}/uploads/${task.creator_avatar}` : null;
							return (
								<div
									key={task.id}
									className={`todaylist-task-item ${STATUS_COLORS[task.status]} ${hoveredTaskId === task.id ? 'todaylist-task-item--hover' : ''}`}
									onClick={(e) => openEditModal(e, task)}
									onDoubleClick={(e) => openEditModal(e, task)} /* cử chỉ double-click để edit */
									onMouseEnter={() => setHoveredTaskId(task.id)}
									onMouseLeave={() => setHoveredTaskId(null)}
									tabIndex={0}
									onKeyDown={(e) => handleItemKeyDown(e, task)}
								>
									<div className="todaylist-task-content">
										<div className="todaylist-task-header">
											<span className="todaylist-task-text">{task.text}</span>
											<span className={`todaylist-priority ${task.priority?.toLowerCase().replace(" ", "-")}`}>
												{task.priority}
											</span>
										</div>

										<div className="todaylist-task-meta">
											<span className="todaylist-task-time">{task.time || ""}</span>
											{/* disable nếu không phải creator (vẫn hiển thị để xem) */}
											<select
												className="todaylist-task-status"
												value={task.status || ""}
												onChange={(e) => handleStatusChange(task.id, e.target.value)}
												onClick={(e) => e.stopPropagation()}
												disabled={!canEdit(task)}
												title={!canEdit(task) ? "Chỉ người tạo mới có thể thay đổi trạng thái" : ""}
											>
												{CONSTANTS.TASK_STATUSES.map((s) => (
													<option key={s} value={s}>
														{s}
													</option>
												))}
											</select>
										</div>
									</div>

									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "flex-end",
											gap: "12px",
											minWidth: "280px",
										}}
									>
										<div className="todaylist-deadline-badge">
											{task.deadline ? new Date(task.deadline).toLocaleDateString("vi-VN") : "Không có"}
										</div>
										<div className="todaylist-dept-badge">
											{task.department_name || task.creator_department_name || "Không rõ"}
										</div>
										<div className="todaylist-creator">
											{avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <div className="avatar-fallback">👤</div>}
											<span>{task.creator_name || "Không rõ"}</span>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Modals: dùng chung cho create + edit */}
			{showCreateModal && (
				<CreateTodayList
					show={showCreateModal}
					onClose={() => {
						setShowCreateModal(false);
						setEditInitial(null);
						setModalReadOnly(false);
					}}
					onCreate={handleCreate}
					onUpdate={handleUpdate}
					mode={editInitial ? "edit" : "create"}
					initialData={editInitial}
					readOnly={modalReadOnly}
					departments={departments}
				/>
			)}
		</div>
	);
};

export default TodayListView;

