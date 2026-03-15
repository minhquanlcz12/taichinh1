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
                                        <th class="col-stt">STT</th>
                                        <th class="col-ngay">Ngày đăng</th>
                                        <th class="col-muctieu th-green">Mục tiêu</th>
                                        <th class="col-tieude th-green">Tiêu đề</th>
                                        <th class="col-noidung th-green">Nội dung chi tiết</th>
                                        <th class="col-dinhdang">Định dạng</th>
                                        <th class="col-order">Nội dung order thiết kế</th>
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
                        <td class="col-stt">${task.stt || ''}</td>
                        <td class="col-ngay" style="font-weight: 600;">${task.ngayDang}</td>
                        <td class="col-muctieu td-green"><span class="task-content-text">${task.mucTieu || '--'}</span></td>
                        <td class="col-tieude td-green">
                            <span class="task-content-text" style="font-size: 14px; font-weight: bold; color: var(--primary);">${task.tieuDe || '--'}</span>
                        </td>
                        <td class="col-noidung td-green"><span class="task-content-text" style="text-align:justify;">${task.noiDung || '--'}</span></td>
                        <td class="col-dinhdang"><span class="badge badge-gray">${task.dinhDang || '--'}</span></td>
                        <td class="col-order"><span class="task-content-text" style="text-align:justify;">${task.orderBrief || '--'}</span></td>
                        <td class="col-deadline">
                            <div class="${deadlineClass}" style="padding: 4px; border-radius: 4px; text-align: left;">
                                ${task.thu ? `<b>${task.thu}</b><br>` : ''}
                                ${task.deadline ? `${task.deadline}` : '--'}
                            </div>
                        </td>
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
                prompt += `Hãy trả về "Phiếu làm việc — Marketing" chi tiết, bám sát form mẫu sau, điền thông tin phù hợp với chủ đề:
Phiếu làm việc — Marketing
Mục tiêu
[Mục tiêu]
Định dạng
[Định dạng]
Chủ đề
[Chủ đề]
Phong cách thiết kế
[Gợi ý phong cách]
Nội dung chính
Tiêu đề: [Tiêu đề đề xuất]
Điểm nhấn: [Giải thích điểm nhấn chi tiết]
Cách triển khai
1. [Bước 1]
2. [Bước 2]
3. [Bước 3]
Đầu ra cần làm
[Danh sách đầu ra]
Lưu ý quan trọng
• [Lưu ý 1]
• [Lưu ý 2]\n`;
                targetInputId = 'ai-tomtat';
            } else if (activeTabId === 'tab-kichban') {
                prompt += `Hãy trả về kịch bản video/bài đăng dựa trên chủ đề yêu cầu. Viết theo format chuẩn:
Kịch bản video ngắn — 20–30 giây
🎬 HOOK (0–5 giây)
Cảnh: [Mô tả cảnh thu hút]
Lời thoại / text overlay: "[Hook 1 câu cực cuốn]"

📌 NỘI DUNG CHÍNH (5–22 giây)
Cảnh 1: [Mô tả]
Cảnh 2: [Mô tả]
Text overlay: "[Text tương ứng]"

📣 CTA (22–30 giây)
Cảnh: [Mô tả]
Text overlay: "[CTA text]"
Lời thoại: "[Lời thoại chốt sale/kêu gọi]"

Ghi chú sản xuất
Âm nhạc: [Gợi ý]
Phong cách quay: [Gợi ý]
Màu sắc chủ đạo: [Gợi ý]
Phù hợp đăng: [Nền tảng]\n`;
                targetInputId = 'ai-kichban';
            } else if (activeTabId === 'tab-caption') {
                prompt += `Hãy viết 3 mẫu Caption theo format chính xác sau:
Caption kiểu 1 — Bán hàng trực tiếp
[Nội dung caption 1 chốt sale mạnh, đủ icon, hashtag]

Caption kiểu 2 — Branding nhẹ
[Nội dung caption 2 tập trung vào cảm xúc, thương hiệu, bay bổng tinh tế]

Caption kiểu 3 — Ngắn gọn dễ đăng
[Nội dung caption 3 siêu ngắn, giật gân, mồi tương tác nền tảng ngắn]\n`;
                targetInputId = 'ticket-noidung';
            } else if (activeTabId === 'tab-ytuong') {
                prompt += `Hãy đóng vai trò là Art Director, gợi ý 3 Ý tưởng/Concept thiết kế theo định dạng sau:
01
Concept
[Tên concept]
Bố cục
[Mô tả bố cục]
Màu sắc
[Gợi ý màu]
Cảm giác
[Tâm trạng, vibe mang lại]

02
Concept
... (tt)

03
Concept
... (tt)\n`;
                targetInputId = 'ticket-order';
            } else if (activeTabId === 'tab-zalo') {
                prompt += `Hãy viết 2 mẫu tin nhắn Zalo gửi báo cáo hoặc gửi khách hàng để xin feedback. Format:
Mẫu 1 — Lịch sự, chuyên nghiệp
[Nội dung thân thiện, kính ngữ chuyên nghiệp, dài vừa phải]

Mẫu 2 — Ngắn gọn, thân thiện
[Nội dung nhí nhảnh hợp sếp/đồng nghiệp để báo cáo hoàn thành phiêu]\n`;
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
                fallbackContent = `Phiếu làm việc — Marketing
Mục tiêu
${mucTieu || 'Tăng nhận diện thương hiệu'}
Định dạng
${dinhDang || 'Ảnh + Caption'}
Chủ đề
${truCot || 'Giới thiệu tính năng'}
Phong cách thiết kế
Sang trọng, sạch sẽ, hiện đại
Nội dung chính
Tiêu đề: ${tieuDe || 'Mẫu thiết kế thanh lịch cho dân văn phòng'}

Điểm nhấn: Tập trung giới thiệu cách mà sản phẩm giúp ích cho cuộc sống/công việc hàng ngày. Cách sử dụng dễ dàng và vô cùng chuyên nghiệp.
Cách triển khai
1. Chụp ảnh sản phẩm: nền trắng, ánh sáng trong, setup đơn giản
2. Chụp lifestyle: người dùng đang trải nghiệm
3. Thiết kế layout sạch: font tối giản, màu ấm
4. Lên lịch đăng giờ vàng: 7-9h tối
Đầu ra cần làm
3 hình ảnh
1 video reels
3 mẫu caption
Lưu ý quan trọng
• Hình ảnh nhất quán: sang - sạch - hiện đại
• Call-to-action phải xuất hiện ở ảnh cuối cùng và ở caption`;
            } else if (activeTabId === 'tab-kichban') {
                targetInputId = 'ai-kichban';
                fallbackContent = `Kịch bản video ngắn — 20–30 giây
🎬 HOOK (0–5 giây)
Cảnh: Cú máy đi từ dưới lên, cận cảnh vào chi tiết đáng giá nhất của sản phẩm.
Lời thoại / text overlay:
"Bạn đã bỏ lỡ bí quyết này trong suốt ngần ấy năm!"

📌 NỘI DUNG CHÍNH (5–22 giây)
Cảnh 1: Một nhân vật đang gặp vấn đề quen thuộc, gương mặt mệt mỏi.
Cảnh 2: Ứng dụng ngay "${tieuDe}" -> Cười rạng rỡ, thần thái đỉnh cao.
Text overlay: "Giải pháp nhanh chóng — hiệu quả tức thì."

📣 CTA (22–30 giây)
Cảnh: Sản phẩm đặt giữa màn hình, vòng hào quang phía sau.
Text overlay: "Sở hữu ngay hôm nay!"
Lời thoại: "Click vào link dưới đây để chốt đơn với giá cực hời."

Ghi chú sản xuất
Âm nhạc
Nhạc nền điện tử (EDM) giật beat mạnh hoặc lofi tùy tính chất sản phẩm
Phong cách quay
Chuyển cảnh nhanh để giữ chân người xem
Màu sắc chủ đạo
Môi trường sáng rõ, màu chủ thể nổi trội
Phù hợp đăng
TikTok, Instagram Reels, Youtube Shorts`;
            } else if (activeTabId === 'tab-caption') {
                targetInputId = 'ticket-noidung';
                fallbackContent = `Caption kiểu 1 — Bán hàng trực tiếp
✨ Bí kíp để công việc trôi chảy cả ngày dài! ${tieuDe} mang đến trải nghiệm tuyệt vời chưa từng có. 💼 Tự tin hơn, chuyên nghiệp hơn. Hơn 1.000+ người đã thử và hài lòng tuyệt đối! 👉 Nhắn tin inbox trực tiếp trên page để nhận tư vấn miễn phí + ưu đãi giảm 20% hôm nay. #SảnPhẩm #UuDai

Caption kiểu 2 — Branding nhẹ
Có những thứ nhỏ bé, nhưng thay đổi cả cách công việc vận hành. ${tieuDe} — tinh tế, thanh lịch và không phô trương. Vì phong cách không cần nói nhiều, chỉ cần đứng vào đúng chỗ là tự toả sáng. 🔗 Khám phá bộ sưu tập đầy đủ tại [link bio]

Caption kiểu 3 — Ngắn gọn dễ đăng
${tieuDe} — Nhẹ, Sang, Đỉnh cao xu hướng. 🕶️ Thử ngay để thấy sự khác biệt tại [Tên cửa hàng]! 📲 Inbox chốt đơn liền tay.`;
            } else if (activeTabId === 'tab-ytuong') {
                targetInputId = 'ticket-order';
                fallbackContent = `01
Concept
Lifestyle — "Một ngày làm việc hoàn hảo"
Bố cục
Nhân vật đang ngồi ở một quán cafe sang chảnh, tập trung vào màn hình làm việc. Góc chụp ngang hoặc từ bên trên qua vai người mẫu.
Màu sắc
Tone kem, vàng nhạt, xám văn phòng. Ấm và sang trọng.
Cảm giác
Tự tin, điềm đạm, đẳng cấp

02
Concept
Flat lay sản phẩm — "Chi tiết đắt giá"
Bố cục
Sản phẩm là nhân vật chính diện. Xung quanh trang trí một vài phụ kiện văn phòng: Macbook, đồng hồ, ly cafe.
Màu sắc
Tông tương phản sáng tối mạnh. Ánh sáng tạt.
Cảm giác
Sang trọng, chi tiết, tập trung

03
Concept
Video Before/After — "Một bước lên mây"
Bố cục
Chia khung hình Split-screen để thấy sự đối lập giữa lúc chưa dùng và khi đã dùng "${tieuDe}".
Màu sắc
Tone sáng khỏe mạnh.
Cảm giác
Bất ngờ, giải trí, thỏa mãn thị giác`;
            } else if (activeTabId === 'tab-zalo') {
                targetInputId = 'ai-zalo';
                fallbackContent = `Mẫu 1 — Lịch sự, chuyên nghiệp
Xin chào anh/chị [Tên khách], Em là [Tên bạn] từ [Tên thương hiệu]. Em xin phép gửi anh/chị tham khảo nội dung kế hoạch bài "${tieuDe}". Anh/chị xem qua nếu cần chỉnh sửa thì phản hồi sớm giúp em để team bay vào sản xuất ạ. Em cảm ơn! Trân trọng.

Mẫu 2 — Ngắn gọn, thân thiện
Sếp ơi 👋 Em xong bản nháp Ticket "${tieuDe}" rồi ạ. Sếp đi ngang rảnh ngó qua Tab Caption với Kịch Bản cho em xin xíu góc nhìn nha. Oke là em bật máy quay luôn 📷 Mãi iu 🫰`;
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
