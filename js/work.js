// js/work.js

const WorkModule = {
    data: {
        // Now containing all 13 marketing fields
        // {id, stt, ngayDang, thu, mucTieu, truCot, tieuDe, noiDung, dinhDang, orderBrief, deadline, trangThai, ghiChu, anhGoiY, project, owner}
        tasks: []
    },

    init: () => {
        WorkModule.renderPlaceholder();
        WorkModule.load(); // Load data and filter by role
    },

    load: () => {
        const d = Utils.storage.get('work_data');
        if (d && d.tasks) {
            WorkModule.data = d;
        } else {
            // If no data or old schema, initialize with empty tasks
            WorkModule.data.tasks = [];
        }
        WorkModule.filterByRole();
    },

    save: () => {
        Utils.storage.set('work_data', WorkModule.data);
        WorkModule.filterByRole();
    },

    filterByRole: () => {
        const currentUser = Auth.currentUser;
        if (!currentUser) {
            WorkModule.renderList([]); // Render empty if no user
            return;
        }

        let displayTasks = WorkModule.data.tasks;

        // If not admin,        let displayTasks = WorkModule.data.tasks;

        if (currentUser.role === 'admin') {
            const filterEl = document.getElementById('work-user-filter');
            if (filterEl && filterEl.value !== 'all') {
                displayTasks = WorkModule.data.tasks.filter(t => t.owner === filterEl.value || (!t.owner && filterEl.value === 'admin'));
            }
        } else {
            // If not admin, only show tasks owned by this user
            displayTasks = WorkModule.data.tasks.filter(t => t.owner === currentUser.username);
        }

        WorkModule.renderList(displayTasks);
    },

    getTodaysTasks: () => {
        // Return active tasks for dashboard
        let tasks = WorkModule.data.tasks;
        const currentUser = Auth.currentUser;
        if (currentUser) {
            tasks = tasks.filter(t => t.owner === currentUser.username || (!t.owner && currentUser.username === 'admin'));
        }

        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();
        const todayStr = `${d}/${m}/${y}`;

        return tasks.filter(t => {
            const isNotDone = t.trangThai && t.trangThai.toLowerCase() !== 'done';
            const isToday = t.ngayDang === todayStr || t.deadline === todayStr;
            return isNotDone && isToday;
        });
    },

    renderPlaceholder: () => {
        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';

        let filterHtml = '';
        if (isAdmin) {
            const accounts = Auth.getAccounts();
            let opts = `<option value="all">Tất cả nhân viên</option>`;
            accounts.forEach(a => {
                opts += `<option value="${a.username}">${a.username} (${a.role})</option>`;
            });
            filterHtml = `
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

    handleExcelUpload: (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const projectName = prompt("Nhập tên Thư mục / Kế hoạch cho file excel này:", file.name.split('.')[0]);
        if (!projectName) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Read as array of arrays
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                let importedCount = 0;

                // Usually headers are on row 1 or 2. We will look for data rows that start with STT number or start parsing from row 2.
                let dataStartIndex = 1; // Assuming row 0 is header

                for (let i = dataStartIndex; i < rawJson.length; i++) {
                    const row = rawJson[i];

                    // Basic validation: skip completely empty rows
                    if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) continue;

                    // Parse mapping (assuming standard 13 columns as described)
                    const stt = row[0]?.toString() || '';
                    if (stt.toLowerCase() === 'stt' || stt.toLowerCase() === 'ngày đăng') continue; // double ensure we skip headers

                    const taskObj = {
                        id: Utils.generateId(),
                        project: projectName,
                        stt: stt,
                        ngayDang: Utils.convertExcelDate(row[1]) || '',
                        thu: row[2]?.toString() || '',
                        mucTieu: row[3]?.toString() || '',
                        truCot: row[4]?.toString() || '',
                        tieuDe: row[5]?.toString() || '',
                        noiDung: row[6]?.toString() || '',
                        dinhDang: row[7]?.toString() || '',
                        orderBrief: row[8]?.toString() || '',
                        deadline: Utils.convertExcelDate(row[9]) || '',
                        trangThai: row[10]?.toString() || 'Planned',
                        ghiChu: row[11]?.toString() || '',
                        anhGoiY: row[12]?.toString() || '',
                        owner: Auth.currentUser ? Auth.currentUser.username : 'admin'
                    };

                    WorkModule.data.tasks.push(taskObj);
                    importedCount++;
                }

                alert(`Đã nhập thành công ${importedCount} công việc vào kế hoạch "${projectName}".`);
                WorkModule.save();

            } catch (err) {
                console.error(err);
                alert("Đã xảy ra lỗi khi đọc file Excel. Vui lòng đảm bảo định dạng các cột (13 cột) chuẩn.");
            }

            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    },

    toggleFolder: (folderId) => {
        const folderEl = document.getElementById(folderId);
        if (folderEl) {
            folderEl.classList.toggle('expanded');
        }
    },

    deleteProject: (projectName, event) => {
        event.stopPropagation(); // prevent toggling accordion
        if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ kế hoạch "${projectName}"? Hành động này không thể hoàn tác.`)) {
            WorkModule.data.tasks = WorkModule.data.tasks.filter(t => t.project !== projectName);
            WorkModule.save();
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

            html += `
                <div class="folder-group glass-card expanded" style="padding: 0; overflow:hidden;" id="${folderId}">
                    <div class="folder-header" onclick="WorkModule.toggleFolder('${folderId}')">
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
                        <td class="col-deadline">${task.deadline}</td>
                        <td class="col-trangthai">
                            <select class="form-control ${statusClass}" style="font-size: 13px; font-weight:600; padding:4px 8px; border-radius:4px;" onchange="WorkModule.changeTaskStatus('${task.id}', this.value)">
                                ${statusOptions}
                            </select>
                        </td>
                        <td class="col-ghichu"><span class="task-content-text">${task.ghiChu}</span></td>
                        <td class="col-anh" style="text-align:center;">
                            ${imgCellContent}
                        </td>
                        <td class="col-actions">
                            <button class="btn-text text-danger" title="Xóa" onclick="WorkModule.deleteTask('${task.id}')" style="margin-top: 8px;">
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

    changeTaskStatus: (id, newStatus) => {
        const task = WorkModule.data.tasks.find(t => t.id === id);
        if (task) {
            task.trangThai = newStatus;
            WorkModule.save();
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
            alert('Vui lòng chọn một tập tin hình ảnh.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;

            // Find task and save image data
            const task = WorkModule.data.tasks.find(t => t.id === WorkModule.activeImageTaskId);
            if (task) {
                task.anhData = base64Data;
                WorkModule.save();
            }

            WorkModule.activeImageTaskId = null;
            event.target.value = ''; // Reset input
        };

        reader.readAsDataURL(file);
    },
    deleteTask: (id) => {
        if (confirm('Bạn có chắc muốn xóa dòng công việc này?')) {
            WorkModule.data.tasks = WorkModule.data.tasks.filter(t => t.id !== id);
            WorkModule.save();
        }
    }
};
