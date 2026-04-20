const MusicPlayer = {
    _rendered: false,
    _apis: [
        'https://pipedapi.kavin.rocks',
        'https://pipedapi.frontendfriendly.xyz',
        'https://api.piped.projectsegfau.lt',
        'https://inv.nadeko.net',
    ],

    render: () => {
        if (MusicPlayer._rendered) return;
        MusicPlayer._rendered = true;

        const container = document.getElementById('music-view');
        if (!container) return;

        container.innerHTML = `
            <div style="width:100%; min-height:calc(100vh - 100px); background:linear-gradient(160deg,#0a0a1a 0%,#111 100%); border-radius:14px; overflow:hidden; border:1px solid rgba(231,76,60,0.12);">

                <!-- Player Section -->
                <div style="display:grid; grid-template-columns:1fr 340px; min-height:calc(100vh - 100px);">

                    <!-- LEFT: Player + Search -->
                    <div style="padding:20px; display:flex; flex-direction:column;">
                        <!-- Header -->
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <i class="fa-brands fa-youtube" style="color:#e74c3c;font-size:24px;"></i>
                            <h3 style="color:#fff;margin:0;font-size:17px;font-weight:700;">YouTube Music</h3>
                        </div>

                        <!-- YouTube Embed Player -->
                        <div id="yt-player-wrap" style="width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,0.06);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
                            <iframe id="yt-player" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0" style="width:100%;height:100%;border:none;" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>
                        </div>

                        <!-- Now Playing -->
                        <div id="yt-now-playing" style="margin-top:10px;padding:8px 12px;border-radius:8px;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.15);display:none;">
                            <p style="color:#fff;font-size:13px;font-weight:600;margin:0;" id="yt-now-title"></p>
                            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:4px 0 0;" id="yt-now-channel"></p>
                        </div>

                        <!-- Search Bar -->
                        <div style="margin-top:14px;display:flex;gap:8px;">
                            <input id="yt-search" type="text" placeholder="🔍 Tìm bài hát... (VD: Sơn Tùng, See Tình, Lofi chill...)" style="flex:1;padding:11px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#fff;font-size:14px;outline:none;" onfocus="this.style.borderColor='#e74c3c'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
                            <button onclick="MusicPlayer.search()" id="yt-search-btn" style="padding:11px 18px;border-radius:10px;background:#e74c3c;color:#fff;border:none;cursor:pointer;font-weight:700;font-size:13px;white-space:nowrap;">
                                <i class="fa-solid fa-magnifying-glass" style="margin-right:5px;"></i>Tìm
                            </button>
                        </div>

                        <!-- Search Results -->
                        <div id="yt-results" style="margin-top:14px;flex:1;overflow-y:auto;"></div>
                    </div>

                    <!-- RIGHT: Sidebar -->
                    <div style="background:rgba(0,0,0,0.3);border-left:1px solid rgba(255,255,255,0.05);padding:16px;overflow-y:auto;">
                        <h4 style="color:rgba(255,255,255,0.3);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">
                            <i class="fa-solid fa-fire" style="margin-right:5px;color:#e74c3c;"></i>Tìm nhanh
                        </h4>
                        <div style="display:flex;flex-direction:column;gap:6px;" id="yt-quick-list">
                            ${MusicPlayer._quickBtn('Nhạc Việt hot 2024')}
                            ${MusicPlayer._quickBtn('Lofi chill study')}
                            ${MusicPlayer._quickBtn('Sơn Tùng MTP')}
                            ${MusicPlayer._quickBtn('Nhạc không lời piano')}
                            ${MusicPlayer._quickBtn('Acoustic cover hay')}
                            ${MusicPlayer._quickBtn('EDM remix việt')}
                            ${MusicPlayer._quickBtn('Bolero trữ tình')}
                            ${MusicPlayer._quickBtn('Nhạc Trịnh Công Sơn')}
                            ${MusicPlayer._quickBtn('US UK pop hits')}
                            ${MusicPlayer._quickBtn('K-Pop hot nhất')}
                            ${MusicPlayer._quickBtn('Rap Việt hay nhất')}
                            ${MusicPlayer._quickBtn('Hà Anh Tuấn')}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .yt-quick:hover{background:rgba(231,76,60,0.15)!important;border-color:rgba(231,76,60,0.3)!important;color:#e74c3c!important;}
                .yt-result-card:hover{background:rgba(231,76,60,0.08)!important;border-color:rgba(231,76,60,0.3)!important;}
                @media(max-width:900px){#music-view [style*="grid-template-columns"]{grid-template-columns:1fr!important;}}
            </style>
        `;

        // Enter key
        document.getElementById('yt-search').addEventListener('keydown', e => {
            if (e.key === 'Enter') MusicPlayer.search();
        });

        // Auto-search nhạc hot khi mở lần đầu
        MusicPlayer._doSearch('nhạc việt hot 2024');
    },

    _quickBtn: (text) => `
        <button class="yt-quick" onclick="MusicPlayer.quickSearch('${text}')" style="text-align:left;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.6);cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;">
            <i class="fa-solid fa-play" style="margin-right:6px;font-size:9px;opacity:0.4;"></i>${text}
        </button>
    `,

    quickSearch: (query) => {
        document.getElementById('yt-search').value = query;
        MusicPlayer.search();
    },

    search: () => {
        const q = document.getElementById('yt-search').value.trim();
        if (!q) return;
        MusicPlayer._doSearch(q);
    },

    _doSearch: async (query) => {
        const btn = document.getElementById('yt-search-btn');
        const results = document.getElementById('yt-results');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tìm...';
        btn.disabled = true;
        results.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:10px;">Đang tìm kiếm...</p></div>';

        let videos = null;

        // Thử Piped API trước (trả về format khác Invidious)
        for (const api of MusicPlayer._apis) {
            try {
                const isPiped = !api.includes('inv.');
                const url = isPiped
                    ? `${api}/search?q=${encodeURIComponent(query)}&filter=videos`
                    : `${api}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

                const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
                if (!resp.ok) continue;
                const data = await resp.json();

                if (isPiped && data.items) {
                    videos = data.items.filter(v => v.type === 'stream').slice(0, 12).map(v => ({
                        id: v.url ? v.url.replace('/watch?v=', '') : '',
                        title: v.title || 'Không rõ',
                        channel: v.uploaderName || v.uploader || '',
                        duration: v.duration || 0,
                        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.url?.replace('/watch?v=','')}/mqdefault.jpg`
                    }));
                } else if (!isPiped && Array.isArray(data)) {
                    videos = data.filter(v => v.type === 'video').slice(0, 12).map(v => ({
                        id: v.videoId,
                        title: v.title || 'Không rõ',
                        channel: v.author || '',
                        duration: v.lengthSeconds || 0,
                        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
                    }));
                }

                if (videos && videos.length > 0) break;
            } catch(e) { continue; }
        }

        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass" style="margin-right:5px;"></i>Tìm';
        btn.disabled = false;

        if (!videos || videos.length === 0) {
            results.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);"><i class="fa-solid fa-face-sad-tear" style="font-size:32px;margin-bottom:10px;display:block;"></i>Không tìm thấy kết quả.<br>Thử từ khóa khác nhé!</div>';
            return;
        }

        results.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">
                ${videos.map(v => `
                    <div class="yt-result-card" onclick="MusicPlayer.play('${v.id}','${v.title.replace(/'/g,"\\'")}','${v.channel.replace(/'/g,"\\'")}')" style="display:flex;gap:10px;padding:8px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:all 0.2s;">
                        <div style="position:relative;flex-shrink:0;">
                            <img src="${v.thumbnail}" style="width:140px;height:78px;border-radius:6px;object-fit:cover;background:#222;" onerror="this.src='https://i.ytimg.com/vi/default/mqdefault.jpg'">
                            ${v.duration ? `<span style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.8);color:#fff;font-size:10px;padding:1px 5px;border-radius:3px;">${MusicPlayer._fmt(v.duration)}</span>` : ''}
                        </div>
                        <div style="overflow:hidden;display:flex;flex-direction:column;justify-content:center;min-width:0;">
                            <div style="color:#fff;font-weight:600;font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;">${v.title}</div>
                            <div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.channel}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    play: (videoId, title, channel) => {
        document.getElementById('yt-player').src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

        const np = document.getElementById('yt-now-playing');
        np.style.display = 'block';
        document.getElementById('yt-now-title').textContent = title || '';
        document.getElementById('yt-now-channel').textContent = channel || '';

        // Scroll lên player
        document.getElementById('yt-player-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _fmt: (s) => {
        if (!s || s <= 0) return '';
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }
};
