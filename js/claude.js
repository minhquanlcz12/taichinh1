/**
 * js/claude.js - Claude AI Direct API Integration
 * Cỗ máy AI chuyên sâu phục vụ Content & Kịch bản
 */

const ClaudeModule = {
    state: {
        chatHistory: [],
        isTalking: false
    },

    init: () => {
        console.log("Claude Module initialized");
    },

    getSettings: () => {
        return {
            key: Utils.storage.get('claude_api_key') || '',
            model: Utils.storage.get('claude_api_model') || 'claude-3-haiku-20240307',
            baseUrl: Utils.storage.get('claude_api_base') || 'https://api.anthropic.com'
        };
    },

    // --- API CORE: Gửi yêu cầu đến Anthropic ---
    sendMessage: async (userText, systemPrompt = "You are a helpful assistant for a business management system.", maxTokens = 1024) => {
        const settings = ClaudeModule.getSettings();

        if (!settings.key) {
            Utils.showToast("Sếp chưa nhập Claude API Key trong Cài đặt!", "error");
            app.navigateTo('settings-view');
            return null;
        }

        ClaudeModule.state.isTalking = true;
        
        // Cấu trúc Messages API của Anthropic
        const messages = [...ClaudeModule.state.chatHistory, { role: "user", content: userText }];

        try {
            // LƯU Ý: Browser thường chặn CORS khi gọi thẳng Anthropic API.
            // Sếp cần cài Extension "Allow CORS: Access-Control-Allow-Origin" trên Chrome/Edge để chạy mượt mà.
            const response = await fetch(`${settings.baseUrl}/v1/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": settings.key,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true" 
                },
                body: JSON.stringify({
                    model: settings.model,
                    max_tokens: maxTokens,
                    system: systemPrompt,
                    messages: messages
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData.error ? errorData.error.message : (response.statusText || 'Lỗi không xác định');
                throw new Error(`Anthropic API Error (${response.status}): ${errMsg}`);
            }

            const data = await response.json();
            const aiResponse = data.content[0].text;

            // Lưu vào lịch sử (tạm thời)
            ClaudeModule.state.chatHistory.push({ role: "user", content: userText });
            ClaudeModule.state.chatHistory.push({ role: "assistant", content: aiResponse });

            return aiResponse;

        } catch (e) {
            console.error("Claude API Error:", e);
            if (e.message.includes('Failed to fetch')) {
                Utils.showToast("⚠️ Lỗi kết nối (CORS/Network)! Vui lòng kiểm tra API Base URL hoặc bật Extension 'Allow CORS'.", "warning");
            } else {
                Utils.showToast(e.message, "error");
            }
            return null;
        } finally {
            ClaudeModule.state.isTalking = false;
        }
    },

    // --- UI: Mở cửa sổ Chat ---
    openChat: () => {
        const overlay = document.createElement('div');
        overlay.id = 'claude-chat-overlay';
        overlay.className = 'modal-overlay active';
        overlay.style.zIndex = '10001';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="glass-card" style="width: 90%; max-width: 600px; height: 80vh; display: flex; flex-direction: column; padding: 0; overflow: hidden; border: 1px solid var(--primary); box-shadow: 0 0 30px rgba(0,240,255,0.2);">
                <!-- Header -->
                <div style="padding: 16px 20px; background: rgba(0,240,255,0.1); border-bottom: 1px solid rgba(0,240,255,0.2); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d4/Anthropic_logo.svg" style="width: 20px;">
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 16px; color: #fff;">Claude AI Chatbot</h3>
                            <span style="font-size: 10px; color: var(--success);"><i class="fa-solid fa-circle" style="font-size: 8px;"></i> Direct API Connected</span>
                        </div>
                    </div>
                    <button class="btn btn-text" onclick="document.getElementById('claude-chat-overlay').remove()"><i class="fa-solid fa-times"></i></button>
                </div>

                <!-- Chat Body -->
                <div id="claude-chat-body" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: rgba(0,0,0,0.2);">
                    <div style="align-self: flex-start; max-width: 80%; background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 4px 16px 16px 16px; font-size: 14px; color: #e2e8f0; line-height: 1.5; border: 1px solid rgba(255,255,255,0.1);">
                        Chào sếp! Tôi là Claude, chuyên gia về ngôn ngữ và kịch bản. Tôi có thể giúp gì cho sếp hôm nay?
                    </div>
                </div>

                <!-- Input Area -->
                <div style="padding: 20px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; gap: 10px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 4px 4px 4px 16px; border: 1px solid rgba(255,255,255,0.1);">
                        <input type="text" id="claude-user-input" placeholder="Nhập tin nhắn..." style="flex: 1; background: transparent; border: none; color: #fff; outline: none; font-size: 14px;" onkeypress="if(event.key === 'Enter') ClaudeModule.handleUserSubmit()">
                        <button class="btn btn-primary" id="claude-send-btn" onclick="ClaudeModule.handleUserSubmit()" style="border-radius: 10px; width: 44px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                    <p style="font-size: 10px; color: var(--text-secondary); margin: 8px 0 0 4px;">Sử dụng model: <span style="color: var(--warning);">${Utils.storage.get('claude_api_model') || 'Claude 3 Haiku'}</span></p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('claude-user-input').focus();
    },

    handleUserSubmit: async () => {
        const input = document.getElementById('claude-user-input');
        const text = input.value.trim();
        if (!text || ClaudeModule.state.isTalking) return;

        input.value = '';
        ClaudeModule.appendMessage('user', text);

        // Show loading
        const loadingId = 'ai-loading-' + Date.now();
        ClaudeModule.appendMessage('assistant', '<i class="fa-solid fa-spinner fa-spin"></i> Claude đang suy nghĩ...', loadingId);

        const aiResponse = await ClaudeModule.sendMessage(text);
        
        // Remove loading
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.parentElement.remove();

        if (aiResponse) {
            ClaudeModule.appendMessage('assistant', aiResponse);
        }
    },

    appendMessage: (role, text, id = null) => {
        const body = document.getElementById('claude-chat-body');
        if (!body) return;

        const isUser = role === 'user';
        const msgWrapper = document.createElement('div');
        msgWrapper.style.cssText = `display: flex; flex-direction: column; gap: 4px; align-self: ${isUser ? 'flex-end' : 'flex-start'}; max-width: 85%;`;

        const bubble = document.createElement('div');
        bubble.id = id || '';
        bubble.style.cssText = `
            padding: 12px 16px; 
            border-radius: ${isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px'}; 
            font-size: 14px; 
            line-height: 1.5; 
            ${isUser ? 'background: linear-gradient(135deg, var(--primary), #a855f7); color: #fff; border: none;' : 'background: rgba(255,255,255,0.05); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1);'}
            word-wrap: break-word;
            white-space: pre-wrap;
        `;
        bubble.textContent = text;
        if (!isUser && !id) {
            // Render markdown-ish or formatting if basic
            bubble.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        }

        msgWrapper.appendChild(bubble);
        body.appendChild(msgWrapper);
        body.scrollTop = body.scrollHeight;
    },

    // --- AI ASSIST: Viết nội dung cho Task ---
    assistTaskContent: async (taskId) => {
        const tasks = WorkModule.data.tasks || [];
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const confirmAssist = await Utils.showConfirm(
            "🪄 AI Assist", 
            `Claude sẽ viết kịch bản nội dung cho dự án "<b>${task.project}</b>" dựa trên mục tiêu "<b>${task.mucTieu}</b>". Sếp đồng ý chứ?`,
            "Đồng ý, nhờ Claude!",
            "Thôi, tự viết"
        );
        if (!confirmAssist) return;

        const systemPrompt = "Bạn là một chuyên gia sáng tạo nội dung mạng xã hội và kịch bản video. Hãy viết nội dung thật hấp dẫn, chuyên nghiệp và tối ưu cho Facebook/TikTok.";
        const userPrompt = `Hãy viết một kịch bản chi tiết hoặc bài viết Facebook mẫu cho nhiệm vụ sau:\n\nDự án: ${task.project}\nMục tiêu: ${task.mucTieu}\nChủ đề: ${task.trucot || 'Chưa rõ'}\nĐịnh dạng: ${task.dinhdang || 'Chưa rõ'}\n\nYêu cầu: Viết tiếng Việt, văn phong hiện đại, có các hashtag phù hợp.`;

        Utils.showToast("Claude đang soạn thảo kịch bản...", "info");
        const aiResult = await ClaudeModule.sendMessage(userPrompt, systemPrompt);

        if (aiResult) {
            // Hiển thị kết quả vào modal đặc biệt
            Utils.showModal(
                '🎨 KỊCH BẢN ĐỀ XUẤT TỪ CLAUDE',
                `
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; border: 1px solid var(--primary); max-height: 400px; overflow-y: auto;">
                    <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${aiResult}</div>
                </div>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 12px; font-style: italic;">* Sếp có thể copy nội dung này vào phần Chi tiết Task.</p>
                `,
                () => {
                    // Copy to clipboard or set to task?
                    navigator.clipboard.writeText(aiResult);
                    Utils.showToast("Đã copy kịch bản vào bộ nhớ đệm!", "success");
                    return true;
                },
                'COPY & ĐÓNG'
            );
        }
    }
};
