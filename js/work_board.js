(function () {
    if (typeof WorkModule === 'undefined' || WorkModule.__boardDashboardPatched) return;

    const originalRenderList = WorkModule.renderList.bind(WorkModule);
    WorkModule.__boardDashboardPatched = true;
    WorkModule.currentWorkMode = WorkModule.currentWorkMode || 'board';
    WorkModule.selectedTaskId = WorkModule.selectedTaskId || null;

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const plainText = (value) => {
        if (!value) return '';
        const div = document.createElement('div');
        div.innerHTML = String(value);
        return (div.textContent || div.innerText || '').trim();
    };

    const normalize = (value) => plainText(value).toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');

    const parseDate = (value) => {
        const str = String(value || '').trim();
        if (!str) return null;
        let date = null;
        if (str.includes('/')) {
            const p = str.split('/');
            if (p.length === 3) date = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`);
        } else {
            date = new Date(str);
        }
        return date && !Number.isNaN(date.getTime()) ? date : null;
    };

    const dayDiff = (task) => {
        const target = parseDate(task.deadline || task.ngayDang);
        if (!target || typeof Utils === 'undefined') return null;
        const parts = Utils.getTodayString().split('/');
        if (parts.length !== 3) return null;
        const today = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
        return Math.round((target.getTime() - today.getTime()) / 86400000);
    };

    const statusMeta = (task) => {
        const raw = normalize(task.trangThai || 'Planned');
        const diff = dayDiff(task);
        const done = raw.includes('done') || raw.includes('hoan thanh') || raw.includes('hoã') || raw.includes('hoÃ');
        const doing = raw.includes('doing') || raw.includes('dang lam') || raw.includes('dang');
        const expired = !done && (raw.includes('het han') || raw.includes('qua han') || raw.includes('háº¿t') || (diff !== null && diff < 0));
        const dueToday = !done && (raw.includes('han chot') || raw.includes('háº¡n') || diff === 0);

        if (done) return { key: 'done', label: 'Đã xong', className: 'done', accent: '#10b981', progress: 100 };
        if (expired) return { key: 'expired', label: diff !== null ? `Quá hạn ${Math.abs(diff)} ngày` : 'Quá hạn', className: 'expired', accent: '#ef4444', progress: 18 };
        if (dueToday) return { key: 'deadline', label: 'Hạn hôm nay', className: 'deadline', accent: '#f59e0b', progress: 48 };
        if (doing) return { key: 'doing', label: 'Đang làm', className: 'doing', accent: '#3b82f6', progress: 64 };
        return { key: 'planned', label: task.trangThai || 'Planned', className: 'planned', accent: '#64748b', progress: 28 };
    };

    const taskTitle = (task) => plainText(task.tieuDe || task.mucTieu || task.noiDung || 'Công việc không tên');
    const ownerName = (task) => task.owner ? (Utils.getUserDisplayName(task.owner) || task.owner) : 'Chưa giao';

    WorkModule.setWorkMode = (mode) => {
        WorkModule.currentWorkMode = mode === 'table' ? 'table' : 'board';
        WorkModule.render();
    };

    WorkModule.selectTask = (id) => {
        WorkModule.selectedTaskId = id;
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

    WorkModule.renderPlaceholder = async () => {
        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';
        const accounts = await Auth.getAccounts();
        WorkModule.allAccounts = accounts;

        let userFilterHtml = '';
        let quickAssignHtml = '';
        if (isAdmin) {
            let opts = '<option value="all">Tất cả nhân viên</option>';
            let assignOpts = '<option value="">-- Chọn nhân viên --</option>';
            accounts.forEach((account) => {
                const name = Utils.getUserDisplayName(account.username) || account.username;
                opts += `<option value="${escapeHtml(account.username)}">${escapeHtml(name)} (${escapeHtml(account.role)})</option>`;
                assignOpts += `<option value="${escapeHtml(account.username)}">${escapeHtml(name)}</option>`;
            });

            userFilterHtml = `
                <select class="form-control work-board-control" id="work-user-filter" onchange="WorkModule.filterByRole()">
                    ${opts}
                </select>
            `;

            quickAssignHtml = `
                <div class="work-board-assign">
                    <select class="form-control" id="work-quick-assign-user">${assignOpts}</select>
                    <button class="btn btn-primary" onclick="WorkModule.assignSelectedTask()">
                        <i class="fa-solid fa-user-check"></i> Giao việc
                    </button>
                </div>
            `;
        }

        const container = document.getElementById('work-view');
        container.innerHTML = `
            <style>
                .work-board-root { display: flex; flex-direction: column; gap: 16px; }
                .work-board-top {
                    display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;
                    padding: 18px; border-radius: 16px; border: 1px solid rgba(148,163,184,.16);
                    background: linear-gradient(135deg, rgba(15,23,42,.9), rgba(2,6,23,.76));
                    box-shadow: 0 18px 54px rgba(0,0,0,.24);
                }
                .work-board-title h3 { margin: 0; color: #f8fafc; font-size: 22px; letter-spacing: 0; }
                .work-board-title p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; }
                .work-board-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
                .work-search-wrap { position: relative; }
                .work-search-wrap i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #22d3ee; font-size: 12px; }
                .work-board-search, .work-board-control {
                    height: 38px; min-width: 150px; border-radius: 10px !important;
                    background: rgba(2,6,23,.74) !important; border: 1px solid rgba(148,163,184,.18) !important;
                    color: #e2e8f0 !important; font-size: 13px !important;
                }
                .work-board-search { width: 248px; padding-left: 34px !important; }
                .work-board-switch { display: inline-flex; gap: 3px; padding: 3px; border-radius: 12px; background: rgba(15,23,42,.88); border: 1px solid rgba(148,163,184,.16); }
                .work-board-switch button { height: 31px; border: 0; border-radius: 9px; padding: 0 12px; background: transparent; color: #94a3b8; font-size: 12px; font-weight: 850; cursor: pointer; }
                .work-board-switch button.active { background: rgba(16,185,129,.18); color: #6ee7b7; box-shadow: inset 0 0 0 1px rgba(16,185,129,.24); }
                .work-board-import { position: relative; overflow: hidden; display: inline-flex; }
                .work-board-import input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
                .work-board-assign { display: inline-flex; align-items: center; gap: 6px; padding: 4px; border-radius: 12px; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.24); }
                .work-board-assign select { height: 30px !important; min-width: 150px; border: 0 !important; background: transparent !important; font-size: 12px !important; }
                .work-board-assign button { height: 30px; padding: 0 10px; font-size: 12px; border-radius: 8px; }
                .work-kpis { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
                .work-kpi {
                    min-height: 82px; padding: 14px; border-radius: 14px; border: 1px solid rgba(148,163,184,.15);
                    background: rgba(15,23,42,.72); overflow: hidden; position: relative;
                }
                .work-kpi::after { content: ''; position: absolute; right: -18px; top: -18px; width: 72px; height: 72px; border-radius: 999px; background: var(--kpi); opacity: .13; }
                .work-kpi label { display: block; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; font-weight: 900; }
                .work-kpi strong { display: block; color: #f8fafc; font-size: 28px; line-height: 1; margin-top: 10px; }
                .work-kpi span { display: block; color: #64748b; font-size: 12px; margin-top: 6px; }
                .work-board-layout { display: grid; grid-template-columns: minmax(220px,.72fr) minmax(520px,1.55fr) minmax(340px,.92fr); gap: 14px; align-items: start; }
                .work-board-panel { border: 1px solid rgba(148,163,184,.14); border-radius: 16px; background: rgba(8,13,27,.78); overflow: hidden; min-height: 220px; }
                .work-board-panel-head { padding: 14px; border-bottom: 1px solid rgba(148,163,184,.1); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
                .work-board-panel-head h4 { margin: 0; color: #f8fafc; font-size: 14px; letter-spacing: 0; }
                .work-board-panel-head span { color: #64748b; font-size: 12px; font-weight: 800; }
                .work-agenda { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
                .work-agenda-card { padding: 10px; border-radius: 12px; border: 1px solid rgba(148,163,184,.12); background: rgba(15,23,42,.58); }
                .work-agenda-card b { display: block; color: #e2e8f0; font-size: 13px; margin-bottom: 4px; }
                .work-agenda-card span { color: #94a3b8; font-size: 12px; line-height: 1.38; }
                .work-lanes { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; padding: 12px; }
                .work-lane { min-height: 520px; border-radius: 14px; background: rgba(2,6,23,.42); border: 1px solid rgba(148,163,184,.1); overflow: hidden; }
                .work-lane-head { height: 46px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(148,163,184,.1); }
                .work-lane-head b { color: #f8fafc; font-size: 13px; }
                .work-lane-head span { color: #94a3b8; font-size: 12px; font-weight: 850; }
                .work-card-list { padding: 10px; display: flex; flex-direction: column; gap: 10px; max-height: 560px; overflow-y: auto; }
                .work-card {
                    border: 1px solid rgba(148,163,184,.13); border-left: 4px solid var(--accent);
                    border-radius: 13px; padding: 12px; background: rgba(15,23,42,.78); cursor: pointer;
                    box-shadow: 0 10px 26px rgba(0,0,0,.18); transition: transform .15s ease, background .15s ease, border-color .15s ease;
                }
                .work-card:hover { transform: translateY(-1px); background: rgba(20,29,48,.92); border-color: rgba(34,211,238,.28); }
                .work-card.active { border-color: rgba(34,211,238,.62); box-shadow: 0 0 0 1px rgba(34,211,238,.18), 0 16px 34px rgba(0,0,0,.28); }
                .work-card-title { color: #f8fafc; font-size: 13px; font-weight: 950; line-height: 1.28; min-height: 34px; }
                .work-card-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; align-items: center; }
                .work-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 7px; border-radius: 999px; font-size: 11px; font-weight: 900; color: #cbd5e1; background: rgba(2,6,23,.56); border: 1px solid rgba(148,163,184,.14); }
                .work-pill.done { color: #6ee7b7; border-color: rgba(16,185,129,.24); background: rgba(16,185,129,.1); }
                .work-pill.doing { color: #93c5fd; border-color: rgba(59,130,246,.24); background: rgba(59,130,246,.1); }
                .work-pill.expired { color: #fecaca; border-color: rgba(239,68,68,.28); background: rgba(239,68,68,.12); }
                .work-pill.deadline { color: #fde68a; border-color: rgba(245,158,11,.28); background: rgba(245,158,11,.12); }
                .work-progress { height: 5px; border-radius: 999px; overflow: hidden; background: rgba(148,163,184,.14); margin-top: 11px; }
                .work-progress i { display: block; height: 100%; width: var(--progress); border-radius: inherit; background: linear-gradient(90deg, var(--accent), rgba(255,255,255,.56)); }
                .work-detail { padding: 14px; display: flex; flex-direction: column; gap: 14px; }
                .work-detail h3 { margin: 0; color: #f8fafc; font-size: 18px; line-height: 1.28; letter-spacing: 0; }
                .work-detail-sub { display: flex; flex-wrap: wrap; gap: 8px; color: #94a3b8; font-size: 12px; }
                .work-detail-actions { display: flex; flex-wrap: wrap; gap: 8px; }
                .work-detail-section { border-top: 1px solid rgba(148,163,184,.1); padding-top: 12px; }
                .work-detail-section h5 { margin: 0 0 8px; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
                .work-detail-section p { margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.55; white-space: pre-wrap; }
                .work-checklist { display: flex; flex-direction: column; gap: 7px; }
                .work-checklist div { display: flex; gap: 8px; color: #cbd5e1; font-size: 13px; }
                .work-empty { padding: 32px 14px; text-align: center; color: #94a3b8; border-radius: 14px; border: 1px dashed rgba(148,163,184,.2); background: rgba(15,23,42,.46); }
                @media (max-width: 1350px) { .work-board-layout { grid-template-columns: 1fr; } .work-lanes { grid-template-columns: 1fr; } }
                @media (max-width: 900px) { .work-kpis { grid-template-columns: repeat(2, minmax(0,1fr)); } .work-board-toolbar { justify-content: flex-start; } .work-board-search { width: 100%; } }
            </style>
            <div class="work-board-root">
                <div class="work-board-top">
                    <div class="work-board-title">
                        <h3>Công việc & Lịch</h3>
                        <p id="work-date-display">Tất cả kế hoạch</p>
                    </div>
                    <div class="work-board-toolbar">
                        <div class="work-search-wrap">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input class="form-control work-board-search" id="work-search-input" placeholder="Tìm việc, brief, nhân viên..." oninput="WorkModule.render()">
                        </div>
                        <select class="form-control work-board-control" id="work-time-filter" onchange="WorkModule.currentFilterTime = this.value; WorkModule.filterByRole()">
                            <option value="all">Tất cả thời gian</option>
                            <option value="today">Hôm nay</option>
                        </select>
                        ${userFilterHtml}
                        <select class="form-control work-board-control" id="work-status-filter" onchange="WorkModule.render()">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="urgent">Cần xử lý</option>
                            <option value="doing">Đang làm</option>
                            <option value="done">Đã xong</option>
                            <option value="unassigned">Chưa giao</option>
                        </select>
                        <div class="work-board-switch">
                            <button id="work-mode-board" class="active" onclick="WorkModule.setWorkMode('board')"><i class="fa-solid fa-table-columns"></i> Điều phối</button>
                            <button id="work-mode-table" onclick="WorkModule.setWorkMode('table')"><i class="fa-solid fa-table"></i> Bảng gốc</button>
                        </div>
                        ${quickAssignHtml}
                        <div class="work-board-import">
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

    const getFilteredTasks = (tasksToRender) => {
        let tasks = [...(tasksToRender || WorkModule.data.tasks || [])];
        const query = normalize(document.getElementById('work-search-input')?.value || '');
        const statusFilter = document.getElementById('work-status-filter')?.value || 'all';

        if (query) {
            tasks = tasks.filter((task) => {
                const bag = [
                    task.project, task.mucTieu, task.truCot, task.tieuDe, task.noiDung,
                    task.dinhDang, task.orderBrief, task.ghiChu, task.anhGoiY,
                    task.owner, task.trangThai
                ].map(normalize).join(' ');
                return bag.includes(query);
            });
        }

        if (statusFilter !== 'all') {
            tasks = tasks.filter((task) => {
                const meta = statusMeta(task);
                if (statusFilter === 'urgent') return meta.key === 'expired' || meta.key === 'deadline';
                if (statusFilter === 'doing') return meta.key === 'doing' || meta.key === 'planned';
                if (statusFilter === 'done') return meta.key === 'done';
                if (statusFilter === 'unassigned') return !task.owner;
                return true;
            });
        }

        return tasks.sort((a, b) => {
            const order = { expired: 0, deadline: 1, doing: 2, planned: 3, done: 4 };
            const ma = statusMeta(a);
            const mb = statusMeta(b);
            if ((order[ma.key] ?? 9) !== (order[mb.key] ?? 9)) return (order[ma.key] ?? 9) - (order[mb.key] ?? 9);
            const da = parseDate(a.deadline || a.ngayDang)?.getTime() || 9999999999999;
            const db = parseDate(b.deadline || b.ngayDang)?.getTime() || 9999999999999;
            return da - db;
        });
    };

    const kpiCard = (label, value, note, color) => `
        <div class="work-kpi" style="--kpi:${color};border-color:${color}33;">
            <label>${escapeHtml(label)}</label>
            <strong>${value}</strong>
            <span>${escapeHtml(note)}</span>
        </div>
    `;

    const agendaCard = (label, tasks) => {
        const preview = tasks.slice(0, 2).map(taskTitle).join(', ');
        return `
            <div class="work-agenda-card">
                <b>${escapeHtml(label)} <em style="float:right;color:#6ee7b7;font-style:normal;">${tasks.length}</em></b>
                <span>${escapeHtml(preview || 'Không có việc nổi bật')}</span>
            </div>
        `;
    };

    const taskCard = (task) => {
        const meta = statusMeta(task);
        const active = task.id === WorkModule.selectedTaskId ? 'active' : '';
        return `
            <div class="work-card ${active}" style="--accent:${meta.accent};--progress:${meta.progress}%;" onclick="WorkModule.selectTask('${escapeHtml(task.id)}')">
                <div class="work-card-title">${escapeHtml(taskTitle(task))}</div>
                <div class="work-card-meta">
                    <span class="work-pill"><i class="fa-solid fa-user"></i>${escapeHtml(ownerName(task))}</span>
                    <span class="work-pill ${meta.className}">${escapeHtml(meta.label)}</span>
                    <span class="work-pill"><i class="fa-regular fa-clock"></i>${escapeHtml(task.deadline || task.ngayDang || '--')}</span>
                </div>
                <div class="work-progress"><i></i></div>
            </div>
        `;
    };

    const laneHtml = (title, icon, tasks) => `
        <div class="work-lane">
            <div class="work-lane-head">
                <b><i class="fa-solid ${icon}" style="margin-right:7px;"></i>${escapeHtml(title)}</b>
                <span>${tasks.length}</span>
            </div>
            <div class="work-card-list">
                ${tasks.length ? tasks.map(taskCard).join('') : '<div class="work-empty" style="padding:28px 12px;font-size:13px;">Không có việc trong nhóm này</div>'}
            </div>
        </div>
    `;

    const detailHtml = (task) => {
        if (!task) return '<div class="work-empty" style="margin:14px;">Chọn một việc để xem chi tiết.</div>';
        const meta = statusMeta(task);
        const canEdit = Auth.currentUser && (
            Auth.currentUser.role === 'admin' ||
            String(task.owner || '').toLowerCase().trim() === String(Auth.currentUser.username || '').toLowerCase().trim()
        );
        const brief = plainText(task.orderBrief || task.noiDung || task.mucTieu || '');
        const caption = plainText(task.noiDung || '');
        const note = plainText(task.ghiChu || task.anhGoiY || '');

        return `
            <div class="work-detail">
                <div>
                    <h3>${escapeHtml(taskTitle(task))}</h3>
                    <div class="work-detail-sub">
                        <span><i class="fa-solid fa-user"></i> ${escapeHtml(ownerName(task))}</span>
                        <span><i class="fa-regular fa-calendar"></i> Deadline: ${escapeHtml(task.deadline || task.ngayDang || '--')}</span>
                        <span class="work-pill ${meta.className}">${escapeHtml(meta.label)}</span>
                    </div>
                </div>
                <div class="work-detail-actions">
                    ${canEdit ? `<button class="btn btn-success btn-sm" onclick="WorkModule.changeTaskStatus('${escapeHtml(task.id)}','Done')"><i class="fa-solid fa-check"></i> Duyệt/Done</button>` : ''}
                    ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="WorkModule.changeTaskStatus('${escapeHtml(task.id)}','Doing')"><i class="fa-solid fa-rotate"></i> Đang làm</button>` : ''}
                    <button class="btn btn-warning btn-sm" onclick="WorkModule.openTicketModal('${escapeHtml(task.id)}')"><i class="fa-solid fa-ticket"></i> Mở phiếu</button>
                    <button class="btn btn-outline btn-sm" onclick="WorkModule.triggerImageUpload('${escapeHtml(task.id)}')"><i class="fa-solid fa-image"></i> Ảnh gợi ý</button>
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
                    <p>${escapeHtml(brief || 'Chưa có brief chi tiết.')}</p>
                </div>
                ${caption && caption !== brief ? `<div class="work-detail-section"><h5>Caption / Outline</h5><p>${escapeHtml(caption)}</p></div>` : ''}
                <div class="work-detail-section">
                    <h5>Ảnh gợi ý / Ghi chú</h5>
                    ${task.anhData ? `<img src="${task.anhData}" style="width:100%;max-height:170px;object-fit:cover;border-radius:12px;border:1px solid rgba(148,163,184,.16);margin-bottom:8px;">` : ''}
                    <p>${escapeHtml(note || 'Chưa có ghi chú hoặc ảnh gợi ý.')}</p>
                </div>
            </div>
        `;
    };

    WorkModule.renderBoardDashboard = (tasksToRender) => {
        const container = document.getElementById('work-list');
        if (!container) return;

        const baseTasks = tasksToRender || WorkModule.data.tasks || [];
        const tasks = getFilteredTasks(tasksToRender);
        if (!baseTasks.length) {
            container.innerHTML = `
                <div class="work-empty">
                    <i class="fa-solid fa-calendar-plus" style="font-size:42px;opacity:.6;margin-bottom:14px;"></i>
                    <div style="font-weight:900;color:#e2e8f0;margin-bottom:6px;">Chưa có kế hoạch công việc</div>
                    <div>Nhấn “Nhập Excel” để đưa kế hoạch vào hệ thống.</div>
                </div>
            `;
            return;
        }

        const visibleIds = new Set(tasks.map(t => t.id));
        if (!WorkModule.selectedTaskId || !visibleIds.has(WorkModule.selectedTaskId)) {
            WorkModule.selectedTaskId = tasks[0]?.id || baseTasks[0]?.id || null;
        }
        const selected = (WorkModule.data.tasks || []).find(t => t.id === WorkModule.selectedTaskId) || tasks[0];

        const todayTasks = baseTasks.filter(t => dayDiff(t) === 0);
        const overdueTasks = baseTasks.filter(t => statusMeta(t).key === 'expired');
        const waitingTasks = baseTasks.filter(t => {
            const key = statusMeta(t).key;
            return key === 'deadline' || key === 'planned' || !t.owner;
        });
        const doneTasks = baseTasks.filter(t => statusMeta(t).key === 'done');

        const urgent = tasks.filter(t => ['expired', 'deadline'].includes(statusMeta(t).key));
        const doing = tasks.filter(t => ['doing', 'planned'].includes(statusMeta(t).key)).slice(0, 12);
        const done = tasks.filter(t => statusMeta(t).key === 'done').slice(0, 12);

        container.innerHTML = `
            <div class="work-kpis">
                ${kpiCard('Hôm nay', todayTasks.length, 'Việc có lịch hôm nay', '#22d3ee')}
                ${kpiCard('Quá hạn', overdueTasks.length, 'Cần xử lý trước', '#ef4444')}
                ${kpiCard('Chờ duyệt', waitingTasks.length, 'Planned/chưa giao/hạn hôm nay', '#f59e0b')}
                ${kpiCard('Đã xong', doneTasks.length, 'Việc hoàn thành', '#10b981')}
            </div>
            <div class="work-board-layout">
                <div class="work-board-panel">
                    <div class="work-board-panel-head">
                        <h4><i class="fa-regular fa-calendar-days" style="color:#22d3ee;margin-right:8px;"></i>Lịch nhanh</h4>
                        <span>${tasks.length} việc</span>
                    </div>
                    <div class="work-agenda">
                        ${agendaCard('Hôm nay', todayTasks)}
                        ${agendaCard('Ngày mai', baseTasks.filter(t => dayDiff(t) === 1))}
                        ${agendaCard('Tuần này', baseTasks.filter(t => { const d = dayDiff(t); return d !== null && d >= 0 && d <= 7; }))}
                        ${agendaCard('Chưa giao', baseTasks.filter(t => !t.owner))}
                    </div>
                </div>
                <div class="work-board-panel">
                    <div class="work-board-panel-head">
                        <h4><i class="fa-solid fa-layer-group" style="color:#10b981;margin-right:8px;"></i>Bảng điều phối</h4>
                        <span>Ưu tiên việc cần xử lý</span>
                    </div>
                    <div class="work-lanes">
                        ${laneHtml('Cần xử lý ngay', 'fa-triangle-exclamation', urgent)}
                        ${laneHtml('Đang làm hôm nay', 'fa-list-check', doing)}
                        ${laneHtml('Chờ duyệt / Đã xong', 'fa-circle-check', done)}
                    </div>
                </div>
                <div class="work-board-panel">
                    <div class="work-board-panel-head">
                        <h4><i class="fa-solid fa-circle-info" style="color:#f59e0b;margin-right:8px;"></i>Chi tiết việc</h4>
                        <span>${escapeHtml(selected?.project || 'Kế hoạch')}</span>
                    </div>
                    ${detailHtml(selected)}
                </div>
            </div>
        `;
    };

    WorkModule.renderList = (tasksToRender) => {
        const boardBtn = document.getElementById('work-mode-board');
        const tableBtn = document.getElementById('work-mode-table');
        if (boardBtn && tableBtn) {
            boardBtn.classList.toggle('active', WorkModule.currentWorkMode !== 'table');
            tableBtn.classList.toggle('active', WorkModule.currentWorkMode === 'table');
        }

        if (WorkModule.currentWorkMode === 'table') {
            originalRenderList(tasksToRender);
            return;
        }
        WorkModule.renderBoardDashboard(tasksToRender);
    };
})();
