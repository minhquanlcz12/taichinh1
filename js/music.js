/**
 * MusicPlayer - Floating Mini YouTube Player
 * Hiển thị ở góc dưới phải trên TẤT CẢ các trang
 * Search + Play + Skip + Expand/Collapse
 */
const MusicPlayer = {
    _injected: false,
    _expanded: false,
    _results: [],
    _currentIdx: -1,
    _currentVideoId: null,
    _apis: [
        'https://pipedapi.kavin.rocks',
        'https://pipedapi.frontendfriendly.xyz',
        'https://api.piped.projectsegfau.lt',
        'https://inv.nadeko.net',
    ],

    // Gọi 1 lần khi app load — inject mini player vào DOM
    init: () => {
        if (MusicPlayer._injected) return;
        MusicPlayer._injected = true;

        // Inject CSS
        const style = document.createElement('style');
        style.textContent = `
            #mini-player {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Inter', 'Segoe UI', sans-serif;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #mini-player.collapsed {
                width: 360px;
                height: auto;
                border-radius: 14px;
            }
            #mini-player.expanded {
                width: 420px;
                height: auto;
                max-height: 85vh;
                border-radius: 16px;
            }
            #mp-toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9998;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(231,76,60,0.5);
                transition: all 0.3s;
                color: #fff;
                font-size: 20px;
            }
            #mp-toggle-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(231,76,60,0.6); }
            #mp-toggle-btn.has-music { animation: mpPulse 2s infinite; }

            @keyframes mpPulse {
                0%, 100% { box-shadow: 0 4px 20px rgba(231,76,60,0.5); }
                50% { box-shadow: 0 4px 28px rgba(231,76,60,0.8), 0 0 40px rgba(231,76,60,0.2); }
            }

            .mp-result:hover { background: rgba(231,76,60,0.1) !important; }
            .mp-result.active { background: rgba(231,76,60,0.15) !important; border-left: 3px solid #e74c3c !important; }
            .mp-quick:hover { background: rgba(231,76,60,0.15) !important; color: #e74c3c !important; }
            #mini-player ::-webkit-scrollbar { width: 4px; }
            #mini-player ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            @media (max-width: 500px) {
                #mini-player.collapsed, #mini-player.expanded { width: calc(100vw - 20px); right: 10px; bottom: 10px; }
            }
        `;
        document.head.appendChild(style);

        // Inject toggle button (FAB)
        const fab = document.createElement('button');
        fab.id = 'mp-toggle-btn';
        fab.innerHTML = '<i class="fa-solid fa-music"></i>';
        fab.title = 'Mở/đóng Music Player';
        fab.onclick = () => MusicPlayer.toggle();
        document.body.appendChild(fab);

        // Inject mini player container (hidden initially)
        const player = document.createElement('div');
        player.id = 'mini-player';
        player.className = 'collapsed';
        player.style.display = 'none';
        document.body.appendChild(player);
    },

    toggle: () => {
        const mp = document.getElementById('mini-player');
        const fab = document.getElementById('mp-toggle-btn');
        if (mp.style.display === 'none') {
            mp.style.display = 'block';
            fab.style.display = 'none';
            MusicPlayer._renderPlayer();
        } else {
            mp.style.display = 'none';
            fab.style.display = 'flex';
        }
    },

    expand: () => {
        const mp = document.getElementById('mini-player');
        MusicPlayer._expanded = !MusicPlayer._expanded;
        mp.className = MusicPlayer._expanded ? 'expanded' : 'collapsed';
        MusicPlayer._renderPlayer();
    },

    _renderPlayer: () => {
        const mp = document.getElementById('mini-player');
        const hasVideo = !!MusicPlayer._currentVideoId;
        const videoSrc = hasVideo
            ? `https://www.youtube.com/embed/${MusicPlayer._currentVideoId}?autoplay=1`
            : 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0';

        // Check if iframe already exists to avoid resetting
        const existingFrame = document.getElementById('mp-yt-frame');
        const needNewFrame = !existingFrame;

        const currentTitle = document.getElementById('mp-now-title')?.textContent || '';
        const currentChannel = document.getElementById('mp-now-channel')?.textContent || '';

        mp.innerHTML = `
            <div style="background:linear-gradient(160deg,#1a1a2e,#16213e); border:1px solid rgba(231,76,60,0.2); border-radius:inherit; overflow:hidden; box-shadow:0 10px 50px rgba(0,0,0,0.7);">
                <!-- Header -->
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.05);cursor:move;" onmousedown="MusicPlayer._startDrag(event)">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <i class="fa-brands fa-youtube" style="color:#e74c3c;font-size:16px;"></i>
                        <span style="color:#fff;font-weight:700;font-size:12px;">Music Player</span>
                        ${hasVideo ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#2ecc71;margin-left:4px;animation:mpPulse 2s infinite;"></span>' : ''}
                    </div>
                    <div style="display:flex;gap:4px;">
                        <button onclick="MusicPlayer.expand()" style="width:26px;height:26px;border-radius:6px;border:none;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);cursor:pointer;font-size:10px;" title="${MusicPlayer._expanded ? 'Thu nhỏ' : 'Mở rộng'}">
                            <i class="fa-solid fa-${MusicPlayer._expanded ? 'compress' : 'expand'}"></i>
                        </button>
                        <button onclick="MusicPlayer.toggle()" style="width:26px;height:26px;border-radius:6px;border:none;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);cursor:pointer;font-size:10px;" title="Đóng">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                    </div>
                </div>

                <!-- Video Player -->
                <div style="width:100%;aspect-ratio:16/9;background:#000;">
                    <iframe id="mp-yt-frame" src="${needNewFrame ? videoSrc : ''}" style="width:100%;height:100%;border:none;" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>
                </div>

                <!-- Controls Bar -->
                <div style="display:flex;align-items:center;padding:8px 12px;gap:6px;background:rgba(0,0,0,0.2);">
                    <button onclick="MusicPlayer.prev()" style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;font-size:11px;" title="Bài trước">
                        <i class="fa-solid fa-backward-step"></i>
                    </button>
                    <button onclick="MusicPlayer.next()" style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(231,76,60,0.4);background:rgba(231,76,60,0.1);color:#e74c3c;cursor:pointer;font-size:11px;" title="Bài tiếp">
                        <i class="fa-solid fa-forward-step"></i>
                    </button>
                    <div style="flex:1;min-width:0;margin:0 6px;">
                        <div style="color:#fff;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="mp-now-title">${currentTitle || 'Lofi Girl Radio'}</div>
                        <div style="color:rgba(255,255,255,0.35);font-size:10px;" id="mp-now-channel">${currentChannel || 'Chọn bài từ tìm kiếm'}</div>
                    </div>
                    <a id="mp-yt-link" href="https://www.youtube.com/watch?v=${MusicPlayer._currentVideoId || 'jfKfPfyJRdk'}" target="_blank" style="width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:10px;" title="Mở YouTube">
                        <i class="fa-solid fa-up-right-from-square"></i>
                    </a>
                </div>

                ${MusicPlayer._expanded ? MusicPlayer._renderSearchPanel() : `
                    <!-- Mini search toggle -->
                    <div style="padding:6px 12px 10px;display:flex;gap:6px;">
                        <input id="mp-search-mini" type="text" placeholder="🔍 Tìm nhạc..." style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:12px;outline:none;" onkeydown="if(event.key==='Enter'){MusicPlayer._expanded=true;MusicPlayer.expand();setTimeout(()=>{document.getElementById('mp-search-input').value=this.value;MusicPlayer.doSearch();},100);}">
                    </div>
                `}
            </div>
        `;

        if (!needNewFrame && existingFrame) {
            // Don't reset iframe src if already playing
        }
    },

    _renderSearchPanel: () => {
        return `
            <div style="padding:10px 12px;border-top:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex;gap:6px;margin-bottom:8px;">
                    <input id="mp-search-input" type="text" placeholder="🔍 Tìm bài hát..." style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#fff;font-size:12px;outline:none;" onkeydown="if(event.key==='Enter')MusicPlayer.doSearch()">
                    <button onclick="MusicPlayer.doSearch()" id="mp-search-btn" style="padding:8px 12px;border-radius:8px;background:#e74c3c;color:#fff;border:none;cursor:pointer;font-weight:700;font-size:11px;white-space:nowrap;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>

                <!-- Quick searches -->
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                    ${['Lofi chill','V-Pop hot','Acoustic','EDM remix','Bolero','K-Pop','Rap Việt','Piano'].map(t =>
                        `<button class="mp-quick" onclick="document.getElementById('mp-search-input').value='${t}';MusicPlayer.doSearch();" style="padding:3px 8px;border-radius:5px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:rgba(255,255,255,0.4);cursor:pointer;font-size:10px;transition:all 0.2s;">${t}</button>`
                    ).join('')}
                </div>

                <!-- Results -->
                <div id="mp-results" style="max-height:250px;overflow-y:auto;">
                    ${MusicPlayer._renderResults()}
                </div>
            </div>
        `;
    },

    _renderResults: () => {
        if (MusicPlayer._results.length === 0) {
            return '<p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;padding:16px;">Tìm kiếm bài hát để bắt đầu nghe nhạc</p>';
        }
        return MusicPlayer._results.map((v, i) => `
            <div class="mp-result ${i === MusicPlayer._currentIdx ? 'active' : ''}" onclick="MusicPlayer.playIdx(${i})" style="display:flex;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer;transition:all 0.2s;border-left:3px solid transparent;margin-bottom:2px;">
                <img src="${v.thumbnail}" style="width:64px;height:36px;border-radius:4px;object-fit:cover;flex-shrink:0;background:#222;" onerror="this.style.display='none'">
                <div style="min-width:0;flex:1;display:flex;flex-direction:column;justify-content:center;">
                    <div style="color:#fff;font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
                    <div style="color:rgba(255,255,255,0.25);font-size:10px;">${v.channel}${v.duration ? ' • ' + MusicPlayer._fmt(v.duration) : ''}</div>
                </div>
            </div>
        `).join('');
    },

    doSearch: async () => {
        const input = document.getElementById('mp-search-input');
        if (!input) return;
        const q = input.value.trim();
        if (!q) return;

        const btn = document.getElementById('mp-search-btn');
        const resultDiv = document.getElementById('mp-results');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        if (resultDiv) resultDiv.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:11px;text-align:center;padding:16px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tìm...</p>';

        let videos = null;
        for (const api of MusicPlayer._apis) {
            try {
                const isPiped = !api.includes('inv.');
                const url = isPiped
                    ? `${api}/search?q=${encodeURIComponent(q)}&filter=videos`
                    : `${api}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
                const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
                if (!resp.ok) continue;
                const data = await resp.json();
                if (isPiped && data.items) {
                    videos = data.items.filter(v => v.type === 'stream' && v.duration > 0).slice(0, 20).map(v => ({
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
                if (videos) videos = videos.filter(v => v.id && v.id.length === 11);
                if (videos && videos.length > 0) break;
            } catch(e) { continue; }
        }

        if (btn) btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';

        if (!videos || videos.length === 0) {
            MusicPlayer._results = [];
            if (resultDiv) resultDiv.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:11px;text-align:center;padding:16px;">Không tìm thấy. Thử từ khóa khác!</p>';
            return;
        }

        MusicPlayer._results = videos;
        MusicPlayer._currentIdx = -1;
        if (resultDiv) resultDiv.innerHTML = MusicPlayer._renderResults();

        // Auto-play first result
        MusicPlayer.playIdx(0);
    },

    playIdx: (idx) => {
        if (idx < 0 || idx >= MusicPlayer._results.length) return;
        const v = MusicPlayer._results[idx];
        MusicPlayer._currentIdx = idx;
        MusicPlayer._currentVideoId = v.id;

        const frame = document.getElementById('mp-yt-frame');
        if (frame) frame.src = `https://www.youtube.com/embed/${v.id}?autoplay=1`;

        // Update now playing
        const title = document.getElementById('mp-now-title');
        const channel = document.getElementById('mp-now-channel');
        const link = document.getElementById('mp-yt-link');
        if (title) title.textContent = v.title;
        if (channel) channel.textContent = v.channel;
        if (link) link.href = `https://www.youtube.com/watch?v=${v.id}`;

        // Update FAB
        const fab = document.getElementById('mp-toggle-btn');
        if (fab) fab.classList.add('has-music');

        // Highlight active result
        document.querySelectorAll('.mp-result').forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });
    },

    next: () => {
        if (MusicPlayer._results.length === 0) return;
        const nextIdx = MusicPlayer._currentIdx + 1;
        if (nextIdx < MusicPlayer._results.length) {
            MusicPlayer.playIdx(nextIdx);
        }
    },

    prev: () => {
        if (MusicPlayer._currentIdx > 0) {
            MusicPlayer.playIdx(MusicPlayer._currentIdx - 1);
        }
    },

    // Drag support
    _startDrag: (e) => {
        const mp = document.getElementById('mini-player');
        const rect = mp.getBoundingClientRect();
        const offX = e.clientX - rect.left;
        const offY = e.clientY - rect.top;

        const onMove = (e) => {
            mp.style.left = (e.clientX - offX) + 'px';
            mp.style.top = (e.clientY - offY) + 'px';
            mp.style.right = 'auto';
            mp.style.bottom = 'auto';
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    },

    // Render music-view page content (when clicking sidebar)
    render: () => {
        const container = document.getElementById('music-view');
        if (!container) return;
        container.innerHTML = `
            <div style="width:100%;min-height:calc(100vh - 150px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;">
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#e74c3c,#c0392b);display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 0 40px rgba(231,76,60,0.3);animation:mpPulse 2s infinite;">
                    <i class="fa-solid fa-music" style="color:#fff;font-size:32px;"></i>
                </div>
                <h2 style="color:#fff;margin-bottom:8px;font-size:22px;">YouTube Music Player</h2>
                <p style="color:rgba(255,255,255,0.4);max-width:400px;font-size:14px;line-height:1.6;">
                    Music Player luôn hiển thị ở <b style="color:#e74c3c;">góc dưới phải</b> màn hình.<br>
                    Bấm nút <i class="fa-solid fa-music" style="color:#e74c3c;"></i> để mở player, tìm kiếm và nghe nhạc <b>trên bất kỳ trang nào</b>!
                </p>
                <button onclick="MusicPlayer.toggle()" style="margin-top:24px;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;border:none;cursor:pointer;font-weight:700;font-size:15px;box-shadow:0 6px 25px rgba(231,76,60,0.4);transition:all 0.3s;">
                    <i class="fa-solid fa-headphones" style="margin-right:8px;"></i>Mở Music Player
                </button>
            </div>
        `;

        // Auto-open the mini player
        const mp = document.getElementById('mini-player');
        if (mp && mp.style.display === 'none') {
            MusicPlayer.toggle();
        }
    },

    _fmt: (s) => {
        if (!s || s <= 0) return '';
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }
};

// Auto-init khi page load
document.addEventListener('DOMContentLoaded', () => MusicPlayer.init());
