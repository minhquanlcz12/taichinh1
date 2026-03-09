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

        // If it's already a standard string, return it
        if (typeof excelDateCode === 'string' && isNaN(Number(excelDateCode))) {
            return excelDateCode;
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
