/**
 * AttendanceMusic — Background ambient music for the attendance section
 * Streams from YouTube (5FCcXCchXDk) but hidden
 */
const AttendanceMusic = {
    _player: null,
    _enabled: false,
    _initialized: false,
    _videoId: '5FCcXCchXDk',
    _startTime: 0,
    _endTime: 300, // 5 minutes

    init: () => {
        if (AttendanceMusic._initialized) return;
        AttendanceMusic._initialized = true;

        // Create a hidden container for the YT player
        const container = document.createElement('div');
        container.id = 'wf-music-container';
        container.style.position = 'absolute';
        container.style.width = '1px';
        container.style.height = '1px';
        container.style.left = '-9999px';
        container.innerHTML = `<div id="wf-yt-player"></div>`;
        document.body.appendChild(container);

        // Load YouTube IFrame API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Initialize enabled state from storage
        AttendanceMusic._enabled = Utils.storage.get('wf_ambient_enabled', false);
    },

    onYouTubeIframeAPIReady: () => {
        AttendanceMusic._player = new YT.Player('wf-yt-player', {
            height: '0',
            width: '0',
            videoId: AttendanceMusic._videoId,
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'modestbranding': 1,
                'rel': 0,
                'showinfo': 0,
                'start': AttendanceMusic._startTime,
                'end': AttendanceMusic._endTime,
                'loop': 1,
                'playlist': AttendanceMusic._videoId
            },
            events: {
                'onReady': AttendanceMusic._onPlayerReady,
                'onStateChange': AttendanceMusic._onPlayerStateChange
            }
        });
    },

    _onPlayerReady: (event) => {
        console.log('Attendance Ambient Music Ready');
        // If we are already on the attendance view and enabled, play
        if (app.state.currentView === 'attendance-view' && AttendanceMusic._enabled) {
            AttendanceMusic.play();
        }
    },

    _onPlayerStateChange: (event) => {
        // If video ends, restart from startTime
        if (event.data === YT.PlayerState.ENDED) {
            AttendanceMusic._player.seekTo(AttendanceMusic._startTime);
            AttendanceMusic._player.playVideo();
        }
    },

    play: () => {
        if (AttendanceMusic._player && AttendanceMusic._player.playVideo) {
            AttendanceMusic._player.playVideo();
        }
    },

    pause: () => {
        if (AttendanceMusic._player && AttendanceMusic._player.pauseVideo) {
            AttendanceMusic._player.pauseVideo();
        }
    },

    toggle: (state) => {
        AttendanceMusic._enabled = state;
        Utils.storage.set('wf_ambient_enabled', state);
        if (state) {
            if (app.state.currentView === 'attendance-view') AttendanceMusic.play();
        } else {
            AttendanceMusic.pause();
        }
    },

    updateTabState: (viewId) => {
        if (viewId === 'attendance-view') {
            if (AttendanceMusic._enabled) AttendanceMusic.play();
        } else {
            AttendanceMusic.pause();
        }
    }
};

// Global YT function hook
window.onYouTubeIframeAPIReady = () => {
    // Check if MusicPlayer or AttendanceMusic wants it
    if (typeof MusicPlayer !== 'undefined' && MusicPlayer.onYouTubeIframeAPIReady) MusicPlayer.onYouTubeIframeAPIReady();
    if (AttendanceMusic.onYouTubeIframeAPIReady) AttendanceMusic.onYouTubeIframeAPIReady();
};
