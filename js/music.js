const MusicPlayer = {
    render: () => {
        const container = document.getElementById('music-view');
        if (!container) return;

        container.innerHTML = `
            <div id="music-player-app" style="width:100%; min-height: calc(100vh - 100px); background: linear-gradient(160deg, #0d001a 0%, #1a0533 40%, #0a0a2e 100%); border-radius: 16px; border: 1px solid rgba(148,0,211,0.15); padding: 24px; position: relative; overflow: hidden;">
                <!-- Glow BGs -->
                <div style="position:absolute; width:400px; height:400px; background:radial-gradient(circle, rgba(155,89,182,0.08), transparent 70%); top:-100px; right:-100px; pointer-events:none;"></div>
                <div style="position:absolute; width:300px; height:300px; background:radial-gradient(circle, rgba(231,76,60,0.06), transparent 70%); bottom:-80px; left:-60px; pointer-events:none;"></div>

                <div style="display:grid; grid-template-columns: 1fr 300px; gap: 24px; position:relative; z-index:1;">
                    <!-- LEFT: Video Player -->
                    <div>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#9b59b6,#e74c3c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(155,89,182,0.4);animation:musicPulse 2s ease-in-out infinite;">
                                <i class="fa-solid fa-headphones" style="color:#fff;font-size:18px;"></i>
                            </div>
                            <div>
                                <h3 style="color:#fff; margin:0; font-size:18px; font-weight:700;">Music Player</h3>
                                <p style="color:rgba(255,255,255,0.4); margin:0; font-size:12px;">Nghe nhạc ngay trong ứng dụng • YouTube</p>
                            </div>
                        </div>

                        <!-- YouTube Embed -->
                        <div style="width:100%; aspect-ratio:16/9; border-radius:12px; overflow:hidden; border:1px solid rgba(155,89,182,0.3); box-shadow: 0 8px 40px rgba(0,0,0,0.6); background:#000;">
                            <iframe id="yt-player" src="https://www.youtube.com/embed/videoseries?list=PLcnJPEBp0mhGH0M5gHnHAGXVI8VLqYObE&autoplay=0" style="width:100%; height:100%; border:none;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
                        </div>

                        <!-- URL Input -->
                        <div style="margin-top:16px; display:flex; gap:8px;">
                            <input id="yt-url-input" type="text" placeholder="Dán link YouTube hoặc nhập tên bài hát..." style="flex:1; padding:12px 16px; border-radius:10px; border:1px solid rgba(155,89,182,0.3); background:rgba(255,255,255,0.05); color:#fff; font-size:14px; outline:none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#9b59b6'" onblur="this.style.borderColor='rgba(155,89,182,0.3)'">
                            <button onclick="MusicPlayer.playFromInput()" style="padding:12px 20px; border-radius:10px; background:linear-gradient(135deg,#9b59b6,#8e44ad); color:#fff; border:none; cursor:pointer; font-weight:700; font-size:14px; white-space:nowrap; transition:all 0.3s; box-shadow:0 4px 15px rgba(155,89,182,0.3);">
                                <i class="fa-solid fa-play" style="margin-right:6px;"></i>Phát
                            </button>
                        </div>
                        <p style="color:rgba(255,255,255,0.25); font-size:11px; margin-top:6px;">
                            <i class="fa-solid fa-lightbulb" style="margin-right:4px; color:#f1c40f;"></i>
                            Dán link YouTube, youtu.be, hoặc gõ tên bài hát rồi bấm Phát
                        </p>
                    </div>

                    <!-- RIGHT: Playlist Sidebar -->
                    <div style="display:flex; flex-direction:column; gap:10px; max-height: calc(100vh - 160px); overflow-y:auto; padding-right:4px;">
                        <h4 style="color:#9b59b6; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 4px 0; position:sticky; top:0; background:rgba(13,0,26,0.95); padding:8px 0; z-index:2;">
                            <i class="fa-solid fa-fire" style="margin-right:6px;"></i>Playlist nổi bật
                        </h4>

                        ${MusicPlayer.renderPlaylistCard('PLcnJPEBp0mhGH0M5gHnHAGXVI8VLqYObE', 'Lofi Chill Vietnam', 'Nhạc lofi thư giãn làm việc', 'fa-cloud-moon', '#9b59b6', '#6c3483')}
                        ${MusicPlayer.renderPlaylistCard('PLlRTR3bEAkxF1lCnwnNeUlRQiQjMNrMvl', 'V-Pop Hot', 'Nhạc Việt thịnh hành nhất', 'fa-heart', '#e74c3c', '#c0392b')}
                        ${MusicPlayer.renderPlaylistCard('PLRqwX-V8ieTawOSMNI-ycZzEz7r5r17R4', 'Acoustic Cover', 'Bản cover nhẹ nhàng hay nhất', 'fa-guitar', '#3498db', '#2980b9')}
                        ${MusicPlayer.renderPlaylistCard('PLw-VjHDlEOguJTfRmsa0UNSTV_FGP-0pAS', 'EDM / Remix', 'Nhạc sàn, remix sôi động', 'fa-bolt', '#f39c12', '#e67e22')}
                        ${MusicPlayer.renderPlaylistCard('PLkqz3S84Tw-T1LMwNTpJjXhXBzNoET53q', 'Nhạc Trịnh', 'Trịnh Công Sơn bất hủ', 'fa-leaf', '#2ecc71', '#27ae60')}
                        ${MusicPlayer.renderPlaylistCard('PLx0sYbCqOb8TBPRdmBHs0IfTg_YnmNCNI', 'US-UK Top Hits', 'Billboard, Pop quốc tế', 'fa-globe', '#95a5a6', '#7f8c8d')}
                        ${MusicPlayer.renderPlaylistCard('PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i', 'Rap Việt', 'Rap Việt, Hip-hop hay nhất', 'fa-microphone', '#e67e22', '#d35400')}
                        ${MusicPlayer.renderPlaylistCard('PLDIoUOhQQPlXr63I_vwF9GD8sAKh77dWU', 'Ballad Việt', 'Nhạc trữ tình, ballad buồn', 'fa-moon', '#1abc9c', '#16a085')}
                    </div>
                </div>
            </div>

            <style>
                @keyframes musicPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(155,89,182,0.4); }
                    50% { box-shadow: 0 0 35px rgba(155,89,182,0.6), 0 0 60px rgba(155,89,182,0.15); }
                }
                .music-pl-card:hover {
                    transform: translateX(4px);
                    border-color: #9b59b6 !important;
                    background: rgba(155,89,182,0.12) !important;
                }
                @media (max-width: 900px) {
                    #music-player-app > div { grid-template-columns: 1fr !important; }
                }
            </style>
        `;

        // Enter key listener
        const ytInput = document.getElementById('yt-url-input');
        if (ytInput) ytInput.addEventListener('keydown', e => { if (e.key === 'Enter') MusicPlayer.playFromInput(); });
    },

    renderPlaylistCard: (id, title, subtitle, icon, color1, color2) => {
        return `
            <div class="music-pl-card" onclick="MusicPlayer.loadPlaylist('${id}')" style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); cursor:pointer; transition:all 0.3s;">
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

    playFromInput: () => {
        const input = document.getElementById('yt-url-input').value.trim();
        if (!input) return;
        const videoId = MusicPlayer.extractVideoId(input);
        if (videoId) {
            document.getElementById('yt-player').src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        } else {
            // Treat as search — use YouTube's embedded search (may be limited)
            document.getElementById('yt-player').src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(input)}&autoplay=1`;
        }
    },

    loadPlaylist: (playlistId) => {
        document.getElementById('yt-player').src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`;
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
