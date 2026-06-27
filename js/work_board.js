(function () {
    if (typeof WorkModule === 'undefined' || WorkModule.__focusDashboardPatched) return;

    const originalRenderList = WorkModule.renderList.bind(WorkModule);
    WorkModule.__focusDashboardPatched = true;
    WorkModule.currentWorkMode = WorkModule.currentWorkMode || 'focus';
    WorkModule.selectedTaskId = WorkModule.selectedTaskId || null;
    WorkModule.staleOverdueDays = 3;

    const esc = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const textOnly = (value) => {
        if (!value) return '';
        const div = document.createElement('div');
        div.innerHTML = String(value);
        return (div.textContent || div.innerText || '').trim();
    };

    const norm = (value) => textOnly(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Ä‘/g, 'd');

    const parseDate = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return null;
        let date = null;
        if (raw.includes('/')) {
            const parts = raw.split('/');
            if (parts.length === 3) date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
        } else {
            date = new Date(raw);
        }
        return date && !Number.isNaN(date.getTime()) ? date : null;
    };

    const diffDays = (task) => {
        if (typeof Utils === 'undefined') return null;
        const target = parseDate(task.deadline || task.ngayDang);
        if (!target) return null;
        const parts = Utils.getTodayString().split('/');
        if (parts.length !== 3) return null;
        const today = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
        return Math.round((target.getTime() - today.getTime()) / 86400000);
    };

    const getMeta = (task) => {
        const raw = norm(task.trangThai || 'Planned');
        const days = diffDays(task);
        const done = raw.includes('done') || raw.includes('hoan thanh') || raw.includes('hoã') || raw.includes('hoÃ');
        const doing = raw.includes('doing') || raw.includes('dang lam') || raw.includes('dang');
        const stale = !done && days !== null && days < -WorkModule.staleOverdueDays;
        const overdue = !done && !stale && (days !== null && days < 0);
        const today = !done && days === 0;

        if (done) return { key: 'done', label: 'Đã xong', tone: 'done', accent: '#10b981', progress: 100, days };
        if (stale) return { key: 'stale', label: `Tồn cũ ${Math.abs(days)} ngày`, tone: 'stale', accent: '#64748b', progress: 8, days };
        if (overdue) return { key: 'overdue', label: `Trễ ${Math.abs(days)} ngày`, tone: 'danger', accent: '#ef4444', progress: 28, days };
        if (today) return { key: 'today', label: 'Hôm nay', tone: 'warning', accent: '#f59e0b', progress: 55, days };
        if (doing) return { key: 'doing', label: 'Đang làm', tone: 'doing', accent: '#3b82f6', progress: 64, days };
        return { key: 'planned', label: 'Planned', tone: 'planned', accent: '#94a3b8', progress: 30, days };
    };

    const titleOf = (task) => textOnly(task.tieuDe || task.mucTieu || task.noiDung || 'Công việc không tên');
    const ownerOf = (task) => task.owner ? (Utils.getUserDisplayName(task.owner) || task.owner) : 'Chưa giao';
    const whenOf = (task) => task.deadline || task.ngayDang || '--';

    const ensureImageInput = () => {
        let input = document.getElementById('hidden-image-upload');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'hidden-image-upload';
            input.accept = 'image/*';
            input.style.display = 'none';
            input.onchange = WorkModule.handleImageSelection;
            document.body.appendChild(input);
        }
        return input;
    };

    WorkModule.triggerImageUpload = (taskId) => {
        WorkModule.activeImageTaskId = taskId;
        ensureImageInput().click();
    };

    WorkModule.setWorkMode = (mode) => {
        WorkModule.currentWorkMode = mode === 'table' ? 'table' : 'focus';
        WorkModule.render();
    };

    WorkModule.selectTask = (taskId) => {
        WorkModule.selectedTaskId = taskId;
        WorkModule.render();
    };

    WorkModule.assignSelectedTask = async () => {
        const select = document.getElementById('work-quick-assign-user');
        if (!select || !WorkModule.selectedTaskId) {
            Utils.showToast('Hãy chọn một công việc trước khi giao.', 'warning');
            return;
        }
        await WorkModule.assignTask(WorkModule.selectedTaskId, select.value);
    };

    WorkModule.renderPlaceholder = async () => {
        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';
        const accounts = await Auth.getAccounts();
        WorkModule.allAccounts = accounts;

        let userFilterHtml = '';
        let quickAssignHtml = '';

        if (isAdmin) {
            let userOptions = '<option value="all">Tất cả nhân viên</option>';
            let assignOptions = '<option value="">-- Chọn nhân viên --</option>';
            accounts.forEach((account) => {
                const name = Utils.getUserDisplayName(account.username) || account.username;
                userOptions += `<option value="${esc(account.username)}">${esc(name)} (${esc(account.role)})</option>`;
                assignOptions += `<option value="${esc(account.username)}">${esc(name)}</option>`;
            });

            userFilterHtml = `
                <select class="form-control work-control" id="work-user-filter" onchange="WorkModule.filterByRole()">
                    ${userOptions}
                </select>
            `;

            quickAssignHtml = `
                <div class="work-assign">
                    <select class="form-control" id="work-quick-assign-user">${assignOptions}</select>
                    <button class="btn btn-primary" onclick="WorkModule.assignSelectedTask()">
                        <i class="fa-solid fa-user-check"></i> Giao việc
                    </button>
                </div>
            `;
        }

        const container = document.getElementById('work-view');
        container.innerHTML = `
            <style>
                .work-focus-root { display: flex; flex-direction: column; gap: 14px; }
                .work-focus-top {
                    display: grid; grid-template-columns: minmax(260px, 1fr) minmax(520px, auto);
                    gap: 14px; align-items: start; padding: 16px;
                    background: linear-gradient(135deg, rgba(15,23,42,.9), rgba(2,6,23,.78));
                    border: 1px solid rgba(148,163,184,.16); border-radius: 14px;
                }
                .work-title h3 { margin: 0; color: #f8fafc; font-size: 20px; letter-spacing: 0; }
                .work-title p { margin: 5px 0 0; color: #94a3b8; font-size: 13px; }
                .work-toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-wrap: wrap; }
                .work-search { position: relative; }
                .work-search i { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #22d3ee; font-size: 12px; }
                .work-search input { width: 230px; padding-left: 32px !important; }
                .work-control, .work-search input {
                    height: 36px; min-width: 142px; border-radius: 10px !important;
                    background: rgba(2,6,23,.72) !important; border: 1px solid rgba(148,163,184,.18) !important;
                    color: #e2e8f0 !important; font-size: 12px !important;
                }
                .work-switch { display: inline-flex; gap: 3px; padding: 3px; border-radius: 11px; background: rgba(15,23,42,.88); border: 1px solid rgba(148,163,184,.16); }
                .work-switch button { height: 30px; border: 0; border-radius: 8px; padding: 0 11px; color: #94a3b8; background: transparent; font-size: 12px; font-weight: 850; cursor: pointer; }
                .work-switch button.active { background: rgba(16,185,129,.18); color: #6ee7b7; box-shadow: inset 0 0 0 1px rgba(16,185,129,.24); }
                .work-import { position: relative; overflow: hidden; display: inline-flex; }
                .work-import input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
                .work-assign { display: inline-flex; gap: 5px; align-items: center; padding: 3px; border-radius: 11px; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.22); }
                .work-assign select { height: 30px !important; min-width: 140px; border: 0 !important; background: transparent !important; font-size: 12px !important; }
                .work-assign button { height: 30px; padding: 0 9px; border-radius: 8px; font-size: 12px; }
                .work-strip { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 10px; }
                .work-metric { padding: 12px; min-height: 72px; border-radius: 12px; background: rgba(15,23,42,.68); border: 1px solid rgba(148,163,184,.14); }
                .work-metric b { display: block; color: #f8fafc; font-size: 24px; line-height: 1; margin-top: 8px; }
                .work-metric span { display: block; color: #94a3b8; font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: .35px; }
                .work-metric small { display: block; color: #64748b; font-size: 11px; margin-top: 5px; }
                .work-main { display: grid; grid-template-columns: minmax(560px, 1.08fr) minmax(360px, .72fr); gap: 14px; align-items: start; }
                .work-panel { background: rgba(8,13,27,.78); border: 1px solid rgba(148,163,184,.14); border-radius: 14px; overflow: hidden; }
                .work-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 14px; border-bottom: 1px solid rgba(148,163,184,.1); }
                .work-panel-head h4 { margin: 0; color: #f8fafc; font-size: 14px; letter-spacing: 0; }
                .work-panel-head span { color: #64748b; font-size: 12px; font-weight: 800; }
                .work-list { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
                .work-section { border: 1px solid rgba(148,163,184,.1); border-radius: 13px; overflow: hidden; background: rgba(2,6,23,.35); }
                .work-section-title { display: flex; align-items: center; justify-content: space-between; min-height: 42px; padding: 0 12px; border-bottom: 1px solid rgba(148,163,184,.08); }
                .work-section-title b { color: #e2e8f0; font-size: 13px; }
                .work-section-title small { color: #94a3b8; font-size: 12px; font-weight: 850; }
                .work-card-list { display: flex; flex-direction: column; gap: 8px; padding: 10px; }
                .work-task {
                    display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;
                    border: 1px solid rgba(148,163,184,.12); border-left: 4px solid var(--accent);
                    border-radius: 11px; background: rgba(15,23,42,.76); padding: 10px;
                    cursor: pointer; transition: border-color .15s ease, background .15s ease, transform .15s ease;
                }
                .work-task:hover { transform: translateY(-1px); background: rgba(20,29,48,.9); border-color: rgba(34,211,238,.25); }
                .work-task.active { border-color: rgba(34,211,238,.62); box-shadow: 0 0 0 1px rgba(34,211,238,.18); }
                .work-task.stale { opacity: .78; background: rgba(15,23,42,.48); border-left-color: #64748b; }
                .work-task-title { color: #f8fafc; font-size: 13px; font-weight: 950; line-height: 1.25; }
                .work-task-sub { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
                .work-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 7px; border-radius: 999px; font-size: 11px; font-weight: 850; color: #cbd5e1; background: rgba(2,6,23,.56); border: 1px solid rgba(148,163,184,.14); }
                .work-pill.done { color: #6ee7b7; border-color: rgba(16,185,129,.24); background: rgba(16,185,129,.1); }
                .work-pill.doing { color: #93c5fd; border-color: rgba(59,130,246,.24); background: rgba(59,130,246,.1); }
                .work-pill.danger { color: #fecaca; border-color: rgba(239,68,68,.28); background: rgba(239,68,68,.12); }
                .work-pill.warning { color: #fde68a; border-color: rgba(245,158,11,.28); background: rgba(245,158,11,.12); }
                .work-pill.stale { color: #cbd5e1; border-color: rgba(100,116,139,.3); background: rgba(100,116,139,.12); }
                .work-progress { width: 92px; height: 5px; border-radius: 999px; overflow: hidden; background: rgba(148,163,184,.14); }
                .work-progress i { display: block; width: var(--progress); height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), rgba(255,255,255,.5)); }
                .work-empty { padding: 24px 12px; text-align: center; color: #94a3b8; border: 1px dashed rgba(148,163,184,.18); border-radius: 12px; background: rgba(15,23,42,.36); }
                .work-stale-block { padding: 0 10px 10px; }
                .work-stale-block details { border: 1px solid rgba(100,116,139,.22); border-radius: 12px; background: rgba(15,23,42,.36); overflow: hidden; }
                .work-stale-block summary { cursor: pointer; padding: 11px 12px; color: #cbd5e1; font-size: 13px; font-weight: 900; }
                .work-stale-block summary span { color: #64748b; font-weight: 700; margin-left: 8px; }
                .work-detail { padding: 14px; display: flex; flex-direction: column; gap: 13px; }
                .work-detail h3 { margin: 0; color: #f8fafc; font-size: 18px; line-height: 1.28; letter-spacing: 0; }
                .work-detail-sub { display: flex; gap: 7px; flex-wrap: wrap; color: #94a3b8; font-size: 12px; }
                .work-detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }
                .work-detail-section { border-top: 1px solid rgba(148,163,184,.1); padding-top: 11px; }
                .work-detail-section h5 { margin: 0 0 7px; color: #cbd5e1; font-size: 12px; letter-spacing: .45px; text-transform: uppercase; }
                .work-detail-section p { margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.55; white-space: pre-wrap; }
                .work-checklist { display: flex; flex-direction: column; gap: 7px; }
                .work-checklist div { display: flex; gap: 8px; color: #cbd5e1; font-size: 13px; }
                @media (max-width: 1280px) { .work-focus-top, .work-main { grid-template-columns: 1fr; } .work-toolbar { justify-content: flex-start; } }
                @media (max-width: 900px) { .work-strip { grid-template-columns: repeat(2, minmax(0,1fr)); } .work-task { grid-template-columns: 1fr; } .work-progress { width: 100%; } }
            </style>
            <div class="work-focus-root">
                <div class="work-focus-top">
                    <div class="work-title">
                        <h3>Công việc & Lịch</h3>
                        <p id="work-date-display">Tất cả kế hoạch</p>
                    </div>
                    <div class="work-toolbar">
                        <div class="work-search">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input class="form-control" id="work-search-input" placeholder="Tìm việc, brief, nhân viên..." oninput="WorkModule.render()">
                        </div>
                        <select class="form-control work-control" id="work-time-filter" onchange="WorkModule.currentFilterTime = this.value; WorkModule.filterByRole()">
                            <option value="all">Tất cả thời gian</option>
                            <option value="today">Hôm nay</option>
                        </select>
                        ${userFilterHtml}
                        <select class="form-control work-control" id="work-status-filter" onchange="WorkModule.render()">
                            <option value="focus">Việc cần làm</option>
                            <option value="urgent">Cần xử lý</option>
                            <option value="upcoming">Sắp tới</option>
                            <option value="stale">Tồn đọng cũ</option>
                            <option value="done">Đã xong</option>
                            <option value="all">Tất cả</option>
                        </select>
                        <div class="work-switch">
                            <button id="work-mode-focus" class="active" onclick="WorkModule.setWorkMode('focus')"><i class="fa-solid fa-bullseye"></i> Focus</button>
                            <button id="work-mode-table" onclick="WorkModule.setWorkMode('table')"><i class="fa-solid fa-table"></i> Bảng gốc</button>
                        </div>
                        ${quickAssignHtml}
                        <div class="work-import">
                            <button class="btn btn-success" style="background: var(--success); color: white;">
                                <i class="fa-solid fa-file-excel"></i> Nhập Excel
                            </button>
                            <input type="file" id="excel-upload" accept=".xlsx,.xls" onchange="WorkModule.handleExcelUpload(event)">
                        </div>
                    </div>
                </div>
                <div id="work-list"></div>
                <input type="file" id="hidden-image-upload" accept="image/*" style="display:none;" onchange="WorkModule.handleImageSelection(event)">
            </div>
        `;
    };

    const isActionable = (task) => ['overdue', 'today'].includes(getMeta(task).key);
    const isUpcoming = (task) => ['doing', 'planned'].includes(getMeta(task).key);

    const filteredTasks = (tasksToRender) => {
        let tasks = [...(tasksToRender || WorkModule.data.tasks || [])];
        const query = norm(document.getElementById('work-search-input')?.value || '');
        const status = document.getElementById('work-status-filter')?.value || 'focus';

        if (query) {
            tasks = tasks.filter((task) => {
                const source = [
                    task.project, task.mucTieu, task.truCot, task.tieuDe, task.noiDung,
                    task.dinhDang, task.orderBrief, task.ghiChu, task.anhGoiY,
                    task.owner, task.trangThai
                ].map(norm).join(' ');
                return source.includes(query);
            });
        }

        tasks = tasks.filter((task) => {
            const meta = getMeta(task);
            if (status === 'focus') return ['overdue', 'today', 'doing', 'planned'].includes(meta.key);
            if (status === 'urgent') return ['overdue', 'today'].includes(meta.key);
            if (status === 'upcoming') return ['doing', 'planned'].includes(meta.key);
            if (status === 'stale') return meta.key === 'stale';
            if (status === 'done') return meta.key === 'done';
            return true;
        });

        return tasks.sort((a, b) => {
            const order = { overdue: 0, today: 1, doing: 2, planned: 3, stale: 4, done: 5 };
            const ma = getMeta(a);
            const mb = getMeta(b);
            if ((order[ma.key] ?? 9) !== (order[mb.key] ?? 9)) return (order[ma.key] ?? 9) - (order[mb.key] ?? 9);
            const da = parseDate(a.deadline || a.ngayDang)?.getTime() || 9999999999999;
            const db = parseDate(b.deadline || b.ngayDang)?.getTime() || 9999999999999;
            return da - db;
        });
    };

    const metric = (label, value, note, color) => `
        <div class="work-metric" style="border-color:${color}33;">
            <span>${esc(label)}</span>
            <b>${value}</b>
            <small>${esc(note)}</small>
        </div>
    `;

    const taskCard = (task, stale = false) => {
        const meta = getMeta(task);
        const active = task.id === WorkModule.selectedTaskId ? 'active' : '';
        return `
            <div class="work-task ${active} ${stale ? 'stale' : ''}" style="--accent:${meta.accent};--progress:${meta.progress}%;" onclick="WorkModule.selectTask('${esc(task.id)}')">
                <div>
                    <div class="work-task-title">${esc(titleOf(task))}</div>
                    <div class="work-task-sub">
                        <span class="work-pill"><i class="fa-solid fa-user"></i>${esc(ownerOf(task))}</span>
                        <span class="work-pill ${meta.tone}">${esc(meta.label)}</span>
                        <span class="work-pill"><i class="fa-regular fa-clock"></i>${esc(whenOf(task))}</span>
                    </div>
                </div>
                <div class="work-progress"><i></i></div>
            </div>
        `;
    };

    const section = (title, subtitle, icon, tasks, emptyText) => `
        <div class="work-section">
            <div class="work-section-title">
                <b><i class="fa-solid ${icon}" style="margin-right:7px;"></i>${esc(title)}</b>
                <small>${tasks.length} việc</small>
            </div>
            <div class="work-card-list">
                ${tasks.length ? tasks.map((task) => taskCard(task)).join('') : `<div class="work-empty">${esc(emptyText || 'Không có việc trong nhóm này')}</div>`}
            </div>
        </div>
    `;

    const staleBlock = (tasks) => {
        if (!tasks.length) return '';
        return `
            <div class="work-stale-block">
                <details>
                    <summary>Tồn đọng cũ (${tasks.length}) <span>Không đưa vào “Cần xử lý ngay”</span></summary>
                    <div class="work-card-list">
                        ${tasks.map((task) => taskCard(task, true)).join('')}
                    </div>
                </details>
            </div>
        `;
    };

    const detail = (task) => {
        if (!task) return '<div class="work-empty" style="margin:14px;">Chọn một việc để xem chi tiết.</div>';
        const meta = getMeta(task);
        const canEdit = Auth.currentUser && (
            Auth.currentUser.role === 'admin' ||
            String(task.owner || '').toLowerCase().trim() === String(Auth.currentUser.username || '').toLowerCase().trim()
        );
        const brief = textOnly(task.orderBrief || task.noiDung || task.mucTieu || '');
        const caption = textOnly(task.noiDung || '');
        const note = textOnly(task.ghiChu || task.anhGoiY || '');

        return `
            <div class="work-detail">
                <div>
                    <h3>${esc(titleOf(task))}</h3>
                    <div class="work-detail-sub">
                        <span><i class="fa-solid fa-user"></i> ${esc(ownerOf(task))}</span>
                        <span><i class="fa-regular fa-calendar"></i> ${esc(whenOf(task))}</span>
                        <span class="work-pill ${meta.tone}">${esc(meta.label)}</span>
                    </div>
                </div>
                <div class="work-detail-actions">
                    ${canEdit ? `<button class="btn btn-success btn-sm" onclick="WorkModule.changeTaskStatus('${esc(task.id)}','Done')"><i class="fa-solid fa-check"></i> Done</button>` : ''}
                    ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="WorkModule.changeTaskStatus('${esc(task.id)}','Doing')"><i class="fa-solid fa-rotate"></i> Đang làm</button>` : ''}
                    <button class="btn btn-warning btn-sm" onclick="WorkModule.openTicketModal('${esc(task.id)}')"><i class="fa-solid fa-ticket"></i> Mở phiếu</button>
                    <button class="btn btn-outline btn-sm" onclick="WorkModule.triggerImageUpload('${esc(task.id)}')"><i class="fa-solid fa-image"></i> Ảnh gợi ý</button>
                </div>
                <div class="work-detail-section">
                    <h5>Checklist</h5>
                    <div class="work-checklist">
                        <div><i class="fa-regular fa-square-check" style="color:#10b981;"></i> Xác nhận người phụ trách và deadline</div>
                        <div><i class="fa-regular fa-square-check" style="color:#10b981;"></i> Hoàn thiện brief/caption trong phiếu</div>
                        <div><i class="fa-regular fa-square-check" style="color:#10b981;"></i> Cập nhật trạng thái trước khi chốt ngày</div>
                    </div>
                </div>
                <div class="work-detail-section">
                    <h5>Brief</h5>
                    <p>${esc(brief || 'Chưa có brief chi tiết.')}</p>
                </div>
                ${caption && caption !== brief ? `<div class="work-detail-section"><h5>Caption / Outline</h5><p>${esc(caption)}</p></div>` : ''}
                <div class="work-detail-section">
                    <h5>Ảnh gợi ý / Ghi chú</h5>
                    ${task.anhData ? `<img src="${task.anhData}" style="width:100%;max-height:170px;object-fit:cover;border-radius:12px;border:1px solid rgba(148,163,184,.16);margin-bottom:8px;">` : ''}
                    <p>${esc(note || 'Chưa có ghi chú hoặc ảnh gợi ý.')}</p>
                </div>
            </div>
        `;
    };

    WorkModule.renderFocusDashboard = (tasksToRender) => {
        const container = document.getElementById('work-list');
        if (!container) return;

        const baseTasks = tasksToRender || WorkModule.data.tasks || [];
        const tasks = filteredTasks(tasksToRender);
        const activeTasks = baseTasks.filter((task) => !['done', 'stale'].includes(getMeta(task).key));
        const urgent = tasks.filter(isActionable);
        const upcoming = tasks.filter(isUpcoming);
        const stale = baseTasks.filter((task) => getMeta(task).key === 'stale');
        const done = baseTasks.filter((task) => getMeta(task).key === 'done');
        const today = baseTasks.filter((task) => diffDays(task) === 0);

        if (!baseTasks.length) {
            container.innerHTML = `
                <div class="work-empty">
                    <i class="fa-solid fa-calendar-plus" style="font-size:38px;opacity:.6;margin-bottom:12px;"></i>
                    <div style="font-weight:900;color:#e2e8f0;margin-bottom:6px;">Chưa có kế hoạch công việc</div>
                    <div>Nhấn “Nhập Excel” để đưa kế hoạch vào hệ thống.</div>
                </div>
            `;
            return;
        }

        const visibleIds = new Set([...urgent, ...upcoming, ...stale, ...done].map((task) => task.id));
        if (!WorkModule.selectedTaskId || !visibleIds.has(WorkModule.selectedTaskId)) {
            WorkModule.selectedTaskId = urgent[0]?.id || upcoming[0]?.id || tasks[0]?.id || baseTasks[0]?.id || null;
        }
        const selected = (WorkModule.data.tasks || []).find((task) => task.id === WorkModule.selectedTaskId) || tasks[0];

        container.innerHTML = `
            <div class="work-strip">
                ${metric('Đang cần làm', activeTasks.length, 'Không tính tồn cũ', '#22d3ee')}
                ${metric('Hôm nay', today.length, 'Việc có lịch hôm nay', '#f59e0b')}
                ${metric('Cần xử lý', urgent.length, 'Trễ <= 3 ngày / hạn hôm nay', '#ef4444')}
                ${metric('Tồn cũ', stale.length, 'Quá hạn trên 3 ngày', '#64748b')}
                ${metric('Đã xong', done.length, 'Việc hoàn thành', '#10b981')}
            </div>
            <div class="work-main">
                <div class="work-panel">
                    <div class="work-panel-head">
                        <h4><i class="fa-solid fa-bullseye" style="color:#22d3ee;margin-right:8px;"></i>Việc cần nhìn hôm nay</h4>
                        <span>${tasks.length} việc đang hiển thị</span>
                    </div>
                    <div class="work-list">
                        ${section('Cần xử lý ngay', 'Không gồm tồn cũ', 'fa-triangle-exclamation', urgent, 'Không có việc gấp trong 3 ngày gần đây.')}
                        ${section('Đang làm / Sắp tới', 'Việc còn trong luồng', 'fa-list-check', upcoming, 'Không có việc sắp tới trong bộ lọc này.')}
                    </div>
                    ${staleBlock(stale)}
                </div>
                <div class="work-panel">
                    <div class="work-panel-head">
                        <h4><i class="fa-solid fa-circle-info" style="color:#f59e0b;margin-right:8px;"></i>Chi tiết việc</h4>
                        <span>${esc(selected?.project || 'Kế hoạch')}</span>
                    </div>
                    ${detail(selected)}
                </div>
            </div>
        `;
    };

    WorkModule.renderList = (tasksToRender) => {
        const focusBtn = document.getElementById('work-mode-focus');
        const tableBtn = document.getElementById('work-mode-table');
        if (focusBtn && tableBtn) {
            focusBtn.classList.toggle('active', WorkModule.currentWorkMode !== 'table');
            tableBtn.classList.toggle('active', WorkModule.currentWorkMode === 'table');
        }

        if (WorkModule.currentWorkMode === 'table') {
            originalRenderList(tasksToRender);
            return;
        }

        WorkModule.renderFocusDashboard(tasksToRender);
    };
})();
