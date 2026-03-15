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
                <div class="folder-group glass-card ${isExpanded}" style="padding: 0; overflow:hidden;" id="${folderId}">
                    <div class="folder-header" onclick="WorkModule.toggleFolder('${folderId}', '${projName}')">
                        <div class="folder-title">
                            <i class="fa-solid fa-folder-open"></i>
                            ${projName}
                            ${adminBadgeHtml}
                            <span class="badge badge-blue" style="font-size: 11px; margin-left: 8px;">Hoàn thành: ${doneCount}/${totalCount}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap: 16px;">
                            <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="WorkModule.deleteProject('${projName}', event)">
                                <i class="fa-solid fa-trash"></i> Xóa bảng
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
                                        <th class="col-thu">Thứ</th>
                                        <th class="col-muctieu th-green">Mục tiêu</th>
                                        <th class="col-trucot th-green">Trụ cột</th>
                                        <th class="col-tieude th-green">Tiêu đề</th>
                                        <th class="col-noidung th-green">Nội dung chi tiết (caption/outline)</th>
                                        <th class="col-dinhdang">Định dạng</th>
                                        <th class="col-order">Nội dung order thiết kế (brief)</th>
                                        <th class="col-deadline">Deadline<br>thiết kế</th>
                                        <th class="col-trangthai">Trạng thái</th>
                                        <th class="col-ghichu">Ghi chú</th>
                                        <th class="col-anh">Ảnh gợi ý</th>
                                        <th class="col-actions"><i class="fa-solid fa-gear"></i></th>
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

                // Image logic
                const imgCellContent = task.anhData
                    ? `<img src="${task.anhData}" style="max-width:80px; max-height:80px; border-radius:4px; cursor:pointer;" onclick="WorkModule.triggerImageUpload('${task.id}')" title="Đổi ảnh">`
                    : `<button class="btn btn-outline" style="font-size:11px; padding:4px 8px;" onclick="WorkModule.triggerImageUpload('${task.id}')"><i class="fa-solid fa-image"></i> Tải ảnh</button>`;

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
                        <td class="col-stt">${task.stt}</td>
                        <td class="col-ngay">${task.ngayDang}</td>
                        <td class="col-thu">${task.thu}</td>
                        <td class="col-muctieu td-green"><span class="task-content-text">${task.mucTieu}</span></td>
                        <td class="col-trucot td-green"><span class="task-content-text">${task.truCot}</span></td>
                        <td class="col-tieude td-green"><span class="task-content-text">${task.tieuDe}</span></td>
                        <td class="col-noidung td-green"><span class="task-content-text" style="text-align:justify;">${task.noiDung}</span></td>
                        <td class="col-dinhdang"><span class="task-content-text">${task.dinhDang}</span></td>
                        <td class="col-order"><span class="task-content-text" style="text-align:justify;">${task.orderBrief}</span></td>
                        <td class="col-deadline"><div class="${deadlineClass}" style="padding: 4px; border-radius: 4px; text-align: center;">${task.deadline}</div></td>
                        <td class="col-trangthai">
                            <select class="form-control ${statusClass}" style="font-size: 13px; font-weight:600; padding:4px 8px; border-radius:4px;" onchange="WorkModule.changeTaskStatus('${task.id}', this.value)">
                                ${statusOptions}
                            </select>
                        </td>
                        <td class="col-ghichu"><span class="task-content-text">${task.ghiChu}</span></td>
                        <td class="col-anh" style="text-align:center;">
                            ${imgCellContent}
                        </td>
                        <td class="col-actions" style="display: flex; flex-direction: column; gap: 4px;">
                            <button class="btn btn-primary btn-sm" title="Mở Phiếu Làm Việc" onclick="WorkModule.openTicketModal('${task.id}')">
                                <i class="fa-solid fa-ticket"></i> Mở
                            </button>
                            <button class="btn-text text-danger" title="Xóa" onclick="WorkModule.deleteTask('${task.id}')">
                                <i class="fa-solid fa-trash"></i> Xóa
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
        document.getElementById('ticket-trangthai').value = task.trangThai || 'Planned';

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

    generateAILocal: () => {
        const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeTicketId);
        if (!task) return;

        let tieuDe = document.getElementById('ticket-tieude').value || task.tieuDe || 'Chủ đề bài đăng';
        let dinhDang = (task.dinhDang || '').toLowerCase();
        
        let draft = `[🔥 BẢN NHÁP TẠO TỰ ĐỘNG BẰNG AI SIMULATOR]\n\n`;
        
        if (dinhDang.includes('video') || dinhDang.includes('reels') || dinhDang.includes('tiktok') || dinhDang.includes('short')) {
            draft += `🎬 KỊCH BẢN CHI TIẾT (VIDEO):\n`;
            draft += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            draft += `⚡ 1. Hook (0-3s) - Thu hút ngay lập tức:\n`;
            draft += `   - Hình ảnh: Cảnh quay giật gân, cận cảnh hoặc text to đập vào mắt.\n`;
            draft += `   - Lời thoại/Text: "Bạn có biết ${tieuDe} đang là xu hướng không thể bỏ lỡ?"\n\n`;
            draft += `😰 2. Vấn đề/Pain point (3-8s):\n`;
            draft += `   - Hình ảnh: Khách hàng đang gặp khó khăn hoặc trạng thái chưa hoàn hảo.\n`;
            draft += `   - Lời thoại/Text: "Rất nhiều người đang loay hoay vì chưa biết cách tối ưu..."\n\n`;
            draft += `💡 3. Giải pháp (8-18s) - Body chính:\n`;
            draft += `   - Hình ảnh: Show sản phẩm/dịch vụ giải quyết vấn đề. Góc máy năng động (pan, tilt).\n`;
            draft += `   - Lời thoại/Text: "Với giải pháp từ chúng tôi, bạn dễ dàng đạt được 3 lợi ích vượt trội: A, B, C..."\n\n`;
            draft += `🔥 4. Kêu gọi hành động (18-20s) - CTA:\n`;
            draft += `   - Hình ảnh: Logo nhãn hàng, thông tin liên hệ bật lên rõ ràng.\n`;
            draft += `   - Lời thoại/Text: "Để lại bình luận hoặc inbox ngay để nhận ưu đãi độc quyền!"\n\n`;
            draft += `🎥 HƯỚNG DẪN QUAY (SHOT LIST BONE):\n`;
            draft += `- Shot 1 (Cận cảnh): Setup ánh sáng keylight tôn chủ thể.\n`;
            draft += `- Shot 2 (Trung cảnh): Khung hình 1/3, chừa backgound chèn Text.\n`;
            draft += `- Shot 3 (B-roll): Quay chi tiết sản phẩm 60fps để slow-motion mượt mà.\n`;
            draft += `- Âm nhạc: Trending TikTok, beat dồn dập ở đoạn Hook.\n`;
        } else {
            draft += `📝 CAPTION BÀI VIẾT (ẢNH/TEXT):\n`;
            draft += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            draft += `👉 Tiêu đề giật tít: TỔNG HỢP NHỮNG ĐIỀU CẦN BIẾT VỀ ${tieuDe.toUpperCase()}!\n\n`;
            draft += `🌟 Bạn đang tìm kiếm giải pháp hoàn hảo? Dưới đây là những lý do bạn không nên bỏ lỡ:\n`;
            draft += `✔️ Lợi ích 1: Tiết kiệm tối đa thời gian & chi phí.\n`;
            draft += `✔️ Lợi ích 2: Hiệu quả tức thì, cam kết chất lượng.\n`;
            draft += `✔️ Lợi ích 3: Đội ngũ hỗ trợ nhiệt tình chuyên nghiệp.\n\n`;
            draft += `🎁 ƯU ĐÃI ĐẶC BIỆT CHỈ TRONG HÔM NAY!\n`;
            draft += `🔥 Kêu gọi hành động: "Để lại [CHẤM] nhận ngay tư vấn miễn phí hoặc Inbox trực tiếp cho Fanpage!"\n\n`;
            draft += `🖼️ Ý TƯỞNG THIẾT KẾ ẢNH (BONE):\n`;
            draft += `- Tone màu chủ đạo chuyên nghiệp, nổi bật thông điệp.\n`;
            draft += `- Bố cục: Áp dụng quy tắc 1/3, chia rõ không gian đọc Text và không gian Hình ảnh.\n`;
            draft += `- Text trên ảnh (Key visual): "${tieuDe}" font chữ to, đậm, viền nổi rõ trên màn hình Mobile.\n`;
            draft += `- Call to action (Trên ảnh): Nút "Xem Thêm" hoặc "Đăng Ký Ngay" đặt ở mép dưới chữ nhỏ hơn.\n`;
        }

        // Tự động điền cả Order Design
        let orderBrief = `[🛠️ ORDER THIẾT KẾ / DỰNG VIDEO]\n- Yêu cầu: Làm nổi bật tiêu đề "${tieuDe}".\n- Tone màu: Phù hợp nhận diện thương hiệu.\n- Text chính: (Sử dụng text từ kịch bản trên).\n- Định dạng xuất file: Tối ưu cho Mobile (9:16 hoặc vuông 1:1, ảnh nét HD).`;
        document.getElementById('ticket-order').value = orderBrief;

        // Fill into the textarea
        document.getElementById('ticket-noidung').value = draft;
        Utils.showToast('AI đã tạo xong nội dung khung sườn chi tiết!', 'success');
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
