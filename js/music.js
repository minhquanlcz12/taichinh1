/**
 * MusicPlayer - Full-page YouTube search + embed player
 * Phiên bản ổn định nhất, đã được test hoạt động
 */
const MusicPlayer = {
    _rendered: false,
    _results: [],
    _currentIdx: -1,
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
                <div style="display:grid; grid-template-columns:1fr 300px; min-height:calc(100vh - 100px);" id="mp-grid">

                    <!-- LEFT: Player + Search -->
                    <div style="padding:20px; display:flex; flex-direction:column;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <i class="fa-brands fa-youtube" style="color:#e74c3c;font-size:24px;"></i>
                            <h3 style="color:#fff;margin:0;font-size:17px;font-weight:700;">YouTube Music</h3>
                            <span style="color:rgba(255,255,255,0.2);font-size:11px;">• Nghe nhạc ngay trong app</span>
                        </div>

                        <!-- YouTube Embed Player -->
                        <div id="yt-player-wrap" style="width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,0.06);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
                            <iframe id="yt-player" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0" style="width:100%;height:100%;border:none;" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>
                        </div>

                        <!-- Now Playing Bar -->
                        <div id="yt-now-playing" style="margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.15);">
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                                <div style="min-width:0;flex:1;">
                                    <p style="color:#fff;font-size:13px;font-weight:600;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="yt-now-title">Lofi Girl Radio — live 24/7</p>
                                    <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:2px 0 0;" id="yt-now-channel">Bấm tìm kiếm hoặc chọn playlist bên phải</p>
                                </div>
                                <div style="display:flex;gap:6px;flex-shrink:0;">
                                    <button onclick="MusicPlayer.prev()" title="Bài trước" style="width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;font-size:12px;">
                                        <i class="fa-solid fa-backward-step"></i>
                                    </button>
                                    <button onclick="MusicPlayer.next()" title="Bài tiếp (skip lỗi)" style="width:32px;height:32px;border-radius:50%;border:1px solid rgba(231,76,60,0.4);background:rgba(231,76,60,0.1);color:#e74c3c;cursor:pointer;font-size:12px;">
                                        <i class="fa-solid fa-forward-step"></i>
                                    </button>
                                    <a id="yt-open-link" href="https://www.youtube.com/watch?v=jfKfPfyJRdk" target="_blank" title="Mở trên YouTube" style="width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;text-decoration:none;">
                                        <i class="fa-solid fa-up-right-from-square"></i>
                                    </a>
                                </div>
                            </div>
                            <p style="color:rgba(255,255,255,0.2);font-size:10px;margin:6px 0 0;"><i class="fa-solid fa-circle-info" style="margin-right:3px;"></i>Video lỗi? Bấm ⏭ chuyển bài hoặc ↗ mở YouTube trực tiếp</p>
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
                            ${[
                                'Nhạc Việt hot 2024', 'Lofi chill study', 'Sơn Tùng MTP',
                                'Nhạc không lời piano', 'Acoustic cover hay nhất', 'EDM remix việt',
                                'Bolero trữ tình', 'Nhạc Trịnh Công Sơn', 'US UK pop hits 2024',
                                'K-Pop hot nhất', 'Rap Việt hay nhất', 'Hà Anh Tuấn playlist'
                            ].map(t => `
                                <button class="yt-quick" onclick="MusicPlayer.quickSearch('${t}')" style="text-align:left;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.6);cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;">
                                    <i class="fa-solid fa-play" style="margin-right:6px;font-size:9px;opacity:0.4;"></i>${t}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .yt-quick:hover{background:rgba(231,76,60,0.15)!important;border-color:rgba(231,76,60,0.3)!important;color:#e74c3c!important;}
                .yt-result-card:hover{background:rgba(231,76,60,0.08)!important;border-color:rgba(231,76,60,0.3)!important;}
                .yt-result-card.active{background:rgba(231,76,60,0.12)!important;border-color:rgba(231,76,60,0.4)!important;}
                @media(max-width:900px){#mp-grid{grid-template-columns:1fr!important;}}
            </style>
        `;

        document.getElementById('yt-search').addEventListener('keydown', e => {
            if (e.key === 'Enter') MusicPlayer.search();
        });

        // Auto-search nhạc hot
        MusicPlayer._doSearch('nhạc việt hot nhất 2024');
    },

    quickSearch: (q) => {
        document.getElementById('yt-search').value = q;
        MusicPlayer.search();
    },

    search: () => {
        const q = document.getElementById('yt-search').value.trim();
        if (!q) return;
        MusicPlayer._doSearch(q);
    },

    next: () => {
        if (MusicPlayer._results.length === 0) return;
        let nextIdx = MusicPlayer._currentIdx + 1;
        if (nextIdx < MusicPlayer._results.length) {
            MusicPlayer.playIdx(nextIdx);
        }
    },

    prev: () => {
        if (MusicPlayer._currentIdx > 0) {
            MusicPlayer.playIdx(MusicPlayer._currentIdx - 1);
        }
    },

    _doSearch: async (query) => {
        const btn = document.getElementById('yt-search-btn');
        const resultDiv = document.getElementById('yt-results');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Tìm...';
        btn.disabled = true;
        resultDiv.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:10px;">Đang tìm kiếm...</p></div>';

        let videos = null;

        for (const api of MusicPlayer._apis) {
            try {
                const isPiped = !api.includes('inv.');
                const url = isPiped
                    ? `${api}/search?q=${encodeURIComponent(query)}&filter=music_songs`
                    : `${api}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

                const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
                if (!resp.ok) {
                    // Piped music_songs filter might fail, try videos filter
                    if (isPiped) {
                        const resp2 = await fetch(`${api}/search?q=${encodeURIComponent(query)}&filter=videos`, { signal: AbortSignal.timeout(6000) });
                        if (resp2.ok) {
                            const data2 = await resp2.json();
                            if (data2.items) {
                                videos = data2.items.filter(v => v.type === 'stream' && v.duration > 0).slice(0, 20).map(v => ({
                                    id: v.url ? v.url.replace('/watch?v=', '') : '',
                                    title: v.title || '', channel: v.uploaderName || v.uploader || '',
                                    duration: v.duration || 0,
                                    thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.url?.replace('/watch?v=','')}/mqdefault.jpg`
                                }));
                            }
                        }
                    }
                    if (!videos || videos.length === 0) continue;
                } else {
                    const data = await resp.json();
                    if (isPiped && data.items) {
                        videos = data.items.filter(v => (v.type === 'stream' || v.type === 'song') && v.duration > 0).slice(0, 20).map(v => ({
                            id: v.url ? v.url.replace('/watch?v=', '') : '',
                            title: v.title || '', channel: v.uploaderName || v.uploader || '',
                            duration: v.duration || 0,
                            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.url?.replace('/watch?v=','')}/mqdefault.jpg`
                        }));
                    } else if (!isPiped && Array.isArray(data)) {
                        videos = data.filter(v => v.type === 'video' && v.lengthSeconds > 0).slice(0, 20).map(v => ({
                            id: v.videoId, title: v.title || '', channel: v.author || '',
                            duration: v.lengthSeconds || 0,
                            thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
                        }));
                    }
                }

                if (videos) videos = videos.filter(v => v.id && v.id.length === 11);
                if (videos && videos.length > 0) break;
            } catch(e) { continue; }
        }

        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass" style="margin-right:5px;"></i>Tìm';
        btn.disabled = false;

        if (!videos || videos.length === 0) {
            resultDiv.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);"><i class="fa-solid fa-face-sad-tear" style="font-size:32px;margin-bottom:10px;display:block;"></i>Không tìm thấy. Thử từ khóa khác!</div>';
            return;
        }

        MusicPlayer._results = videos;
        MusicPlayer._currentIdx = -1;

        resultDiv.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${videos.map((v, i) => `
                    <div class="yt-result-card" id="yt-card-${i}" onclick="MusicPlayer.playIdx(${i})" style="display:flex;gap:10px;padding:8px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:all 0.2s;">
                        <div style="position:relative;flex-shrink:0;">
                            <img src="${v.thumbnail}" style="width:120px;height:68px;border-radius:6px;object-fit:cover;background:#222;" onerror="this.style.display='none'">
                            ${v.duration ? `<span style="position:absolute;bottom:3px;right:3px;background:rgba(0,0,0,0.85);color:#fff;font-size:10px;padding:1px 4px;border-radius:3px;">${MusicPlayer._fmt(v.duration)}</span>` : ''}
                        </div>
                        <div style="overflow:hidden;display:flex;flex-direction:column;justify-content:center;min-width:0;flex:1;">
                            <div style="color:#fff;font-weight:600;font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;">${v.title}</div>
                            <div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.channel}</div>
                        </div>
                        <div style="display:flex;align-items:center;flex-shrink:0;"><i class="fa-solid fa-play" style="color:rgba(255,255,255,0.15);font-size:14px;"></i></div>
                    </div>
                `).join('')}
            </div>
        `;

        // Auto-play first result
        MusicPlayer.playIdx(0);
    },

    playIdx: (idx) => {
        if (idx < 0 || idx >= MusicPlayer._results.length) return;
        const v = MusicPlayer._results[idx];
        MusicPlayer._currentIdx = idx;

        document.getElementById('yt-player').src = `https://www.youtube.com/embed/${v.id}?autoplay=1`;
        document.getElementById('yt-now-title').textContent = v.title;
        document.getElementById('yt-now-channel').textContent = v.channel;
        document.getElementById('yt-open-link').href = `https://www.youtube.com/watch?v=${v.id}`;

        // Highlight
        document.querySelectorAll('.yt-result-card').forEach((el, i) => el.classList.toggle('active', i === idx));
        document.getElementById('yt-player-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _fmt: (s) => {
        if (!s || s <= 0) return '';
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }
};
