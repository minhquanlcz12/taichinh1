const MusicPlayer = {
    _rendered: false,

    render: () => {
        // Nếu đã render rồi, không render lại (giữ nhạc đang phát)
        if (MusicPlayer._rendered) return;
        MusicPlayer._rendered = true;

        const container = document.getElementById('music-view');
        if (!container) return;

        container.innerHTML = `
            <div id="music-player-app" style="width:100%; min-height: calc(100vh - 100px); background: linear-gradient(160deg, #0d001a 0%, #1a0533 40%, #0a0a2e 100%); border-radius: 16px; border: 1px solid rgba(148,0,211,0.15); padding: 24px; position: relative; overflow: hidden;">
                <div style="position:absolute; width:400px; height:400px; background:radial-gradient(circle, rgba(155,89,182,0.08), transparent 70%); top:-100px; right:-100px; pointer-events:none;"></div>

                <div style="display:grid; grid-template-columns: 1fr 300px; gap: 24px; position:relative; z-index:1;">
                    <!-- LEFT: Video Player -->
                    <div>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#e74c3c,#c0392b);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(231,76,60,0.4);animation:musicPulse 2s ease-in-out infinite;">
                                <i class="fa-brands fa-youtube" style="color:#fff;font-size:20px;"></i>
                            </div>
                            <div>
                                <h3 style="color:#fff; margin:0; font-size:18px; font-weight:700;">YouTube Music</h3>
                                <p style="color:rgba(255,255,255,0.4); margin:0; font-size:12px;">Nghe nhạc & xem MV ngay trong ứng dụng</p>
                            </div>
                        </div>

                        <!-- YouTube Embed -->
                        <div style="width:100%; aspect-ratio:16/9; border-radius:12px; overflow:hidden; border:1px solid rgba(231,76,60,0.3); box-shadow: 0 8px 40px rgba(0,0,0,0.6); background:#000;">
                            <iframe id="yt-player" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0" style="width:100%; height:100%; border:none;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
                        </div>

                        <!-- Search / URL Input -->
                        <div style="margin-top:16px; display:flex; gap:8px;">
                            <input id="yt-url-input" type="text" placeholder="🔍 Tìm bài hát hoặc dán link YouTube..." style="flex:1; padding:12px 16px; border-radius:10px; border:1px solid rgba(231,76,60,0.3); background:rgba(255,255,255,0.05); color:#fff; font-size:14px; outline:none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#e74c3c'" onblur="this.style.borderColor='rgba(231,76,60,0.3)'">
                            <button onclick="MusicPlayer.playFromInput()" id="yt-play-btn" style="padding:12px 20px; border-radius:10px; background:linear-gradient(135deg,#e74c3c,#c0392b); color:#fff; border:none; cursor:pointer; font-weight:700; font-size:14px; white-space:nowrap; transition:all 0.3s; box-shadow:0 4px 15px rgba(231,76,60,0.3);">
                                <i class="fa-solid fa-play" style="margin-right:6px;"></i>Phát
                            </button>
                        </div>
                        <p style="color:rgba(255,255,255,0.25); font-size:11px; margin-top:6px;">
                            <i class="fa-solid fa-lightbulb" style="margin-right:4px; color:#f1c40f;"></i>
                            Gõ tên bài hát (VD: "Em của ngày hôm qua") hoặc dán link YouTube
                        </p>

                        <!-- Search Results Area -->
                        <div id="yt-search-results" style="margin-top:12px; display:none;"></div>
                    </div>

                    <!-- RIGHT: Quick Play Sidebar -->
                    <div style="display:flex; flex-direction:column; gap:10px; max-height: calc(100vh - 160px); overflow-y:auto; padding-right:4px;">
                        <h4 style="color:#e74c3c; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 4px 0; position:sticky; top:0; background:rgba(13,0,26,0.95); padding:8px 0; z-index:2;">
                            <i class="fa-solid fa-fire" style="margin-right:6px;"></i>Nghe nhanh
                        </h4>

                        ${MusicPlayer._card('jfKfPfyJRdk', 'Lofi Girl Radio', 'Live 24/7 • Thư giãn', 'fa-cloud-moon', '#9b59b6', '#6c3483')}
                        ${MusicPlayer._card('kgx4WGK0oNU', 'Nhạc Acoustic Chill', 'Cover nhẹ nhàng hay nhất', 'fa-guitar', '#3498db', '#2980b9')}
                        ${MusicPlayer._card('5qap5aO4i9A', 'Nhạc Không Lời Hay', 'Piano, study, relax', 'fa-moon', '#1abc9c', '#16a085')}
                        ${MusicPlayer._card('hHW1oY26kxQ', 'EDM Mix Sôi Động', 'Best EDM drops 2024', 'fa-bolt', '#f39c12', '#f1c40f')}
                        ${MusicPlayer._card('QH2-TGUlwu4', 'Nyan Cat 10h', 'Meme huyền thoại 😹', 'fa-cat', '#ff6b9d', '#c44569')}
                    </div>
                </div>
            </div>

            <style>
                @keyframes musicPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(231,76,60,0.4); }
                    50% { box-shadow: 0 0 35px rgba(231,76,60,0.6), 0 0 60px rgba(231,76,60,0.15); }
                }
                .music-pl-card:hover {
                    transform: translateX(4px);
                    border-color: rgba(231,76,60,0.5) !important;
                    background: rgba(231,76,60,0.1) !important;
                }
                .yt-result-item:hover {
                    background: rgba(231,76,60,0.12) !important;
                    border-color: rgba(231,76,60,0.4) !important;
                }
                @media (max-width: 900px) {
                    #music-player-app > div { grid-template-columns: 1fr !important; }
                }
            </style>
        `;

        // Enter key listener
        document.getElementById('yt-url-input').addEventListener('keydown', e => {
            if (e.key === 'Enter') MusicPlayer.playFromInput();
        });
    },

    _card: (videoId, title, subtitle, icon, color1, color2) => {
        return `
            <div class="music-pl-card" onclick="MusicPlayer.playVideo('${videoId}')" style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); cursor:pointer; transition:all 0.3s;">
                <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,${color1},${color2});display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fa-solid ${icon}" style="color:#fff;font-size:16px;"></i>
                </div>
                <div style="overflow:hidden;">
                    <div style="color:#fff;font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
                    <div style="color:rgba(255,255,255,0.35);font-size:11px;">${subtitle}</div>
                </div>
            </div>
        `;
    },

    playVideo: (videoId) => {
        document.getElementById('yt-player').src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        // Ẩn search results khi bấm phát
        const sr = document.getElementById('yt-search-results');
        if (sr) sr.style.display = 'none';
    },

    playFromInput: async () => {
        const input = document.getElementById('yt-url-input').value.trim();
        if (!input) return;

        // Kiểm tra nếu là link YouTube → phát trực tiếp
        const videoId = MusicPlayer.extractVideoId(input);
        if (videoId) {
            MusicPlayer.playVideo(videoId);
            return;
        }

        // Nếu không phải link → TÌM KIẾM
        await MusicPlayer.searchYouTube(input);
    },

    searchYouTube: async (query) => {
        const btn = document.getElementById('yt-play-btn');
        const sr = document.getElementById('yt-search-results');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i>Tìm...';
        sr.style.display = 'block';
        sr.innerHTML = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:12px;">Đang tìm kiếm...</p>';

        try {
            // Dùng Invidious API (free, không cần key)
            const apis = [
                'https://inv.nadeko.net',
                'https://invidious.fdn.fr',
                'https://vid.puffyan.us'
            ];
            let results = null;

            for (const api of apis) {
                try {
                    const resp = await fetch(`${api}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
                        signal: AbortSignal.timeout(5000)
                    });
                    if (resp.ok) {
                        results = await resp.json();
                        break;
                    }
                } catch(e) { continue; }
            }

            if (!results || results.length === 0) {
                sr.innerHTML = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:12px;">Không tìm thấy kết quả. Thử từ khóa khác nhé!</p>';
                btn.innerHTML = '<i class="fa-solid fa-play" style="margin-right:6px;"></i>Phát';
                return;
            }

            // Hiển thị top 6 kết quả
            const top = results.filter(r => r.type === 'video').slice(0, 6);
            sr.innerHTML = `
                <h4 style="color:#e74c3c; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
                    <i class="fa-solid fa-search" style="margin-right:4px;"></i>Kết quả cho "${query}"
                </h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px;">
                    ${top.map(v => `
                        <div class="yt-result-item" onclick="MusicPlayer.playVideo('${v.videoId}')" style="display:flex; gap:10px; padding:10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:all 0.3s;">
                            <img src="https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg" style="width:120px; height:68px; border-radius:6px; object-fit:cover; flex-shrink:0; background:#222;">
                            <div style="overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
                                <div style="color:#fff; font-weight:600; font-size:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${v.title}</div>
                                <div style="color:rgba(255,255,255,0.3); font-size:11px; margin-top:4px;">${v.author || ''} • ${MusicPlayer._formatDuration(v.lengthSeconds)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch(e) {
            sr.innerHTML = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:12px;">Lỗi tìm kiếm. Thử lại sau hoặc dán trực tiếp link YouTube.</p>';
        }

        btn.innerHTML = '<i class="fa-solid fa-play" style="margin-right:6px;"></i>Phát';
    },

    _formatDuration: (seconds) => {
        if (!seconds) return '';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    },

    extractVideoId: (url) => {
        let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];
        match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];
        match = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
        return null;
    }
};
