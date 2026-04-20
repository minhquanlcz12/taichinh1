const MusicPlayer = {
    _rendered: false,
    _currentSrc: 'https://piped.video',

    // Các frontend YouTube mã nguồn mở (cho phép iframe, ko bị chặn)
    SOURCES: [
        { name: 'Piped', url: 'https://piped.video', icon: 'fa-play-circle', desc: 'Giao diện đẹp nhất' },
        { name: 'Piped 2', url: 'https://piped.privacyredirect.com', icon: 'fa-play-circle', desc: 'Server dự phòng' },
        { name: 'Invidious', url: 'https://yewtu.be', icon: 'fa-tv', desc: 'Giao diện cổ điển' },
        { name: 'Invidious 2', url: 'https://invidious.fdn.fr', icon: 'fa-tv', desc: 'Server EU' },
    ],

    render: () => {
        if (MusicPlayer._rendered) return;
        MusicPlayer._rendered = true;

        const container = document.getElementById('music-view');
        if (!container) return;

        container.innerHTML = `
            <div style="width:100%; height: calc(100vh - 80px); display:flex; flex-direction:column; border-radius:12px; overflow:hidden; border: 1px solid rgba(231,76,60,0.2); background:#0f0f0f;">
                <!-- Top Bar -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 16px; background:rgba(15,15,15,0.95); border-bottom:1px solid rgba(255,255,255,0.08); flex-shrink:0; gap:8px; flex-wrap: wrap;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-brands fa-youtube" style="color:#e74c3c; font-size:22px;"></i>
                        <span style="color:#fff; font-weight:700; font-size:15px;">YouTube</span>
                        <span style="color:rgba(255,255,255,0.3); font-size:11px;">trong Thanh Long Work</span>
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${MusicPlayer.SOURCES.map((s, i) => `
                            <button onclick="MusicPlayer.switchSource('${s.url}')" title="${s.desc}" style="padding:5px 12px; border-radius:6px; border:1px solid ${i===0 ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.1)'}; background:${i===0 ? 'rgba(231,76,60,0.15)' : 'rgba(255,255,255,0.04)'}; color:${i===0 ? '#e74c3c' : 'rgba(255,255,255,0.5)'}; cursor:pointer; font-size:11px; font-weight:600; transition:all 0.2s;" class="yt-source-btn" data-url="${s.url}">
                                <i class="fa-solid ${s.icon}" style="margin-right:4px;"></i>${s.name}
                            </button>
                        `).join('')}
                        <button onclick="MusicPlayer.reload()" title="Tải lại" style="padding:5px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.5); cursor:pointer; font-size:11px; transition:all 0.2s;">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>

                <!-- Full YouTube iframe -->
                <iframe id="yt-full-frame" src="${MusicPlayer._currentSrc}" style="flex:1; width:100%; border:none; background:#0f0f0f;" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"></iframe>

                <!-- Fallback message (hidden by default) -->
                <div id="yt-fallback" style="display:none; position:absolute; inset:0; z-index:10; background:rgba(15,15,15,0.98); display:none; flex-direction:column; align-items:center; justify-content:center; padding:40px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:48px; color:#f39c12; margin-bottom:16px;"></i>
                    <h3 style="color:#fff; margin-bottom:8px;">Server không phản hồi</h3>
                    <p style="color:rgba(255,255,255,0.5); text-align:center; margin-bottom:24px;">Thử chuyển sang server khác bằng các nút phía trên</p>
                </div>
            </div>
        `;
    },

    switchSource: (url) => {
        MusicPlayer._currentSrc = url;
        const frame = document.getElementById('yt-full-frame');
        if (frame) frame.src = url;

        // Highlight active button
        document.querySelectorAll('.yt-source-btn').forEach(btn => {
            const isActive = btn.dataset.url === url;
            btn.style.borderColor = isActive ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.1)';
            btn.style.background = isActive ? 'rgba(231,76,60,0.15)' : 'rgba(255,255,255,0.04)';
            btn.style.color = isActive ? '#e74c3c' : 'rgba(255,255,255,0.5)';
        });
    },

    reload: () => {
        const frame = document.getElementById('yt-full-frame');
        if (frame) frame.src = frame.src;
    }
};
