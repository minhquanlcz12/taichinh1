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
            DB.listenWorkData((d) => {
                if (d && d.tasks) {
                    WorkModule.data = d;
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
            // If not admin, only show tasks owned by this user
            displayTasks = displayTasks.filter(t => t.owner === currentUser.username);
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
        // Return active tasks for dashboard
        let tasks = WorkModule.data.tasks;
        const currentUser = Auth.currentUser;
        if (currentUser) {
            if (currentUser.role !== 'admin') {
                tasks = tasks.filter(t => t.owner === currentUser.username);
            }
        }

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

                    const taskObj = {
                        id: Utils.generateId(),
                        project: projectName,
                        stt: safeGet(colMap.stt),
                        ngayDang: colMap.ngayDang !== undefined ? Utils.convertExcelDate(row[colMap.ngayDang]) : '',
                        thu: safeGet(colMap.thu),
                        mucTieu: safeGet(colMap.mucTieu),
                        truCot: safeGet(colMap.truCot),
                        tieuDe: safeGet(colMap.tieuDe),
                        noiDung: safeGet(colMap.noiDung),
                        dinhDang: safeGet(colMap.dinhDang),
                        orderBrief: safeGet(colMap.orderBrief),
                        deadline: colMap.deadline !== undefined ? Utils.convertExcelDate(row[colMap.deadline]) : '',
                        trangThai: safeGet(colMap.trangThai) || 'Planned',
                        ghiChu: safeGet(colMap.ghiChu),
                        anhGoiY: safeGet(colMap.anhGoiY),
                        owner: Auth.currentUser ? Auth.currentUser.username : 'admin'
                    };

                    WorkModule.data.tasks.push(taskObj);
                    importedCount++;
                }

                Utils.showToast(`Đã nhập thành công ${importedCount} công việc vào kế hoạch "${projectName}".`, 'success');
                await WorkModule.save();

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
        if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ kế hoạch "${projectName}"? Hành động này không thể hoàn tác.`)) {
            WorkModule.data.tasks = WorkModule.data.tasks.filter(t => t.project !== projectName);
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
            let adminBadgeHtml = '';
            if (Auth.currentUser && Auth.currentUser.role === 'admin') {
                adminBadgeHtml = `<span class="badge badge-orange" style="font-size: 11px; margin-left: 8px;"><i class="fa-solid fa-user"></i> ${ownerNames}</span>`;
            }

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
                                        <th class="col-ngay">Ngày đăng</th>
                                        <th class="col-muctieu th-green">Mục tiêu</th>
                                        <th class="col-tieude th-green">Tiêu đề</th>
                                        <th class="col-dinhdang">Định dạng</th>
                                        <th class="col-deadline">Thứ - Deadline</th>
                                        <th class="col-trangthai">Trạng thái</th>
                                        <th class="col-actions" style="text-align: right;"><i class="fa-solid fa-gear"></i></th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            projTasks.forEach(task => {
                const isCompleted = task.trangThai && task.trangThai.toLowerCase().includes('done');
                let statusClass = '';
                const currentStatus = task.trangThai ? task.trangThai.toLowerCase() : 'planned';

                if (currentStatus.includes('planned')) statusClass = 'status-planned';
                if (isCompleted) statusClass = 'status-done';
                if (currentStatus.includes('doing')) statusClass = 'status-doing';

                // Status Dropdown Options
                const statuses = ['Planned', 'Doing', 'Done'];
                let statusOptions = statuses.map(s => {
                    const selected = task.trangThai.toLowerCase() === s.toLowerCase() ? 'selected' : '';
                    return `<option value="${s}" ${selected}>${s}</option>`;
                }).join('');

                // Deadline Logic
                let deadlineClass = '';
                if (task.deadline) {
                    const todayStr = Utils.getTodayString();
                    // Basic string comparison logic assuming YYYY-MM-DD
                    const todayTime = new Date(todayStr).getTime();
                    const deadlineTime = new Date(task.deadline).getTime();
                    if (!isNaN(todayTime) && !isNaN(deadlineTime)) {
                        const diffDays = Math.ceil((deadlineTime - todayTime) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 1) {
                            deadlineClass = 'deadline-danger';
                        } else if (diffDays === 2) {
                            deadlineClass = 'deadline-warning';
                        }
                    }
                }

                html += `
                    <tr class="${isCompleted ? 'row-completed' : ''}">
                        <td class="col-ngay" style="font-weight: 600;">${task.ngayDang}</td>
                        <td class="col-muctieu td-green"><span class="task-content-text">${task.mucTieu || '--'}</span></td>
                        <td class="col-tieude td-green">
                            <span class="task-content-text" style="font-size: 14px; font-weight: bold; color: var(--primary);">${task.tieuDe || 'Chưa có tiêu đề'}</span>
                        </td>
                        <td class="col-dinhdang"><span class="badge badge-gray">${task.dinhDang || '--'}</span></td>
                        <td class="col-deadline"><div class="${deadlineClass}" style="padding: 4px; border-radius: 4px; text-align: left;">${task.thu} ${task.deadline ? `<br>(Hạn: ${task.deadline})` : ''}</div></td>
                        <td class="col-trangthai">
                            <select class="form-control ${statusClass}" style="font-size: 12px; font-weight:600; padding:4px 8px; border-radius:4px; max-width: 120px;" onchange="WorkModule.changeTaskStatus('${task.id}', this.value)">
                                ${statusOptions}
                            </select>
                        </td>
                        <td class="col-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-warning btn-sm" title="Mở Phiếu Làm Việc" onclick="WorkModule.openTicketModal('${task.id}')" style="font-weight: bold; min-width: 100px;">
                                <i class="fa-solid fa-ticket"></i> MỞ PHIẾU
                            </button>
                            <button class="btn-text text-danger" title="Xóa" onclick="WorkModule.deleteTask('${task.id}')">
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
        if (confirm('Bạn có chắc muốn xóa dòng công việc này?')) {
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
        document.getElementById('ticket-noidung').value = task.noiDung || '';
        document.getElementById('ticket-order').value = task.orderBrief || '';
        document.getElementById('ai-tomtat').value = task.aiTomTat || '';
        document.getElementById('ai-kichban').value = task.aiKichBan || '';
        document.getElementById('ai-zalo').value = task.aiZalo || '';

        document.getElementById('ticket-trangthai').value = task.trangThai || 'Planned';

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
            task.noiDung = document.getElementById('ticket-noidung').value;
            task.orderBrief = document.getElementById('ticket-order').value;
            task.aiTomTat = document.getElementById('ai-tomtat').value;
            task.aiKichBan = document.getElementById('ai-kichban').value;
            task.aiZalo = document.getElementById('ai-zalo').value;

            task.trangThai = document.getElementById('ticket-trangthai').value;

            await WorkModule.save();
            Utils.showToast('Đã lưu Phiếu Làm Việc!', 'success');
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
    generateAILocal: async () => {
        const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeTicketId);
        if (!task) return;

        let tieuDe = document.getElementById('ticket-tieude').value || task.tieuDe || 'chủ đề này';
        let mucTieu = task.mucTieu || '';
        let truCot = task.truCot || '';
        let dinhDang = (task.dinhDang || '').toLowerCase();
        const isVideo = dinhDang.includes('video') || dinhDang.includes('reels') || dinhDang.includes('tiktok') || dinhDang.includes('short');

        // GET ACTIVE TAB
        const activeTabElement = document.querySelector('.ai-tab-content.active');
        const activeTabId = activeTabElement ? activeTabElement.id : 'tab-tomtat';

        // KIẾM TRA CLAUDE API KEY
        const claudeKey = Utils.storage.get('claude_api_key');
        
        if (claudeKey && claudeKey.trim() !== '') {
            Utils.showToast('Đang kết nối Claude AI (Vui lòng đợi vài giây)...', 'info');
            // Cập nhật giao diện (loading state)
            const btn = document.getElementById('btn-ai-generate') || document.querySelector('.btn-warning[onclick="WorkModule.generateAILocal()"]');
            const originalBtnHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG TẠO...';
            btn.disabled = true;

            let prompt = `Bạn là một chuyên gia Marketing và lên kế hoạch cực kỳ giỏi.
            Hãy viết nội dung dựa trên những thông tin sau:
            - Mục tiêu chiến dịch: ${mucTieu}
            - Chủ đề chính: ${truCot}
            - Tiêu đề mong muốn: ${tieuDe}
            - Định dạng yêu cầu: ${dinhDang}
            
            `;

            let targetInputId = '';
            
            if (activeTabId === 'tab-tomtat') {
                prompt += `Hãy trả về duy nhất 1 "Phiếu tóm tắt công việc" gọn gàng gồm: Mục tiêu chính, nội dung trọng yếu, cách triển khai, đầu ra cần hoàn thành.\n`;
                targetInputId = 'ai-tomtat';
            } else if (activeTabId === 'tab-kichban') {
                prompt += `Hãy trả về duy nhất kịch bản chi tiết ${isVideo ? '(Video/Reels)' : '(Bài đăng)'}. Có Hook (thu hút mở đầu), Thân bài/Painpoint, Kêu gọi hành động (CTA). Lời thoại dễ hiểu, cuốn hút.\n`;
                targetInputId = 'ai-kichban';
            } else if (activeTabId === 'tab-caption') {
                prompt += `Hãy trả về duy nhất 3 mẫu caption khác nhau:\n1. Bán hàng trực tiếp (kèm CTA/chốt sale)\n2. Kể chuyện branding nhẹ nhàng\n3. Caption siêu ngắn cho Video Reels/TikTok (tương tác cao)\n`;
                targetInputId = 'ticket-noidung';
            } else if (activeTabId === 'tab-ytuong') {
                prompt += `Hãy đóng vai trò là Art Director, trả về gợi ý 3 Concept/Ý tưởng hình ảnh hoặc quay video chi tiết (màu sắc, góc máy, mood/cảm giác tổng thể, text đặt lên ảnh nếu có) để đưa cho đội Thiết kế thực thi.\n`;
                targetInputId = 'ticket-order';
            } else if (activeTabId === 'tab-zalo') {
                prompt += `Hãy trả về duy nhất 2 mẫu tin nhắn Zalo gửi sếp hoặc gửi khách hàng để báo cáo/gửi kịch bản duyệt:\n1. Mẫu lịch sự, chuyên nghiệp.\n2. Mẫu thân thiện, ngắn gọn năng động.\n`;
                targetInputId = 'ai-zalo';
            } else {
                btn.innerHTML = originalBtnHtml;
                btn.disabled = false;
                return;
            }

            prompt += `Lưu ý: Chỉ trả về nội dung trực tiếp, không vòng vo giải thích, không dùng thẻ XML.`;

            const activeModel = Utils.storage.get('claude_api_model') || 'claude-3-haiku-20240307';
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
                        max_tokens: 2048,
                        messages: [
                            { role: "user", content: prompt }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error('API Request Failed: ' + response.statusText);
                }

                const data = await response.json();
                const aiText = data.content[0].text;
                
                // Map trực tiếp vào input tương ứng đang mở
                document.getElementById(targetInputId).value = aiText.trim();
                
                Utils.showToast('Tạo nội dung cho thẻ này thành công!', 'success');
            } catch (error) {
                console.error("Claude API Error:", error);
                Utils.showToast('Lỗi khi gọi API Claude (Sai Key hoặc lỗi Cors).', 'error');
                // Khôi phục nút
                btn.innerHTML = originalBtnHtml;
                btn.disabled = false;
                return;
            }

            // Khôi phục nút
            btn.innerHTML = originalBtnHtml;
            btn.disabled = false;

        } else {
            // FALLBACK LOCAL MOCKUP NẾU CHƯA NHẬP KEY
            Utils.showToast('Chưa có API Key. Sử dụng Local Template (Trộn ngẫu nhiên).', 'info');
            
            let fallbackContent = '';
            let targetInputId = '';

            if (activeTabId === 'tab-tomtat') {
                targetInputId = 'ai-tomtat';
                fallbackContent = `[MẪU LOCAL] Tóm tắt công việc:
- Mục tiêu: ${mucTieu || 'Chưa rõ'}
- Chủ đề: ${truCot || 'Chưa rõ'}
- Định dạng: ${dinhDang || 'Chưa rõ'}
=> Cần hoàn thành nội dung thu hút và hình ảnh bắt mắt.`;
            } else if (activeTabId === 'tab-kichban') {
                targetInputId = 'ai-kichban';
                if (isVideo) {
                    const hooks = [`3 Góc khuất về ${tieuDe} mà không ai nói cho bạn biết! 😱`, `Sự thật ngã ngửa về ${tieuDe} - Xem ngay nhé!`];
                    const bodies = [`Lỗi sai phổ biến: Quá lạm dụng hoặc không chú ý tiểu tiết.\n- Cách khắc phục: Tập trung trải nghiệm.`, `Bạn chỉ cần 1 bí quyết: Đúng lúc + Đúng chỗ = Thành công!`];
                    const ctas = [`Thấy hay thì nhớ thả tim và Follow nha! ❤️`, `Bạn nghĩ sao về điều này? Comment phí dưới nhé! 👇`];
                    fallbackContent = `🎬 KỊCH BẢN CHI TIẾT (VIDEO):\n\n⚡ 1. Hook (0-3s):\n▶️ Thoại: "${hooks[Math.floor(Math.random() * hooks.length)]}"\n\n😰 2. Nội dung chính:\n▶️ Thoại: "${bodies[Math.floor(Math.random() * bodies.length)]}"\n\n🔥 3. Kêu gọi hành động:\n▶️ Thoại: "${ctas[Math.floor(Math.random() * ctas.length)]}"\n\n🎥 HƯỚNG DẪN B-ROLL:\n- Quay cận cảnh sản phẩm, lồng nhạc trending giật beat mạnh.`;
                } else {
                    fallbackContent = `(Với bài Text/Ảnh không có kịch bản Video. Vui lòng xem Tab Caption bên cạnh)`;
                }
            } else if (activeTabId === 'tab-caption') {
                targetInputId = 'ticket-noidung';
                if (isVideo) {
                    fallbackContent = `📌 Dùng tóm tắt kịch bản trên làm caption đăng kèm reels/tiktok. Thêm hashtag #viral #${tieuDe.replace(/\s+/g,'')}`;
                } else {
                    const headlines = [`🔥 BẬT MÍ BÍ QUYẾT: ${tieuDe.toUpperCase()}`, `🌟 CƠ HỘI VÀNG: GIẢI MÃ ${tieuDe.toUpperCase()}`];
                    const contents = [`Nhiều anh/chị hay hỏi em tại sao. Đơn giản vì nó giúp TIẾT KIỆM 50% thời gian!`, `Chỉ với 3 thay đổi nhỏ mỗi ngày, thành quả sẽ khiến bạn bất ngờ! chờ xem nhé.`];
                    fallbackContent = `[CAPTION 1 - BÁN HÀNG]\n🔥 ${headlines[0]}\n${contents[0]}\n👉 Inbox chốt đơn ngay!\n\n[CAPTION 2 - BRANDING]\n🌟 ${headlines[1]}\n${contents[1]}\n👉 Phù hợp mọi phong cách. Theo dõi trang để biết thêm!`;
                }
            } else if (activeTabId === 'tab-ytuong') {
                targetInputId = 'ticket-order';
                fallbackContent = `[MẪU LOCAL] Ý TƯỞNG THIẾT KẾ:\n- Bố cục 1/3: Bên trái là chữ to rõ, bên phải là ảnh minh họa.\n- Tone màu chói/tương phản mạnh để hút mắt người lướt Feed.\n- Yêu cầu thêm: Làm nổi bật tiêu đề "${tieuDe}".`;
            } else if (activeTabId === 'tab-zalo') {
                targetInputId = 'ai-zalo';
                fallbackContent = `[MẪU 1 - CHUYÊN NGHIỆP]\nDạ em gửi anh chị kịch bản nháp cho bài "${tieuDe}". Anh chị xem và phản hồi giúp em nhé!\n\n[MẪU 2 - THÂN THIỆN]\nSếp ơi, em lên xong plan bài "${tieuDe}" rồi nè. Sếp check qua nha 😉`;
            }

            if (targetInputId) {
                document.getElementById(targetInputId).value = fallbackContent;
            }

            Utils.showToast('Đã trộn ngẫu nhiên Template nội dung!', 'success');
        }
    },

    copyActiveZaloMessage: () => {
        // Copy nội dung của Tab Zalo
        const zaloContent = document.getElementById('ai-zalo').value.trim();
        if (!zaloContent) {
            Utils.showToast('Vui lòng tạo nội dung AI mẫu trước hoặc điền tin nhắn Zalo!', 'warning');
            return;
        }

        navigator.clipboard.writeText(zaloContent).then(() => {
            Utils.showToast("Đã copy tin nhắn Zalo vào bộ nhớ đệm!", "success");
        }).catch(err => {
            console.error('Không thể copy', err);
            Utils.showToast("Không thể copy tự động, vui lòng copy tay.", "error");
        });
    },

    copyZaloMessage: () => {
        const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeTicketId);
        if (!task) return;

        const dateStr = task.ngayDang || Utils.getTodayString();
        const contentStr = document.getElementById('ticket-noidung').value || task.noiDung || "(Chưa có nội dung chi tiết)";

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
