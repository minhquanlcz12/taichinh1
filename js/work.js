// js/work.js

const WorkModule = {
    data: {
        // Now containing all 13 marketing fields
        // {id, stt, ngayDang, thu, mucTieu, truCot, tieuDe, noiDung, dinhDang, orderBrief, deadline, trangThai, ghiChu, anhGoiY, project, owner}
        tasks: []
    },
    expandedProjects: null, // Track open folders
    currentFilterTime: 'all', // Default to all

    init: async () => {
        await WorkModule.renderPlaceholder();
        await WorkModule.load(); // Load data and filter by role
    },

    load: () => {
        return new Promise((resolve) => {
            let initialLoad = true;
            DB.listenWorkData(async (d) => {
                let changed = false;
                if (d && d.tasks) {
                    const todayStr = Utils.getTodayString();
                    const todayParts = todayStr.split('/');
                    const todayTime = new Date(`${todayParts[2]}-${todayParts[1]}-${todayParts[0]}T00:00:00`).getTime();

                    d.tasks.forEach(t => {
                        let curStatus = (t.trangThai || 'Planned').toLowerCase();
                        if (!curStatus.includes('done') && !curStatus.includes('hết hạn') && !curStatus.includes('hoàn thành')) {
                            const compareDateStr = t.ngayDang || t.deadline;
                            if (compareDateStr) {
                                let compareTime;
                                if (compareDateStr.includes('-')) {
                                    compareTime = new Date(compareDateStr).getTime();
                                } else if (compareDateStr.includes('/')) {
                                    const p = compareDateStr.split('/');
                                    if (p.length === 3) {
                                        compareTime = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`).getTime();
                                    }
                                }

                                if (compareTime && !isNaN(compareTime)) {
                                    if (compareTime < todayTime && !curStatus.includes('hết hạn')) {
                                        t.trangThai = 'Hết hạn';
                                        changed = true;
                                    } else if (compareTime === todayTime && !curStatus.includes('hạn chót')) {
                                        t.trangThai = 'Hạn chót';
                                        changed = true;
                                    }
                                }
                            }
                        }
                    });
                    WorkModule.data = d;
                    
                    // Nết có update trạng thái thì lưu lại db
                    if (changed) {
                        try {
                            await DB.saveWorkData(WorkModule.data);
                        } catch (e) {
                            console.error("Auto-expire save error:", e);
                        }
                    }
                } else {
                    WorkModule.data.tasks = [];
                }
                WorkModule.filterByRole();
                if (initialLoad) {
                    initialLoad = false;
                    resolve();
                }
            });
        });
    },

    save: async () => {
        await DB.saveWorkData(WorkModule.data);
        WorkModule.filterByRole();
    },

    filterByRole: () => {
        const currentUser = Auth.currentUser;
        if (!currentUser) {
            WorkModule.renderList([]); // Render empty if no user
            return;
        }

        let displayTasks = WorkModule.data.tasks;

        if (currentUser.role === 'admin') {
            const filterEl = document.getElementById('work-user-filter');
            if (filterEl && filterEl.value !== 'all') {
                displayTasks = displayTasks.filter(t => t.owner === filterEl.value || (!t.owner && filterEl.value === 'admin'));
            }
        } else {
            // Non-admin: xem tất cả công việc, nhưng chỉ sửa trạng thái của công việc được giao cho mình
            // displayTasks giữ nguyên toàn bộ
        }

        if (WorkModule.currentFilterTime === 'today') {
            const todayStr = Utils.getTodayString();
            displayTasks = displayTasks.filter(t => t.ngayDang === todayStr || t.deadline === todayStr);
            const dateDisplay = document.getElementById('work-date-display');
            if (dateDisplay) dateDisplay.textContent = 'Kế hoạch Hôm nay (' + todayStr + ')';
        } else {
            const dateDisplay = document.getElementById('work-date-display');
            if (dateDisplay) dateDisplay.textContent = 'Tất cả Kế hoạch';
        }

        const timeFilterEl = document.getElementById('work-time-filter');
        if (timeFilterEl) timeFilterEl.value = WorkModule.currentFilterTime;

        if (app.state && app.state.currentView === 'dashboard-view') {
            app.renderDashboard();
        }

        WorkModule.renderList(displayTasks);
    },

    getTodaysTasks: () => {
        // Return active tasks for dashboard - tất cả user xem được toàn bộ
        let tasks = WorkModule.data.tasks;

        const todayStr = Utils.getTodayString();

        return tasks.filter(t => {
            const nd = (t.ngayDang || '').trim();
            const dl = (t.deadline || '').trim();
            return nd === todayStr || dl === todayStr;
        });
    },

    renderPlaceholder: async () => {
        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';

        let filterHtml = `
            <select class="form-control" id="work-time-filter" style="width: auto; display: inline-block; margin-right: 12px; height: 38px;" onchange="WorkModule.currentFilterTime = this.value; WorkModule.filterByRole()">
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
            </select>
        `;
        if (isAdmin) {
            const accounts = await Auth.getAccounts();
            let opts = `<option value="all">Tất cả nhân viên</option>`;
            accounts.forEach(a => {
                opts += `<option value="${a.username}">${a.username} (${a.role})</option>`;
            });
            filterHtml += `
                <select class="form-control" id="work-user-filter" style="width: auto; display: inline-block; margin-right: 12px; height: 38px;" onchange="WorkModule.filterByRole()">
                    ${opts}
                </select>
            `;
        }

        const container = document.getElementById('work-view');
        container.innerHTML = `
            <div class="work-header" style="display:flex; justify-content:space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                <h3 style="font-size: 20px;">Kế hoạch Tiếp thị & Công việc</h3>
                <div style="display: flex; gap: 12px; align-items: center;">
                    ${filterHtml}
                    <div class="upload-btn-wrapper">
                        <button class="btn btn-success" style="background: var(--success); color: white;">
                            <i class="fa-solid fa-file-excel"></i> Nhập File Kế Hoạch
                        </button>
                        <input type="file" id="excel-upload" accept=".xlsx, .xls" onchange="WorkModule.handleExcelUpload(event)">
                    </div>
                </div>
            </div>
            
            <div class="dashboard-content-grid" style="grid-template-columns: 1fr;">
                <div class="glass-card" style="padding: 16px;">
                    <div class="card-header" style="margin-bottom: 8px;">
                        <h3 id="work-date-display">Tất cả Kế hoạch</h3>
                    </div>
                    <div class="task-list full-list" id="work-list">
                        <!-- Danh sách thư mục -->
                    </div>
                </div>
            </div>
        `;

        // renderList is now called by filterByRole
    },

    render: () => {
        WorkModule.filterByRole();
    },

    handleExcelUpload: async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const projectName = await Utils.showPrompt("Nhập tên Thư mục / Kế hoạch:", file.name.split('.')[0]);
        if (!projectName) {
            event.target.value = '';
            return;
        }

        if (!WorkModule.data.importedFiles) {
            WorkModule.data.importedFiles = [];
        }
        
        const fileSignature = `${projectName}_${file.name}_${file.size}`;
        if (WorkModule.data.importedFiles.includes(fileSignature)) {
            const hasExistingProject = WorkModule.data.tasks.some(t => t.project === projectName);
            if (hasExistingProject) {
                Utils.showToast(`File "${file.name}" đã được tải lên dự án "${projectName}" trước đây! Vui lòng xóa kế hoạch đang hiển thị trước khi tải đè.`, 'error');
                event.target.value = '';
                return;
            } else {
                // Xóa signature bị kẹt do dự án cũ đã bị xóa
                WorkModule.data.importedFiles = WorkModule.data.importedFiles.filter(f => f !== fileSignature);
            }
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Read as array of arrays
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                let importedCount = 0;
                let headerRowIndex = -1;
                let colMap = {};

                // 1. Find Header Row dynamically (scan first 20 rows)
                for (let i = 0; i < Math.min(20, rawJson.length); i++) {
                    const row = rawJson[i];
                    if (!row || row.length === 0) continue;

                    const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
                    if (rowStr.includes('stt') || rowStr.includes('ngày đăng') || rowStr.includes('tiêu đề') || rowStr.includes('mục tiêu')) {
                        headerRowIndex = i;
                        // Build mapping dictionary
                        row.forEach((colName, idx) => {
                            if (!colName) return;
                            const name = String(colName).toLowerCase().trim();
                            if (name === 'stt') colMap.stt = idx;
                            else if (name.includes('ngày đăng')) colMap.ngayDang = idx;
                            else if (name.includes('thứ')) colMap.thu = idx;
                            else if (name.includes('mục tiêu') || name.includes('mục đích')) colMap.mucTieu = idx;
                            else if (name.includes('trụ cột')) colMap.truCot = idx;
                            else if (name.includes('tiêu đề')) colMap.tieuDe = idx;
                            else if (name.includes('nội dung chi tiết') || name === 'nội dung' || name.includes('caption')) colMap.noiDung = idx;
                            else if (name.includes('định dạng')) colMap.dinhDang = idx;
                            else if (name.includes('đặt hàng') || name.includes('order brief') || name.includes('nội dung order') || name.includes('order thiết kế')) colMap.orderBrief = idx;
                            else if (name.includes('deadline')) colMap.deadline = idx;
                            else if (name.includes('trạng thái')) colMap.trangThai = idx;
                            else if (name.includes('ghi chú')) colMap.ghiChu = idx;
                            else if (name.includes('ảnh gợi ý')) colMap.anhGoiY = idx;
                        });
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    Utils.showToast("Không tìm thấy dòng tiêu đề chuẩn (STT, Ngày đăng, Tiêu đề...) trong file Excel.", 'error');
                    return;
                }

                // 2. Extract Data using dynamic ColMap
                for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
                    const row = rawJson[i];

                    // Basic validation: skip completely empty rows
                    if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) continue;

                    const sttVal = colMap.stt !== undefined ? row[colMap.stt] : '';
                    if (String(sttVal).toLowerCase() === 'stt' || String(sttVal).toLowerCase() === 'ngày đăng') continue;

                    const safeGet = (colIndex) => colIndex !== undefined && row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex].toString() : '';

                    const ngayDangParsed = colMap.ngayDang !== undefined ? Utils.convertExcelDate(row[colMap.ngayDang]) : '';
                    const deadlineParsed = colMap.deadline !== undefined ? Utils.convertExcelDate(row[colMap.deadline]) : '';
                    let rawTrangThai = safeGet(colMap.trangThai) || 'Planned';

                    // Auto-expired logic
                    const todayStr = Utils.getTodayString();
                    const todayParts = todayStr.split('/');
                    const todayTime = new Date(`${todayParts[2]}-${todayParts[1]}-${todayParts[0]}T00:00:00`).getTime();
                    
                    const compareDateStr = ngayDangParsed || deadlineParsed;
                    if (compareDateStr && !rawTrangThai.toLowerCase().includes('done')) {
                        const p = compareDateStr.split('/');
                        const compareTime = p.length === 3 ? new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`).getTime() : new Date(compareDateStr).getTime();
                        if (!isNaN(compareTime)) {
                            if (compareTime < todayTime) {
                                rawTrangThai = 'Hết hạn';
                            } else if (compareTime === todayTime) {
                                rawTrangThai = 'Hạn chót';
                            }
                        }
                    }

                    const taskObj = {
                        id: Utils.generateId(),
                        project: projectName,
                        stt: safeGet(colMap.stt),
                        ngayDang: ngayDangParsed,
                        thu: safeGet(colMap.thu),
                        mucTieu: safeGet(colMap.mucTieu),
                        truCot: safeGet(colMap.truCot),
                        tieuDe: safeGet(colMap.tieuDe),
                        noiDung: safeGet(colMap.noiDung),
                        dinhDang: safeGet(colMap.dinhDang),
                        orderBrief: safeGet(colMap.orderBrief),
                        deadline: deadlineParsed,
                        trangThai: rawTrangThai,
                        ghiChu: safeGet(colMap.ghiChu),
                        anhGoiY: safeGet(colMap.anhGoiY),
                        owner: Auth.currentUser ? Auth.currentUser.username : 'admin'
                    };

                    WorkModule.data.tasks.push(taskObj);
                    importedCount++;
                }

                WorkModule.data.importedFiles.push(fileSignature);

                Utils.showToast(`Đã nhập thành công ${importedCount} công việc vào kế hoạch "${projectName}".`, 'success');
                await WorkModule.save();

                // --- NEW: Gửi thông báo Telegram khi import bảng kế hoạch mới ---
                if (!app.state.settings || !app.state.settings.tgToken || !app.state.settings.tgChatId) {
                    Utils.showToast("Cảnh báo: Chưa có Token/Chat ID Telegram, Bot sẽ không thông báo vào nhóm!", "warning");
                } else if (importedCount > 0) {
                    const currentUserStr = Auth.currentUser ? Auth.currentUser.username : 'admin';
                    let urgentCount = 0;
                    
                    // Quét số lượng công việc trong ngày (Hạn chót)
                    WorkModule.data.tasks.forEach(t => {
                        if (t.project === projectName && t.trangThai === 'Hạn chót') {
                            urgentCount++;
                        }
                    });

                    // Xử lý Escape chuỗi để tránh lỗi Parse HTML của Telegram
                    const safeProjectName = projectName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                    let msg = `📢 <b>CẬP NHẬT KẾ HOẠCH MỚI</b>\n\n`;
                    msg += `📁 <b>Dự án:</b> ${safeProjectName}\n`;
                    msg += `👤 <b>Tài khoản:</b> ${currentUserStr}\n\n`;
                    
                    if (urgentCount > 0) {
                        msg += `🚨 <b>CẢNH BÁO:</b> Tài khoản <b>${currentUserStr}</b> có ${urgentCount} việc cần làm gấp (Hạn hôm nay)! Đề nghị xử lý ngay lập tức.\n`;
                    } else {
                        msg += `✅ Tài khoản <b>${currentUserStr}</b> có ${importedCount} công việc mới (Đều trong tiến độ, không có việc gấp hôm nay).\n`;
                    }
                    msg += `\n👉 <a href="https://minhquanlcz12.github.io/taichinh1/">Truy cập hệ thống</a>`;
                    
                    Utils.notifyTelegram(msg);
                }

            } catch (err) {
                console.error(err);
                Utils.showToast("Đã xảy ra lỗi khi đọc file Excel. Vui lòng đảm bảo định dạng các cột (13 cột) chuẩn.", 'error');
            }

            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    },

    goToProject: (projectName) => {
        // 1. Chuyển hướng giao diện về Kế hoạch công việc
        if (app.state.currentView !== 'work-view') {
            app.navigateTo('work-view');
        }

        // 2. Ép buộc mở Folder
        if (WorkModule.expandedProjects === null) {
            WorkModule.expandedProjects = new Set();
        }
        WorkModule.expandedProjects.add(projectName);
        WorkModule.filterByRole();

        // 3. Chờ DOM render xong rồi cuộn mượt đến thẳng dự án
        setTimeout(() => {
            const folderHeaders = document.querySelectorAll('.folder-title');
            for (let header of folderHeaders) {
                if (header.textContent.includes(projectName)) {
                    const group = header.closest('.folder-group');
                    group.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Highlight hiệu ứng nhấp nháy 2 giây
                    const oldTransition = group.style.transition;
                    group.style.transition = 'box-shadow 0.3s ease';
                    group.style.boxShadow = '0 0 25px var(--primary)';
                    setTimeout(() => {
                        group.style.boxShadow = '';
                        setTimeout(() => group.style.transition = oldTransition, 300);
                    }, 1500);
                    break;
                }
            }
        }, 100);
    },

    toggleFolder: (folderId, projName) => {
        const folderEl = document.getElementById(folderId);
        if (folderEl) {
            const isExpanded = folderEl.classList.toggle('expanded');
            if (WorkModule.expandedProjects !== null) {
                if (isExpanded) {
                    WorkModule.expandedProjects.add(projName);
                } else {
                    WorkModule.expandedProjects.delete(projName);
                }
            }
        }
    },

    deleteProject: async (projectName, event) => {
        event.stopPropagation(); // prevent toggling accordion
        if (await Utils.showConfirm('Xác nhận Xóa', `Bạn có chắc chắn muốn xóa toàn bộ kế hoạch "${projectName}"? Hành động này không thể hoàn tác.`)) {
            WorkModule.data.tasks = WorkModule.data.tasks.filter(t => t.project !== projectName);
            if (WorkModule.data.importedFiles) {
                WorkModule.data.importedFiles = WorkModule.data.importedFiles.filter(f => !f.startsWith(`${projectName}_`));
            }
            await WorkModule.save();
        }
    },

    renderList: (tasksToRender) => {
        const container = document.getElementById('work-list');
        if (!container) return;

        const tasks = tasksToRender || WorkModule.data.tasks;

        if (tasks.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--text-secondary); background: rgba(0,0,0,0.02); border-radius: 8px;">
                    <i class="fa-solid fa-folder-open" style="font-size: 48px; margin-bottom: 16px; opacity:0.5;"></i>
                    <p style="font-size: 15px;">Bạn chưa có kế hoạch công việc nào.</p>
                    <p style="font-size: 13px; opacity: 0.7; margin-top: 8px;">Nhấn nút "Nhập File Kế Hoạch" màu xanh phía trên góc phải để bắt đầu.</p>
                </div>
            `;
            return;
        }

        // Group by project
        const grouped = {};
        tasks.forEach(t => {
            if (!grouped[t.project]) grouped[t.project] = [];
            grouped[t.project].push(t);
        });

        // Initialize expanded tracking on first load
        if (WorkModule.expandedProjects === null) {
            WorkModule.expandedProjects = new Set(Object.keys(grouped));
        }

        let html = '';

        // Render each project folder
        Object.keys(grouped).sort().forEach((projName, index) => {
            const projTasks = grouped[projName];
            const sortedByStt = [...projTasks].sort((a, b) => parseInt(a.stt) - parseInt(b.stt)); // Sort numerically STT
            const folderId = 'folder-' + index;

            // Simple metric for folder badge
            const doneCount = projTasks.filter(t => t.trangThai && t.trangThai.toLowerCase().includes('done')).length;
            const totalCount = projTasks.length;

            const ownerSet = new Set(projTasks.map(t => t.owner || 'admin'));
            const ownerNames = Array.from(ownerSet).join(', ');
            // Hiện badge người được phân công cho tất cả user
            const adminBadgeHtml = `<span class="badge badge-orange" style="font-size: 11px; margin-left: 8px;"><i class="fa-solid fa-user"></i> ${ownerNames}</span>`;

            const isExpanded = WorkModule.expandedProjects.has(projName) ? 'expanded' : '';

            html += `
                <div class="folder-group glass-card ${isExpanded}" style="padding: 0; overflow:hidden; margin-bottom: 24px;" id="${folderId}">
                    <div class="folder-header" onclick="WorkModule.toggleFolder('${folderId}', '${projName}')">
                        <div class="folder-title">
                            <i class="fa-solid fa-folder-open" style="color: var(--primary);"></i>
                            ${projName}
                            ${adminBadgeHtml}
                            <span class="badge badge-gray" style="font-size: 11px; margin-left: 8px;">${projTasks.length} nhiệm vụ</span>
                            <span class="badge badge-blue" style="font-size: 11px; margin-left: 8px;">Hoàn thành: ${doneCount}/${totalCount}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap: 16px;">
                            <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px; font-weight: bold;" onclick="WorkModule.deleteProject('${projName}', event)">
                                <i class="fa-solid fa-trash"></i> Xóa
                            </button>
                            <i class="fa-solid fa-chevron-down chevron-icon"></i>
                        </div>
                    </div>
                    <div class="folder-content">
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th class="col-stt" style="width: 40px; min-width: 40px; text-align: center;">STT</th>
                                        <th class="col-ngay" style="width: 105px; min-width: 105px;">Ngày đăng /<br>Deadline</th>
                                        <th class="col-muctieu th-green">Mục tiêu</th>
                                        <th class="col-tieude th-green">Tiêu đề</th>
                                        <th class="col-noidung th-green">Nội dung chi tiết (caption/outline)</th>
                                        <th class="col-dinhdang">Định dạng</th>
                                        <th class="col-order">Nội dung order thiết kế (brief)</th>
                                        <th class="col-phancong" style="width: 100px; min-width: 100px; text-align: center;">Phân công</th>
                                        <th class="col-trangthai" style="width: 110px; min-width: 110px;">Trạng thái</th>
                                        <th class="col-ghichu">Ghi chú</th>
                                        <th class="col-anh">Ảnh gợi ý</th>
                                        <th class="col-ticket" style="width: 90px; min-width: 90px; text-align: center;">Phiếu LV</th>
                                        <th class="col-actions" style="width: 50px; min-width: 50px; text-align: center;"><i class="fa-solid fa-trash"></i></th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            projTasks.forEach(task => {
                const currentStatus = task.trangThai ? task.trangThai.toLowerCase() : 'planned';
                const isCompleted = currentStatus.includes('done') || currentStatus.includes('hoàn thành');
                const isExpired = currentStatus.includes('hết hạn');
                const isDeadline = currentStatus.includes('hạn chót');
                let statusClass = '';

                if (currentStatus.includes('planned')) statusClass = 'status-planned';
                if (isCompleted) statusClass = 'status-done';
                if (currentStatus.includes('doing')) statusClass = 'status-doing';
                if (isExpired) statusClass = 'status-expired';
                if (isDeadline) statusClass = 'status-deadline'; // For styling later

                let rowClass = '';
                if (isCompleted) rowClass = 'row-completed';
                else if (isExpired) rowClass = 'row-expired';
                else if (isDeadline) rowClass = 'row-deadline';

                // Kiểm tra quyền chỉnh sửa trạng thái
                const taskCurrentUser = Auth.currentUser;
                const canEditStatus = taskCurrentUser && (taskCurrentUser.role === 'admin' || task.owner === taskCurrentUser.username);

                // Status Dropdown Options
                const statuses = ['Planned', 'Doing', 'Done', 'Hạn chót', 'Hết hạn'];
                let statusOptions = statuses.map(s => {
                    const selected = task.trangThai.toLowerCase() === s.toLowerCase() ? 'selected' : '';
                    return `<option value="${s}" ${selected}>${s}</option>`;
                }).join('');

                // Image logic
                const imgCellContent = task.anhData
                    ? `<img src="${task.anhData}" style="max-width:80px; max-height:80px; border-radius:4px; cursor:pointer;" onclick="WorkModule.triggerImageUpload('${task.id}')" title="Đổi ảnh">`
                    : `<button class="btn btn-outline" style="font-size:11px; padding:4px 8px;" onclick="WorkModule.triggerImageUpload('${task.id}')"><i class="fa-solid fa-image"></i> Tải ảnh</button>`;

                // Deadline Logic
                let deadlineClass = '';
                let deadlineText = task.deadline || '--';
                if (task.deadline) {
                    const todayStr = Utils.getTodayString();
                    // todayStr from Utils is DD/MM/YYYY
                    const pToday = todayStr.split('/');
                    
                    // task.deadline can be YYYY-MM-DD or DD/MM/YYYY
                    let deadlineTime;
                    if (task.deadline.includes('-')) {
                        deadlineTime = new Date(task.deadline).getTime();
                    } else if (task.deadline.includes('/')) {
                        const pDeadline = task.deadline.split('/');
                        if (pDeadline.length === 3) {
                            deadlineTime = new Date(`${pDeadline[2]}-${pDeadline[1]}-${pDeadline[0]}T00:00:00`).getTime();
                        }
                    }

                    if (pToday.length === 3 && deadlineTime) {
                        const todayTime = new Date(`${pToday[2]}-${pToday[1]}-${pToday[0]}T00:00:00`).getTime();
                        
                        if (!isNaN(todayTime) && !isNaN(deadlineTime)) {
                            const diffDays = Math.round((deadlineTime - todayTime) / (1000 * 60 * 60 * 24));
                            
                            if (diffDays < 0 && !task.trangThai.toLowerCase().includes('done')) {
                                deadlineClass = 'deadline-danger';
                                deadlineText = `${task.deadline} <br><span style="font-size:10px; color:var(--danger);">(Quá hạn ${Math.abs(diffDays)} ngày)</span>`;
                            } else if (diffDays === 0 && !task.trangThai.toLowerCase().includes('done')) {
                                deadlineClass = 'deadline-danger';
                                deadlineText = `${task.deadline} <br><span style="font-size:10px; color:var(--danger);">(Hạn hôm nay!)</span>`;
                            } else if (diffDays === 1 && !task.trangThai.toLowerCase().includes('done')) {
                                deadlineClass = 'deadline-warning';
                                deadlineText = `${task.deadline} <br><span style="font-size:10px; color:var(--warning);">(Ngày mai)</span>`;
                            } else if ((diffDays === 2 || diffDays === 3) && !task.trangThai.toLowerCase().includes('done')) {
                                deadlineClass = 'deadline-info';
                                deadlineText = `${task.deadline} <br><span style="font-size:10px; color:var(--info);">(Còn ${diffDays} ngày)</span>`;
                            }
                        }
                    }
                }

                // Clean HTML content for table view
                const stripHtml = (html) => {
                    if(!html) return '';
                    let tmp = document.createElement("DIV");
                    tmp.innerHTML = html;
                    return tmp.textContent || tmp.innerText || "";
                };

                html += `
                    <tr class="${rowClass}">
                        <td class="col-stt" style="text-align: center; vertical-align: middle;">${task.stt || ''}</td>
                        <td class="col-ngay">
                            <div style="font-weight:bold; color:var(--text-secondary); font-size: 13px; margin-bottom: 4px; text-align: center;">Đăng: ${task.ngayDang || '---'}</div>
                            ${task.deadline ? `<div class="${deadlineClass}" style="padding: 4px; border-radius: 4px; text-align: center; font-weight: bold; width: 100%; min-width: 90px; display: inline-block;">Hạn: ${deadlineText}</div>` : ''}
                        </td>
                        <td class="col-muctieu td-green"><span class="task-content-text">${task.mucTieu || ''}</span></td>
                        <td class="col-tieude td-green"><span class="task-content-text" style="font-weight: bold;">${task.tieuDe || ''}</span></td>
                        <td class="col-noidung td-green"><span class="task-content-text" style="text-align:justify;">${stripHtml(task.noiDung)}</span></td>
                        <td class="col-dinhdang"><span class="task-content-text">${task.dinhDang || ''}</span></td>
                        <td class="col-order"><span class="task-content-text" style="text-align:justify;">${stripHtml(task.orderBrief)}</span></td>
                        <td class="col-phancong" style="text-align:center; vertical-align:middle;">
                            ${task.owner
                                ? `<span class="badge badge-orange" style="font-size:12px; padding:4px 8px;"><i class="fa-solid fa-user"></i> ${task.owner}</span>`
                                : `<span style="color:var(--text-secondary); font-size:11px;">Chưa giao</span>`
                            }
                        </td>
                        <td class="col-trangthai">
                            ${canEditStatus
                                ? `<select class="form-control ${statusClass}" style="font-size: 13px; font-weight:600; padding:4px 8px; border-radius:4px;" onchange="WorkModule.changeTaskStatus('${task.id}', this.value)">${statusOptions}</select>`
                                : `<span class="badge ${statusClass}" style="font-size:12px; padding:5px 10px; display:block; text-align:center; border-radius:4px;">${task.trangThai || 'Planned'}</span>`
                            }
                        </td>
                        <td class="col-ghichu"><span class="task-content-text">${task.ghiChu || ''}</span></td>
                        <td class="col-anh" style="text-align:center;">
                            ${imgCellContent}
                        </td>
                        <td class="col-ticket" style="text-align:center; vertical-align:middle;">
                            <button class="btn btn-warning btn-sm" title="Mở Phiếu Làm Việc" onclick="WorkModule.openTicketModal('${task.id}')" style="font-weight: bold; width: 100%; height: 36px;">
                                <i class="fa-solid fa-ticket"></i> Mở
                            </button>
                        </td>
                        <td class="col-actions" style="text-align:center; vertical-align:middle;">
                            <button class="btn btn-danger btn-sm" title="Xóa" onclick="WorkModule.deleteTask('${task.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            // Hidden file input for image uploads globally handled
            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        });

        // Add single hidden file input for images
        html += `<input type="file" id="hidden-image-upload" accept="image/*" style="display:none;" onchange="WorkModule.handleImageSelection(event)">`;

        container.innerHTML = html;
    },

    changeTaskStatus: async (id, newStatus) => {
        const task = WorkModule.data.tasks.find(t => t.id === id);
        if (task) {
            const currentUser = Auth.currentUser;
            if (!currentUser || (currentUser.role !== 'admin' && task.owner !== currentUser.username)) {
                Utils.showToast('Bạn không có quyền thay đổi trạng thái công việc này!', 'error');
                WorkModule.filterByRole(); // Reset dropdown về giá trị cũ
                return;
            }
            task.trangThai = newStatus;
            await WorkModule.save();
            Utils.showToast('Cập nhật trạng thái thành công!', 'success');
        }
    },

    toggleTaskStatus: async (id) => {
        const task = WorkModule.data.tasks.find(t => t.id === id);
        if (task) {
            const isDone = task.trangThai && task.trangThai.toLowerCase().includes('done');
            task.trangThai = isDone ? 'Planned' : 'Done';
            await WorkModule.save();
            Utils.showToast('Cập nhật công việc trong ngày!', 'success');
        }
    },

    // Image Upload Handling
    activeImageTaskId: null,

    triggerImageUpload: (taskId) => {
        WorkModule.activeImageTaskId = taskId;
        document.getElementById('hidden-image-upload').click();
    },

    handleImageSelection: (event) => {
        const file = event.target.files[0];
        if (!file || !WorkModule.activeImageTaskId) return;

        // Ensure it's an image
        if (!file.type.startsWith('image/')) {
            Utils.showToast('Vui lòng chọn một tập tin hình ảnh.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target.result;

            // Find task and save image data
            const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeImageTaskId);
            if (task) {
                task.anhData = base64Data;
                await WorkModule.save();
            }

            WorkModule.activeImageTaskId = null;
            event.target.value = ''; // Reset input
        };

        reader.readAsDataURL(file);
    },
    deleteTask: async (id) => {
        if (await Utils.showConfirm('Xác nhận Xóa', 'Bạn có chắc muốn xóa dòng công việc này?')) {
            WorkModule.data.tasks = WorkModule.data.tasks.filter(t => t.id !== id);
            await WorkModule.save();
        }
    },

    // Tab Switching Logic
    switchAITab: (tabId) => {
        document.querySelectorAll('.ai-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ai-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        const btn = document.querySelector(`button[onclick="WorkModule.switchAITab('${tabId}')"]`);
        if (btn) btn.classList.add('active');
    },

    // --- PHASE 2: TICKET VIEW MODULE & AUTOMATION ---
    activeTicketId: null,

    openTicketModal: (id) => {
        const task = WorkModule.data.tasks.find(t => t.id === id);
        if (!task) return;

        WorkModule.activeTicketId = id;

        // Fill Readonly Fields
        document.getElementById('ticket-subtitle').textContent = `Dự án: ${task.project} - Nguồn: ${task.owner}`;
        document.getElementById('ticket-ngay').textContent = task.ngayDang || '--';
        document.getElementById('ticket-muctieu').textContent = task.mucTieu || '--';
        document.getElementById('ticket-trucot').textContent = task.truCot || '--';
        document.getElementById('ticket-dinhdang').textContent = task.dinhDang || '--';
        document.getElementById('ticket-deadline').textContent = task.deadline || '--';

        // Fill Editable Fields
        document.getElementById('ticket-tieude').value = task.tieuDe || '';
        document.getElementById('ticket-noidung').innerHTML = task.noiDung || '';
        document.getElementById('ticket-order').innerHTML = task.orderBrief || '';
        document.getElementById('ai-tomtat').innerHTML = task.aiTomTat || '';
        document.getElementById('ai-kichban').innerHTML = task.aiKichBan || '';
        document.getElementById('ai-zalo').innerHTML = task.aiZalo || '';

        document.getElementById('ticket-trangthai').value = task.trangThai || 'Planned';
        document.getElementById('ticket-schedule-time').value = task.scheduledFbTime || '';

        // Reset về tab đầu tiên
        WorkModule.switchAITab('tab-tomtat');

        // Fill Image Preview
        const imgPreview = document.getElementById('ticket-img-preview');
        if (task.anhData) {
            imgPreview.innerHTML = `<img src="${task.anhData}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            imgPreview.innerHTML = `<i class="fa-solid fa-image" style="color: var(--text-secondary);"></i>`;
        }

        document.getElementById('ticket-modal-overlay').classList.add('active');
    },

    closeTicketModal: () => {
        document.getElementById('ticket-modal-overlay').classList.remove('active');
        WorkModule.activeTicketId = null;
    },

    saveTicketModal: async () => {
        if (!WorkModule.activeTicketId) return;
        const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeTicketId);
        if (task) {
            task.tieuDe = document.getElementById('ticket-tieude').value;
            task.noiDung = document.getElementById('ticket-noidung').innerHTML;
            task.orderBrief = document.getElementById('ticket-order').innerHTML;
            task.aiTomTat = document.getElementById('ai-tomtat').innerHTML;
            task.aiKichBan = document.getElementById('ai-kichban').innerHTML;
            task.aiZalo = document.getElementById('ai-zalo').innerHTML;

            task.scheduledFbTime = document.getElementById('ticket-schedule-time').value;
            task.trangThai = document.getElementById('ticket-trangthai').value;

            await WorkModule.save();
            Utils.showToast('Đã lưu Phiếu Làm Việc!', 'success');

            // --- TÍCH HỢP AUTO-PUBLISH WEBHOOK ---
            if (task.trangThai === 'Đã lên lịch FB' && task.scheduledFbTime) {
                 try {
                     Utils.showToast('Đang truyền dữ liệu Auto-Publish...', 'info');
                     let tmpEl = document.createElement("DIV");
                     tmpEl.innerHTML = task.noiDung;
                     let cleanContent = tmpEl.textContent || tmpEl.innerText || "";
                     let payload = {
                         message: (task.tieuDe ? task.tieuDe.toUpperCase() + "\\n\\n" : "") + cleanContent,
                         imageUrl: task.anhData || '',
                         scheduledTime: task.scheduledFbTime,
                         taskId: task.id
                     };
                     fetch('https://hook.eu1.make.com/iye5sbzfo7iyx2emljm5l8fya8ni53h9', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(payload)
                     });
                     Utils.showToast('Đã bắn tín hiệu đến trạm Make.com 🚀', 'success');
                 } catch(err) {
                     console.error('Webhook error:', err);
                 }
            }

            WorkModule.closeTicketModal();
        }
    },

    handleTicketImageUpload: (event) => {
        const file = event.target.files[0];
        if (!file || !WorkModule.activeTicketId) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target.result;
            const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeTicketId);
            if (task) {
                task.anhData = base64Data;
                // Update preview immediately
                document.getElementById('ticket-img-preview').innerHTML = `<img src="${base64Data}" style="width:100%; height:100%; object-fit:cover;">`;
            }
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    },

// AI Local Simulator Logic
// Helper renderers for AI structured output
    renderAITomTat: (data) => {
        if (!data) return '';
        const tags = Array.isArray(data.dauRa) ? data.dauRa.map((d, i) => {
            let color = 'blue';
            if (i % 4 === 1) color = 'green';
            if (i % 4 === 2) color = 'orange';
            if (i % 4 === 3) color = 'red';
            return `<span class="ai-tag ${color}">${d}</span>`;
        }).join('') : '';

        const trienKhai = Array.isArray(data.cachTrienKhai) ? data.cachTrienKhai.map(t => `<li>${t}</li>`).join('') : '';
        const luuY = Array.isArray(data.luuY) ? data.luuY.map(t => `<li>${t}</li>`).join('') : '';

        return `
    <span class="ai-section-title">PHIẾU LÀM VIỆC — MARKETING</span>
    <div class="ai-card-grid-2">
      <div class="ai-card">
        <div class="ai-card-title">MỤC TIÊU</div>
        <div class="ai-card-value">${data.mucTieu || ''}</div>
      </div>
      <div class="ai-card">
        <div class="ai-card-title">ĐỊNH DẠNG</div>
        <div class="ai-card-value">${data.dinhDang || ''}</div>
      </div>
      <div class="ai-card">
        <div class="ai-card-title">CHỦ ĐỀ</div>
        <div class="ai-card-value">${data.chuDe || ''}</div>
      </div>
      <div class="ai-card">
        <div class="ai-card-title">PHONG CÁCH THIẾT KẾ</div>
        <div class="ai-card-value">${data.phongCach || ''}</div>
      </div>
    </div>

    <span class="ai-section-title">NỘI DUNG CHÍNH</span>
    <div class="ai-block-card ai-block">
      <b>Tiêu đề:</b> ${data.tieuDe || ''}<br><br>
      <b>Điểm nhấn:</b> ${data.diemNhan || ''}
    </div>

    <span class="ai-section-title">CÁCH TRIỂN KHAI</span>
    <div class="ai-block-card ai-block">
      <ol class="ai-list">${trienKhai}</ol>
    </div>

    <span class="ai-section-title">ĐẦU RA CẦN LÀM</span>
    <div class="ai-tag-group ai-block">${tags}</div>

    <span class="ai-section-title">LƯU Ý QUAN TRỌNG</span>
    <div class="ai-block-card ai-block">
      <ul class="ai-list" style="list-style-type: disc;">${luuY}</ul>
    </div>`;
    },

    renderAIKichBan: (data) => {
        if (!data) return '';
        return `
    <span class="ai-section-title">KỊCH BẢN VIDEO NGẮN — 20–30 GIÂY</span>
    <div class="ai-block-card ai-block">
      <b>🎬 HOOK (0–5 giây)</b><br>
      ${(data.hook || '').replace(/\n/g, '<br>')}<br><br>
      <b>📌 NỘI DUNG CHÍNH (5–22 giây)</b><br>
      ${(data.noiDung || '').replace(/\n/g, '<br>')}<br><br>
      <b>📣 CTA (22–30 giây)</b><br>
      ${(data.cta || '').replace(/\n/g, '<br>')}
    </div>

    <span class="ai-section-title">GHI CHÚ SẢN XUẤT</span>
    <div class="ai-card-grid-2">
      <div class="ai-card">
        <div class="ai-card-title">ÂM NHẠC</div>
        <div class="ai-card-value">${data.amNhac || ''}</div>
      </div>
      <div class="ai-card">
        <div class="ai-card-title">PHONG CÁCH QUAY</div>
        <div class="ai-card-value">${data.phongCachQuay || ''}</div>
      </div>
      <div class="ai-card">
        <div class="ai-card-title">MÀU SẮC CHỦ ĐẠO</div>
        <div class="ai-card-value">${data.mauSac || ''}</div>
      </div>
      <div class="ai-card">
        <div class="ai-card-title">PHÙ HỢP ĐĂNG</div>
        <div class="ai-card-value">${data.phuHopDang || ''}</div>
      </div>
    </div>`;
    },

    renderAICaption: (data) => {
        if (!data || !Array.isArray(data)) return '';
        return data.map((cap, i) => `
      <span class="ai-section-title" style="margin-top: ${i > 0 ? '16px' : '0'};">${(cap.tieuDe || '').toUpperCase()}</span>
      <div class="ai-block-card ai-block">
        ${(cap.noiDung || '').replace(/\n/g, '<br>')}
      </div>
    `).join('');
    },

    renderAIYTuong: (data) => {
        if (!data || !Array.isArray(data)) return '';
        const cards = data.map((yt, i) => `
    <div class="ai-ytuong-card">
      <div class="ai-ytuong-number">0${i + 1}</div>
      <div class="ai-card-title">CONCEPT</div>
      <div class="ai-card-value" style="margin-bottom:12px;">${yt.concept || ''}</div>
      
      <div class="ai-card-title">BỐ CỤC</div>
      <div style="font-size: 13px; margin-bottom:12px;">${yt.boCuc || ''}</div>

      <div class="ai-card-title">MÀU SẮC</div>
      <div style="font-size: 13px; margin-bottom:12px;">${yt.mauSac || ''}</div>

      <div class="ai-card-title">CẢM GIÁC</div>
      <div style="font-size: 13px;">${yt.camGiac || ''}</div>
    </div>`).join('');
        return `<div class="ai-ytuong-grid">${cards}</div>`;
    },

    renderAIZalo: (data) => {
        if (!data || !Array.isArray(data)) return '';
        return data.map((z, i) => `
      <span class="ai-section-title" style="margin-top: ${i > 0 ? '16px' : '0'};">${z.tieuDe || ''}</span>
      <div class="ai-block-card ai-block">
        ${(z.noiDung || '').replace(/\n/g, '<br>')}
      </div>
    `).join('');
    },

    // AI Local Simulator Logic
    generateAILocal: async () => {
        const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeTicketId);
        if (!task) return;

        let tieuDe = document.getElementById('ticket-tieude').value || task.tieuDe || 'chủ đề này';
        let mucTieu = task.mucTieu || '';
        let truCot = task.truCot || '';
        let dinhDang = (task.dinhDang || '').toLowerCase();
        
        // KIẾM TRA CLAUDE API KEY
        const claudeKey = Utils.storage.get('claude_api_key');
        
        const btn = document.getElementById('btn-ai-generate') || document.querySelector('.btn-warning[onclick="WorkModule.generateAILocal()"]');
        const originalBtnHtml = btn.innerHTML;

        if (claudeKey && claudeKey.trim() !== '') {
            Utils.showToast('Đang kết nối Claude AI tạo 5 mục (Vui lòng đợi 10-20 giây)...', 'info');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG TẠO...';
            btn.disabled = true;

            const prompt = `Bạn là một chuyên gia Marketing siêu hạng. Hãy lập kế hoạch toàn diện cho một phi vụ truyền thông dựa trên:
Mục tiêu chiến dịch: ${mucTieu}
Chủ đề: ${truCot}
Tiêu đề: ${tieuDe}
Định dạng: ${dinhDang}

HÃY TRẢ VỀ DUY NHẤT 1 CHUỖI JSON ĐÚNG ĐỊNH DẠNG (Không có text bên ngoài, không giải thích, không dùng markdown code block \`\`\`json). 
Cấu trúc JSON bắt buộc phải chính xác như sau:
{
  "tomTat": {
    "mucTieu": "...", "dinhDang": "...", "chuDe": "...", "phongCach": "...", "tieuDe": "...", "diemNhan": "...",
    "cachTrienKhai": ["B1...", "B2...", "B3...", "B4..."],
    "dauRa": ["3-5 ảnh...", "1 video...", "3 caption..."],
    "luuY": ["Lưu ý 1...", "Lưu ý 2..."]
  },
  "kichBan": {
    "hook": "Cảnh: ...\\nLời thoại: ...",
    "noiDung": "Cảnh 1: ...\\nCảnh 2: ...\\nText: ...",
    "cta": "Cảnh: ...\\nLời thoại: ...",
    "amNhac": "...", "phongCachQuay": "...", "mauSac": "...", "phuHopDang": "..."
  },
  "caption": [
    { "tieuDe": "Caption 1 - Bán hàng trực tiếp", "noiDung": "..." },
    { "tieuDe": "Caption 2 - Branding nhẹ", "noiDung": "..." },
    { "tieuDe": "Caption 3 - Ngắn gọn dễ đăng", "noiDung": "..." }
  ],
  "yTuong": [
    { "concept": "...", "boCuc": "...", "mauSac": "...", "camGiac": "..." },
    { "concept": "...", "boCuc": "...", "mauSac": "...", "camGiac": "..." },
    { "concept": "...", "boCuc": "...", "mauSac": "...", "camGiac": "..." }
  ],
  "zalo": [
    { "tieuDe": "Mẫu 1 - Lịch sự, chuyên nghiệp", "noiDung": "..." },
    { "tieuDe": "Mẫu 2 - Ngắn gọn, thân thiện", "noiDung": "..." }
  ]
}
Chỉ xuất ra đúng chuỗi JSON, không giải thích hay bao bọc XML/HTML.`;

            const activeModel = Utils.storage.get('claude_api_model') || 'claude-3-haiku-20240307';
            // Thêm random seed để đảm bảo AI trả về kết quả khác nhau mỗi lần
            const randomSeed = Math.random().toString(36).substring(7);
            const finalPrompt = prompt + `\n\n[Bắt buộc: Bạn hãy nghĩ ra các ý tưởng hoang dã, góc nhìn hoàn toàn MỚI LẠ. Sử dụng văn phong, từ vựng và cấu trúc hoàn toàn KHÁC BIỆT so với các mẫu thông thường! Mã tạo ngẫu nhiên để ép tính sáng tạo: ${randomSeed}]`;

            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': claudeKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json',
                        'anthropic-dangerous-direct-browser-access': 'true' // Bắt buộc cho trình duyệt
                    },
                    body: JSON.stringify({
                        model: activeModel,
                        max_tokens: 4096,
                        temperature: 0.9,
                        messages: [
                            { role: "user", content: finalPrompt }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error('API Request Failed: ' + response.statusText);
                }

                const data = await response.json();
                let aiText = data.content[0].text;
                
                // Trích xuất JSON an toàn (Xử lý cả trường hợp Claude nói 'Dạ đây là JSON: ...')
                aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
                const startIdx = aiText.indexOf('{');
                const endIdx = aiText.lastIndexOf('}');
                
                if (startIdx !== -1 && endIdx !== -1) {
                    aiText = aiText.substring(startIdx, endIdx + 1);
                }
                
                const aiDataObj = JSON.parse(aiText);

                // Gán vào giao diện
                document.getElementById('ai-tomtat').innerHTML = WorkModule.renderAITomTat(aiDataObj.tomTat);
                document.getElementById('ai-kichban').innerHTML = WorkModule.renderAIKichBan(aiDataObj.kichBan);
                document.getElementById('ticket-noidung').innerHTML = WorkModule.renderAICaption(aiDataObj.caption);
                document.getElementById('ticket-order').innerHTML = WorkModule.renderAIYTuong(aiDataObj.yTuong);
                document.getElementById('ai-zalo').innerHTML = WorkModule.renderAIZalo(aiDataObj.zalo);
                
                Utils.showToast('Đã tạo thành công đủ 5 mục bằng AI!', 'success');
            } catch (error) {
                console.error("Claude API Error:", error);
                Utils.showToast('Lỗi khi gọi API hoặc định dạng JSON không hợp lệ. Vui lòng thử lại!', 'error');
            }
            btn.innerHTML = originalBtnHtml;
            btn.disabled = false;

        } else {
            // FALLBACK LOCAL MOCKUP KHI KHÔNG CÓ API
            Utils.showToast('Chưa có API Key. Đang tạo Bản nháp Mẫu...', 'info');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG TẠO...';
            btn.disabled = true;
            
            setTimeout(() => {
                const styles = ['Sang trọng', 'Tối giản', 'Phá cách', 'Hiện đại', 'Cổ điển', 'Đường phố'];
                const randStyle = styles[Math.floor(Math.random() * styles.length)];
                
                const angles = ['Tập trung vào tính năng', 'Mang yếu tố hài hước', 'Chạm vào cảm xúc', 'So sánh trực diện'];
                const randAngle = angles[Math.floor(Math.random() * angles.length)];

                const mockupList = [
                    {
                        "tomTat": {
                            "mucTieu": mucTieu || "Tạo độ phủ thương hiệu, tăng chuyển đổi",
                            "dinhDang": dinhDang || "Video/Ảnh chất lượng cao",
                            "chuDe": truCot || tieuDe || "Định hình phong cách mới",
                            "phongCach": "Sang trọng, Tối giản (Minimalism)",
                            "tieuDe": (tieuDe || "Sự Tinh Tế Đích Thực") + " - Luxury Vibes",
                            "diemNhan": "Hướng tiếp cận: Kể chuyện bằng hình ảnh, tập trung vào chi tiết đắt giá.",
                            "cachTrienKhai": [
                                "Brainstorm kịch bản quay cận cảnh (macro) sản phẩm",
                                "Sử dụng ánh sáng ven (rim light) tạo chiều sâu",
                                "Chỉnh màu tông ấm, trầm, mang lại cảm giác đắt tiền"
                            ],
                            "dauRa": ["3 ảnh macro xịn sò", "1 video Cinematic 15s", "Caption thả thính nhẹ nhàng"],
                            "luuY": [
                                "Không chèn text quá to lấn át hình ảnh",
                                "Âm nhạc không lời, du dương, có điểm nhấn bass"
                            ]
                        },
                        "kichBan": {
                            "hook": "Cảnh: Góc quay chậm (slow-motion) lướt qua bề mặt sản phẩm.\\nLời thoại: Không cần lên tiếng để thể hiện đẳng cấp...",
                            "noiDung": "Cảnh 1: Bối cảnh sang trọng, người mẫu tự tin xuất hiện.\\nCảnh 2: Sản phẩm là tâm điểm ánh nhìn.\\nText: Tinh hoa hội tụ.",
                            "cta": "Cảnh: Đặt sản phẩm trang trọng trên mặt bàn kính.\\nLời thoại: Trải nghiệm sự hoàn mỹ tại link Bio.",
                            "amNhac": "Strings & Piano (Cinematic)",
                            "phongCachQuay": "Slow-motion, Gimbal mượt mà",
                            "mauSac": "Đen trầm, Vàng Gold, Trắng ánh kim",
                            "phuHopDang": "Reels, Instagram Stories"
                        },
                        "caption": [
                            { "tieuDe": "Caption 1 - Branding", "noiDung": "Người tinh tế luôn biết cách chọn những điều nhỏ nhất để tỏa sáng. ✨ Khám phá bộ sưu tập mới nhất. #Luxury #Lifestyle" },
                            { "tieuDe": "Caption 2 - Tự sự", "noiDung": "Đôi khi, câu trả lời nằm ở những chi tiết mà người vội vã dễ bỏ lỡ..." },
                            { "tieuDe": "Caption 3 - Kêu gọi hành động ngắn", "noiDung": "Đẳng cấp không cần thiết kế rườm rà. 👉 Nhấn nhẹ để sở hữu." }
                        ],
                        "yTuong": [
                            { "concept": "Cinematic Story", "boCuc": "Luật 1/3, đường dẫn góc ảnh", "mauSac": "Cyberpunk Neon", "camGiac": "Kịch tính" },
                            { "concept": "Flat lay", "boCuc": "Cân bằng động học, không gian âm (negative space)", "mauSac": "Off-white", "camGiac": "Sạch sẽ, đáng tin" }
                        ],
                        "zalo": [
                            { "tieuDe": "Mẫu cho Khách VIP", "noiDung": "Chào anh/chị, em xin phép gửi thông tin bản pre-order cực kỳ giới hạn bên em ạ. Anh chị kiểm tra nhé." }
                        ]
                    },
                    {
                        "tomTat": {
                            "mucTieu": mucTieu || "Trend bắt đáy, chốt đơn tức thì",
                            "dinhDang": dinhDang || "Short Video/Tiktok",
                            "chuDe": truCot || tieuDe || "Giải quyết nỗi đau khách hàng",
                            "phongCach": "Hài hước, Năng động, Thẳng thắn",
                            "tieuDe": (tieuDe || "Sự Thật Phũ Phàng") + " - POV Comedy",
                            "diemNhan": "Hướng tiếp cận: Làm quá (exaggerate) sự bất tiện khi không có sản phẩm.",
                            "cachTrienKhai": [
                                "Viết hook sốc, ngược đời trong 2 giây đầu",
                                "Diễn xuất lố, mảng miếng hài tình huống (POV)",
                                "Text overlay siêu to khổng lồ"
                            ],
                            "dauRa": ["1 Video TikTok Viral 30s", "1 Meme ảnh chế", "Caption giật gân"],
                            "luuY": [
                                "Luôn có CTA chốt sale mạnh",
                                "Năng lượng phải cao (high energy) suốt video"
                            ]
                        },
                        "kichBan": {
                            "hook": "Cảnh: Diễn viên vò đầu bứt tai ngã gục.\\nText to đùng: \"TÔI ĐÃ SAI MẤT RỒI...\"",
                            "noiDung": "Cảnh 1: Kể khổ vì thói quen cũ.\\nCảnh 2: Quăng ngay sản phẩm vào mặt cam, âm thanh bùm chéo.\\nText: \"Giải pháp đâyyy!\"",
                            "cta": "Cảnh: Chỉ thẳng vào vị trí nút giỏ hàng.\\nLời thoại: Mua ngay không hết deal hời!",
                            "amNhac": "Nhạc trend TikTok dập bass mạnh hoặc Funny SFX",
                            "phongCachQuay": "Selfie góc rộng hoặc zoom giật cục",
                            "mauSac": "Rực rỡ, độ tương phản cao",
                            "phuHopDang": "TikTok, Trạng thái đa nền tảng"
                        },
                        "caption": [
                            { "tieuDe": "Caption 1 - Bắt Trend", "noiDung": "Ét o ét!!! Ai còn dùng cách cũ thì update liền nha. Xài đồ nhà em chỉ có nhàn cái thân thôi 😂 👉 Click ngay!" },
                            { "tieuDe": "Caption 2 - Nỗi Đau Thực Tế", "noiDung": "Cứ thấy bảo khó, dùng thử cái này xong quên luôn khái niệm khó là gì." }
                        ],
                        "yTuong": [
                            { "concept": "POV Thực Tế", "boCuc": "Cầm tay, rung lắc nhẹ (POV)", "mauSac": "Sặc sỡ", "camGiac": "Chân thật, Vui nhộn" },
                            { "concept": "So Sánh Ngốc Nghếch", "boCuc": "Chia đôi màn hình Before/After lố bịch", "mauSac": "Tương phản mạnh", "camGiac": "So sánh mạnh" }
                        ],
                        "zalo": [
                            { "tieuDe": "Mẫu cho gen Z/Trẻ hóa", "noiDung": "Sếp ơii, gửi sếp quả kịch bản hài ẻ vừa nung xong. Quả này không viral là do... lỗi của nền tảng nha 😂" }
                        ]
                    },
                    {
                        "tomTat": {
                            "mucTieu": mucTieu || "Cung cấp kiến thức chuyên sâu",
                            "dinhDang": dinhDang || "Bài viết chuyên sâu kèm Đồ họa",
                            "chuDe": truCot || tieuDe || "Đào tạo & Định hình tư duy",
                            "phongCach": "Chuyên nghiệp, Học thuật, Rõ ràng",
                            "tieuDe": (tieuDe || "Góc Nhìn Thực Tế") + " - Kiến thức nền tảng",
                            "diemNhan": "Hướng tiếp cận: Liệt kê số liệu, minh chứng vòng lặp lý thuyết.",
                            "cachTrienKhai": [
                                "Chia nhỏ ý thành bullet point dễ đọc",
                                "Sử dụng đồ thị / Infographic làm minh họa",
                                "Dẫn nguồn thông tin uy tín"
                            ],
                            "dauRa": ["Infographic 5 trang", "Bài viết phân tích dài 800 chữ"],
                            "luuY": [
                                "Tránh sai sót chính tả và số liệu",
                                "Đóng gói kiến thức bằng checklist cuối bài"
                            ]
                        },
                        "kichBan": {
                            "hook": "Cảnh: Số liệu thực tế bay lơ lửng trên màn hình.\\nLời thoại: 80% người dùng sai lầm trong việc...",
                            "noiDung": "Cảnh 1: Giải thích nguyên nhân gốc rễ.\\nCảnh 2: Mô hình hóa cách giải quyết từng bước.",
                            "cta": "Cảnh: Quét mã QR hiện trên màn hình.\\nLời thoại: Lưu lại ngay checklist đầy đủ ở đây.",
                            "amNhac": "Corporate/Nhạc nền tin tức",
                            "phongCachQuay": "Setup góc Podcast/Chuyên gia tĩnh",
                            "mauSac": "Xanh dương, Trắng, Xanh lá cây (Tin cậy)",
                            "phuHopDang": "LinkedIn, Facebook Group Chuyên môn"
                        },
                        "caption": [
                            { "tieuDe": "Caption 1 - Chiều Sâu", "noiDung": "Bạn có biết? Số liệu chỉ ra rằng việc thay đổi tư duy quyết định đến 90% kết quả. Hãy cùng phân tích tại sao 🧐👇 [Link chi tiết]" },
                            { "tieuDe": "Caption 2 - Dạng Checklist", "noiDung": "3 sai lầm lớn nhất thường mắc phải:\n1. Bỏ qua chi tiết\n2. Cẩu thả...\nCùng giải mã cách khắc phục triệt để." }
                        ],
                        "yTuong": [
                            { "concept": "Chuyên gia phân tích", "boCuc": "Luật 1/3, có bảng/màn hình phụ minh họa", "mauSac": "Xanh blue navy, Trắng", "camGiac": "Tin cậy, Dày dặn kinh nghiệm" }
                        ],
                        "zalo": [
                            { "tieuDe": "Lời gửi trang trọng", "noiDung": "Dạ em gửi anh chị chuyên đề nghiên cứu nội dung tuần này. Các số liệu đã được chuẩn hóa, mong anh chị kiểm duyệt." }
                        ]
                    }
                ];

                const mockupObj = mockupList[Math.floor(Math.random() * mockupList.length)];

                document.getElementById('ai-tomtat').innerHTML = WorkModule.renderAITomTat(mockupObj.tomTat);
                document.getElementById('ai-kichban').innerHTML = WorkModule.renderAIKichBan(mockupObj.kichBan);
                document.getElementById('ticket-noidung').innerHTML = WorkModule.renderAICaption(mockupObj.caption);
                document.getElementById('ticket-order').innerHTML = WorkModule.renderAIYTuong(mockupObj.yTuong);
                document.getElementById('ai-zalo').innerHTML = WorkModule.renderAIZalo(mockupObj.zalo);

                btn.innerHTML = originalBtnHtml;
                btn.disabled = false;
                Utils.showToast('Đã sinh thành công Templates!', 'success');
            }, 1000);
        }
    },

    copyActiveTabContent: () => {
        const activeTabElement = document.querySelector('.ai-tab-content.active .ai-rich-content');
        if (!activeTabElement) return;
        
        const content = activeTabElement.innerText.trim();
        if (!content) {
            Utils.showToast('Nội dung thẻ đang trống!', 'warning');
            return;
        }

        navigator.clipboard.writeText(content).then(() => {
            Utils.showToast("Đã copy nội dung thẻ đang xem!", "success");
        }).catch(err => {
            console.error('Không thể copy', err);
            Utils.showToast("Lỗi khi copy.", "error");
        });
    },

    copyAllTabsContent: () => {
        const tomtat = document.getElementById('ai-tomtat').innerText.trim();
        const kichban = document.getElementById('ai-kichban').innerText.trim();
        const caption = document.getElementById('ticket-noidung').innerText.trim();
        const ytuong = document.getElementById('ticket-order').innerText.trim();
        const zalo = document.getElementById('ai-zalo').innerText.trim();

        if (!tomtat && !kichban && !caption && !ytuong && !zalo) {
            Utils.showToast('Không có nội dung nào để copy!', 'warning');
            return;
        }

        let fullContent = "=== 1. PHIẾU TÓM TẮT ===\n" + tomtat + "\n\n";
        fullContent += "=== 2. KỊCH BẢN VIDEO ===\n" + kichban + "\n\n";
        fullContent += "=== 3. CAPTION MẠNG XÃ HỘI ===\n" + caption + "\n\n";
        fullContent += "=== 4. Ý TƯỞNG THIẾT KẾ & QUAY DỰNG ===\n" + ytuong + "\n\n";
        fullContent += "=== 5. MẪU TIN NHẮN ZALO ===\n" + zalo + "\n";

        navigator.clipboard.writeText(fullContent).then(() => {
            Utils.showToast("Đã copy thành công TOÀN BỘ 5 BẢNG AI!", "success");
        }).catch(err => {
            console.error('Không thể copy', err);
            Utils.showToast("Lỗi khi copy toàn bộ.", "error");
        });
    },

    copyZaloMessage: () => {
        const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeTicketId);
        if (!task) return;

        const dateStr = task.ngayDang || Utils.getTodayString();
        const contentStr = document.getElementById('ticket-noidung').innerText || task.noiDung || "(Chưa có nội dung chi tiết)";

        const message = `Em gửi anh/chị nội dung lên bài ngày ${dateStr} gồm:\n\n`
            + `👉 Chủ đề: ${task.tieuDe || task.truCot || 'N/A'}\n`
            + `👉 Định dạng: ${task.dinhDang || 'N/A'}\n\n`
            + `Nội dung Caption/Kịch bản dự kiến:\n--------------------\n${contentStr}\n--------------------\n\n`
            + `Nhờ anh/chị xem giúp em ạ!`;

        navigator.clipboard.writeText(message).then(() => {
            Utils.showToast("Đã copy tin nhắn Zalo vào bộ nhớ đệm!", "success");
        }).catch(err => {
            console.error('Không thể copy', err);
            Utils.showToast("Lỗi khi copy tin nhắn.", "error");
        });
    }
};
