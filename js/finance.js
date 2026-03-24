// js/finance.js

const FinanceModule = {
    data: {
        transactions: [] // {id, type: 'income'|'expense', amount, category, note, date, owner}
    },

    categories: {
        income: ['Lương', 'Đầu tư', 'Thưởng', 'Khác'],
        expense: ['Thực phẩm', 'Hóa đơn', 'Giải trí', 'Mua sắm', 'Sức khỏe', 'Giáo dục', 'Khác']
    },

    currentFilterMonth: new Date().toISOString().slice(0, 7), // YYYY-MM

    init: async () => {
        await FinanceModule.renderPlaceholder();
        await FinanceModule.load();
    },

    load: async () => {
        const d = await DB.getFinanceData();
        if (d && d.transactions) {
            FinanceModule.data = d;
        } else {
            FinanceModule.data.transactions = [];
        }
        FinanceModule.filterByRole();
    },

    save: async () => {
        await DB.saveFinanceData(FinanceModule.data);
        FinanceModule.filterByRole(); // Re-render with active filters
    },

    filterByRole: () => {
        const currentUser = Auth.currentUser;
        if (!currentUser) return;

        let displayTransactions = FinanceModule.data.transactions;

        if (currentUser.role === 'admin') {
            const filterEl = document.getElementById('finance-user-filter');
            if (filterEl && filterEl.value !== 'all') {
                displayTransactions = FinanceModule.data.transactions.filter(t => t.owner === filterEl.value || (!t.owner && filterEl.value === 'admin'));
            }
        } else {
            // If not admin, only show transactions owned by this user
            displayTransactions = FinanceModule.data.transactions.filter(t => t.owner === currentUser.username);
        }

        if (app.state && app.state.currentView === 'dashboard-view') {
            app.renderDashboard(); // Dashboard always renders personal summary implicitly
        }
        FinanceModule.renderList(displayTransactions);
    },

    addTransaction: async (type, amount, category, date, note) => {
        FinanceModule.data.transactions.push({
            id: Utils.generateId(),
            type,
            amount: parseFloat(amount),
            category,
            date,
            note,
            owner: Auth.currentUser.username
        });
        await FinanceModule.save();
    },

    getSummary: (transactionsToSummarize) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let income = 0;
        let expense = 0;
        let totalBalance = 0; // Balance is all-time

        let txs = transactionsToSummarize || FinanceModule.data.transactions;
        const currentUser = Auth.currentUser;
        if (!transactionsToSummarize && currentUser) {
            txs = txs.filter(t => t.owner === currentUser.username || (!t.owner && currentUser.username === 'admin'));
        }

        txs.forEach(tx => {
            const txDate = new Date(tx.date);

            // All-time balance
            if (tx.type === 'income') totalBalance += parseFloat(tx.amount);
            else totalBalance -= parseFloat(tx.amount);

            // Month summary
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                if (tx.type === 'income') income += parseFloat(tx.amount);
                else expense += parseFloat(tx.amount);
            }
        });

        return { balance: totalBalance, income, expense };
    },

    getRecentTransactions: (limit = 5, transactionsToFilter) => {
        let txs = transactionsToFilter || FinanceModule.data.transactions;
        const currentUser = Auth.currentUser;
        if (!transactionsToFilter && currentUser) {
            txs = txs.filter(t => t.owner === currentUser.username || (!t.owner && currentUser.username === 'admin'));
        }
        return [...txs]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    },

    renderPlaceholder: async () => {
        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';

        let filterHtml = '';
        if (isAdmin) {
            const accounts = await Auth.getAccounts();
            let opts = `<option value="all">Tất cả nhân viên</option>`;
            accounts.forEach(a => {
                opts += `<option value="${a.username}">${a.username} (${a.role})</option>`;
            });
            filterHtml = `
                <select class="form-control" id="finance-user-filter" style="width: auto; display: inline-block; margin-right: 12px; height: 38px;" onchange="FinanceModule.filterByRole()">
                    ${opts}
                </select>
            `;
        }

        const container = document.getElementById('finance-view');
        container.innerHTML = `
            <div class="finance-header" style="display:flex; justify-content:space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                <h3 style="font-size: 20px;">Danh sách Giao dịch</h3>
                <div style="display: flex; gap: 12px; align-items: center;">
                    ${filterHtml}
                    <button class="btn btn-primary" onclick="FinanceModule.showAddModal()">
                        <i class="fa-solid fa-plus"></i> Thêm Giao dịch
                    </button>
                    ${isAdmin ? '<button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f;" onclick="FinanceModule.exportToPDF()"><i class="fa-solid fa-file-pdf"></i> Xuất PDF</button>' : ''}
                </div>
            </div>
            
            <div class="glass-card">
                <div class="transaction-list full-list" id="finance-list-container">
                    <!-- Danh sách giao dịch full -->
                </div>
            </div>
        `;
    },

    renderList: (transactionsToRender) => {
        const container = document.getElementById('finance-list-container');
        if (!container) return; // not rendered yet

        const txs = transactionsToRender || FinanceModule.data.transactions;
        const sortedTxs = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTxs.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Chưa có giao dịch lịch sử.</div>';
            return;
        }

        const isAdmin = Auth.currentUser && Auth.currentUser.role === 'admin';

        container.innerHTML = sortedTxs.map(tx => {
            let actionHtml = '';
            if (isAdmin) {
                actionHtml = `
                    ${tx.editRequested ? `
                    <button class="btn-text text-success" onclick="FinanceModule.approveEditRequest('${tx.id}')" title="Duyệt & Cấp quyền Sửa/Xóa">
                        <i class="fa-solid fa-check-circle"></i>
                    </button>
                    <button class="btn-text text-warning" onclick="FinanceModule.clearEditRequest('${tx.id}')" title="Từ chối/Hủy yêu cầu">
                        <i class="fa-solid fa-xmark-circle"></i>
                    </button>
                    ` : ''}
                    <button class="btn-text text-primary" onclick="FinanceModule.editTransaction('${tx.id}')" title="Chỉnh sửa trực tiếp">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-text text-danger" onclick="FinanceModule.deleteTransaction('${tx.id}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
            } else {
                if (tx.editApproved) {
                    actionHtml = `
                        <button class="btn-text text-primary" onclick="FinanceModule.editTransaction('${tx.id}')" title="Đã được cấp quyền sửa">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-text text-danger" onclick="FinanceModule.deleteTransaction('${tx.id}')" title="Đã được cấp quyền xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    `;
                } else if (tx.editRequested) {
                    actionHtml = `<span class="badge bg-warning" style="font-size: 10px; color: #000; padding: 4px 8px; font-weight: bold;"><i class="fa-solid fa-hourglass-half"></i> Chờ duyệt</span>`;
                } else {
                    actionHtml = `
                        <button class="btn-text" style="color: var(--warning);" onclick="FinanceModule.requestEditTransaction('${tx.id}')" title="Yêu cầu Admin sửa/xóa">
                            <i class="fa-solid fa-code-pull-request"></i>
                        </button>
                    `;
                }
            }

            return `
            <div class="transaction-item" style="padding: 20px 16px; ${tx.editRequested && isAdmin ? 'border: 1px solid var(--warning); background: rgba(245, 158, 11, 0.1);' : ''}">
                <div class="tx-info">
                    <div class="tx-icon ${tx.type === 'income' ? 'bg-success' : 'bg-danger'}">
                        <i class="fa-solid ${tx.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div class="tx-details">
                        <h4>
                            ${tx.category} 
                            ${isAdmin ? `<span class="badge badge-orange" style="font-size:10px; margin-left: 8px;"><i class="fa-solid fa-user"></i> ${tx.owner || 'admin'}</span>` : ''}
                        </h4>
                        <p>${tx.note ? tx.note + ' • ' : ''}${Utils.formatDate(tx.date)}</p>
                        ${tx.editRequested && isAdmin ? `<div style="margin-top: 6px; font-size: 12px; color: var(--warning);"><i class="fa-solid fa-triangle-exclamation"></i> <b>Yêu cầu:</b> ${tx.editReason}</div>` : ''}
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap: 8px;">
                    <div class="tx-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${tx.type === 'income' ? '+' : '-'}${Utils.formatCurrency(tx.amount)}
                    </div>
                    ${actionHtml}
                </div>
            </div>
            `;
        }).join('');
    },

    render: () => {
        FinanceModule.filterByRole();
    },

    showAddModal: () => {
        const today = new Date().toISOString().split('T')[0];

        const content = `
            <div class="form-group">
                <label>Loại Giao dịch</label>
                <select class="form-control" id="tx-type" onchange="FinanceModule.updateCategories()">
                    <option value="expense">Chi tiêu</option>
                    <option value="income">Thu nhập</option>
                </select>
            </div>
            <div class="form-group">
                <label>Số tiền (VNĐ)</label>
                <input type="number" class="form-control" id="tx-amount" placeholder="VD: 500000" required>
                <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(50000)">50k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(100000)">100k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(200000)">200k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(500000)">500k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(1000000)">1000k</button>
                </div>
            </div>
            <div class="form-group">
                <label>Danh mục</label>
                <select class="form-control" id="tx-category"></select>
            </div>
            <div class="form-group">
                <label>Ngày</label>
                <input type="date" class="form-control" id="tx-date" value="${today}">
            </div>
            <div class="form-group">
                <label>Ghi chú (Tùy chọn)</label>
                <input type="text" class="form-control" id="tx-note" placeholder="Chi tiết giao dịch">
            </div>
        `;

        Utils.showModal('Thêm Giao dịch Mới', content, async () => {
            const type = document.getElementById('tx-type').value;
            const amount = document.getElementById('tx-amount').value;
            const category = document.getElementById('tx-category').value;
            const date = document.getElementById('tx-date').value;
            const note = document.getElementById('tx-note').value;

            if (!amount || amount <= 0) {
                Utils.showToast('Vui lòng nhập số tiền hợp lệ.', 'error');
                return false; // Prevent close
            }

            FinanceModule.data.transactions.push({
                id: Utils.generateId(),
                type,
                amount: parseFloat(amount),
                category,
                date,
                note,
                owner: Auth.currentUser ? Auth.currentUser.username : 'admin'
            });

            await FinanceModule.save();
            Utils.showToast('Thêm giao dịch thành công!', 'success');
            return true; // OK to close
        }, 'Lưu Giao dịch');

        // Initialize categories for default 'expense'
        FinanceModule.updateCategories();
    },

    requestEditTransaction: (id) => {
        const tx = FinanceModule.data.transactions.find(t => t.id === id);
        if (!tx) return;

        Utils.showModal('Yêu cầu Chỉnh sửa / Xóa', `
            <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 13px;">Giao dịch sau khi đã lưu không thể tự ý thay đổi. Vui lòng nhập lý do và chi tiết cần sửa để Admin phê duyệt.</p>
            <div class="form-group">
                <label>Lý do / Nội dung cần sửa</label>
                <textarea class="form-control" id="req-edit-reason" rows="3" placeholder="Ví dụ: Em nhập nhầm số tiền thành 500k, nhờ sếp sửa thành 50k giúp em." required></textarea>
            </div>
        `, async () => {
            const reason = document.getElementById('req-edit-reason').value.trim();
            if (!reason) {
                Utils.showToast("Vui lòng nhập lý do!", "error");
                return false;
            }

            tx.editRequested = true;
            tx.editReason = reason;

            await FinanceModule.save();
            Utils.showToast("Đã gửi yêu cầu cho Admin!", "success");

            // Notify via Telegram
            if (typeof Utils.notifyTelegram === 'function') {
                const msg = `⚠️ <b>[YÊU CẦU CẬP NHẬT TÀI CHÍNH]</b>
👤 Nhân viên: <b>${tx.owner}</b>
💰 Giao dịch: ${tx.type === 'income' ? '+' : '-'}${Utils.formatCurrency(tx.amount)} (${tx.category})
📝 Lý do: <i>${reason}</i>

👉 Admin vui lòng truy cập mục Tài chính để xử lý!`;
                Utils.notifyTelegram(msg);
            }

            return true;
        }, 'Gửi Yêu Cầu');
    },

    approveEditRequest: async (id) => {
        const tx = FinanceModule.data.transactions.find(t => t.id === id);
        if (!tx) return;
        
        tx.editApproved = true;
        tx.editRequested = false;
        await FinanceModule.save();
        Utils.showToast('Đã cấp quyền sửa/xóa cho nhân viên!', 'success');

        // Notify via Telegram
        if (typeof Utils.notifyTelegram === 'function') {
            const msg = `✅ <b>[YÊU CẦU ĐÃ ĐƯỢC DUYỆT]</b>
Admin đã CẤP QUYỀN sửa/xóa giao dịch cho bạn:
💰 Số tiền: ${tx.type === 'income' ? '+' : '-'}${Utils.formatCurrency(tx.amount)} (${tx.category})
📝 Yêu cầu ban đầu: <i>${tx.editReason}</i>

👉 Vui lòng vào lại hệ thống Tài chính để thực hiện Sửa/Xóa!`;
            Utils.notifyTelegram(msg);
        }
    },

    clearEditRequest: async (id) => {
        const tx = FinanceModule.data.transactions.find(t => t.id === id);
        if (!tx) return;
        
        tx.editRequested = false;
        tx.editReason = null;
        await FinanceModule.save();
        Utils.showToast('Đã từ chối/hủy yêu cầu sửa!', 'success');
    },

    editTransaction: (id) => {
        const tx = FinanceModule.data.transactions.find(t => t.id === id);
        if (!tx) return;

        const content = `
            <div class="form-group">
                <label>Loại Giao dịch</label>
                <select class="form-control" id="tx-type" onchange="FinanceModule.updateCategories()">
                    <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>Chi tiêu</option>
                    <option value="income" ${tx.type === 'income' ? 'selected' : ''}>Thu nhập</option>
                </select>
            </div>
            <div class="form-group">
                <label>Số tiền (VNĐ)</label>
                <input type="number" class="form-control" id="tx-amount" placeholder="VD: 500000" value="${tx.amount}" required>
                <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(50000)">50k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(100000)">100k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(200000)">200k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(500000)">500k</button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="FinanceModule.setFastAmount(1000000)">1000k</button>
                </div>
            </div>
            <div class="form-group">
                <label>Danh mục</label>
                <select class="form-control" id="tx-category"></select>
            </div>
            <div class="form-group">
                <label>Ngày</label>
                <input type="date" class="form-control" id="tx-date" value="${tx.date}">
            </div>
            <div class="form-group">
                <label>Ghi chú (Tùy chọn)</label>
                <input type="text" class="form-control" id="tx-note" placeholder="Chi tiết giao dịch" value="${tx.note || ''}">
            </div>
        `;

        Utils.showModal('Chỉnh sửa Giao dịch', content, async () => {
            // For simplicity, modify the logic so we delete the old one if save is clicked
            // This means the ID changes, but that's okay for localStorage/firebase.
            const type = document.getElementById('tx-type').value;
            const amount = document.getElementById('tx-amount').value;
            const category = document.getElementById('tx-category').value;
            const date = document.getElementById('tx-date').value;
            const note = document.getElementById('tx-note').value;

            if (!amount || amount <= 0) {
                Utils.showToast('Vui lòng nhập số tiền hợp lệ.', 'error');
                return false; // Prevent close
            }

            // Remove old
            FinanceModule.data.transactions = FinanceModule.data.transactions.filter(t => t.id !== id);

            // Add new replacement (keep old owner)
            FinanceModule.data.transactions.push({
                id: Utils.generateId(), // New ID for the updated transaction
                type,
                amount: parseFloat(amount),
                category,
                date,
                note,
                owner: tx.owner // Keep the original owner
            });

            await FinanceModule.save();
            Utils.showToast('Cập nhật giao dịch thành công!', 'success');
            return true; // OK to close
        }, 'Lưu Thay đổi');

        // Initialize categories for the selected type and then set the category
        FinanceModule.updateCategories();
        document.getElementById('tx-category').value = tx.category;
    },

    setFastAmount: (amount) => {
        const input = document.getElementById('tx-amount');
        if (input) {
            input.value = amount;
        }
    },

    updateCategories: () => {
        const typeControl = document.getElementById('tx-type');
        const catControl = document.getElementById('tx-category');
        if (!typeControl || !catControl) return;

        const type = typeControl.value;
        const options = FinanceModule.categories[type];

        catControl.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    },

    deleteTransaction: async (id) => {
        if (await Utils.showConfirm('Xác nhận Xóa', 'Bạn có chắc muốn xóa giao dịch này?')) {
            FinanceModule.data.transactions = FinanceModule.data.transactions.filter(t => t.id !== id);
            await FinanceModule.save();
            Utils.showToast('Đã xoá giao dịch!', 'success');
        }
    },

    exportToPDF: () => {
        const listContainer = document.getElementById('finance-list-container');
        if (!listContainer || listContainer.innerHTML.includes('Chưa có giao dịch lịch sử')) {
            Utils.showToast("Không có dữ liệu để xuất", "error");
            return;
        }

        Utils.showToast("Đang tạo file PDF...", "info");

        const clone = document.createElement('div');
        clone.style.padding = '30px';
        clone.style.background = '#ffffff';
        clone.style.color = '#000000';
        clone.style.fontFamily = 'Arial, sans-serif';

        const today = new Date().toLocaleDateString('vi-VN');
        const totalInc = FinanceModule.data.transactions.filter(t=>t.type==='income').reduce((sum,t)=>sum+t.amount,0);
        const totalExp = FinanceModule.data.transactions.filter(t=>t.type==='expense').reduce((sum,t)=>sum+t.amount,0);

        clone.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #da251d; padding-bottom: 20px;">
                <h1 style="color: #da251d; margin-bottom: 5px;">THANH LONG WORK</h1>
                <h3>BÁO CÁO TÀI CHÍNH</h3>
                <p>Ngày xuất: ${today}</p>
            </div>
            
            <div style="display:flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold;">
                <div style="color: #10b981;">Tổng Thu: ${Utils.formatCurrency(totalInc)}đ</div>
                <div style="color: #ef4444;">Tổng Chi: ${Utils.formatCurrency(totalExp)}đ</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 13px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Ngày</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Loại</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Danh mục</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Ghi chú</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Số tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${FinanceModule.data.transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(tx => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #d1d5db;">${Utils.formatDate(tx.date)}</td>
                            <td style="padding: 10px; border: 1px solid #d1d5db; color: ${tx.type === 'income' ? '#10b981' : '#ef4444'}; font-weight: bold;">${tx.type === 'income' ? 'Thu' : 'Chi'}</td>
                            <td style="padding: 10px; border: 1px solid #d1d5db;">${tx.category}</td>
                            <td style="padding: 10px; border: 1px solid #d1d5db;">${tx.note || ''}</td>
                            <td style="padding: 10px; border: 1px solid #d1d5db; text-align: right; color: ${tx.type === 'income' ? '#10b981' : '#ef4444'};">${tx.type === 'income' ? '+' : '-'}${Utils.formatCurrency(tx.amount)}đ</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 50px; text-align: center;">
                <div style="width: 200px;">
                    <p style="font-weight: bold; margin-bottom: 80px;">Giám Đốc</p>
                    <p>ĐÀO THANH LONG</p>
                </div>
            </div>
        `;

        const opt = {
            margin:       0.5,
            filename:     'baocao_taichinh_' + Date.now() + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(clone).save().then(() => {
            Utils.showToast("Đã xuất Báo Cáo Tài Chính ra PDF!", "success");
        }).catch(err => {
            console.error("Lỗi xuất PDF:", err);
            Utils.showToast("Lỗi khi xuất PDF", "error");
        });
    }
};
