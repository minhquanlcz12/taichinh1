/**
 * MusicPlayer — Curated embeddable YouTube music library
 * Pre-loaded with verified embeddable videos by genre
 */
const MusicPlayer = {
    _rendered: false,
    _catalog: {
        '🇻🇳 Nam Em': [
            { id: 'QDR-9wgkeu0', title: 'Áng Mây Sẽ Nở Hoa', channel: 'Nam Em Official' },
            { id: 'QAxWxbZO_n4', title: 'Giá Như Cha Còn Ở Trên Đời', channel: 'Nam Em Official' },
            { id: '9FDdozo3dLs', title: 'Ngày Mai Em Đi Mất', channel: 'Nam Em Official' },
            { id: 'NHnynJKDS6w', title: 'Live Session M\' 1975 [Full Show]', channel: 'Nam Em Official' },
            { id: 'J8oO3ygSvuM', title: 'Live Bùng Nổ Cảm Xúc (Hắc Nguyệt Quang)', channel: 'Nam Em Official' },
            { id: 'KZxT_Kv2l00', title: 'Đơn Phương (Cover)', channel: 'Nam Em Official' },
        ],
        '🇻🇳 Chu Thúy Quỳnh': [
            { id: '5QmxIW-YWa0', title: 'Ít Nhưng Dài Lâu (ft. Yan Nguyễn)', channel: 'Chu Thúy Quỳnh' },
            { id: 'kVG9XjbX1Ig', title: 'Thương Ly Biệt', channel: 'Chu Thúy Quỳnh' },
            { id: 'fIS81oY1aZ8', title: 'Xem Như Em Chẳng May', channel: 'Chu Thúy Quỳnh' },
            { id: 'djyPhWBEEgQ', title: 'Yêu 3 Năm Dại 1 Giờ', channel: 'Chu Thúy Quỳnh' },
            { id: 'd4a34dd8VeQ', title: 'Thằng Hầu (ft. Nhật Phong)', channel: 'Chu Thúy Quỳnh' },
        ],
        '🇻🇳 Sơn Tùng M-TP': [
            { id: 'abPmZCZZrFA', title: 'Đừng Làm Trái Tim Anh Đau', channel: 'Sơn Tùng M-TP' },
            { id: 'psZ1g9fMfeo', title: 'Chúng Ta Của Hiện Tại', channel: 'Sơn Tùng M-TP' },
            { id: 'Llw9Q6akRo4', title: 'Lạc Trôi', channel: 'Sơn Tùng M-TP' },
            { id: 'FN7ALfpGxiI', title: 'Nơi Này Có Anh', channel: 'Sơn Tùng M-TP' },
            { id: 'knW7-x7Y7RE', title: 'Hãy Trao Cho Anh (ft. Snoop Dogg)', channel: 'Sơn Tùng M-TP' },
        ],
        '🇻🇳 V-Pop Hot': [
            { id: 'JAhdeizXpaQ', title: 'Để Mị Nói Cho Mà Nghe', channel: 'Hoàng Thùy Linh' },
            { id: 'gJHSDZfJrRY', title: 'See Tình', channel: 'Hoàng Thùy Linh' },
            { id: 'Q6ZNsHvspEg', title: 'Gieo Quẻ (ft. ĐEN)', channel: 'Hoàng Thùy Linh' },
            { id: 'kJQP7kiw5Fk', title: 'Despacito (Vietnamese Fav)', channel: 'Luis Fonsi' },
            { id: 'RgKAFK5djSk', title: 'See You Again', channel: 'Wiz Khalifa' },
        ],
        '🎧 Lofi & Chill': [
            { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio 📚', channel: 'Lofi Girl', live: true },
            { id: 'rUxyKA_-grg', title: 'Lofi Sleep/Chill Radio 🌙', channel: 'Lofi Girl', live: true },
            { id: '4oStw0r33so', title: '3 Hour Lofi Mix', channel: 'Lofi Girl' },
        ],
        '🎹 Nhạc Không Lời': [
            { id: 'lE6RYpe9IT0', title: 'Relaxing Sleep Music', channel: 'Soothing Relaxation' },
            { id: '2OEL4P1Rz04', title: 'Peaceful Piano', channel: 'Soothing Relaxation' },
            { id: 'qYnA9wWFHLI', title: 'Morning Positive Energy', channel: 'OCB Relax Music' },
        ],
        '🎵 EDM & NCS': [
            { id: 'bM7SZ5SBzyY', title: 'Alan Walker - Faded', channel: 'Alan Walker' },
            { id: 'n1WpP7iowLc', title: 'Elektronomia - Sky High', channel: 'NCS' },
            { id: '36YnV9STBqc', title: 'Top 50 NCS Songs', channel: 'NCS' },
        ],
        '🇰🇷 K-Pop': [
            { id: '9bZkp7q19f0', title: 'PSY - Gangnam Style', channel: 'PSY' },
            { id: 'gdZLi9oWNZg', title: 'BTS - Dynamite', channel: 'BTS' },
            { id: 'IHNzOHi8sJs', title: 'BLACKPINK - How You Like That', channel: 'BLACKPINK' },
            { id: 'UBURTj20HXI', title: 'NewJeans - Super Shy', channel: 'HYBE' },
        ],
        '🌍 Pop Quốc Tế': [
            { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You', channel: 'Ed Sheeran' },
            { id: 'CevxZvSJLk8', title: 'Katy Perry - Roar', channel: 'Katy Perry' },
            { id: '09R8_2nJtjg', title: 'Maroon 5 - Sugar', channel: 'Maroon 5' },
        ],
        '🎻 Classical': [
            { id: 'VBmaJFPrRak', title: 'Bach — Best Of', channel: 'HALIDONMUSIC' },
            { id: 'g1uLrHq9TDg', title: 'Chopin — Classical Piano', channel: 'HALIDONMUSIC' },
            { id: 'sPlhKP0nZII', title: 'Beethoven — Moonlight Sonata', channel: 'Rousseau' },
        ],
        '🎷 Jazz': [
            { id: 'neV3EPgvZ3g', title: 'Jazz Relaxing Music ☕', channel: 'Cafe Music BGM' },
            { id: 'fEvM-OUbaKs', title: 'Night Jazz Lounge', channel: 'Jazz Lounge' },
            { id: 'Dx5qFachd3A', title: 'Smooth Jazz', channel: 'Dr. SaxLove' },
        ],
    },
    _currentCat: null,
    _results: [],
    _currentIdx: -1,

    render: () => {
        if (MusicPlayer._rendered) return;
        MusicPlayer._rendered = true;

        const container = document.getElementById('music-view');
        if (!container) return;

        const cats = Object.keys(MusicPlayer._catalog);

        container.innerHTML = `
            <div style="width:100%; min-height:calc(100vh - 100px); background:linear-gradient(160deg,#0a0a1a 0%,#111 100%); border-radius:14px; overflow:hidden; border:1px solid rgba(231,76,60,0.12);">
                <div style="display:grid; grid-template-columns:1fr 320px; min-height:calc(100vh - 100px);" id="mp-grid">

                    <!-- LEFT: Player -->
                    <div style="padding:20px; display:flex; flex-direction:column;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <i class="fa-brands fa-youtube" style="color:#e74c3c;font-size:24px;"></i>
                            <h3 style="color:#fff;margin:0;font-size:17px;font-weight:700;">YouTube Music</h3>
                            <span style="color:rgba(255,255,255,0.2);font-size:11px;">• Thư viện nhạc tích hợp</span>
                        </div>

                        <!-- YouTube Player -->
                        <div id="yt-player-wrap" style="width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,0.06);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
                            <iframe id="yt-player" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0" style="width:100%;height:100%;border:none;" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>
                        </div>

                        <!-- Now Playing Controls -->
                        <div style="margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.15);">
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                                <div style="min-width:0;flex:1;">
                                    <p style="color:#fff;font-size:13px;font-weight:600;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="yt-now-title">Lofi Hip Hop Radio 📚</p>
                                    <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:2px 0 0;" id="yt-now-channel">Lofi Girl • Chọn thể loại bên phải để nghe</p>
                                </div>
                                <div style="display:flex;gap:6px;flex-shrink:0;">
                                    <button onclick="MusicPlayer.prev()" title="Bài trước" style="width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;font-size:13px;">
                                        <i class="fa-solid fa-backward-step"></i>
                                    </button>
                                    <button onclick="MusicPlayer.next()" title="Bài tiếp" style="width:34px;height:34px;border-radius:50%;border:1px solid rgba(231,76,60,0.4);background:rgba(231,76,60,0.15);color:#e74c3c;cursor:pointer;font-size:13px;">
                                        <i class="fa-solid fa-forward-step"></i>
                                    </button>
                                    <a id="yt-open-link" href="https://www.youtube.com/watch?v=jfKfPfyJRdk" target="_blank" title="Mở YouTube" style="width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:13px;">
                                        <i class="fa-solid fa-up-right-from-square"></i>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Search (optional) -->
                        <div style="margin-top:14px;display:flex;gap:8px;">
                            <input id="yt-search" type="text" placeholder="🔍 Tìm thêm trên YouTube..." style="flex:1;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#fff;font-size:13px;outline:none;" onfocus="this.style.borderColor='#e74c3c'" onblur="this.style.borderColor='rgba(255,255,255,0.08)'">
                            <button onclick="MusicPlayer.search()" id="yt-search-btn" style="padding:10px 14px;border-radius:10px;background:rgba(231,76,60,0.8);color:#fff;border:none;cursor:pointer;font-weight:700;font-size:12px;">
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </button>
                        </div>

                        <!-- Search Results (hidden until search) -->
                        <div id="yt-results" style="margin-top:10px;flex:1;overflow-y:auto;display:none;"></div>
                    </div>

                    <!-- RIGHT: Music Library Sidebar -->
                    <div style="background:rgba(0,0,0,0.3);border-left:1px solid rgba(255,255,255,0.05);padding:0;overflow-y:auto;">
                        <div style="padding:14px 14px 6px;position:sticky;top:0;background:rgba(10,10,26,0.97);z-index:2;">
                            <h4 style="color:#e74c3c;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0;">
                                <i class="fa-solid fa-music" style="margin-right:5px;"></i>Thư viện nhạc
                            </h4>
                        </div>
                        <div id="yt-library" style="padding:0 10px 14px;">
                            ${cats.map(cat => `
                                <div style="margin-bottom:4px;">
                                    <button class="yt-cat-btn" onclick="MusicPlayer.toggleCat('${cat}')" style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;border:none;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.7);cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s;display:flex;align-items:center;justify-content:space-between;">
                                        <span>${cat} <span style="color:rgba(255,255,255,0.2);font-weight:400;font-size:11px;">(${MusicPlayer._catalog[cat].length})</span></span>
                                        <i class="fa-solid fa-chevron-down" style="font-size:10px;opacity:0.3;transition:transform 0.2s;" id="cat-arrow-${cat.replace(/[^a-zA-Z]/g,'')}"></i>
                                    </button>
                                    <div id="cat-list-${cat.replace(/[^a-zA-Z]/g,'')}" style="display:none;padding:4px 0 4px 8px;">
                                        ${MusicPlayer._catalog[cat].map((v, i) => `
                                            <div class="yt-lib-item" onclick="MusicPlayer.playCat('${cat}',${i})" style="display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:6px;cursor:pointer;transition:all 0.2s;border-left:2px solid transparent;">
                                                <img src="https://i.ytimg.com/vi/${v.id}/default.jpg" style="width:40px;height:30px;border-radius:3px;object-fit:cover;background:#222;flex-shrink:0;">
                                                <div style="min-width:0;flex:1;">
                                                    <div style="color:#fff;font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
                                                    <div style="color:rgba(255,255,255,0.25);font-size:10px;">${v.channel}${v.live ? ' • 🔴 LIVE' : ''}</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .yt-cat-btn:hover{background:rgba(231,76,60,0.1)!important;color:#e74c3c!important;}
                .yt-lib-item:hover{background:rgba(231,76,60,0.1)!important;border-left-color:#e74c3c!important;}
                .yt-lib-item.active{background:rgba(231,76,60,0.12)!important;border-left-color:#e74c3c!important;}
                .yt-result-card:hover{background:rgba(231,76,60,0.08)!important;}
                @media(max-width:900px){#mp-grid{grid-template-columns:1fr!important;}}
            </style>
        `;

        document.getElementById('yt-search').addEventListener('keydown', e => {
            if (e.key === 'Enter') MusicPlayer.search();
        });

        // Auto-mở category đầu tiên
        MusicPlayer.toggleCat(cats[0]);
    },

    toggleCat: (cat) => {
        const key = cat.replace(/[^a-zA-Z]/g, '');
        const list = document.getElementById('cat-list-' + key);
        const arrow = document.getElementById('cat-arrow-' + key);
        if (!list) return;

        const isOpen = list.style.display !== 'none';
        list.style.display = isOpen ? 'none' : 'block';
        if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
    },

    playCat: (cat, idx) => {
        const videos = MusicPlayer._catalog[cat];
        if (!videos || !videos[idx]) return;
        MusicPlayer._results = videos;
        MusicPlayer._currentIdx = idx;
        MusicPlayer._currentCat = cat;

        const v = videos[idx];
        document.getElementById('yt-player').src = `https://www.youtube.com/embed/${v.id}?autoplay=1`;
        document.getElementById('yt-now-title').textContent = v.title;
        document.getElementById('yt-now-channel').textContent = `${v.channel} • ${cat}`;
        document.getElementById('yt-open-link').href = `https://www.youtube.com/watch?v=${v.id}`;

        // Highlight
        document.querySelectorAll('.yt-lib-item').forEach(el => el.classList.remove('active'));
        const key = cat.replace(/[^a-zA-Z]/g, '');
        const items = document.getElementById('cat-list-' + key)?.querySelectorAll('.yt-lib-item');
        if (items && items[idx]) items[idx].classList.add('active');

        document.getElementById('yt-player-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    next: () => {
        if (MusicPlayer._results.length === 0) return;
        let nextIdx = MusicPlayer._currentIdx + 1;
        if (nextIdx >= MusicPlayer._results.length) nextIdx = 0; // Loop
        if (MusicPlayer._currentCat) {
            MusicPlayer.playCat(MusicPlayer._currentCat, nextIdx);
        }
    },

    prev: () => {
        if (MusicPlayer._results.length === 0) return;
        let prevIdx = MusicPlayer._currentIdx - 1;
        if (prevIdx < 0) prevIdx = MusicPlayer._results.length - 1; // Loop
        if (MusicPlayer._currentCat) {
            MusicPlayer.playCat(MusicPlayer._currentCat, prevIdx);
        }
    },

    // Optional search for finding more videos
    _apis: [
        'https://pipedapi.kavin.rocks',
        'https://inv.nadeko.net',
    ],

    search: () => {
        const q = document.getElementById('yt-search').value.trim();
        if (!q) return;
        MusicPlayer._doSearch(q);
    },

    _doSearch: async (query) => {
        const btn = document.getElementById('yt-search-btn');
        const rd = document.getElementById('yt-results');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;
        rd.style.display = 'block';
        rd.innerHTML = '<p style="color:rgba(255,255,255,0.3);text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tìm...</p>';

        let videos = null;
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
                    videos = data.items.filter(v => v.type === 'stream' && v.duration > 0).slice(0, 10).map(v => ({
                        id: v.url ? v.url.replace('/watch?v=', '') : '',
                        title: v.title || '', channel: v.uploaderName || '',
                        duration: v.duration || 0,
                    }));
                } else if (!isPiped && Array.isArray(data)) {
                    videos = data.filter(v => v.type === 'video').slice(0, 10).map(v => ({
                        id: v.videoId, title: v.title || '', channel: v.author || '',
                        duration: v.lengthSeconds || 0,
                    }));
                }
                if (videos) videos = videos.filter(v => v.id && v.id.length === 11);
                if (videos && videos.length > 0) break;
            } catch(e) { continue; }
        }

        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
        btn.disabled = false;

        if (!videos || videos.length === 0) {
            rd.innerHTML = '<p style="color:rgba(255,255,255,0.3);text-align:center;padding:20px;">Không tìm thấy</p>';
            return;
        }

        rd.innerHTML = videos.map((v, i) => `
            <div class="yt-result-card" onclick="MusicPlayer._playSearch(${i})" style="display:flex;gap:8px;padding:7px;border-radius:8px;cursor:pointer;transition:all 0.2s;margin-bottom:4px;">
                <img src="https://i.ytimg.com/vi/${v.id}/default.jpg" style="width:60px;height:34px;border-radius:4px;object-fit:cover;background:#222;">
                <div style="min-width:0;flex:1;">
                    <div style="color:#fff;font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
                    <div style="color:rgba(255,255,255,0.3);font-size:10px;">${v.channel}</div>
                </div>
            </div>
        `).join('');

        MusicPlayer._searchResults = videos;
    },

    _searchResults: [],
    _playSearch: (idx) => {
        const v = MusicPlayer._searchResults[idx];
        if (!v) return;
        document.getElementById('yt-player').src = `https://www.youtube.com/embed/${v.id}?autoplay=1`;
        document.getElementById('yt-now-title').textContent = v.title;
        document.getElementById('yt-now-channel').textContent = v.channel;
        document.getElementById('yt-open-link').href = `https://www.youtube.com/watch?v=${v.id}`;
    },
};
