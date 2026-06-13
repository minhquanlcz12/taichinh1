const Attendance = {
    // Thá»i háº¡n cháº¥m cÃ´ng Ä‘Ãºng giá»
    DEADLINE_HOURS: 8,
    DEADLINE_MINUTES: 30,
    AFTERNOON_DEADLINE_HOURS: 14,
    AFTERNOON_DEADLINE_MINUTES: 0,

    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    ATTENDANCE_SECURITY_DEFAULTS: {
        enabled: true,
        requireTrustedDevice: false,
        radiusMeters: 180,
        companyLat: null,
        companyLng: null,
        allowedPublicIps: [],
        trustedDevices: []
    },


    init: () => {
        // Tá»± Ä‘á»™ng Ä‘iá»ƒm danh bÃ¹ chiá»u 13/06
        Attendance.checkAndPerformAutoCheckIn();
        // Chá»‰ render khi ngÆ°á»i dÃ¹ng click vÃ o tab cháº¥m cÃ´ng (hoáº·c init láº§n Ä‘áº§u náº¿u cáº§n)
    },


    checkAndPerformAutoCheckIn: async () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (dateStr === '2026-06-13' && now.getHours() >= 12) {
            const flagKey = 'tl_auto_checkin_jun13_v2';
            if (localStorage.getItem(flagKey) === 'done') return;
            try {
                const accounts = await Auth.getAccounts();
                const allAttendance = await Attendance.loadData();
                let changed = false;
                for (const acc of accounts) {
                    if (acc.role === 'admin' || acc.username === 'nlgiang' || acc.username === 'nlgiang112' || acc.username === 'congty') continue;
                    const hasRecord = allAttendance.some(r => r.username === acc.username && r.dateStr === dateStr && r.type === 'afternoon');
                    if (!hasRecord) {
                        allAttendance.push({
                            id: `auto_${acc.username}_${Date.now()}`,
                            username: acc.username,
                            dateStr: dateStr,
                            timestamp: Date.now(),
                            status: 'on_time',
                            lateMinutes: 0,
                            type: 'afternoon',
                            security: { autoCheckIn: true }
                        });
                        changed = true;
                    }
                }
                if (changed) {
                    await Attendance.saveData(allAttendance);
                    if (document.getElementById('attendance-content-area')) Attendance.render();
                }
                localStorage.setItem(flagKey, 'done');
            } catch (e) {
                console.error('Lỗi điểm danh tự động:', e);
            }
        }
    },

    loadData: async () => {
        let attendanceData = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getAttendance === 'function') {
                attendanceData = await DB.getAttendance() || [];
                // Äá»“ng bá»™ má»“ cÃ´i tá»« LocalStorage lá»¡ lÆ°u lÃºc chÆ°a update
                let localData = JSON.parse(localStorage.getItem('tl_attendance') || '[]');
                if (localData.length > 0) {
                    let changed = false;
                    localData.forEach(lr => {
                        if (!attendanceData.find(r => r.id === lr.id)) {
                            attendanceData.push(lr);
                            changed = true;
                        }
                    });
                    if (changed) {
                        await DB.saveAttendance(attendanceData);
                    }
                    localStorage.removeItem('tl_attendance');
                }
            } else {
                attendanceData = JSON.parse(localStorage.getItem('tl_attendance') || '[]');
            }
        } catch (e) {
            console.error("Lá»—i táº£i dá»¯ liá»‡u cháº¥m cÃ´ng:", e);
            attendanceData = JSON.parse(localStorage.getItem('tl_attendance') || '[]');
        }
        return attendanceData;
    },

    saveData: async (data) => {
        try {
            if (typeof DB !== 'undefined' && typeof DB.saveAttendance === 'function') {
                await DB.saveAttendance(data);
            } else {
                localStorage.setItem('tl_attendance', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Lá»—i lÆ°u dá»¯ liá»‡u cháº¥m cÃ´ng:", e);
            localStorage.setItem('tl_attendance', JSON.stringify(data));
        }
    },

    getAttendanceSecuritySettings: async () => {
        let settings = {};
        try {
            if (typeof DB !== 'undefined' && typeof DB.getSettings === 'function') {
                settings = await DB.getSettings() || {};
            } else if (typeof app !== 'undefined' && app.state) {
                settings = app.state.settings || {};
            }
        } catch (e) {
            settings = (typeof app !== 'undefined' && app.state) ? (app.state.settings || {}) : {};
        }

        const raw = settings.attendanceSecurity || {};
        return {
            ...Attendance.ATTENDANCE_SECURITY_DEFAULTS,
            ...raw,
            allowedPublicIps: Array.isArray(raw.allowedPublicIps) ? raw.allowedPublicIps : [],
            trustedDevices: Array.isArray(raw.trustedDevices) ? raw.trustedDevices : []
        };
    },

    saveAttendanceSecuritySettings: async (security) => {
        const current = (typeof DB !== 'undefined' && typeof DB.getSettings === 'function')
            ? await DB.getSettings() || {}
            : ((typeof app !== 'undefined' && app.state) ? (app.state.settings || {}) : {});
        const next = {
            ...current,
            attendanceSecurity: {
                ...Attendance.ATTENDANCE_SECURITY_DEFAULTS,
                ...security,
                updatedAt: Date.now(),
                updatedBy: Auth.currentUser?.username || 'admin'
            }
        };

        if (typeof DB !== 'undefined' && typeof DB.saveSettings === 'function') {
            await DB.saveSettings(next);
        }
        if (typeof app !== 'undefined' && app.state) {
            app.state.settings = next;
        }
    },

    getOrCreateDeviceSeed: () => {
        const key = 'tl_attendance_device_seed';
        let seed = localStorage.getItem(key);
        if (!seed) {
            const webCrypto = window.crypto || window.msCrypto;
            seed = (webCrypto && webCrypto.randomUUID)
                ? webCrypto.randomUUID()
                : `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(key, seed);
        }
        return seed;
    },

    sha256: async (text) => {
        const webCrypto = window.crypto || window.msCrypto;
        if (webCrypto?.subtle && window.TextEncoder) {
            const data = new TextEncoder().encode(text);
            const hash = await webCrypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    },

    escapeHtml: (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch])),

    getCurrentDeviceProfile: async () => {
        const seed = Attendance.getOrCreateDeviceSeed();
        const raw = [
            seed,
            navigator.userAgent || '',
            navigator.platform || '',
            screen?.width || 0,
            screen?.height || 0,
            Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        ].join('|');
        const id = await Attendance.sha256(raw);
        return {
            id,
            shortId: id.slice(0, 10).toUpperCase(),
            label: `${navigator.platform || 'Company PC'} ${screen?.width || ''}x${screen?.height || ''}`.trim(),
            userAgent: (navigator.userAgent || '').slice(0, 140)
        };
    },

    getPublicIp: async () => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4500);
            const res = await fetch('https://api.ipify.org?format=json', {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!res.ok) return null;
            const data = await res.json();
            return (data.ip || '').trim();
        } catch (e) {
            return null;
        }
    },

    distanceMeters: (lat1, lng1, lat2, lng2) => {
        const toRad = deg => deg * Math.PI / 180;
        const earth = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
        return Math.round(earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    },

    verifyCheckInAccess: async (lat, lng) => {
        const security = await Attendance.getAttendanceSecuritySettings();
        const device = await Attendance.getCurrentDeviceProfile();
        const allowedIps = security.allowedPublicIps.map(ip => String(ip).trim()).filter(Boolean);
        const publicIp = allowedIps.length > 0 ? await Attendance.getPublicIp() : null;

        if (!security.enabled) {
            return { ok: true, reason: 'security-disabled', security, device, publicIp };
        }

        const trustedDevice = !security.requireTrustedDevice ||
            security.trustedDevices.some(d => d.id === device.id);

        const hasOfficeLocation = Number.isFinite(Number(security.companyLat)) && 
                                 Number.isFinite(Number(security.companyLng)) && 
                                 (Number(security.companyLat) !== 0 || Number(security.companyLng) !== 0);

        let distance = null;
        let locationOk = false;
        if (hasOfficeLocation && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
            distance = Attendance.distanceMeters(
                Number(lat),
                Number(lng),
                Number(security.companyLat),
                Number(security.companyLng)
            );
            locationOk = distance <= Number(security.radiusMeters || Attendance.ATTENDANCE_SECURITY_DEFAULTS.radiusMeters);
        }

        const networkOk = !!publicIp && allowedIps.includes(publicIp);

        const hasAnyOfficeGate = hasOfficeLocation || allowedIps.length > 0;
        const officeGateOk = locationOk || networkOk;
        const reasons = [];

        if (!trustedDevice) {
            reasons.push('MÃ¡y nÃ y chÆ°a Ä‘Æ°á»£c Ä‘Äƒng kÃ½ lÃ  thiáº¿t bá»‹ cÃ´ng ty tin cáº­y.');
        }

        if (!hasAnyOfficeGate) {
            reasons.push('ChÆ°a cáº¥u hÃ¬nh Vá»‹ trÃ­ hoáº·c IP cÃ´ng ty (Vui lÃ²ng bÃ¡o Admin).');
        } else if (!officeGateOk) {
            if (hasOfficeLocation && !locationOk && allowedIps.length > 0 && !networkOk) {
                 reasons.push('Báº¡n Ä‘ang á»Ÿ ngoÃ i pháº¡m vi GPS vÃ  khÃ´ng dÃ¹ng máº¡ng WiFi cÃ´ng ty.');
            } else if (hasOfficeLocation && !locationOk) {
                 reasons.push('Vá»‹ trÃ­ hiá»‡n táº¡i cá»§a báº¡n náº±m ngoÃ i pháº¡m vi cÃ´ng ty (> ' + (security.radiusMeters || 180) + 'm).');
            } else if (allowedIps.length > 0 && !networkOk) {
                 reasons.push('Báº¡n khÃ´ng sá»­ dá»¥ng Ä‘á»‹a chá»‰ IP máº¡ng cÃ´ng ty Ä‘Æ°á»£c cho phÃ©p.');
            }
        }

        // RELAXED SECURITY: Always allow check-ins but log reasons if failed
        // This ensures "everyone can clock in" as requested by user
        return {
            ok: true, // Force true to allow check-in
            warning: reasons.join(' '), // Pass reasons as warning
            isStrictFailure: !(trustedDevice && hasAnyOfficeGate && officeGateOk),
            reason: reasons.join(' '),

            security,
            device,
            publicIp,
            trustedDevice,
            locationOk,
            networkOk,
            distance
        };
    },

    resetCheckInButton: (message) => {
        const btn = document.getElementById('btn-check-in');
        if (!btn) return;
        btn.dataset.state = 'idle';
        const label = btn.querySelector('.wf-label');
        if (label) label.textContent = message || 'GO MO DIEM DANH';
    },

    notifyAttendanceSecurityAlert: async (access, context = {}) => {
        if (typeof Utils === 'undefined' || typeof Utils.notifyTelegram !== 'function') return;

        const user = Auth.currentUser || {};
        const now = context.now || new Date();
        const sessionLabel = context.session === 'afternoon' ? 'Ca chieu' : 'Ca sang';
        const throttleKey = `tl_attendance_security_alert_${user.username || 'unknown'}`;
        const throttleMs = 2 * 60 * 1000;

        try {
            const lastSent = Number(sessionStorage.getItem(throttleKey) || 0);
            if (Date.now() - lastSent < throttleMs) return;
            sessionStorage.setItem(throttleKey, String(Date.now()));
        } catch (e) {
            // Ignore private-mode storage errors; alert is still useful.
        }

        const reason = Attendance.escapeHtml(access.reason || 'Khong dat dieu kien diem danh tai cong ty.');
        const publicIp = access.publicIp ? Attendance.escapeHtml(access.publicIp) : 'Khong doc duoc';
        const deviceShortId = access.device?.shortId ? Attendance.escapeHtml(access.device.shortId) : 'Unknown';
        const deviceStatus = access.trustedDevice ? 'Da dang ky' : 'Chua dang ky';
        const radius = access.security?.radiusMeters || Attendance.ATTENDANCE_SECURITY_DEFAULTS.radiusMeters;
        const distanceText = access.distance !== null && access.distance !== undefined
            ? `${access.distance}m / ban kinh ${radius}m`
            : 'Khong co GPS hop le';
        const lat = Number(context.lat);
        const lng = Number(context.lng);
        const locationText = Number.isFinite(lat) && Number.isFinite(lng)
            ? `<a href="https://google.com/maps?q=${lat},${lng}">${lat.toFixed(6)}, ${lng.toFixed(6)}</a> (${distanceText})`
            : distanceText;

        const msg = [
            `ðŸš¨ <b>[CANH BAO DIEM DANH NGOAI CONG TY]</b>`,
            ``,
            `ðŸ‘¤ <b>Nhan su:</b> ${Attendance.escapeHtml(user.username || 'unknown')}`,
            `ðŸ•’ <b>Thoi gian:</b> ${Attendance.escapeHtml(now.toLocaleString('vi-VN'))} (${sessionLabel})`,
            `â›” <b>Ket qua:</b> Bi chan, khong tao ban ghi cham cong`,
            `ðŸ“ <b>Ly do:</b> ${reason}`,
            ``,
            `ðŸ“ <b>GPS:</b> ${locationText}`,
            `ðŸŒ <b>Public IP:</b> ${publicIp} (${access.networkOk ? 'mang cong ty' : 'khong khop mang cong ty'})`,
            `ðŸ–¥ï¸ <b>May:</b> ${deviceShortId} (${deviceStatus})`,
            `âœ… <b>Gate:</b> GPS ${access.locationOk ? 'PASS' : 'FAIL'} | Network ${access.networkOk ? 'PASS' : 'FAIL'}`
        ].join('\n');

        await Utils.notifyTelegram(msg);
    },

    renderAttendanceSecurityPanel: async (security) => {
        const currentDevice = await Attendance.getCurrentDeviceProfile();
        const publicIp = await Attendance.getPublicIp();
        const deviceTrusted = security.trustedDevices.some(d => d.id === currentDevice.id);
        const ipTrusted = publicIp && security.allowedPublicIps.includes(publicIp);
        const locationConfigured = Number.isFinite(Number(security.companyLat)) && Number.isFinite(Number(security.companyLng));
        const deviceList = security.trustedDevices.length
            ? security.trustedDevices.map(d => `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 10px;">
                    <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Attendance.escapeHtml(d.label || 'Company PC')} <small style="color:#94a3b8;">${String(d.id).slice(0, 10).toUpperCase()}</small></span>
                    <button class="btn btn-sm" style="padding:5px 8px;border-color:rgba(239,68,68,0.5);color:#f87171;" onclick="Attendance.removeTrustedDevice('${d.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `).join('')
            : '<div style="color:#f59e0b;font-size:12px;">Chua co may cong ty nao duoc dang ky.</div>';
        const ipList = security.allowedPublicIps.length
            ? security.allowedPublicIps.map(ip => `
                <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);color:#86efac;border-radius:999px;padding:5px 8px;font-weight:700;">
                    ${ip}
                    <button style="background:transparent;border:0;color:#f87171;cursor:pointer;font-weight:900;" onclick="Attendance.removeAllowedIp('${ip}')">&times;</button>
                </span>
            `).join('')
            : '<span style="color:#f59e0b;font-size:12px;">Chua co IP mang cong ty.</span>';

        return `
            <div class="glass-panel" style="margin: 0 0 18px 0; padding: 16px; border: 1px solid rgba(34,211,238,0.28); background: linear-gradient(135deg, rgba(8,47,73,0.45), rgba(15,23,42,0.75));">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px;">
                    <div>
                        <h3 style="margin:0 0 4px;color:#67e8f9;font-size:15px;text-transform:uppercase;letter-spacing:.7px;"><i class="fa-solid fa-shield-halved"></i> Bao mat diem danh</h3>
                        <div style="color:#94a3b8;font-size:12px;">Dieu kien: may cong ty da dang ky + dung GPS cong ty hoac dung IP mang cong ty.</div>
                    </div>
                    <button class="btn btn-sm" style="border-color:${security.enabled ? '#22c55e' : '#64748b'};color:${security.enabled ? '#86efac' : '#cbd5e1'};" onclick="Attendance.toggleAttendanceSecurity()">
                        <i class="fa-solid ${security.enabled ? 'fa-lock' : 'fa-lock-open'}"></i> ${security.enabled ? 'Dang bat' : 'Dang tat'}
                    </button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                    <div style="background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
                        <div style="font-size:12px;color:#cbd5e1;font-weight:800;margin-bottom:8px;"><i class="fa-solid fa-desktop"></i> May hien tai</div>
                        <div style="font-size:12px;color:${deviceTrusted ? '#86efac' : '#fbbf24'};margin-bottom:8px;">ID: ${currentDevice.shortId} - ${deviceTrusted ? 'Da dang ky' : 'Chua dang ky'}</div>
                        <button class="btn btn-sm btn-primary" onclick="Attendance.registerCurrentDevice()" style="width:100%;"><i class="fa-solid fa-plus"></i> Dang ky may nay</button>
                        <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;max-height:112px;overflow:auto;">${deviceList}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
                        <div style="font-size:12px;color:#cbd5e1;font-weight:800;margin-bottom:8px;"><i class="fa-solid fa-location-dot"></i> Vi tri cong ty</div>
                        <div style="font-size:12px;color:${locationConfigured ? '#86efac' : '#fbbf24'};margin-bottom:8px;">
                            ${locationConfigured ? `${Number(security.companyLat).toFixed(6)}, ${Number(security.companyLng).toFixed(6)} - ban kinh ${security.radiusMeters}m` : 'Chua luu GPS cong ty'}
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-sm btn-primary" onclick="Attendance.saveCurrentCompanyLocation()" style="flex:1;"><i class="fa-solid fa-crosshairs"></i> Luu GPS hien tai</button>
                            <button class="btn btn-sm" onclick="Attendance.updateAttendanceRadius()" style="flex:0 0 auto;">${security.radiusMeters}m</button>
                        </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
                        <div style="font-size:12px;color:#cbd5e1;font-weight:800;margin-bottom:8px;"><i class="fa-solid fa-wifi"></i> Mang cong ty</div>
                        <div style="font-size:12px;color:${ipTrusted ? '#86efac' : '#94a3b8'};margin-bottom:8px;">IP hien tai: ${publicIp || 'Khong doc duoc'} ${ipTrusted ? '(da cho phep)' : ''}</div>
                        <button class="btn btn-sm btn-primary" onclick="Attendance.addCurrentNetworkIp()" style="width:100%;"><i class="fa-solid fa-plus"></i> Them IP hien tai</button>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">${ipList}</div>
                    </div>
                </div>
            </div>
        `;
    },

    registerCurrentDevice: async () => {
        try {
            const security = await Attendance.getAttendanceSecuritySettings();
            const device = await Attendance.getCurrentDeviceProfile();
            const label = prompt('Nhap ten may cong ty:', device.label || 'Company PC') || device.label;
            const trustedDevices = security.trustedDevices.filter(d => d.id !== device.id);
            trustedDevices.push({
                id: device.id,
                label,
                addedAt: Date.now(),
                addedBy: Auth.currentUser?.username || 'admin'
            });
            await Attendance.saveAttendanceSecuritySettings({ ...security, trustedDevices });
            Utils.showToast('Da dang ky may nay la may cong ty.', 'success');
            Attendance.render();
        } catch (e) {
            Utils.showToast('Khong dang ky duoc may hien tai.', 'error');
        }
    },

    removeTrustedDevice: async (deviceId) => {
        const security = await Attendance.getAttendanceSecuritySettings();
        await Attendance.saveAttendanceSecuritySettings({
            ...security,
            trustedDevices: security.trustedDevices.filter(d => d.id !== deviceId)
        });
        Utils.showToast('Da go may khoi danh sach cong ty.', 'success');
        Attendance.render();
    },

    saveCurrentCompanyLocation: async () => {
        if (!navigator.geolocation) {
            Utils.showToast('Trinh duyet khong ho tro GPS.', 'error');
            return;
        }
        Utils.showToast('Dang lay GPS hien tai...', 'info');
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const security = await Attendance.getAttendanceSecuritySettings();
            await Attendance.saveAttendanceSecuritySettings({
                ...security,
                companyLat: pos.coords.latitude,
                companyLng: pos.coords.longitude,
                radiusMeters: Number(security.radiusMeters || 180)
            });
            Utils.showToast('Da luu vi tri cong ty.', 'success');
            Attendance.render();
        }, () => Utils.showToast('Khong lay duoc GPS hien tai.', 'error'), {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    },

    updateAttendanceRadius: async () => {
        const security = await Attendance.getAttendanceSecuritySettings();
        const value = prompt('Nhap ban kinh GPS hop le (met):', String(security.radiusMeters || 180));
        if (value === null) return;
        const radius = Math.max(30, Math.min(2000, Number(value) || 180));
        await Attendance.saveAttendanceSecuritySettings({ ...security, radiusMeters: radius });
        Utils.showToast(`Da cap nhat ban kinh ${radius}m.`, 'success');
        Attendance.render();
    },

    addCurrentNetworkIp: async () => {
        const ip = await Attendance.getPublicIp();
        if (!ip) {
            Utils.showToast('Khong doc duoc public IP hien tai.', 'error');
            return;
        }
        const security = await Attendance.getAttendanceSecuritySettings();
        const allowedPublicIps = Array.from(new Set([...security.allowedPublicIps, ip]));
        await Attendance.saveAttendanceSecuritySettings({ ...security, allowedPublicIps });
        Utils.showToast(`Da them IP cong ty: ${ip}`, 'success');
        Attendance.render();
    },

    removeAllowedIp: async (ip) => {
        const security = await Attendance.getAttendanceSecuritySettings();
        await Attendance.saveAttendanceSecuritySettings({
            ...security,
            allowedPublicIps: security.allowedPublicIps.filter(x => x !== ip)
        });
        Utils.showToast('Da go IP khoi danh sach mang cong ty.', 'success');
        Attendance.render();
    },

    toggleAttendanceSecurity: async () => {
        const security = await Attendance.getAttendanceSecuritySettings();
        await Attendance.saveAttendanceSecuritySettings({ ...security, enabled: !security.enabled });
        Utils.showToast(`Bao mat diem danh da ${!security.enabled ? 'bat' : 'tat'}.`, 'success');
        Attendance.render();
    },

    render: async () => {
        const container = document.getElementById('attendance-content-area');
        if (!container) return;
        
        const currentUser = Auth.currentUser;
        if (!currentUser) return;

        if (currentUser.role === 'admin') {
            await Attendance.renderAdminView(container);
        } else {
            await Attendance.renderUserView(container, currentUser);
        }
    },

    loadLeaveData: async () => {
        let leaveData = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getLeaveRequests === 'function') {
                leaveData = await DB.getLeaveRequests() || [];
                // Äá»“ng bá»™ rÃ¡c tá»« LocalStorage
                let localData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
                if (localData.length > 0) {
                    let changed = false;
                    localData.forEach(lr => {
                        if (!leaveData.find(r => r.id === lr.id)) {
                            leaveData.push(lr);
                            changed = true;
                        }
                    });
                    if (changed) {
                        await DB.saveLeaveRequests(leaveData);
                    }
                    localStorage.removeItem('tl_leave_requests');
                }
            } else {
                leaveData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
            }
        } catch (e) {
            console.error("Lá»—i táº£i dá»¯ liá»‡u xin nghá»‰:", e);
            leaveData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
        }
        return leaveData;
    },

    saveLeaveData: async (data) => {
        try {
            if (typeof DB !== 'undefined' && typeof DB.saveLeaveRequests === 'function') {
                await DB.saveLeaveRequests(data);
            } else {
                localStorage.setItem('tl_leave_requests', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Lá»—i lÆ°u dá»¯ liá»‡u xin nghá»‰:", e);
            localStorage.setItem('tl_leave_requests', JSON.stringify(data));
        }
    },

    loadLateRequests: async () => {
        let lateData = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getLateRequests === 'function') {
                lateData = await DB.getLateRequests() || [];
                // Äá»“ng bá»™ rÃ¡c tá»« LocalStorage
                let localData = JSON.parse(localStorage.getItem('tl_late_requests') || '[]');
                if (localData.length > 0) {
                    let changed = false;
                    localData.forEach(lr => {
                        if (!lateData.find(r => r.id === lr.id)) {
                            lateData.push(lr);
                            changed = true;
                        }
                    });
                    if (changed) {
                        await DB.saveLateRequests(lateData);
                    }
                    localStorage.removeItem('tl_late_requests');
                }
            } else {
                lateData = JSON.parse(localStorage.getItem('tl_late_requests') || '[]');
            }
        } catch (e) {
            console.error("Lá»—i táº£i dá»¯ liá»‡u xin Ä‘i trá»…:", e);
            lateData = JSON.parse(localStorage.getItem('tl_late_requests') || '[]');
        }
        return lateData;
    },

    saveLateRequests: async (data) => {
        try {
            if (typeof DB !== 'undefined' && typeof DB.saveLateRequests === 'function') {
                await DB.saveLateRequests(data);
            } else {
                localStorage.setItem('tl_late_requests', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Lá»—i lÆ°u dá»¯ liá»‡u xin Ä‘i trá»…:", e);
            localStorage.setItem('tl_late_requests', JSON.stringify(data));
        }
    },

    renderUserView: async (container, user) => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const allData = await Attendance.loadData();
        
        // Kiá»ƒm tra xem ca hiá»‡n táº¡i Ä‘Ã£ cháº¥m cÃ´ng chÆ°a
        const currentHour = today.getHours();
        const currentSession = currentHour < 12 ? 'morning' : 'afternoon';
        const sessionRecord = allData.find(r => 
            r.username === user.username && 
            r.dateStr === dateStr && 
            (r.type === currentSession || (currentSession === 'morning' && !r.type))
        );
        let checkInHtml = '';

        if (sessionRecord) {
            let meritPts = 1;
            let statusText = '';
            let badgeClass = '';
            const sessionName = (sessionRecord.type === 'afternoon') ? 'Ca Chiá»u' : 'Ca SÃ¡ng';
            
            if (sessionRecord.status === 'on_time') {
                meritPts = 0.5;
                statusText = `ðŸ† ÄÃºng giá» (${sessionName}) â€” CÃ´ng Ä‘á»©c +0.5`;
                badgeClass = 'on-time';
            } else if (sessionRecord.status === 'late_excused') {
                meritPts = 0.5;
                statusText = `ðŸ† Muá»™n cÃ³ phÃ©p (${sessionName}) â€” CÃ´ng Ä‘á»©c +0.5`;
                badgeClass = 'late-excused';
            } else {
                meritPts = -0.5;
                statusText = `â° Muá»™n ${sessionRecord.lateMinutes}p (${sessionName}) â€” Pháº¡t 20k & Trá»« 0.5 CÃ´ng Ä‘á»©c`;
                badgeClass = 'late';
            }
            checkInHtml = `
                <div class="wf-success">
                    <div class="monk-video-container" style="margin: 0 auto 20px; width: fit-content; border-radius: 12px; overflow: hidden; border: 1px solid rgba(218,165,0,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <video autoplay loop muted playsinline style="width: 100%; max-width: 200px; display: block;">
                            <source src="assets/videos/monk_mo.mp4" type="video/mp4">
                        </video>
                    </div>
                    <div class="wf-success-icon" style="color:#daa520;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2Zm0,18c-4.41,0-8-3.59-8-8s3.59-8,8-8,8,3.59,8,8-3.59,8-8,8ZM11,7h2v6h-2V7Zm0,8h2v2h-2v-2Z" opacity=".3"/>
                            <path d="M12,4c-4.42,0-8,3.58-8,8s3.58,8,8,8,8-3.58,8-8-3.58-8-8-8Zm0,14c-3.31,0-6-2.69-6-6s2.69-6,6-6,6,2.69,6,6-2.69,6-6,6Z"/>
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <h3><i class="fa-solid fa-circle-check" style="color:#2ecc71;margin-right:8px;"></i> ${sessionName} hÃ´m nay Ä‘Ã£ ghi nháº­n</h3>
                    <p>GÃµ mÃµ lÃºc: <strong style="color:#daa520;">${new Date(sessionRecord.timestamp).toLocaleTimeString('vi-VN')}</strong></p>
                    ${sessionRecord.location ? `<p style="font-size:12px;"><i class="fa-solid fa-location-dot" style="color:#daa520;"></i> GPS xÃ¡c minh vá»‹ trÃ­ táº¡i cÃ´ng ty</p>` : ''}
                    ${sessionRecord.security?.networkOk ? `<p style="font-size:12px;"><i class="fa-solid fa-wifi" style="color:#64ffda;"></i> Máº¡ng cÃ´ng ty Ä‘Ã£ xÃ¡c minh</p>` : ''}
                    <span class="wf-badge ${badgeClass}">
                        ${statusText}
                    </span>
                </div>
            `;
            
            // TÃ¬m báº£n ghi checkout cá»§a ngÃ y hÃ´m nay
            const checkoutRecord = allData.find(r => r.username === user.username && r.dateStr === dateStr && r.checkoutTimestamp);
            if (!checkoutRecord) {
                checkInHtml += `
                <div style="text-align:center;margin-top:20px;">
                    <button class="btn" style="background:#daa520;color:#000;padding:12px 24px;font-weight:bold;border-radius:30px;box-shadow:0 4px 15px rgba(218,165,32,0.4);" onclick="Attendance.showCheckoutModal()">
                        <i class="fa-solid fa-person-walking-arrow-right" style="margin-right:8px;"></i> CHECK-OUT
                    </button>
                    <p style="color:var(--text-secondary);font-size:12px;margin-top:8px;">BÃ¡o cÃ¡o EOD trÆ°á»›c khi káº¿t thÃºc ngÃ y.</p>
                </div>`;
            } else {
                checkInHtml += `
                <div class="glass-panel" style="margin-top:20px;padding:16px;border-color:rgba(218,165,32,0.2);">
                    <h4 style="color:#daa520;margin-bottom:8px;"><i class="fa-solid fa-clipboard-check"></i> HoÃ n thÃ nh ngÃ y lÃ m viá»‡c</h4>
                    <p style="color:var(--text-secondary);font-size:13px;margin:0;">Ra vá» lÃºc: <strong>${new Date(checkoutRecord.checkoutTimestamp).toLocaleTimeString('vi-VN')}</strong></p>
                </div>`;
            }
        } else {
            const sessLabel = currentSession === 'afternoon' ? 'Ca Chiá»u (Háº¡n chá»‘t 14:00)' : 'Ca SÃ¡ng (Háº¡n chá»‘t 08:30)';
            checkInHtml = `
                <div class="check-in-box" style="text-align: center;">
                    <div class="monk-video-container" style="margin: 0 auto 24px; width: fit-content; border-radius: 16px; overflow: hidden; border: 2px solid rgba(218,165,32,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                        <video autoplay loop muted playsinline style="width: 100%; max-width: 280px; display: block;">
                            <source src="assets/videos/monk_mo.mp4" type="video/mp4">
                        </video>
                    </div>
                    <button id="btn-check-in" class="wf-assembly" data-state="idle" type="button"
                            aria-label="GÃµ mÃµ Ä‘iá»ƒm danh" onclick="Attendance.handleCheckIn()">
                        <div class="wf-aura"></div>
                        <div class="wf-body"><div class="wf-body-img"></div></div>
                        <div class="wf-mallet">
                            <div class="wf-mallet-handle"></div>
                            <div class="wf-mallet-head"></div>
                        </div>
                        <div class="wf-impact-ring"></div>
                        <span class="wf-particle" style="top:45%;left:30%;--wf-p-dir:translate(-30px,-25px)"></span>
                        <span class="wf-particle" style="top:35%;left:55%;--wf-p-dir:translate(10px,-35px)"></span>
                        <span class="wf-particle" style="top:55%;left:65%;--wf-p-dir:translate(25px,15px)"></span>
                        <span class="wf-particle" style="top:60%;left:35%;--wf-p-dir:translate(-20px,20px)"></span>
                        <span class="wf-particle" style="top:30%;left:40%;--wf-p-dir:translate(-15px,-30px)"></span>
                        <span class="wf-particle" style="top:50%;left:70%;--wf-p-dir:translate(30px,-5px)"></span>
                        <div class="wf-cong-duc"><i class="fa-solid fa-hands-praying"></i> +0.5 CÃ´ng Äá»©c Äi LÃ m</div>
                        <span class="wf-label"><i class="fa-solid fa-gavel" style="margin-right:6px;"></i> GÃ• MÃ• ÄIá»‚M DANH</span>
                    </button>
                    <p style="margin-top:28px;color:#daa520;font-weight:600;font-size:14px;">ðŸ™ GÃµ mÃµ Ä‘á»ƒ tÃ­ch cÃ´ng Ä‘á»©c Ä‘i lÃ m ${sessLabel}!</p>
                    <small style="color:rgba(255,255,255,0.35);display:block;margin-top:6px;"><i class="fa-solid fa-shield-halved" style="color:#daa520;"></i> MÃ¡y cÃ´ng ty + GPS hoáº·c máº¡ng cÃ´ng ty</small>
                </div>
            `;
        }

        // LuÃ´n hiá»ƒn thá»‹ nÃºt xin nghá»‰ phÃ©p & xin Ä‘i trá»…
        checkInHtml += `
            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                <button class="btn btn-outline" style="border-color: var(--warning); color: var(--warning);" onclick="Attendance.showLeaveModal()">
                    <i class="fa-solid fa-calendar-minus" style="margin-right: 6px;"></i>ÄÄƒng kÃ½ Xin Nghá»‰ PhÃ©p
                </button>
                <button class="btn btn-outline" style="border-color: var(--primary); color: var(--primary);" onclick="Attendance.showLateRequestModal()">
                    <i class="fa-solid fa-clock" style="margin-right: 6px;"></i>ÄÄƒng kÃ½ Xin Äáº¿n Trá»…
                </button>
            </div>
        `;

        // TÃ­nh lÆ°Æ¡ng táº¡m tÃ­nh cho user
        let salaryPreviewHtml = '';
        try {
            const currentMonthStr = PayrollModule.getCurrentCycleMonthStr(new Date());
            const estSalary = await PayrollModule.calculateUserSalary(user.username, currentMonthStr);
            const cycle = PayrollModule.getCycleRange(currentMonthStr);
            const workingDaysInCycle = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);
            const passedWorkDays = PayrollModule.getWorkedWorkingDaysInCycle(cycle.startDate, cycle.endDate);
            const formattedStart = cycle.startStr.split('-').slice(1).reverse().join('/'); // DD/MM
            const formattedEnd = cycle.endStr.split('-').slice(1).reverse().join('/'); // DD/MM
            salaryPreviewHtml = `
                <div class="glass-card" style="margin-bottom: 20px; padding: 16px; border-color: rgba(46,204,113,0.2); background: rgba(46,204,113,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                                <i class="fa-solid fa-coins" style="color:var(--success); margin-right: 5px;"></i>LÆ°Æ¡ng Táº¡m TÃ­nh (Ká»³ ${formattedStart} - ${formattedEnd})
                            </div>
                            <div style="font-size: 26px; font-weight: 900; color: var(--success);">${Utils.formatCurrency(estSalary)}</div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: var(--text-secondary);">
                            <div><i class="fa-solid fa-calendar-days" style="color: var(--primary); margin-right: 4px;"></i>${passedWorkDays} / ${workingDaysInCycle} ngÃ y cÃ´ng</div>
                            <div style="margin-top: 4px; font-size: 10px; color: rgba(255,255,255,0.3);">Cáº­p nháº­t theo cháº¥m cÃ´ng</div>
                        </div>
                    </div>
                </div>
            `;
        } catch(e) { console.warn('Salary preview error:', e); }

        // Láº¥y lá»‹ch sá»­ 30 ngÃ y gáº§n nháº¥t
        const userHistory = allData.filter(r => r.username === user.username).sort((a,b) => b.timestamp - a.timestamp).slice(0, 30);
        
        // Láº¥y lá»‹ch sá»­ xin nghá»‰
        const allLeaves = await Attendance.loadLeaveData();
        const userLeaves = allLeaves.filter(l => l.username === user.username).sort((a,b) => b.timestamp - a.timestamp);
        const RESET_DATE = '2026-06-10';
        let currentMeritDisplay = '?';
        if (typeof RewardsModule !== 'undefined') {
            const mInfo = await RewardsModule.calcUserMerit(user.username);
            currentMeritDisplay = mInfo.current;
        } else {
            const meritHistory = userHistory.filter(r => r.dateStr >= RESET_DATE);
            currentMeritDisplay = 1 + meritHistory.reduce((acc, r) => acc + ((r.status === 'on_time' || r.status === 'late_excused') ? 0.5 : -0.5), 0);
        }
        let historyHtml = `
            <div class="wf-history-panel">
                <h3><i class="fa-solid fa-scroll" style="margin-right:8px;"></i> Sá»• CÃ´ng Äá»©c <span class="wf-stat">Kháº£ dá»¥ng: ${currentMeritDisplay} <i class="fa-solid fa-star"></i></span></h3>
                <p style="font-size:11.5px; color:var(--success); margin-top:-5px; margin-bottom:10px;"><i class="fa-solid fa-gift"></i> ÄÃ£ Ä‘Æ°á»£c tá»± Ä‘á»™ng Reset táº·ng khá»Ÿi Ä‘áº§u +1 Ä‘iá»ƒm (Bá» qua lá»‹ch sá»­ vi pháº¡m quÃ¡ háº¡n trÆ°á»›c ngÃ y 20/05/2026).</p>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>NgÃ y</th>
                                <th>Káº¿t quáº£ Ä‘iá»ƒm danh</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userHistory.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:rgba(218,165,32,0.3);">ChÆ°a cÃ³ cÃ´ng Ä‘á»©c nÃ o</td></tr>' : ''}
                            ${userHistory.map(r => {
                                const isOld = r.dateStr < RESET_DATE;
                                const pts = (r.status === 'on_time' || r.status === 'late_excused') ? 0.5 : -0.5;
                                let badgeHtml = '';
                                if (r.status === 'on_time') {
                                    badgeHtml = '<span class="badge bg-success">ÄÃºng giá»</span>';
                                } else if (r.status === 'late_excused') {
                                    badgeHtml = '<span class="badge" style="background:#00adb5; color:#fff; font-weight:bold;">Muá»™n phÃ©p</span>';
                                } else {
                                    badgeHtml = `<span class="badge bg-danger">Muá»™n ${r.lateMinutes}p</span>`;
                                }
                                return `
                                <tr style="${isOld ? 'opacity: 0.5;' : ''}">
                                    <td>${r.dateStr}</td>
                                    <td>
                                        ${badgeHtml}
                                        ${isOld ? `<span class="wf-merit-badge" style="background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);">KhÃ´ng tÃ­nh</span>` 
                                                : `<span class="wf-merit-badge ${pts < 0 ? 'negative' : ''}" style="${pts > 0 ? '' : 'background:rgba(239,68,68,0.2);color:#ef4444;border-color:rgba(239,68,68,0.3);'}">${pts > 0 ? '+' : ''}${pts}</span>`}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-panel" style="margin-top: 24px; padding: 20px;">
                <h3 style="margin-bottom: 16px; color: var(--warning);">Lá»‹ch sá»­ Xin nghá»‰ phÃ©p</h3>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>NgÃ y nghá»‰</th>
                                <th>Sá»‘ ngÃ y</th>
                                <th>LÃ½ do</th>
                                <th>Tráº¡ng thÃ¡i</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userLeaves.length === 0 ? '<tr><td colspan="4" style="text-align:center;">ChÆ°a cÃ³ yÃªu cáº§u xin nghá»‰</td></tr>' : ''}
                            ${userLeaves.map(l => {
                                let statusHtml = '';
                                if (l.status === 'pending') statusHtml = '<span class="badge bg-warning" style="color: #000;">Chá» Duyá»‡t</span>';
                                else if (l.status === 'approved') statusHtml = '<span class="badge bg-success">ÄÃ£ Duyá»‡t</span>';
                                else if (l.status === 'rejected') statusHtml = '<span class="badge bg-danger">Tá»« Chá»‘i</span>';
                                
                                return `
                                <tr>
                                    <td>${l.startDate}</td>
                                    <td>${l.days}</td>
                                    <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${l.reason}">${l.reason}</td>
                                    <td>${statusHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Táº£i lá»‹ch sá»­ xin Ä‘i trá»… cá»§a nhÃ¢n viÃªn
        const allLates = await Attendance.loadLateRequests();
        const userLates = allLates.filter(l => l.username === user.username).sort((a,b) => b.timestamp - a.timestamp);

        historyHtml += `
            <div class="glass-panel" style="margin-top: 24px; padding: 20px;">
                <h3 style="margin-bottom: 16px; color: var(--primary);">Lá»‹ch sá»­ Xin Äáº¿n Trá»…</h3>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>NgÃ y xin trá»…</th>
                                <th>Sá»‘ phÃºt</th>
                                <th>LÃ½ do</th>
                                <th>Tráº¡ng thÃ¡i</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userLates.length === 0 ? '<tr><td colspan="4" style="text-align:center;">ChÆ°a cÃ³ yÃªu cáº§u xin Ä‘i trá»…</td></tr>' : ''}
                            ${userLates.map(l => {
                                let statusHtml = '';
                                if (l.status === 'pending') statusHtml = '<span class="badge bg-warning" style="color: #000;">Chá» Duyá»‡t</span>';
                                else if (l.status === 'approved') statusHtml = `<span class="badge bg-success">${l.resolvedBy === 'system' ? 'Tá»± Äá»™ng Duyá»‡t' : 'ÄÃ£ Duyá»‡t'}</span>`;
                                else if (l.status === 'rejected') statusHtml = '<span class="badge bg-danger">Tá»« Chá»‘i</span>';
                                
                                return `
                                <tr>
                                    <td>${l.date}</td>
                                    <td style="font-weight:bold; color:var(--primary);">${l.minutes} phÃºt</td>
                                    <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${l.reason}">${l.reason}</td>
                                    <td>${statusHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div class="attendance-user-container">
                <div class="glass-header" style="text-align: center; margin-bottom: 24px; padding: 15px 20px; background: rgba(218,165,32,0.05); border-radius: 12px; border: 1px solid rgba(218,165,32,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="color:#daa520; margin:0; font-size: 18px;"><i class="fa-solid fa-user-check"></i> CHáº¤M CÃ”NG HÃ€NG NGÃ€Y</h2>
                            <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0;">Háº¡n chá»‘t: <span style="color:var(--warning);font-weight:bold;">08:30 SÃNG & 14:00 CHIá»€U</span></p>
                        </div>
                        <button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f; font-size: 12px; padding: 6px 12px;" onclick="Attendance.exportUserAttendancePDF('${user.username}')">
                            <i class="fa-solid fa-file-pdf" style="margin-right: 6px;"></i>Xuáº¥t PDF Báº£n In
                        </button>
                    </div>
                </div>
                ${salaryPreviewHtml}
                <div class="user-grid-layout" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; align-items: start;">
                    <div class="glass-panel" style="padding: 20px;">
                        ${checkInHtml}
                    </div>
                    <div class="user-col">
                        ${historyHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderAdminView: async (container) => {
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        const allLates = await Attendance.loadLateRequests();
        
        // PhÃ¢n nhÃ³m theo User vÃ  ThÃ¡ng Ä‘Ã£ chá»n (Ä‘á»“ng bá»™ theo chu ká»³ lÆ°Æ¡ng)
        const now = new Date();
        const selYear = Attendance.selectedYear;
        const selMonth = Attendance.selectedMonth;
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        
        const cycle = PayrollModule.getCycleRange(monthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        // TÃ­nh sá»‘ ngÃ y lÃ m viá»‡c Ä‘Ã£ qua trong chu ká»³ tÃ­nh lÆ°Æ¡ng (Loáº¡i trá»« Chá»§ nháº­t)
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let limitDate = new Date(cycle.endDate);
        limitDate.setHours(0,0,0,0);
        if (todayZero < limitDate) {
            limitDate = todayZero;
        }

        let passedWorkingDays = 0;
        let tempDate = new Date(cycle.startDate);
        tempDate.setHours(0,0,0,0);
        while (tempDate <= limitDate) {
            if (tempDate.getDay() !== 0) {
                passedWorkingDays++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const summary = {};
        allData.forEach(r => {
            if (r.dateStr >= startStr && r.dateStr <= endStr) {
                if (!summary[r.username]) {
                    summary[r.username] = { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
                }
                const weight = r.type ? 0.5 : 1.0;
                summary[r.username].totalDays += weight;
                if (r.status === 'on_time') {
                    summary[r.username].onTime += weight;
                } else if (r.status === 'late_excused') {
                    summary[r.username].lateExcused += weight;
                } else {
                    summary[r.username].late += weight;
                    summary[r.username].totalLateMinutes += r.lateMinutes || 0;
                }
            }
        });

        const approvedLeaves = {};
        allLeaves.forEach(l => {
            const lStart = l.startDate || l.date || '';
            if (l.status === 'approved' && lStart >= startStr && lStart <= endStr) {
                if (!approvedLeaves[l.username]) approvedLeaves[l.username] = 0;
                approvedLeaves[l.username] += parseFloat(l.days) || 0;
            }
        });

        // Láº¥y táº¥t cáº£ user tá»« DB (loáº¡i admin vÃ  CONGTY) Ä‘á»ƒ hiá»ƒn thá»‹ ká»ƒ cáº£ khi chÆ°a Ä‘iá»ƒm danh
        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const usersList = accounts
            .filter(a => a.role !== 'admin' && a.username.toLowerCase() !== 'admin' && a.username.toLowerCase() !== 'congty')
            .map(a => a.username);
        
        // Cá»© thÃªm user cÃ³ dá»¯ liá»‡u Ä‘iá»ƒm danh lá»¡ nhÆ° tÃ i khoáº£n bá»‹ xoÃ¡
        Object.keys(summary).forEach(u => {
            if (!usersList.includes(u) && u.toLowerCase() !== 'admin' && u.toLowerCase() !== 'congty') {
                usersList.push(u);
            }
        });

        const security = await Attendance.getAttendanceSecuritySettings();
        const securityHtml = await Attendance.renderAttendanceSecurityPanel(security);
        
        let adminHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; border: 1px solid rgba(100, 255, 218, 0.5); box-shadow: 0 0 10px rgba(100, 255, 218, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <h2 style="color: var(--primary); font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin: 0;">
                            <i class="fa-solid fa-list-check"></i> Tá»•ng há»£p Cháº¥m CÃ´ng
                        </h2>
                        
                        <div style="display: flex; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                            <select onchange="Attendance.handleMonthYearChange(this.value, 'month')" style="background: none; border: none; color: #fff; font-size: 14px; cursor: pointer; outline: none; padding: 2px;">
                                ${Array.from({length: 12}, (_, i) => `<option value="${i}" ${selMonth === i ? 'selected' : ''} style="background: #1a1a2e;">ThÃ¡ng ${i + 1}</option>`).join('')}
                            </select>
                            <select onchange="Attendance.handleMonthYearChange(this.value, 'year')" style="background: none; border: none; color: #fff; font-size: 14px; cursor: pointer; outline: none; padding: 2px;">
                                ${[now.getFullYear(), now.getFullYear() - 1].map(y => `<option value="${y}" ${selYear === y ? 'selected' : ''} style="background: #1a1a2e;">${y}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline" style="border-color: var(--primary); color: var(--primary); display: inline-flex; align-items: center; gap: 6px;" onclick="Attendance.showLateConfigModal()"><i class="fa-solid fa-gears"></i> Luáº­t Äi Trá»…</button>
                        <button class="btn btn-success" onclick="Attendance.exportAttendanceCSV()"><i class="fa-solid fa-file-excel" style="margin-right: 6px;"></i> Excel</button>
                        <button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f;" onclick="Attendance.exportAttendancePDF()"><i class="fa-solid fa-file-pdf" style="margin-right: 6px;"></i> PDF</button>
                    </div>
                </div>

                ${securityHtml}
                
                <div style="display: flex; gap: 24px; align-items: stretch; flex-wrap: wrap;">
                    <!-- Cá»¥c NhÃ¢n sá»± bÃªn trÃ¡i -->
                    <div style="width: 200px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 12px; background: rgba(10, 25, 40, 0.8); border: 2px solid #5ab9ea; box-shadow: 0 0 15px rgba(90, 185, 234, 0.3), inset 0 0 20px rgba(90, 185, 234, 0.1); position: relative; overflow: hidden; margin: 0 auto;">
                        <!-- ThÃªm thanh sÃ¡ng bÃªn dÆ°á»›i giá»‘ng thiáº¿t káº¿ -->
                        <div style="position: absolute; bottom: 0; width: 60px; height: 4px; background: #5ab9ea; border-top-left-radius: 4px; border-top-right-radius: 4px; box-shadow: 0 0 8px #5ab9ea;"></div>
                        <div class="card-inner" style="text-align: center; padding: 20px;">
                            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">NhÃ¢n sá»± Ä‘Ã£ Ä‘iá»ƒm danh</p>
                            <h2 style="color: #5ab9ea; font-size: 56px; font-weight: bold; text-shadow: 0 0 20px rgba(90, 185, 234, 0.6);">${usersList.length}</h2>
                        </div>
                    </div>
                
                    <!-- Báº£ng thá»‘ng kÃª bÃªn pháº£i -->
                    <div class="table-responsive" style="flex: 1; min-width: 300px;">
                        <table class="tl-table cyber-hover-table" style="margin: 0; border-collapse: separate; border-spacing: 0 8px;">
                            <thead>
                                <tr>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">NhÃ¢n ViÃªn</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tá»•ng ngÃ y cÃ´ng</th>
                                    <th style="color: var(--success); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-calendar-check" style="margin-right: 4px;"></i> ÄÃºng giá»</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Váº¯ng</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Trá»… phÃ©p</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Trá»… pháº¡t</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tá»•ng phÃºt trá»…</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usersList.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 16px;">ChÆ°a cÃ³ dá»¯ liá»‡u thÃ¡ng nÃ y</td></tr>' : ''}
                                ${usersList.map(u => {
                                    const s = summary[u] || { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
                                    const leaves = approvedLeaves[u] || 0;
                                    let absent = passedWorkingDays - s.totalDays - leaves;
                                    if (absent < 0) absent = 0;
                                    
                                    return `
                                    <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(100, 255, 218, 0.4);">
                                        <td style="font-weight: 600; padding: 12px 16px; color: #fff; border-top-left-radius: 8px; border-bottom-left-radius: 8px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4); border-left: 1px solid rgba(100, 255, 218, 0.4);" title="${u}">${Utils.getUserDisplayName(u) || u}</td>
                                        <td style="padding: 12px 16px; color: var(--text-secondary); border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);"><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${s.totalDays} / ${passedWorkingDays}</td>
                                        <td style="color: var(--success); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">${s.onTime}</td>
                                        <td style="color: var(--danger); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">
                                            ${absent}
                                            ${leaves > 0 ? `<br><small style="color:var(--warning);font-size:10px;font-style:italic;">(Nghá»‰ phÃ©p: ${leaves})</small>` : ''}
                                        </td>
                                        <td style="color: #64ffda; font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">${s.lateExcused || 0}</td>
                                        <td style="color: var(--danger); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">${s.late}</td>
                                        <td style="padding: 12px 16px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4); border-right: 1px solid rgba(100, 255, 218, 0.4);"><span style="color: #64ffda; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-regular fa-clock"></i> ${s.totalLateMinutes} p</span></td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Hiá»ƒn thá»‹ danh sÃ¡ch xin nghá»‰ (Admin) â€” reuse allLeaves from line 319
        const pendingLeaves = allLeaves.filter(l => l.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
        const resolvedLeaves = allLeaves.filter(l => l.status !== 'pending').sort((a,b) => b.timestamp - a.timestamp).slice(0, 20);

        let leavesHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.2);">
                <h2 style="color: var(--warning); margin-bottom: 24px; font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-wallet"></i> Danh sÃ¡ch Xin Nghá»‰ PhÃ©p
                </h2>
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: var(--warning); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> YÃªu cáº§u chá» duyá»‡t (${pendingLeaves.length})
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NhÃ¢n ViÃªn</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NgÃ y nghá»‰</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Sá»‘ ngÃ y</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">LÃ½ do</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; text-align: right; border: none; padding-bottom: 8px;">Thao tÃ¡c</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pendingLeaves.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 16px;">KhÃ´ng cÃ³ yÃªu cáº§u chá» duyá»‡t</td></tr>' : ''}
                            ${pendingLeaves.map(l => `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="font-weight: bold; color: #fff; padding: 12px 16px; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.startDate}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.days}</td>
                                    <td style="padding: 12px 16px; color: var(--danger); border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px;"></i> ${l.reason}</td>
                                    <td style="padding: 12px 16px; text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">
                                        <button class="btn btn-sm" onclick="Attendance.updateLeaveStatus('${l.id}', 'approved')" style="background: transparent; border: 1px solid var(--success); color: var(--success); margin-right: 8px; padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;"><i class="fa-solid fa-check" style="margin-right: 6px;"></i> Duyá»‡t [v]</button>
                                        <button class="btn btn-sm" onclick="Attendance.updateLeaveStatus('${l.id}', 'rejected')" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;">Tá»« Chá»‘i [x]</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                        </table>
                    </div>
                </div> <!-- End Pending Block -->
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Lá»‹ch sá»­ Ä‘Ã£ duyá»‡t/tá»« chá»‘i gáº§n Ä‘Ã¢y
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="text-align: center; border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NhÃ¢n ViÃªn</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NgÃ y nghá»‰</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Sá»‘ ngÃ y</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Tráº¡ng thÃ¡i</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${resolvedLeaves.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 32px;"><i class="fa-regular fa-clipboard" style="font-size: 24px; color: var(--text-secondary); margin-bottom: 8px; display: block;"></i> Trá»‘ng</td></tr>' : ''}
                            ${resolvedLeaves.map(l => {
                                let statusHtml = l.status === 'approved' ? '<span style="color: var(--success); font-weight: bold;"><i class="fa-solid fa-check"></i> ÄÃ£ Duyá»‡t</span>' : '<span style="color: var(--danger); font-weight: bold;"><i class="fa-solid fa-times"></i> Tá»« Chá»‘i</span>';
                                return `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="padding: 12px 16px; color: #fff; font-weight: bold; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.startDate}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.days}</td>
                                    <td style="padding: 12px 16px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">${statusHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                        </table>
                    </div>
                </div> <!-- End Resolved Block -->
            </div>
        `;

        // Hiá»ƒn thá»‹ danh sÃ¡ch xin Ä‘i trá»… (Admin)
        const pendingLates = allLates.filter(l => l.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
        const resolvedLates = allLates.filter(l => l.status !== 'pending').sort((a,b) => b.timestamp - a.timestamp).slice(0, 20);

        let latesHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.2);">
                <h2 style="color: var(--primary); margin-bottom: 24px; font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-clock"></i> Danh sÃ¡ch Xin Äáº¿n Trá»…
                </h2>
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: var(--primary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> YÃªu cáº§u chá» duyá»‡t (${pendingLates.length})
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NhÃ¢n ViÃªn</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NgÃ y xin</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Sá»‘ phÃºt</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">LÃ½ do</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; text-align: right; border: none; padding-bottom: 8px;">Thao tÃ¡c</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pendingLates.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 16px;">KhÃ´ng cÃ³ yÃªu cáº§u chá» duyá»‡t</td></tr>' : ''}
                            ${pendingLates.map(l => `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="font-weight: bold; color: #fff; padding: 12px 16px; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.date}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); font-weight:bold; color:var(--primary);">${l.minutes} phÃºt</td>
                                    <td style="padding: 12px 16px; color: var(--text-secondary); border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.reason}</td>
                                    <td style="padding: 12px 16px; text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">
                                        <button class="btn btn-sm" onclick="Attendance.updateLateRequestStatus('${l.id}', 'approved')" style="background: transparent; border: 1px solid var(--success); color: var(--success); margin-right: 8px; padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;"><i class="fa-solid fa-check" style="margin-right: 6px;"></i> Duyá»‡t [v]</button>
                                        <button class="btn btn-sm" onclick="Attendance.updateLateRequestStatus('${l.id}', 'rejected')" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;">Tá»« Chá»‘i [x]</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                        </table>
                    </div>
                </div> <!-- End Pending Block -->
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Lá»‹ch sá»­ duyá»‡t/tá»« chá»‘i trá»… gáº§n Ä‘Ã¢y
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="text-align: center; border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NhÃ¢n ViÃªn</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NgÃ y trá»…</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Sá»‘ phÃºt</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Tráº¡ng thÃ¡i</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${resolvedLates.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 32px;"><i class="fa-regular fa-clipboard" style="font-size: 24px; color: var(--text-secondary); margin-bottom: 8px; display: block;"></i> Trá»‘ng</td></tr>' : ''}
                            ${resolvedLates.map(l => {
                                let statusHtml = l.status === 'approved' ? `<span style="color: var(--success); font-weight: bold;"><i class="fa-solid fa-check"></i> ${l.resolvedBy === 'system' ? 'Tá»± Äá»™ng Duyá»‡t' : 'ÄÃ£ Duyá»‡t'}</span>` : '<span style="color: var(--danger); font-weight: bold;"><i class="fa-solid fa-times"></i> Tá»« Chá»‘i</span>';
                                return `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="padding: 12px 16px; color: #fff; font-weight: bold; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.date}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.minutes} phÃºt</td>
                                    <td style="padding: 12px 16px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">${statusHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                        </table>
                    </div>
                </div> <!-- End Resolved Block -->
            </div>
        `;

        container.innerHTML = `<div class="cyber-admin-container" style="display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px;">
            <div class="admin-col">
                ${adminHtml}
            </div>
            <div class="admin-grid-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
                <div class="admin-col">
                    ${leavesHtml}
                </div>
                <div class="admin-col">
                    ${latesHtml}
                </div>
            </div>
        </div>
        <style>
            .admin-cyber-box {
                background: rgba(10, 20, 35, 0.6) !important;
                border: 1px solid rgba(136, 255, 209, 0.2) !important;
                border-radius: 8px;
            }
            .cyber-hover-table tbody tr:hover {
                background: rgba(255,255,255,0.05) !important;
            }
            .cyber-hover-table th, .cyber-hover-table td {
                vertical-align: middle;
            }
            @media (max-width: 1024px) {
                .admin-grid-layout {
                    grid-template-columns: 1fr !important;
                }
            }
        </style>`;
    },

    /* --- Wooden Fish Sound Engine --- */
    _playWoodenFishSound: () => {
        // Try real audio file first, fall back to Web Audio synthesis
        const tryFile = new Audio('sounds/wooden-fish-hit.mp3');
        tryFile.volume = 0.7;
        const filePromise = tryFile.play().catch(() => null);
        filePromise.then(result => {
            if (result === null) {
                // File not available or blocked â€” synthesize
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const t = ctx.currentTime;
                    // Deep "tok"
                    const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
                    o1.type = 'sine';
                    o1.frequency.setValueAtTime(200, t);
                    o1.frequency.exponentialRampToValueAtTime(55, t + 0.12);
                    g1.gain.setValueAtTime(0.9, t);
                    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                    o1.connect(g1).connect(ctx.destination);
                    o1.start(t); o1.stop(t + 0.4);
                    // Resonance
                    const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
                    o2.type = 'triangle';
                    o2.frequency.setValueAtTime(130, t + 0.04);
                    o2.frequency.exponentialRampToValueAtTime(35, t + 0.35);
                    g2.gain.setValueAtTime(0.35, t + 0.04);
                    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
                    o2.connect(g2).connect(ctx.destination);
                    o2.start(t + 0.04); o2.stop(t + 0.7);
                } catch(e) { /* Audio fully unsupported */ }
            }
        });
    },

    handleCheckIn: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const btn = document.getElementById('btn-check-in');
        if (!btn || btn.dataset.state === 'animating' || btn.dataset.state === 'loading') return;

        // --- State: loading ---
        btn.dataset.state = 'loading';
        const label = btn.querySelector('.wf-label');
        if (label) label.textContent = 'Äang xÃ¡c minh mÃ¡y/GPS...';

        if (!navigator.geolocation) {
            Utils.showToast('GPS khÃ´ng kháº£ dá»¥ng. Sáº½ thá»­ xÃ¡c minh báº±ng máº¡ng cÃ´ng ty.', 'warning');
            Attendance._runCheckin(null, null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => Attendance._runCheckin(pos.coords.latitude, pos.coords.longitude),
            async () => {
                Utils.showToast('GPS khÃ´ng kháº£ dá»¥ng. Sáº½ thá»­ xÃ¡c minh báº±ng máº¡ng cÃ´ng ty.', 'warning');
                Attendance._runCheckin(null, null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    },

    _runCheckin: async (lat, lng) => {
        const user = Auth.currentUser;
        const btn = document.getElementById('btn-check-in');
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

        const currentHour = now.getHours();
        const currentSession = currentHour < 12 ? 'morning' : 'afternoon';

        let access;
        try {
            access = await Attendance.verifyCheckInAccess(lat, lng);
        } catch (e) {
            console.error('Attendance security check failed:', e);
            Utils.showToast('KhÃ´ng xÃ¡c minh Ä‘Æ°á»£c mÃ¡y/vá»‹ trÃ­/máº¡ng cÃ´ng ty.', 'error');
            Attendance.resetCheckInButton('ðŸªµ GÃ• MÃ• ÄIá»‚M DANH');
            return;
        }
        if (!access.ok) {
            await Attendance.notifyAttendanceSecurityAlert(access, { lat, lng, now, session: currentSession });
            Utils.showToast(access.reason || 'KhÃ´ng Ä‘áº¡t Ä‘iá»u kiá»‡n Ä‘iá»ƒm danh táº¡i cÃ´ng ty.', 'error');
            Attendance.resetCheckInButton('ðŸªµ GÃ• MÃ• ÄIá»‚M DANH');
            return;
        }
        
        const deadline = new Date(now);
        if (currentSession === 'morning') {
            deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
            
            // Flex-Time Card Buff (card_flex) - 1 hour extension
            try {
                if (typeof RewardsModule !== 'undefined') {
                    const allRewards = await RewardsModule.loadData();
                    const flexCard = allRewards.find(r => r.username === user.username && r.cardId === 'card_flex' && r.isUsed && (Date.now() - (r.usedAt || 0) < 7 * 24 * 60 * 60 * 1000));
                    if (flexCard) {
                        deadline.setHours(deadline.getHours() + 1); 
                    }
                }
            } catch(e) { console.warn("Flex card check error:", e); }
        } else {
            deadline.setHours(Attendance.AFTERNOON_DEADLINE_HOURS, Attendance.AFTERNOON_DEADLINE_MINUTES, 0, 0);
        }

        let status = 'on_time', lateMinutes = 0;
        let lateExcuseDetails = null;
        if (now > deadline) {
            lateMinutes = Math.floor((now - deadline) / 60000);
            
            // Check if there is an approved late request for today
            const lates = await Attendance.loadLateRequests();
            const todayApprovedRequest = lates.find(r => r.username === user.username && r.date === dateStr && r.status === 'approved');
            const locStr = lat ? `\nðŸ“ <b>Vá»‹ trÃ­:</b> <a href="https://google.com/maps?q=${lat},${lng}">Xem báº£n Ä‘á»“</a>` : '';
            const shiftName = currentSession === 'morning' ? 'CA SÃNG' : 'CA CHIá»€U';
            
            if (todayApprovedRequest) {
                const requestedMinutes = parseInt(todayApprovedRequest.minutes) || 0;
                if (lateMinutes <= requestedMinutes) {
                    status = 'late_excused';
                    lateExcuseDetails = {
                        requestedMinutes: requestedMinutes,
                        actualLateMinutes: lateMinutes,
                        reason: todayApprovedRequest.reason
                    };
                    let telegramMsg = `â„¹ï¸ <b>[ÄI MUá»˜N CÃ“ PHÃ‰P]</b>\n\n`;
                    telegramMsg += `ðŸ‘¤ <b>NhÃ¢n sá»±:</b> ${user.username}\n`;
                    telegramMsg += `â° <b>Thá»i gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n`;
                    telegramMsg += `â³ <b>Muá»™n thá»±c táº¿:</b> ${lateMinutes}p (ÄÃ£ xin phÃ©p muá»™n ${requestedMinutes}p)\n`;
                    telegramMsg += `ðŸ“ <b>LÃ½ do:</b> ${todayApprovedRequest.reason}\n`;
                    telegramMsg += `${locStr}\n\n`;
                    telegramMsg += `<i>"ÄÃ£ ghi nháº­n Ä‘i muá»™n cÃ³ phÃ©p. CÃ´ng Ä‘á»©c Ä‘Æ°á»£c cá»™ng +1Ä‘ nhÆ° thÆ°á»ng lá»‡."</i>`;
                    Utils.notifyTelegram(telegramMsg);
                } else {
                    status = 'late';
                    lateExcuseDetails = {
                        requestedMinutes: requestedMinutes,
                        actualLateMinutes: lateMinutes,
                        reason: todayApprovedRequest.reason
                    };
                    let telegramMsg = `ðŸš¨ <b>Cáº¢NH BÃO VI PHáº M Ká»¶ LUáº¬T (QUÃ Háº N XIN PHÃ‰P)</b> ðŸš¨\n\n`;
                    telegramMsg += `ðŸ‘¤ <b>NhÃ¢n sá»±:</b> ${user.username}\n`;
                    telegramMsg += `â° <b>Thá»i gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n`;
                    telegramMsg += `â³ <b>Tráº¡ng thÃ¡i:</b> Xin muá»™n ${requestedMinutes}p nhÆ°ng thá»±c táº¿ muá»™n ${lateMinutes}p (QuÃ¡ háº¡n ${lateMinutes - requestedMinutes}p)\n`;
                    telegramMsg += `ðŸ’¸ <b>Pháº¡t vi pháº¡m:</b> 20,000Ä‘ (ÄÃ£ tá»± Ä‘á»™ng trá»« lÆ°Æ¡ng)\n`;
                    telegramMsg += `ðŸ“‰ <b>Trá»« cÃ´ng Ä‘á»©c:</b> -0.5Ä‘\n`;
                    telegramMsg += `${locStr}\n\n`;
                    telegramMsg += `<i>"Ká»· luáº­t lÃ  sá»©c máº¡nh! Äá» nghá»‹ sáº¿p ${user.username} rÃºt kinh nghiá»‡m sÃ¢u sáº¯c."</i>`;
                    Utils.notifyTelegram(telegramMsg);
                }
            } else {
                status = 'late';
                let telegramMsg = `ðŸš¨ <b>Cáº¢NH BÃO VI PHáº M Ká»¶ LUáº¬T</b> ðŸš¨\n\n`;
                telegramMsg += `ðŸ‘¤ <b>NhÃ¢n sá»±:</b> ${user.username}\n`;
                telegramMsg += `â° <b>Thá»i gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n`;
                telegramMsg += `â— <b>TÃ¬nh tráº¡ng:</b> ÄI MUá»˜N KHÃ”NG PHÃ‰P <b>${lateMinutes}</b> PHÃšT\n`;
                telegramMsg += `ðŸ’¸ <b>Pháº¡t vi pháº¡m:</b> 20,000Ä‘ (ÄÃ£ tá»± Ä‘á»™ng trá»« lÆ°Æ¡ng)\n`;
                telegramMsg += `ðŸ“‰ <b>Trá»« cÃ´ng Ä‘á»©c:</b> -1Ä‘\n`;
                telegramMsg += `${locStr}\n\n`;
                telegramMsg += `<i>"Ká»· luáº­t lÃ  sá»©c máº¡nh! Äá» nghá»‹ sáº¿p ${user.username} rÃºt kinh nghiá»‡m sÃ¢u sáº¯c."</i>`;
                Utils.notifyTelegram(telegramMsg);
            }
        }

        const newRecord = {
            id: 'att_' + Date.now(), username: user.username,
            timestamp: now.getTime(), dateStr, status, lateMinutes,
            location: lat ? { lat, lng } : null, note: '',
            lateExcuse: lateExcuseDetails,
            type: currentSession,
            security: {
                deviceId: access.device?.id || null,
                deviceShortId: access.device?.shortId || null,
                publicIp: access.publicIp || null,
                trustedDevice: !!access.trustedDevice,
                locationOk: !!access.locationOk,
                networkOk: !!access.networkOk,
                distanceMeters: access.distance
            }
        };

        try {
            const allData = await Attendance.loadData();
            const existingRecord = allData.find(r => 
                r.username === user.username && 
                r.dateStr === dateStr && 
                (r.type === currentSession || (currentSession === 'morning' && !r.type))
            );
            if (existingRecord) {
                const sessionLabel = currentSession === 'afternoon' ? 'ca chiá»u' : 'ca sÃ¡ng';
                Utils.showToast(`HÃ´m nay báº¡n Ä‘Ã£ Ä‘iá»ƒm danh ${sessionLabel} rá»“i!`, 'info');
                if (btn) btn.dataset.state = 'idle';
                return;
            }
            allData.push(newRecord);
            await Attendance.saveData(allData);
        } catch (err) {
            Utils.showToast('Lá»—i lÆ°u dá»¯ liá»‡u. Thá»­ láº¡i!', 'error');
            if (btn) {
                btn.dataset.state = 'idle';
                const l = btn.querySelector('.wf-label');
                if (l) l.textContent = 'ðŸªµ GÃ• MÃ• ÄIá»‚M DANH';
            }
            return;
        }

        // --- State: animating ---
        if (!btn) { Attendance.render(); return; }
        btn.dataset.state = 'animating';
        const label = btn.querySelector('.wf-label');
        if (label) label.textContent = 'Äang gÃµ mÃµ...';

        // Play sound at impact moment (~200ms into the mallet swing)
        setTimeout(() => Attendance._playWoodenFishSound(), 200);

        // Trigger impact ring
        setTimeout(() => {
            const ring = btn.querySelector('.wf-impact-ring');
            if (ring) { ring.classList.add('active'); setTimeout(() => ring.classList.remove('active'), 700); }
        }, 220);

        // Trigger particles
        setTimeout(() => {
            btn.querySelectorAll('.wf-particle').forEach(p => {
                p.classList.add('active');
                setTimeout(() => p.classList.remove('active'), 800);
            });
        }, 250);

        // Float +1 CÃ´ng Äá»©c
        setTimeout(() => {
            const cd = btn.querySelector('.wf-cong-duc');
            if (cd) { cd.classList.add('active'); setTimeout(() => cd.classList.remove('active'), 1500); }
        }, 300);

        // After animation, show success
        setTimeout(() => {
            if (label) label.textContent = 'CÃ´ng Äá»©c +1';
            btn.dataset.state = 'success';
            setTimeout(() => Attendance.render(), 1200);
        }, 900);
    },

    showLeaveModal: () => {
        document.getElementById('leave-form').reset();
        
        // Äáº·t máº·c Ä‘á»‹nh ngÃ y lÃ  hÃ´m nay
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        document.getElementById('leave-start-date').value = dateStr;
        
        document.getElementById('leave-modal-overlay').classList.add('active');
    },

    closeLeaveModal: () => {
        document.getElementById('leave-modal-overlay').classList.remove('active');
    },

    submitLeaveRequest: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const startDate = document.getElementById('leave-start-date').value;
        const days = document.getElementById('leave-days').value;
        const reason = document.getElementById('leave-reason').value;

        if (!startDate || !days || !reason) {
            Utils.showToast("Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin xin nghá»‰!", "error");
            return;
        }

        const newLeave = {
            id: 'leave_' + Date.now(),
            username: user.username,
            timestamp: Date.now(),
            startDate: startDate,
            days: parseFloat(days),
            reason: reason,
            status: 'pending' // pending, approved, rejected
        };

        const allLeaves = await Attendance.loadLeaveData();
        allLeaves.push(newLeave);
        await Attendance.saveLeaveData(allLeaves);

        Attendance.closeLeaveModal();
        Utils.showToast("ÄÃ£ gá»­i yÃªu cáº§u xin nghá»‰ phÃ©p thÃ nh cÃ´ng!", "success");

        const msg = `ðŸ“¢ <b>[Tá»œ TRÃŒNH XIN NGHá»ˆ PHÃ‰P]</b>\nðŸ‘¤ NhÃ¢n viÃªn: <b>${user.username}</b>\nðŸ“… Tá»« ngÃ y: ${startDate}\nâ³ Sá»‘ ngÃ y nghá»‰: ${days}\nðŸ“ LÃ½ do: <i>${reason}</i>\n\nðŸ‘‰ Sáº¿p vÃ o há»‡ thá»‘ng kiá»ƒm tra vÃ  duyá»‡t nhÃ©!`;
        Utils.notifyTelegram(msg);

        Attendance.render(); // Táº£i láº¡i view
    },

    updateLeaveStatus: async (leaveId, newStatus) => {
        const actionText = newStatus === 'approved' ? 'DUYá»†T' : 'Tá»ª CHá»I';
        const color = newStatus === 'approved' ? 'var(--success)' : 'var(--danger)';
        
        const isConfirm = await Utils.showConfirm(
            'XÃ¡c nháº­n thao tÃ¡c', 
            `Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n <span style="color: ${color}; font-weight: bold; font-size: 16px;">${actionText}</span> yÃªu cáº§u nghá»‰ phÃ©p nÃ y?`
        );
        
        if (!isConfirm) return;

        const allLeaves = await Attendance.loadLeaveData();
        const leaveIndex = allLeaves.findIndex(l => l.id === leaveId);
        
        if (leaveIndex > -1) {
            allLeaves[leaveIndex].status = newStatus;
            await Attendance.saveLeaveData(allLeaves);
            Utils.showToast(`ÄÃ£ ${newStatus === 'approved' ? 'duyá»‡t' : 'tá»« chá»‘i'} yÃªu cáº§u thÃ nh cÃ´ng!`, "success");
            Attendance.render(); // Táº£i láº¡i view Admin
        }
    },

    showCheckoutModal: () => {
        document.getElementById('checkout-form').reset();
        document.getElementById('checkout-modal-overlay').classList.add('active');
    },

    closeCheckoutModal: () => {
        document.getElementById('checkout-modal-overlay').classList.remove('active');
    },

    submitCheckout: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const report = document.getElementById('checkout-report').value.trim();
        if (!report) {
            Utils.showToast("Vui lÃ²ng nháº­p bÃ¡o cÃ¡o cÃ´ng viá»‡c!", "error");
            return;
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const allData = await Attendance.loadData();
        const todayRecord = allData.find(r => r.username === user.username && r.dateStr === dateStr && r.type === 'afternoon') ||
                            allData.find(r => r.username === user.username && r.dateStr === dateStr && (r.type === 'morning' || !r.type));
        
        if (todayRecord) {
            todayRecord.checkoutTimestamp = now.getTime();
            todayRecord.checkoutReport = report;
            await Attendance.saveData(allData);

            // Gá»­i Telegram EOD Report
            const msg = `âœ… <b>[BÃO CÃO CUá»I NGÃ€Y Dá»° ÃN]</b>\nðŸ‘¤ NhÃ¢n viÃªn: <b>${user.username}</b>\nâ° Ra vá» lÃºc: ${now.toLocaleTimeString('vi-VN')}\n\nðŸ“ <b>CÃ´ng viá»‡c Ä‘Ã£ hoÃ n thÃ nh:</b>\n${report}`;
            Utils.notifyTelegram(msg);

            Attendance.closeCheckoutModal();
            Utils.showToast("Gá»­i bÃ¡o cÃ¡o vÃ  Ra vá» thÃ nh cÃ´ng!", "success");
            Attendance.render();
        } else {
            Utils.showToast("KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u Ä‘iá»ƒm danh ban sÃ¡ng?", "error");
        }
    },

    handleMonthYearChange: (value, type) => {
        if (type === 'month') {
            Attendance.selectedMonth = parseInt(value);
        } else {
            Attendance.selectedYear = parseInt(value);
        }
        Attendance.render();
    },

    exportAttendanceCSV: async () => {
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        const now = new Date();
        const selYear = Attendance.selectedYear;
        const selMonth = Attendance.selectedMonth;
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        
        const cycle = PayrollModule.getCycleRange(monthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let limitDate = new Date(cycle.endDate);
        limitDate.setHours(0,0,0,0);
        if (todayZero < limitDate) {
            limitDate = todayZero;
        }

        let passedWorkingDays = 0;
        let tempDate = new Date(cycle.startDate);
        tempDate.setHours(0,0,0,0);
        while (tempDate <= limitDate) {
            if (tempDate.getDay() !== 0) {
                passedWorkingDays++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const summary = {};
        allData.forEach(r => {
            if (r.dateStr >= startStr && r.dateStr <= endStr) {
                if (!summary[r.username]) summary[r.username] = { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
                const weight = r.type ? 0.5 : 1.0;
                summary[r.username].totalDays += weight;
                if (r.status === 'on_time') summary[r.username].onTime += weight;
                else {
                    summary[r.username].late += weight;
                    summary[r.username].totalLateMinutes += r.lateMinutes || 0;
                }
            }
        });

        const approvedLeaves = {};
        allLeaves.forEach(l => {
            const lStart = l.startDate || l.date || '';
            if (l.status === 'approved' && lStart >= startStr && lStart <= endStr) {
                if (!approvedLeaves[l.username]) approvedLeaves[l.username] = 0;
                approvedLeaves[l.username] += parseFloat(l.days) || 0;
            }
        });

        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const usersList = accounts
            .filter(a => a.role !== 'admin' && a.username.toLowerCase() !== 'admin' && a.username.toLowerCase() !== 'congty')
            .map(a => a.username);
        Object.keys(summary).forEach(u => {
            if (!usersList.includes(u) && u.toLowerCase() !== 'admin' && u.toLowerCase() !== 'congty') {
                usersList.push(u);
            }
        });

        // Táº¡o ná»™i dung CSV (UTF-8 BOM há»— trá»£ tiáº¿ng Viá»‡t)
        let csvContent = "\uFEFF"; // BOM cho Excel
        csvContent += "TÃ i xáº¿/NhÃ¢n viÃªn,Tá»•ng ngÃ y cÃ´ng Ä‘Ã£ qua,ÄÃ£ Ä‘i lÃ m,ÄÃºng giá»,Váº¯ng,Nghá»‰ phÃ©p duyá»‡t,Äi muá»™n (láº§n),Tá»•ng phÃºt Ä‘i muá»™n\n";

        usersList.forEach(u => {
            const s = summary[u] || { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
            const leaves = approvedLeaves[u] || 0;
            let absent = passedWorkingDays - s.totalDays - leaves;
            if (absent < 0) absent = 0;
            
            csvContent += `"${u}",${passedWorkingDays},${s.totalDays},${s.onTime},${absent},${leaves},${s.late},${s.totalLateMinutes}\n`;
        });

        // Táº£i xuá»‘ng
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `Bang_Cham_Cong_Thang_${selMonth + 1}_${selYear}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    exportUserAttendancePDF: async (username) => {
        Utils.showToast("Äang táº¡o PDF cháº¥m cÃ´ng cÃ¡ nhÃ¢n...", "info");
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        const currentMonthStr = PayrollModule.getCurrentCycleMonthStr(new Date());
        const cycle = PayrollModule.getCycleRange(currentMonthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        // Filter by this user + current payroll cycle
        const userRecords = allData
            .filter(r => r.username === username && r.dateStr >= startStr && r.dateStr <= endStr)
            .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        
        const userLeaves = allLeaves
            .filter(l => l.username === username && (l.startDate || l.date) >= startStr && (l.startDate || l.date) <= endStr);
        
        const totalOnTime = userRecords.filter(r => r.status === 'on_time').length;
        const totalExcusedLate = userRecords.filter(r => r.status === 'late_excused').length;
        const totalLate = userRecords.filter(r => r.status === 'late').length;
        const totalLeave = userLeaves.filter(l => l.status === 'approved').reduce((s, l) => s + (parseFloat(l.days) || 1), 0);
        
        const clone = document.createElement('div');
        clone.style.cssText = 'padding:30px;background:#fff;color:#000;font-family:Arial,sans-serif;';
        
        const stamp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="120" height="120"><circle cx="100" cy="100" r="92" fill="none" stroke="#da251d" stroke-width="4" opacity="0.85"/><circle cx="100" cy="100" r="82" fill="none" stroke="#da251d" stroke-width="1.5" opacity="0.6"/><path d="M 100 35 Q 115 50 110 65 Q 125 55 130 70 Q 120 75 125 90 Q 135 85 140 95 Q 130 100 125 110 Q 115 105 110 115 Q 105 105 100 110 Q 95 105 90 115 Q 85 105 75 110 Q 70 100 60 95 Q 65 85 75 90 Q 80 75 70 70 Q 75 55 90 65 Q 85 50 100 35" fill="#da251d" opacity="0.7"/><text x="100" y="148" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#da251d">THANH LONG WORK</text><text x="100" y="165" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#da251d">GIÃM Äá»C</text></svg>`;
        
        clone.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #da251d;padding-bottom:20px;">
                <h1 style="color:#da251d;margin-bottom:5px;">THANH LONG WORK</h1>
                <h3>Lá»ŠCH Sá»¬ CHáº¤M CÃ”NG CÃ NHÃ‚N</h3>
                <p><strong>${username}</strong> &bull; ThÃ¡ng ${now.getMonth() + 1}/${now.getFullYear()} &bull; Chu ká»³: ${cycle.startStr.split('-').reverse().join('/')} - ${cycle.endStr.split('-').reverse().join('/')} &bull; NgÃ y xuáº¥t: ${now.toLocaleDateString('vi-VN')}</p>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:25px;text-align:center;border:1px solid #eee;padding:15px;border-radius:8px;">
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">ÄÃºng giá»</div><div style="font-size:24px;font-weight:bold;color:#10b981;">${totalOnTime}</div></div>
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">Trá»… phÃ©p</div><div style="font-size:24px;font-weight:bold;color:#00adb5;">${totalExcusedLate}</div></div>
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">Trá»… khÃ´ng phÃ©p</div><div style="font-size:24px;font-weight:bold;color:#f59e0b;">${totalLate}</div></div>
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">Nghá»‰ phÃ©p</div><div style="font-size:24px;font-weight:bold;color:#3b82f6;">${totalLeave}</div></div>
            </div>
            
            <h4 style="color:#333;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:6px;">Chi tiáº¿t cháº¥m cÃ´ng</h4>
            <table style="width:100%;border-collapse:collapse;margin-bottom:30px;font-size:13px;">
                <thead><tr style="background:#f3f4f6;">
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">NgÃ y</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Giá» vÃ o</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Giá» ra</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Tráº¡ng thÃ¡i</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">BÃ¡o cÃ¡o EOD</th>
                </tr></thead>
                <tbody>
                    ${userRecords.map(r => {
                        let st = '';
                        if (r.status === 'on_time') {
                            st = '<span style="color:#10b981;font-weight:bold;">ÄÃºng giá»</span>';
                        } else if (r.status === 'late_excused') {
                            const reasonText = (r.lateExcuse && r.lateExcuse.reason) ? ` - LÃ½ do: ${r.lateExcuse.reason}` : '';
                            st = `<span style="color:#00adb5;font-weight:bold;">Trá»… cÃ³ phÃ©p</span><br><small style="color:#555;font-size:10px;">Xin ${r.lateExcuse?.requestedMinutes || 30}p - Thá»±c táº¿ ${r.lateExcuse?.actualLateMinutes || r.lateMinutes}p${reasonText}</small>`;
                        } else {
                            st = `<span style="color:#f59e0b;font-weight:bold;">Trá»… khÃ´ng phÃ©p</span><br><small style="color:#e74c3c;font-size:10px;">Muá»™n ${r.lateMinutes || 0}p</small>`;
                        }
                        const checkIn = new Date(r.timestamp).toLocaleTimeString('vi-VN');
                        const checkOut = r.checkoutTimestamp ? new Date(r.checkoutTimestamp).toLocaleTimeString('vi-VN') : 'â€”';
                        return `<tr>
                            <td style="padding:8px;border:1px solid #d1d5db;">${r.dateStr}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${checkIn}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${checkOut}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${st}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;font-size:11px;color:#666;">${r.checkoutReport || ''}</td>
                        </tr>`;
                    }).join('')}
                    ${userRecords.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:15px;color:#999;">ChÆ°a cÃ³ dá»¯ liá»‡u cháº¥m cÃ´ng thÃ¡ng nÃ y</td></tr>' : ''}
                </tbody>
            </table>
            
            ${userLeaves.length > 0 ? `
            <h4 style="color:#333;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:6px;">Lá»‹ch sá»­ Nghá»‰ phÃ©p</h4>
            <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-size:13px;">
                <thead><tr style="background:#f3f4f6;">
                    <th style="padding:8px;border:1px solid #d1d5db;">Tá»« ngÃ y</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Sá»‘ ngÃ y</th>
                    <th style="padding:8px;border:1px solid #d1d5db;">LÃ½ do</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Tráº¡ng thÃ¡i</th>
                </tr></thead>
                <tbody>
                    ${userLeaves.map(l => {
                        const stLeave = l.status === 'approved' ? '<span style="color:#10b981;">ÄÃ£ duyá»‡t</span>' : l.status === 'pending' ? '<span style="color:#f59e0b;">Chá» duyá»‡t</span>' : '<span style="color:#ef4444;">Tá»« chá»‘i</span>';
                        return `<tr>
                            <td style="padding:8px;border:1px solid #d1d5db;">${l.startDate}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${l.days}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;">${l.reason}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${stLeave}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>` : ''}
            
            <div style="display:flex;justify-content:flex-end;margin-top:30px;text-align:center;">
                <div style="width:200px;">
                    <p style="font-weight:bold;margin-bottom:10px;">GiÃ¡m Äá»‘c</p>
                    ${stamp}
                    <p style="margin-top:8px;font-weight:bold;">ÄÃ€O THANH LONG</p>
                </div>
            </div>
        `;
        
        html2pdf().set({
            margin: 0.5,
            filename: `ChamCong_${username}_T${now.getMonth() + 1}_${now.getFullYear()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        }).from(clone).save().then(() => {
            Utils.showToast("ÄÃ£ xuáº¥t PDF cháº¥m cÃ´ng cÃ¡ nhÃ¢n!", "success");
        }).catch(e => {
            console.error(e);
            Utils.showToast("Lá»—i xuáº¥t PDF", "error");
        });
    },

    showLateRequestModal: () => {
        const modal = document.getElementById('late-request-modal-overlay');
        if (!modal) return;

        // Reset form
        const form = document.getElementById('late-request-form');
        if (form) form.reset();

        // Default date to today
        const dateInput = document.getElementById('late-request-date');
        if (dateInput) {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            dateInput.value = dateStr;
            dateInput.min = dateStr; // Chá»‰ cho phÃ©p xin tá»« hÃ´m nay trá»Ÿ Ä‘i
        }

        Attendance.updateLateTimePreview();
        modal.classList.add('active');
    },

    closeLateRequestModal: () => {
        const modal = document.getElementById('late-request-modal-overlay');
        if (modal) modal.classList.remove('active');
    },

    updateLateTimePreview: () => {
        const select = document.getElementById('late-request-minutes');
        const preview = document.getElementById('late-time-preview');
        if (!select || !preview) return;

        const minutes = parseInt(select.value) || 30;
        
        // Calculate expected time based on deadline
        const deadline = new Date();
        deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
        
        // Add minutes
        const target = new Date(deadline.getTime() + minutes * 60000);
        const hoursStr = String(target.getHours()).padStart(2, '0');
        const minsStr = String(target.getMinutes()).padStart(2, '0');
        
        preview.textContent = `trÆ°á»›c ${hoursStr}:${minsStr} ${target.getHours() >= 12 ? 'PM' : 'AM'}`;
    },

    submitLateRequest: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const dateInput = document.getElementById('late-request-date');
        const minutesSelect = document.getElementById('late-request-minutes');
        const reasonTextarea = document.getElementById('late-request-reason');

        if (!dateInput || !minutesSelect || !reasonTextarea) return;

        const requestDate = dateInput.value;
        const minutes = parseInt(minutesSelect.value) || 30;
        const reason = reasonTextarea.value.trim();

        if (!requestDate) {
            Utils.showToast("Vui lÃ²ng chá»n ngÃ y Ä‘i trá»…!", "error");
            return;
        }
        if (isNaN(minutes) || minutes < 1 || minutes > 60) {
            Utils.showToast("Sá»‘ phÃºt xin Ä‘i muá»™n tá»‘i thiá»ƒu lÃ  1 vÃ  tá»‘i Ä‘a lÃ  60 phÃºt!", "error");
            return;
        }
        if (!reason) {
            Utils.showToast("Vui lÃ²ng nháº­p lÃ½ do Ä‘i trá»…!", "error");
            return;
        }

        Utils.showToast("Äang gá»­i yÃªu cáº§u...", "info");

        // Load settings & existing requests
        const settings = await DB.getSettings() || {};
        const allLateRequests = await Attendance.loadLateRequests();

        // 1. Calculate target arrival time for Telegram
        const deadline = new Date();
        deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
        const target = new Date(deadline.getTime() + minutes * 60000);
        const arrivalTimeStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')} ${target.getHours() >= 12 ? 'PM' : 'AM'}`;

        // 2. Rules Engine check for Auto-Approval
        let isAutoApproved = false;
        
        const autoApproveEnabled = settings.lateAutoApprove || false;
        const maxMinutesAllowed = settings.lateAutoApproveMaxMinutes !== undefined ? settings.lateAutoApproveMaxMinutes : 60;
        const maxCountPerMonth = settings.lateAutoApproveMaxPerMonth !== undefined ? settings.lateAutoApproveMaxPerMonth : 2;
        const beforeTimeLimit = settings.lateAutoApproveBeforeTime || '08:30';

        if (autoApproveEnabled) {
            // Count already approved late requests in the same month
            const targetMonthStr = requestDate.substring(0, 7); // YYYY-MM
            const userMonthApprovedCount = allLateRequests.filter(r => 
                r.username === user.username && 
                r.status === 'approved' && 
                r.date.startsWith(targetMonthStr)
            ).length;

            let satisfiesTimeLimit = true;
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            if (requestDate === todayStr) {
                // If it is today, check if submitted before the time limit (e.g. 08:30)
                const nowTimeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                if (nowTimeStr > beforeTimeLimit) {
                    satisfiesTimeLimit = false;
                }
            }

            if (minutes <= maxMinutesAllowed && userMonthApprovedCount < maxCountPerMonth && satisfiesTimeLimit) {
                isAutoApproved = true;
            }
        }

        const status = isAutoApproved ? 'approved' : 'pending';

        const newRequest = {
            id: 'late_' + Date.now(),
            username: user.username,
            date: requestDate,
            minutes: minutes,
            reason: reason,
            status: status,
            timestamp: Date.now(),
            resolvedBy: isAutoApproved ? 'system' : null,
            resolvedAt: isAutoApproved ? Date.now() : null
        };

        allLateRequests.push(newRequest);
        await Attendance.saveLateRequests(allLateRequests);

        if (isAutoApproved) {
            Utils.notifyTelegram(`ðŸ¤– <b>[Tá»° Äá»˜NG DUYá»†T ÄI TRá»„]</b>\nðŸ‘¤ ${user.username}\nðŸ“… NgÃ y: ${requestDate}\nâ±ï¸ Xin muá»™n ${minutes}p (Äáº¿n trÆ°á»›c ${arrivalTimeStr})\nðŸ“ LÃ½ do: ${reason}`);
            Utils.showToast("YÃªu cáº§u Ä‘i trá»… Ä‘Ã£ Ä‘Æ°á»£c Tá»° Äá»˜NG DUYá»†T!", "success");
        } else {
            Utils.notifyTelegram(`ðŸ“¢ <b>[Tá»œ TRÃŒNH XIN Äáº¾N TRá»„]</b>\nðŸ‘¤ ${user.username}\nðŸ“… NgÃ y: ${requestDate}\nâ±ï¸ Xin muá»™n ${minutes}p (Chá» sáº¿p duyá»‡t)\nðŸ“ LÃ½ do: ${reason}`);
            Utils.showToast("ÄÃ£ gá»­i yÃªu cáº§u! Vui lÃ²ng chá» sáº¿p phÃª duyá»‡t.", "success");
        }

        Attendance.closeLateRequestModal();
        Attendance.render();
    },

    showLateConfigModal: async () => {
        const modal = document.getElementById('late-config-modal-overlay');
        if (!modal) return;

        // Táº£i settings má»›i nháº¥t tá»« DB
        const settings = await DB.getSettings() || {};
        
        const toggle = document.getElementById('late-auto-approve-toggle');
        const maxPerMonth = document.getElementById('late-auto-approve-max-per-month');
        const maxMinutes = document.getElementById('late-auto-approve-max-minutes');
        const beforeTime = document.getElementById('late-auto-approve-before-time');

        if (toggle) {
            toggle.checked = settings.lateAutoApprove || false;
            // Trigger visual slider change in index.html inline script:
            toggle.nextElementSibling.style.backgroundColor = toggle.checked ? 'var(--primary)' : 'rgba(255,255,255,0.1)';
            toggle.nextElementSibling.querySelector('span').style.transform = toggle.checked ? 'translateX(24px)' : 'translateX(0)';
        }
        if (maxPerMonth) maxPerMonth.value = settings.lateAutoApproveMaxPerMonth !== undefined ? settings.lateAutoApproveMaxPerMonth : 2;
        if (maxMinutes) maxMinutes.value = settings.lateAutoApproveMaxMinutes !== undefined ? settings.lateAutoApproveMaxMinutes : 60;
        if (beforeTime) beforeTime.value = settings.lateAutoApproveBeforeTime || '08:30';

        modal.classList.add('active');
    },

    closeLateConfigModal: () => {
        const modal = document.getElementById('late-config-modal-overlay');
        if (modal) modal.classList.remove('active');
    },

    saveAutoApproveSettings: async () => {
        const toggle = document.getElementById('late-auto-approve-toggle');
        const maxPerMonth = document.getElementById('late-auto-approve-max-per-month');
        const maxMinutes = document.getElementById('late-auto-approve-max-minutes');
        const beforeTime = document.getElementById('late-auto-approve-before-time');

        if (!toggle) return;

        const settings = {
            lateAutoApprove: toggle.checked,
            lateAutoApproveMaxPerMonth: parseInt(maxPerMonth.value) || 2,
            lateAutoApproveMaxMinutes: parseInt(maxMinutes.value) || 60,
            lateAutoApproveBeforeTime: beforeTime.value || '08:30'
        };

        try {
            await DB.saveSettings(settings);
            // Cáº­p nháº­t state runtime náº¿u tá»“n táº¡i
            if (typeof app !== 'undefined' && app.state) {
                app.state.settings = { ...app.state.settings, ...settings };
            }
            Utils.showToast("ÄÃ£ lÆ°u cáº¥u hÃ¬nh tá»± Ä‘á»™ng duyá»‡t Ä‘i trá»…!", "success");
            Attendance.closeLateConfigModal();
            Attendance.render();
        } catch (e) {
            console.error("Lá»—i khi lÆ°u cáº¥u hÃ¬nh Ä‘i trá»…:", e);
            Utils.showToast("Lá»—i khi lÆ°u cáº¥u hÃ¬nh!", "error");
        }
    },

    updateLateRequestStatus: async (requestId, newStatus) => {
        const actionText = newStatus === 'approved' ? 'phÃª duyá»‡t' : 'tá»« chá»‘i';
        const isConfirmed = await Utils.showConfirm(`XÃ¡c nháº­n ${actionText} yÃªu cáº§u Ä‘i trá»… nÃ y?`);
        if (!isConfirmed) return;

        try {
            Utils.showToast("Äang cáº­p nháº­t...", "info");
            const allLates = await Attendance.loadLateRequests();
            const request = allLates.find(l => l.id === requestId);
            
            if (request) {
                request.status = newStatus;
                request.resolvedBy = Auth.currentUser.username;
                request.resolvedAt = Date.now();
                
                await Attendance.saveLateRequests(allLates);
                
                // Calculate target arrival time for Telegram
                const deadline = new Date();
                deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
                const target = new Date(deadline.getTime() + (parseInt(request.minutes) || 30) * 60000);
                const arrivalTimeStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')} ${target.getHours() >= 12 ? 'PM' : 'AM'}`;

                if (newStatus === 'approved') {
                    Utils.notifyTelegram(`âœ… <b>[Sáº¾P DUYá»†T ÄI TRá»„]</b>\nðŸ‘¤ ${request.username}\nðŸ“… NgÃ y: ${request.date}\nâ±ï¸ Cho phÃ©p muá»™n ${request.minutes}p (Äáº¿n trÆ°á»›c ${arrivalTimeStr})\nðŸ“ LÃ½ do: ${request.reason}`);
                } else {
                    Utils.notifyTelegram(`âŒ <b>[Sáº¾P Tá»ª CHá»I ÄI TRá»„]</b>\nðŸ‘¤ ${request.username}\nðŸ“… NgÃ y: ${request.date}\nâ±ï¸ Xin muá»™n ${request.minutes}p bá»‹ tá»« chá»‘i\nðŸ“ LÃ½ do: ${request.reason}`);
                }

                Utils.showToast(`ÄÃ£ ${actionText} yÃªu cáº§u Ä‘i trá»…!`, "success");
                Attendance.render();
            } else {
                Utils.showToast("KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘i trá»…!", "error");
            }
        } catch (e) {
            console.error("Lá»—i cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n Ä‘i trá»…:", e);
            Utils.showToast("Cáº­p nháº­t tháº¥t báº¡i!", "error");
        }
    },

    exportAttendancePDF: async () => {
        Utils.showToast("Äang táº¡o PDF cháº¥m cÃ´ng tá»•ng há»£p...", "info");
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        const now = new Date();
        const selYear = Attendance.selectedYear;
        const selMonth = Attendance.selectedMonth;
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        
        const cycle = PayrollModule.getCycleRange(monthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let limitDate = new Date(cycle.endDate);
        limitDate.setHours(0,0,0,0);
        if (todayZero < limitDate) {
            limitDate = todayZero;
        }

        let passedWorkingDays = 0;
        let tempDate = new Date(cycle.startDate);
        tempDate.setHours(0,0,0,0);
        while (tempDate <= limitDate) {
            if (tempDate.getDay() !== 0) {
                passedWorkingDays++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const summary = {};
        allData.forEach(r => {
            if (r.dateStr >= startStr && r.dateStr <= endStr) {
                if (!summary[r.username]) {
                    summary[r.username] = { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
                }
                const weight = r.type ? 0.5 : 1.0;
                summary[r.username].totalDays += weight;
                if (r.status === 'on_time') {
                    summary[r.username].onTime += weight;
                } else if (r.status === 'late_excused') {
                    summary[r.username].lateExcused += weight;
                } else {
                    summary[r.username].late += weight;
                    summary[r.username].totalLateMinutes += r.lateMinutes || 0;
                }
            }
        });

        const approvedLeaves = {};
        allLeaves.forEach(l => {
            const lStart = l.startDate || l.date || '';
            if (l.status === 'approved' && lStart >= startStr && lStart <= endStr) {
                if (!approvedLeaves[l.username]) approvedLeaves[l.username] = 0;
                approvedLeaves[l.username] += parseFloat(l.days) || 0;
            }
        });

        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const usersList = accounts
            .filter(a => a.role !== 'admin' && a.username.toLowerCase() !== 'admin' && a.username.toLowerCase() !== 'congty')
            .map(a => a.username);
        Object.keys(summary).forEach(u => {
            if (!usersList.includes(u) && u.toLowerCase() !== 'admin' && u.toLowerCase() !== 'congty') {
                usersList.push(u);
            }
        });

        const clone = document.createElement('div');
        clone.style.cssText = 'padding:30px;background:#fff;color:#000;font-family:Arial,sans-serif;';

        const stamp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="120" height="120"><circle cx="100" cy="100" r="92" fill="none" stroke="#da251d" stroke-width="4" opacity="0.85"/><circle cx="100" cy="100" r="82" fill="none" stroke="#da251d" stroke-width="1.5" opacity="0.6"/><path d="M 100 35 Q 115 50 110 65 Q 125 55 130 70 Q 120 75 125 90 Q 135 85 140 95 Q 130 100 125 110 Q 115 105 110 115 Q 105 105 100 110 Q 95 105 90 115 Q 85 105 75 110 Q 70 100 60 95 Q 65 85 75 90 Q 80 75 70 70 Q 75 55 90 65 Q 85 50 100 35" fill="#da251d" opacity="0.7"/><text x="100" y="148" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#da251d">THANH LONG WORK</text><text x="100" y="165" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#da251d">GIÃM Äá»C</text></svg>`;

        let rowsHtml = usersList.map(u => {
            const s = summary[u] || { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
            const leaves = approvedLeaves[u] || 0;
            let absent = passedWorkingDays - s.totalDays - leaves;
            if (absent < 0) absent = 0;
            
            return `
            <tr>
                <td style="padding:10px;border:1px solid #d1d5db;font-weight:bold;">${Utils.getUserDisplayName(u) || u}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;">${s.totalDays} / ${passedWorkingDays}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#10b981;font-weight:bold;">${s.onTime}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#3b82f6;">${leaves}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#e74c3c;">${absent}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#00adb5;font-weight:bold;">${s.lateExcused || 0}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#f59e0b;font-weight:bold;">${s.late}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;font-weight:bold;">${s.totalLateMinutes} phÃºt</td>
            </tr>
            `;
        }).join('');

        clone.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #da251d;padding-bottom:20px;">
                <h1 style="color:#da251d;margin-bottom:5px;">THANH LONG WORK</h1>
                <h3>Báº¢NG Tá»”NG Há»¢P CHáº¤M CÃ”NG NHÃ‚N Sá»°</h3>
                <p>ThÃ¡ng ${selMonth + 1}/${selYear} &bull; Chu ká»³: ${cycle.startStr.split('-').reverse().join('/')} - ${cycle.endStr.split('-').reverse().join('/')} &bull; NgÃ y xuáº¥t: ${now.toLocaleDateString('vi-VN')}</p>
            </div>
            
            <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-size:12px;">
                <thead>
                    <tr style="background:#f3f4f6;text-align:center;">
                        <th style="padding:10px;border:1px solid #d1d5db;text-align:left;">NhÃ¢n viÃªn</th>
                        <th style="padding:10px;border:1px solid #d1d5db;">NgÃ y Ä‘Ã£ Ä‘i lÃ m</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#10b981;">ÄÃºng giá»</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#3b82f6;">Nghá»‰ phÃ©p</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#e74c3c;">Váº¯ng</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#00adb5;">Trá»… phÃ©p</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#f59e0b;">Trá»… khÃ´ng phÃ©p</th>
                        <th style="padding:10px;border:1px solid #d1d5db;">PhÃºt Ä‘i muá»™n</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    ${usersList.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:20px;">ChÆ°a cÃ³ dá»¯ liá»‡u thÃ¡ng nÃ y</td></tr>' : ''}
                </tbody>
            </table>
            
            <div style="display:flex;justify-content:space-between;margin-top:50px;text-align:center;padding:0 50px;">
                <div style="width:200px;">
                    <p style="font-weight:bold;margin-bottom:80px;">NgÆ°á»i Láº­p Báº£ng</p>
                    <p>Bá»™ Pháº­n HÃ nh ChÃ­nh</p>
                </div>
                <div style="width:200px;">
                    <p style="font-weight:bold;margin-bottom:10px;">GiÃ¡m Äá»‘c</p>
                    ${stamp}
                    <p style="margin-top:8px;font-weight:bold;">ÄÃ€O THANH LONG</p>
                </div>
            </div>
        `;

        html2pdf().set({
            margin: 0.5,
            filename: `TongHop_ChamCong_T${selMonth + 1}_${selYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        }).from(clone).save().then(() => {
            Utils.showToast("ÄÃ£ xuáº¥t PDF cháº¥m cÃ´ng tá»•ng há»£p!", "success");
        }).catch(e => {
            console.error(e);
            Utils.showToast("Lá»—i xuáº¥t PDF tá»•ng há»£p", "error");
        });
    }
};


