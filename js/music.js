const MusicPlayer = {
    _rendered: false,

    render: () => {
        if (MusicPlayer._rendered) return;
        MusicPlayer._rendered = true;

        const container = document.getElementById('music-view');
        if (!container) return;

        // Load Piped với trang tìm kiếm sẵn để user thấy kết quả ngay
        const defaultUrl = 'https://piped.video/results?search_query=' + encodeURIComponent('nhạc việt nam hay nhất 2024');

        container.innerHTML = `
            <div style="width:100%; height: calc(100vh - 80px); display:flex; flex-direction:column; border-radius:12px; overflow:hidden; border: 1px solid rgba(231,76,60,0.15); background:#0f0f0f;">
                <!-- Compact Top Bar -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:5px 14px; background:#0f0f0f; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i class="fa-brands fa-youtube" style="color:#e74c3c; font-size:18px;"></i>
                        <span style="color:#fff; font-weight:700; font-size:13px;">YouTube Music</span>
                        <span style="color:rgba(255,255,255,0.2); font-size:10px;">• Không cần đăng ký, dùng thanh tìm kiếm phía dưới</span>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button onclick="MusicPlayer.goHome()" title="Trang chủ" style="padding:4px 10px; border-radius:5px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); cursor:pointer; font-size:11px; font-weight:600;">
                            <i class="fa-solid fa-house" style="margin-right:3px;"></i>Home
                        </button>
                        <button onclick="MusicPlayer.searchPopular()" title="Nhạc hot" style="padding:4px 10px; border-radius:5px; border:1px solid rgba(231,76,60,0.3); background:rgba(231,76,60,0.1); color:#e74c3c; cursor:pointer; font-size:11px; font-weight:600;">
                            <i class="fa-solid fa-fire" style="margin-right:3px;"></i>Hot
                        </button>
                        <button onclick="MusicPlayer.reload()" title="Tải lại nếu lỗi" style="padding:4px 8px; border-radius:5px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); cursor:pointer; font-size:11px;">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>

                <!-- Full Piped iframe -->
                <iframe id="yt-full-frame" src="${defaultUrl}" style="flex:1; width:100%; border:none; background:#0f0f0f;" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"></iframe>
            </div>
        `;
    },

    goHome: () => {
        document.getElementById('yt-full-frame').src = 'https://piped.video';
    },

    searchPopular: () => {
        document.getElementById('yt-full-frame').src = 'https://piped.video/results?search_query=' + encodeURIComponent('nhạc việt nam hay nhất 2024');
    },

    reload: () => {
        const frame = document.getElementById('yt-full-frame');
        if (frame) frame.src = frame.src;
    }
};
