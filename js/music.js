const MusicPlayer = {
    _rendered: false,
    _currentSrc: 'https://yewtu.be',

    // Các frontend YouTube mã nguồn mở — dùng xem video, tìm kiếm, nghe nhạc bình thường
    SOURCES: [
        { name: 'Server 1', url: 'https://yewtu.be', icon: 'fa-server', desc: 'Invidious - nhanh' },
        { name: 'Server 2', url: 'https://inv.nadeko.net', icon: 'fa-server', desc: 'Invidious JP' },
        { name: 'Server 3', url: 'https://invidious.fdn.fr', icon: 'fa-server', desc: 'Invidious EU' },
        { name: 'Piped', url: 'https://piped.video', icon: 'fa-play-circle', desc: 'Piped - giao diện đẹp' },
    ],

    render: () => {
        if (MusicPlayer._rendered) return;
        MusicPlayer._rendered = true;

        const container = document.getElementById('music-view');
        if (!container) return;

        container.innerHTML = `
            <div style="width:100%; height: calc(100vh - 80px); display:flex; flex-direction:column; border-radius:12px; overflow:hidden; border: 1px solid rgba(231,76,60,0.2); background:#0f0f0f;">
                <!-- Top Bar -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 16px; background:rgba(15,15,15,0.97); border-bottom:1px solid rgba(255,255,255,0.08); flex-shrink:0; gap:8px; flex-wrap: wrap;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-brands fa-youtube" style="color:#e74c3c; font-size:20px;"></i>
                        <span style="color:#fff; font-weight:700; font-size:14px;">YouTube Music</span>
                    </div>
                    <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
                        <span style="color:rgba(255,255,255,0.25); font-size:10px; margin-right:4px;">Chậm? Đổi server:</span>
                        ${MusicPlayer.SOURCES.map((s, i) => `
                            <button onclick="MusicPlayer.switchSource('${s.url}')" title="${s.desc}" style="padding:4px 10px; border-radius:5px; border:1px solid ${i===0 ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.1)'}; background:${i===0 ? 'rgba(231,76,60,0.15)' : 'transparent'}; color:${i===0 ? '#e74c3c' : 'rgba(255,255,255,0.4)'}; cursor:pointer; font-size:11px; font-weight:600; transition:all 0.2s;" class="yt-source-btn" data-url="${s.url}">
                                ${s.name}
                            </button>
                        `).join('')}
                        <button onclick="MusicPlayer.reload()" title="Tải lại" style="padding:4px 8px; border-radius:5px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); cursor:pointer; font-size:11px;">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>

                <!-- Full YouTube iframe -->
                <iframe id="yt-full-frame" src="${MusicPlayer._currentSrc}" style="flex:1; width:100%; border:none; background:#0f0f0f;" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"></iframe>
            </div>
        `;
    },

    switchSource: (url) => {
        MusicPlayer._currentSrc = url;
        const frame = document.getElementById('yt-full-frame');
        if (frame) frame.src = url;

        document.querySelectorAll('.yt-source-btn').forEach(btn => {
            const isActive = btn.dataset.url === url;
            btn.style.borderColor = isActive ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.1)';
            btn.style.background = isActive ? 'rgba(231,76,60,0.15)' : 'transparent';
            btn.style.color = isActive ? '#e74c3c' : 'rgba(255,255,255,0.4)';
        });
    },

    reload: () => {
        const frame = document.getElementById('yt-full-frame');
        if (frame) frame.src = frame.src;
    }
};
