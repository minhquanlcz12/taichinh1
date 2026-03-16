// css/utils.js - Shared utilities

const Utils = {
    // LocalStorage wrappers
    storage: {
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage', error);
                return defaultValue;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('Error saving to localStorage', error);
            }
        },
        remove: (key) => {
            localStorage.removeItem(key);
        },
        clearAll: () => {
            localStorage.clear();
        }
    },

    // Formatters
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    },

    formatDate: (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    },

    // Fix for Excel Serial dates (e.g. 45082)
    convertExcelDate: (excelDateCode) => {
        if (!excelDateCode) return '';

        // If it's already a standard string, normalize to DD/MM/YYYY
        if (typeof excelDateCode === 'string' && isNaN(Number(excelDateCode))) {
            let str = excelDateCode.trim();
            let parts = str.split(/[\/\-]/);
            if (parts.length >= 2 && parts.length <= 3) {
                let d = String(parts[0]).padStart(2, '0');
                let m = String(parts[1]).padStart(2, '0');
                let y = parts.length === 3 ? parts[2] : new Date().getFullYear();
                if (String(y).length === 2) y = '20' + y;
                return `${d}/${m}/${y}`;
            }
            return str;
        }

        const serialNumber = Number(excelDateCode);
        if (isNaN(serialNumber) || serialNumber <= 0) return '';

        // Excel epoch is Jan 1, 1900. JS epoch is Jan 1, 1970.
        // Difference is 25569 days (which includes the Lotus 1-2-3 leap year bug).
        const msPerDay = 86400000;
        const jsDateCode = Math.round((serialNumber - 25569) * msPerDay);

        // Use UTC methods to avoid time zone offset shifting
        const date = new Date(jsDateCode);

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();

        return `${day}/${month}/${year}`;
    },

    getTodayString: () => {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();
        return `${d}/${m}/${y}`;
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // UI Animations
    animateValue: (obj, start, end, duration, formatter) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentVal = Math.floor(easeProgress * (end - start) + start);
            obj.textContent = formatter ? formatter(currentVal) : currentVal;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    // Modal Builder
    showModal: (title, contentHtml, onConfirm = null, confirmText = 'Xác nhận') => {
        const overlay = document.getElementById('modal-overlay');

        // Remove existing modal if any
        overlay.innerHTML = '';

        const modalHtml = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" id="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${contentHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-text" id="modal-cancel">Hủy</button>
                    ${onConfirm ? `<button class="btn btn-primary" id="modal-confirm">${confirmText}</button>` : ''}
                </div>
            </div>
        `;

        overlay.innerHTML = modalHtml;
        overlay.classList.add('active');

        // Event listeners
        const closeModal = () => overlay.classList.remove('active');

        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('modal-cancel').addEventListener('click', closeModal);

        if (onConfirm) {
            document.getElementById('modal-confirm').addEventListener('click', () => {
                if (onConfirm()) {
                    closeModal();
                }
            });
        }

        // Close on clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    },

    // Custom Prompt Modal (Returns Promise)
    showPrompt: (title, defaultValue = '') => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '9999';
            overlay.style.backdropFilter = 'blur(5px)';
            overlay.innerHTML = `
                <div class="modal glass-card" style="width: 90%; max-width: 450px; padding: 24px; animation: slideIn 0.3s ease;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <i class="fa-solid fa-folder-plus" style="font-size: 24px; color: var(--primary);"></i>
                        <h3 style="font-weight: 600; font-size: 18px; margin: 0;">${title}</h3>
                    </div>
                    <input type="text" id="custom-prompt-input" class="form-control" value="${defaultValue}" style="margin-bottom: 24px; width: 100%; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; font-size: 15px;" autocomplete="off" spellcheck="false">
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button class="btn btn-text" id="custom-prompt-cancel" style="padding: 10px 20px;">Hủy bỏ</button>
                        <button class="btn btn-primary" id="custom-prompt-ok" style="padding: 10px 24px;">Tiếp tục</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const input = document.getElementById('custom-prompt-input');
            input.focus();
            input.select();

            const close = (val) => {
                overlay.remove();
                resolve(val);
            };

            document.getElementById('custom-prompt-cancel').onclick = () => close(null);
            document.getElementById('custom-prompt-ok').onclick = () => close(input.value.trim());

            input.onkeydown = (e) => {
                if (e.key === 'Enter') close(input.value.trim());
                if (e.key === 'Escape') close(null);
            };
        });
    },

    // Custom Confirm Modal (Returns Promise)
    showConfirm: (title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '9999';
            overlay.style.backdropFilter = 'blur(5px)';
            overlay.innerHTML = `
                <div class="modal glass-card" style="width: 90%; max-width: 400px; padding: 24px; animation: slideIn 0.3s ease; text-align: center; border-radius: 12px; border: 1px solid rgba(136, 255, 209, 0.3); box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);">
                    <div style="margin-bottom: 24px;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(255, 193, 7, 0.1); border: 2px solid var(--warning); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; box-shadow: 0 0 15px rgba(255, 193, 7, 0.2);">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size: 28px; color: var(--warning);"></i>
                        </div>
                        <h3 style="font-weight: bold; font-size: 18px; margin: 0; margin-bottom: 12px; color: #fff;">${title}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.5; margin: 0;">${message}</p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-text" id="custom-confirm-cancel" style="flex: 1; padding: 10px 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;">${cancelText}</button>
                        <button class="btn" id="custom-confirm-ok" style="flex: 1; padding: 10px 0; background: var(--warning); color: #000; font-weight: bold; border-radius: 6px; box-shadow: 0 0 10px rgba(255, 193, 7, 0.4);">${confirmText}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const close = (val) => {
                overlay.remove();
                resolve(val);
            };

            document.getElementById('custom-confirm-cancel').onclick = () => close(false);
            document.getElementById('custom-confirm-ok').onclick = () => close(true);
        });
    },

    // Toast Notification Builder
    showToast: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-circle-xmark';
        if (type === 'info') iconClass = 'fa-circle-info';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 400); // Wait for transition finish
        }, 3000);
    }
};
