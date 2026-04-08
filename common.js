// ==============================================
// 1. 核心配置区
// ==============================================
const AI_CONFIG = {
    // 讯飞星火语音识别配置（第一步申请的3个参数）
    xunfei: {
        appId: "***",
        apiKey: "***",
        apiSecret: "***"
    },
    // 豆包OpenAI配置
    openai: {
        apiKey: "***", // 填OpenAI后台获取的密钥
        endpoint: "https://api.openai.com/v1/chat/completions", // 官方Chat接口地址，无代理可换国内中转地址
        model: "gpt-3.5-turbo" // 用gpt-3.5-turbo/gpt-4o-mini，成本低响应快
    }
};

// 全局变量
let isListening = false; // 录音状态
let currentLanguage = "zh_cn"; // 当前语言：zh_cn=普通话，sichuanhua=四川话
let audioContext = null; // 音频上下文
let mediaRecorder = null; // 录音器
let audioData = []; // 音频数据

// ==============================================
// 2. 原有项目公共逻辑（完全保留，兼容原有代码）
// ==============================================
// 移动端汉堡菜单通用逻辑
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    const navContainer = document.querySelector('.nav-container');

    if (navToggle && navMenu && navContainer) {
        const mobileMenu = document.createElement('ul');
        mobileMenu.className = 'nav-menu-mobile';
        mobileMenu.innerHTML = navMenu.innerHTML;
        navContainer.appendChild(mobileMenu);
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }

    // 返回顶部按钮通用逻辑
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.style.display = window.scrollY > 300 ? 'block' : 'none';
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 图片预览弹窗通用函数
    window.openImageModal = function(imgSrc) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImg');
        if (modal && modalImg) {
            modalImg.src = imgSrc;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
    window.closeImageModal = function() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === this) closeImageModal();
        });
    }
});

// 登录状态展示与退出按钮通用逻辑
window.addEventListener('DOMContentLoaded', function() {
    const isLogin = localStorage.getItem('is_login') === 'true';
    const currentUser = localStorage.getItem('current_user');
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const pagePath = window.location.pathname;

    // 排除登录/注册/忘记密码页面，不执行导航控制
    const excludePages = ['login.html', 'register.html', 'forgot-password.html'];
    const isExcludePage = excludePages.some(page => pagePath.includes(page));

    if (!isExcludePage) {
        // 获取所有导航元素
        const loginNavItem = document.getElementById('loginNavItem');
        const profileNavItem = document.getElementById('profileNavItem');
        const adminNavItem = document.getElementById('adminNavItem');
        const noticeNavItem = document.getElementById('noticeNavItem');
        const logoutNavItem = document.getElementById('logoutNavItem');
        const logoutBtn = document.getElementById('logoutBtn');

        // 登录状态判断
        if (isLogin && currentUser) {
            // 管理员登录逻辑
            if (isAdmin) {
                loginNavItem && (loginNavItem.style.display = 'none');
                profileNavItem && (profileNavItem.style.display = 'none');
                adminNavItem && (adminNavItem.style.display = 'block');
                noticeNavItem && (noticeNavItem.style.display = 'none');
                logoutNavItem && (logoutNavItem.style.display = 'block');
            }
            // 普通用户登录逻辑
            else {
                loginNavItem && (loginNavItem.style.display = 'none');
                profileNavItem && (profileNavItem.style.display = 'block');
                adminNavItem && (adminNavItem.style.display = 'none');
                noticeNavItem && (noticeNavItem.style.display = 'block');
                logoutNavItem && (logoutNavItem.style.display = 'block');
                // 更新消息小红点
                updateNoticeBadge();
            }

            // 退出登录按钮统一逻辑
            if (logoutBtn) {
                logoutBtn.onclick = function() {
                    if (confirm('确定要退出登录吗？')) {
                        localStorage.removeItem('is_login');
                        localStorage.removeItem('current_user');
                        localStorage.removeItem('is_admin');
                        window.location.href = 'index.html';
                    }
                };
            }
        }
        // 未登录逻辑
        else {
            loginNavItem && (loginNavItem.style.display = 'block');
            profileNavItem && (profileNavItem.style.display = 'none');
            adminNavItem && (adminNavItem.style.display = 'none');
            noticeNavItem && (noticeNavItem.style.display = 'none');
            logoutNavItem && (logoutNavItem.style.display = 'none');
        }
    }
});

// 通用清除错误提示函数
window.clearErrors = function() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => error.classList.remove('show'));
};

// 通用显示错误提示+抖动动画函数
window.showError = function(inputId, message) {
    const errorElement = document.getElementById(inputId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    const input = document.getElementById(inputId);
    if (input) {
        input.style.animation = 'none';
        setTimeout(() => input.style.animation = 'shake 0.5s ease', 10);
        input.focus();
        if (!document.getElementById('shakeStyle')) {
            const style = document.createElement('style');
            style.id = 'shakeStyle';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// ==============================================
// 3. 讯飞星火AI语音识别核心（真方言识别，纯前端可运行）
// ==============================================
/**
 * 讯飞语音识别核心函数
 * @param {Blob} audioBlob 录音音频文件
 * @returns {Promise<string>} 识别后的文本
 */
async function xunfeiSpeechToText(audioBlob) {
    try {
        // 1. 鉴权签名生成
        const url = "wss://ws-api.xfyun.cn/v2/iat";
        const host = "ws-api.xfyun.cn";
        const date = new Date().toUTCString();
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;

        // HMAC-SHA256签名（纯前端实现）
        const encoder = new TextEncoder();
        const keyData = encoder.encode(AI_CONFIG.xunfei.apiSecret);
        const messageData = encoder.encode(signatureOrigin);
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
        const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

        // 2. 构建鉴权头
        const authorization = `api_key="${AI_CONFIG.xunfei.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
        const wsUrl = `${url}?authorization=${btoa(authorization)}&date=${btoa(date)}&host=${btoa(host)}`;

        // 3. WebSocket连接讯飞接口
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            let resultText = "";

            ws.onopen = async () => {
                // 音频转base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result.split(",")[1];
                    // 发送音频帧
                    ws.send(JSON.stringify({
                        common: { app_id: AI_CONFIG.xunfei.appId },
                        business: {
                            language: currentLanguage, // 方言配置
                            domain: "iat",
                            accent: currentLanguage === "sichuanhua" ? "mandarin" : "",
                            sample_rate: 16000,
                            encoding: "raw"
                        },
                        data: {
                            status: 2,
                            format: "audio/L16;rate=16000",
                            audio: base64Audio
                        }
                    }));
                };
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.code !== 0) {
                    reject(new Error(data.message));
                    ws.close();
                    return;
                }
                // 拼接识别结果
                if (data.data?.result?.ws) {
                    data.data.result.ws.forEach(item => {
                        item.cw.forEach(cw => {
                            resultText += cw.w;
                        });
                    });
                }
                // 识别结束
                if (data.data.status === 2) {
                    ws.close();
                    resolve(resultText);
                }
            };

            ws.onerror = (error) => {
                reject(error);
            };

            ws.onclose = () => {
                if (resultText) resolve(resultText);
                else reject(new Error("识别失败，无返回结果"));
            };
        });
    } catch (error) {
        console.error("讯飞语音识别错误：", error);
        throw error;
    }
}

/**
 * 开始录音
 */
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        audioData = [];
        processor.onaudioprocess = (e) => {
            const data = e.inputBuffer.getChannelData(0);
            audioData.push(new Int16Array(data.map(v => Math.max(-1, Math.min(1, v)) * 32767)));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        mediaRecorder = { stream, source, processor };
        return true;
    } catch (error) {
        console.error("录音启动失败：", error);
        alert("麦克风权限被拒绝，请在浏览器地址栏左侧开启权限");
        return false;
    }
}

/**
 * 停止录音，返回音频Blob
 */
async function stopRecording() {
    return new Promise((resolve) => {
        if (!mediaRecorder) return resolve(null);

        // 停止录音
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        mediaRecorder.processor.disconnect();
        mediaRecorder.source.disconnect();
        audioContext.close();

        // 拼接音频数据，生成WAV文件
        const audioBuffer = new Int16Array(audioData.reduce((acc, val) => acc.concat(Array.from(val)), []));
        const wavBuffer = createWavFile(audioBuffer);
        const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });

        // 重置变量
        audioData = [];
        mediaRecorder = null;
        audioContext = null;

        resolve(audioBlob);
    });
}

/**
 * 生成WAV格式音频文件
 */
function createWavFile(audioData) {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    // WAV头文件
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 16000 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, audioData.length * 2, true);

    // 写入音频数据
    for (let i = 0; i < audioData.length; i++) {
        view.setInt16(44 + i * 2, audioData[i], true);
    }

    return buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// ==============================================
// 4. 豆包AI文本大模型核心（语义理解+分类+回复生成）
// ==============================================
/**
 * 调用豆包OpenAI生成文本
 */
async function callDoubaoAI(prompt) {
    // 无网/未配置密钥，直接走你原有的离线兜底逻辑
    if (!navigator.onLine || AI_CONFIG.openai.apiKey === "你的OpenAI API Key") {
        return getOfflineAiReply(prompt);
    }
    try {
        const response = await fetch(AI_CONFIG.openai.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_CONFIG.openai.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.openai.model,
                messages: [
                    {
                        role: "system",
                        content: "你是智治通社区共治平台的智能助手，专门服务于川北川南社区治理场景，回答必须严谨、规范、符合政务用语，简洁精准，贴合四川本地场景。"
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1024
            })
        });
        const result = await response.json();
        // OpenAI返回格式与豆包高度兼容，仅做极简适配
        if (result.choices && result.choices[0]) {
            return result.choices[0].message.content.trim();
        } else {
            throw new Error("AI生成失败：" + (result.error?.message || "未知错误"));
        }
    } catch (error) {
        console.error("OpenAI调用错误，启用兜底规则：", error);
        return getOfflineAiReply(prompt);
    }
}

/**
 * 离线AI兜底规则（无网/调用失败自动触发，演示零翻车）
 */
function getOfflineAiReply(prompt) {
    // 1. 诉求分类场景兜底
    if (prompt.includes("诉求类型只能从以下选项中选择")) {
        const appealDesc = prompt.split("居民诉求内容：")[1].trim().toLowerCase();
        let type = "其他", department = "社区居委会";

        if (appealDesc.includes("食堂") || appealDesc.includes("吃饭") || appealDesc.includes("老年餐") || appealDesc.includes("养老")) {
            type = "社区建议"; department = "社区居委会";
        } else if (appealDesc.includes("灯坏了") || appealDesc.includes("电梯") || appealDesc.includes("水管") || appealDesc.includes("设施") || appealDesc.includes("报修")) {
            type = "设施报修"; department = "物业";
        } else if (appealDesc.includes("吵架") || appealDesc.includes("矛盾") || appealDesc.includes("纠纷") || appealDesc.includes("邻里")) {
            type = "纠纷调解"; department = "司法所";
        } else if (appealDesc.includes("社保") || appealDesc.includes("养老") || appealDesc.includes("认证") || appealDesc.includes("政策")) {
            type = "政策咨询"; department = "民政办";
        } else if (appealDesc.includes("志愿者") || appealDesc.includes("志愿") || appealDesc.includes("帮忙")) {
            type = "志愿服务"; department = "社区居委会";
        }

        return JSON.stringify({ type, department });
    }

    // 2. 管理员回复生成场景兜底
    if (prompt.includes("生成一段规范、礼貌、符合政务用语的处理回复")) {
        const typeMatch = prompt.match(/诉求类型：(.+?)\n/);
        const statusMatch = prompt.match(/处理状态：(.+?)\n/);
        const appealType = typeMatch ? typeMatch[1] : "诉求";
        const status = statusMatch ? statusMatch[1] : "待处理";

        const replyTemplate = {
            "待处理": `您好！您提交的${appealType}诉求已收到，我们已将您的需求同步至对应责任部门，将在3个工作日内完成初步核实与对接，后续进展会第一时间同步给您，请您保持联系方式畅通。`,
            "处理中": `您好！您提交的${appealType}诉求正在推进中，目前我们已协调相关部门开展现场核实与方案研讨，会持续跟进处理进度，每2个工作日向您同步一次进展，请您耐心等待。`,
            "已完成": `您好！您提交的${appealType}诉求已处理完毕。针对您提出的需求，我们已完成相关方案落地与资源对接，后续如有其他问题，欢迎您随时通过平台反馈，感谢您对社区工作的支持与监督。`
        };
        return replyTemplate[status] || replyTemplate["待处理"];
    }

    return "您好，您的需求已收到，我们将尽快为您处理。";
}

/**
 * 智能诉求分类与责任部门匹配
 */
async function getAppealIntelligentClassify(appealDesc) {
    const prompt = `
    我现在有一段社区居民的诉求描述，请你严格按照以下规则处理：
    1. 诉求类型只能从以下选项中选择一个：纠纷调解、设施报修、志愿服务、政策咨询、社区建议、其他
    2. 责任部门只能从以下选项中选择一个：社区居委会、物业、街道办、司法所、民政办、城管执法队、其他部门
    3. 只需要返回JSON格式，不要任何其他内容，格式如下：{"type": "诉求类型", "department": "责任部门"}
    4. 必须严格贴合诉求内容分类，不能编造
    居民诉求内容：${appealDesc}
    `;

    const result = await callDoubaoAI(prompt);
    try {
        return JSON.parse(result);
    } catch (e) {
        return { type: "其他", department: "社区居委会" };
    }
}

/**
 * 管理员智能回复生成
 */
async function getAdminIntelligentReply(appealType, appealDesc, status) {
    const prompt = `
    你是社区政务处理的工作人员，请根据以下诉求信息，生成一段规范、礼貌、符合政务用语的处理回复，要求：
    1. 严格贴合诉求内容，针对性回复，不能空泛
    2. 语气正式、礼貌，有温度，符合社区服务的定位
    3. 字数控制在100-200字之间
    4. 处理状态为"待处理"：告知已收到诉求，会尽快分配负责部门跟进，承诺处理时限
    5. 处理状态为"处理中"：告知当前处理进度，正在协调相关部门，会持续跟进反馈
    6. 处理状态为"已完成"：告知诉求已处理完毕，说明处理结果，邀请居民评价反馈
    诉求信息：
    诉求类型：${appealType}
    诉求内容：${appealDesc}
    处理状态：${status}
    `;

    return await callDoubaoAI(prompt);
}

// ==============================================
// 5. 语音合成（文本转语音，四川话/普通话双支持）
// ==============================================
function speakText(text, isSichuan = false) {
    if (!window.speechSynthesis) {
        alert("您的浏览器不支持语音播报功能，请使用Chrome、Edge浏览器");
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isSichuan ? "zh-CN-sichuan" : "zh-CN";
    utterance.rate = document.body.classList.contains("elder-mode") ? 0.7 : 0.9;
    utterance.volume = 1;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
}

// ==============================================
// 6. 全功能语音助手优化整合
// ==============================================
/**
 * 启动语音识别主函数
 */
async function startSpeechRecognition(callback) {
    if (isListening) {
        stopSpeechRecognition();
        return;
    }

    // 启动录音
    const isStart = await startRecording();
    if (!isStart) {
        callback("onerror", "录音启动失败");
        return;
    }

    // 更新状态
    isListening = true;
    showVoiceModal("正在聆听，请说四川话/普通话");
    callback("onstart", "正在聆听");
}

/**
 * 停止语音识别主函数
 */
async function stopSpeechRecognition() {
    if (!isListening) return;

    // 停止录音
    const audioBlob = await stopRecording();
    isListening = false;
    hideVoiceModal();

    if (!audioBlob) return null;

    // 调用讯飞识别
    try {
        const resultText = await xunfeiSpeechToText(audioBlob);
        console.log("讯飞识别结果：", resultText);
        return resultText;
    } catch (error) {
        console.error("识别失败：", error);
        alert("语音识别失败，请重试");
        return null;
    }
}

/**
 * 语音弹窗控制
 */
function showVoiceModal(text = "正在聆听，请说话") {
    const modal = document.getElementById("voiceModal");
    if (modal) {
        document.getElementById("voiceModalText").innerText = text;
        modal.classList.add("show");
    }
}
function hideVoiceModal() {
    const modal = document.getElementById("voiceModal");
    if (modal) modal.classList.remove("show");
}

/**
 * 通用表单语音填充函数
 */
window.startVoiceFill = function(inputId, tipText = "请输入内容") {
    startSpeechRecognition(async (status, text) => {
        if (status === "onend") {
            const result = await stopSpeechRecognition();
            if (!result) return;

            const inputElement = document.getElementById(inputId);
            if (!inputElement) return;

            // 手机号格式化
            if (inputId === "contactPhone") {
                inputElement.value = result.replace(/\D/g, "").slice(0, 11);
            }
            // 文本域填充
            else if (inputElement.tagName === "TEXTAREA") {
                inputElement.value = result;
            }
            // 普通输入框
            else {
                inputElement.value = result;
            }

            speakText(`已为您输入${tipText}`, currentLanguage === "sichuanhua");
        }
    });
};

/**
 * 语音纠错函数
 */
window.voiceCorrect = function(inputId) {
    const inputElement = document.getElementById(inputId);
    if (!inputElement) return;
    const originText = inputElement.value;

    startSpeechRecognition(async (status, text) => {
        if (status === "onend") {
            const result = await stopSpeechRecognition();
            if (!result) return;

            // 匹配纠错指令
            const correctReg = /把(.+?)改成(.+?)/;
            const match = result.match(correctReg);
            if (match) {
                const oldText = match[1];
                const newText = match[2];
                const updatedText = originText.replace(oldText, newText);
                inputElement.value = updatedText;
                speakText(`已为您修改为${updatedText}`, currentLanguage === "sichuanhua");
            } else {
                inputElement.value = result;
                speakText(`已为您重新输入`, currentLanguage === "sichuanhua");
            }
        }
    });
};

/**
 * 方言切换函数
 */
window.toggleDialect = function() {
    currentLanguage = currentLanguage === "zh_cn" ? "sichuanhua" : "zh_cn";
    const isSichuan = currentLanguage === "sichuanhua";
    speakText(isSichuan ? "已切换为四川话模式" : "已切换为普通话模式", isSichuan);
    document.getElementById("dialectBtn").innerText = isSichuan ? "普通话模式" : "四川话模式";
};

/**
 * 适老化模式切换
 */
// 适老化模式切换
window.toggleElderMode = function() {
    const elderBtn = document.getElementById("elderModeBtn");
    document.body.classList.toggle("elder-mode");
    const isElder = document.body.classList.contains("elder-mode");
    localStorage.setItem("elder_mode", isElder ? "open" : "close");

    // 按钮样式同步
    if (isElder) {
        elderBtn.style.background = "#1a56db";
        elderBtn.style.color = "white";
    } else {
        elderBtn.style.background = "white";
        elderBtn.style.color = "#1a56db";
    }

    speakText(isElder ? "已开启适老化模式，字体已放大，语速已放慢" : "已关闭适老化模式", currentLanguage === "sichuanhua");
};

// ==============================================
// 7. 社区专属语音指令库
// ==============================================
const voiceCommandMap = [
    { keywords: ["首页", "回到首页", "回首页"], action: () => { speakText("要得，马上跳转到首页", currentLanguage === "sichuanhua"); setTimeout(() => window.location.href = "index.html", 1000); } },
    { keywords: ["提交诉求", "我要反映问题", "我要投诉", "诉求提交"], action: () => { speakText("要得，马上打开诉求提交页面", currentLanguage === "sichuanhua"); setTimeout(() => window.location.href = "appeal-submit.html", 1000); } },
    { keywords: ["我的诉求", "查进度", "诉求进度", "看我的诉求"], action: () => { speakText("要得，马上打开我的诉求页面", currentLanguage === "sichuanhua"); setTimeout(() => window.location.href = "appeal-query.html", 1000); } },
    { keywords: ["项目介绍", "了解项目", "看项目"], action: () => { speakText("要得，马上打开项目介绍页面", currentLanguage === "sichuanhua"); setTimeout(() => window.location.href = "project.html", 1000); } },
    { keywords: ["登录", "注册", "登录账号"], action: () => { speakText("要得，马上打开登录页面", currentLanguage === "sichuanhua"); setTimeout(() => window.location.href = "login.html", 1000); } },
    { keywords: ["退出登录", "登出"], action: () => { localStorage.removeItem('is_login'); localStorage.removeItem('current_user'); speakText("已为您退出登录", currentLanguage === "sichuanhua"); window.location.href = "index.html"; } },
    { keywords: ["适老化模式", "大字体", "放大字体"], action: () => toggleElderMode() },
    { keywords: ["四川话模式", "切换四川话", "说四川话"], action: () => { currentLanguage = "sichuanhua"; speakText("已切换为四川话模式", true); } },
    { keywords: ["普通话模式", "切换普通话", "说普通话"], action: () => { currentLanguage = "zh_cn"; speakText("已切换为普通话模式", false); } },
    { keywords: ["帮助", "我能说啥子", "指令", "我能说什么"], action: () => { speakText("你可以说：提交诉求、我的诉求、首页、报修、养老保险、老年食堂这些话", currentLanguage === "sichuanhua"); } },
    { keywords: ["养老保险", "养老认证", "社保"], action: () => { speakText("已为您匹配养老保险认证服务", currentLanguage === "sichuanhua"); localStorage.setItem('ai_input_appeal', "我想咨询社区养老保险认证怎么办理"); setTimeout(() => window.location.href = "appeal-submit.html", 1500); } },
    { keywords: ["灯坏了", "设施坏了", "水管坏了", "电梯坏了", "报修"], action: () => { speakText("已为您打开设施报修页面", currentLanguage === "sichuanhua"); localStorage.setItem('ai_input_appeal', "社区公共设施损坏需要报修"); setTimeout(() => window.location.href = "appeal-submit.html", 1500); } },
    { keywords: ["老年食堂", "老年人吃饭", "楼下开食堂"], action: () => { speakText("已为您记录开老年食堂的诉求", currentLanguage === "sichuanhua"); localStorage.setItem('ai_input_appeal', "我想要楼下开一家老年人可以就餐的食堂，年纪大了，做饭不方便"); setTimeout(() => window.location.href = "appeal-submit.html", 1500); } },
    { keywords: ["提交", "提交诉求"], action: () => { if (window.location.pathname.includes("appeal-submit.html")) { submitAppeal(); speakText("已为您提交诉求", currentLanguage === "sichuanhua"); } else { speakText("请先跳转到诉求提交页面", currentLanguage === "sichuanhua"); } } }
];

/**
 * 语音指令匹配处理
 */
function handleVoiceCommand(command) {
    command = command.toLowerCase().trim();
    let isMatched = false;

    // 匹配指令
    for (let item of voiceCommandMap) {
        for (let keyword of item.keywords) {
            if (command.includes(keyword.toLowerCase())) {
                item.action();
                isMatched = true;
                break;
            }
        }
        if (isMatched) break;
    }

    // 未匹配到指令
    if (!isMatched) {
        speakText("不好意思，我没听懂，你可以说帮助，查看我能听懂的指令", currentLanguage === "sichuanhua");
    }
}

// ==============================================
// 8. 页面加载自动初始化
// ==============================================

document.addEventListener("DOMContentLoaded", function() {
    // 1. 渲染语音聆听弹窗（只保留停止录音功能，不改变你原有样式）
    const voiceModal = document.createElement("div");
    voiceModal.className = "voice-modal";
    voiceModal.id = "voiceModal";
    voiceModal.innerHTML = `
        <div class="voice-wave">
            <i class="fa-solid fa-microphone-lines"></i>
        </div>
        <div class="voice-modal-text" id="voiceModalText">正在聆听，请说话</div>
        <div class="voice-modal-subtitle">说完停顿1秒自动结束，或点击下方按钮停止</div>
        <button id="stopVoiceBtn" style="margin-top: 20px; padding: 12px 32px; background: #ef4444; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;">
            <i class="fa-solid fa-stop"></i> 停止录音
        </button>
    `;
    document.body.appendChild(voiceModal);

    // 停止录音按钮事件
    voiceModal.querySelector("#stopVoiceBtn").addEventListener("click", async function() {
        const result = await stopSpeechRecognition();
        if (result) handleVoiceCommand(result);
    });
    // 点击弹窗背景也能停止录音
    voiceModal.addEventListener("click", async function(e) {
        if (e.target === voiceModal) {
            const result = await stopSpeechRecognition();
            if (result) handleVoiceCommand(result);
        }
    });

    // 2. 还原你原本的全局语音助手浮标（位置、样式完全不动）
    const voiceBtn = document.createElement("button");
    voiceBtn.className = "voice-assistant-btn";
    voiceBtn.id = "globalVoiceBtn";
    voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    voiceBtn.title = "AI语音助手";
    voiceBtn.style.bottom = "100px"; // 和你原来的位置完全一致
    voiceBtn.style.right = "24px";
    document.body.appendChild(voiceBtn);

    // 3. 还原你原本的适老化模式单独浮标（和原来一模一样，单独悬浮，不混排）
    const elderToggleBtn = document.createElement("button");
    elderToggleBtn.className = "elder-mode-toggle";
    elderToggleBtn.id = "elderModeBtn";
    elderToggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i> 适老化模式';
    elderToggleBtn.title = "点击开启/关闭适老化模式";
    // 完全还原你原来的位置、样式
    elderToggleBtn.style.position = "fixed";
    elderToggleBtn.style.bottom = "24px";
    elderToggleBtn.style.right = "24px";
    elderToggleBtn.style.padding = "12px 20px";
    elderToggleBtn.style.background = "white";
    elderToggleBtn.style.border = "2px solid #1a56db";
    elderToggleBtn.style.borderRadius = "30px";
    elderToggleBtn.style.color = "#1a56db";
    elderToggleBtn.style.fontSize = "14px";
    elderToggleBtn.style.fontWeight = "600";
    elderToggleBtn.style.cursor = "pointer";
    elderToggleBtn.style.zIndex = "999";
    elderToggleBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    elderToggleBtn.style.transition = "all 0.3s";
    // hover效果和原来一致
    elderToggleBtn.onmouseover = function() {
        this.style.background = "#1a56db";
        this.style.color = "white";
    };
    elderToggleBtn.onmouseout = function() {
        if (!document.body.classList.contains("elder-mode")) {
            this.style.background = "white";
            this.style.color = "#1a56db";
        }
    };
    // 点击事件
    elderToggleBtn.onclick = toggleElderMode;
    document.body.appendChild(elderToggleBtn);

    // 4. 全局语音按钮点击事件（完全保留你原来的逻辑，不修改）
    voiceBtn.addEventListener("click", async function() {
        if (!isListening) {
            voiceBtn.classList.add("active");
            startSpeechRecognition(async (status, text) => {
                if (status === "onend") {
                    const result = await stopSpeechRecognition();
                    voiceBtn.classList.remove("active");
                    if (result) handleVoiceCommand(result);
                } else if (status === "onerror") {
                    voiceBtn.classList.remove("active");
                }
            });
        } else {
            const result = await stopSpeechRecognition();
            voiceBtn.classList.remove("active");
            if (result) handleVoiceCommand(result);
        }
    });

    // 5. 页面加载恢复适老化模式状态（保留原有逻辑）
    if (localStorage.getItem("elder_mode") === "open") {
        document.body.classList.add("elder-mode");
        elderToggleBtn.style.background = "#1a56db";
        elderToggleBtn.style.color = "white";
    }

    // 6. 自动填充首页AI输入的诉求（保留原有逻辑）
    const aiInputAppeal = localStorage.getItem('ai_input_appeal');
    if (aiInputAppeal && window.location.pathname.includes("appeal-submit.html")) {
        document.getElementById('appealDesc').value = aiInputAppeal;
        localStorage.removeItem('ai_input_appeal');
    }
});



// ==============================================
// 站内消息通知系统
// ==============================================
// 发送消息函数（管理员更新状态时自动调用）

// 全局变量，存储弹窗DOM
let noticeModal = null;

// 发送消息函数（管理员更新状态时自动调用）
window.sendNotice = function(userId, title, content) {
    const notices = JSON.parse(localStorage.getItem('zhizhitong_notices')) || [];
    const newNotice = {
        id: Date.now().toString(),
        userId: userId, // 此处的userId就是居民的手机号，和登录的current_user一致
        title: title,
        content: content,
        time: new Date().toLocaleString(),
        read: false
    };
    notices.unshift(newNotice);
    localStorage.setItem('zhizhitong_notices', JSON.stringify(notices));
    updateNoticeBadge();//实时更新小红点
};

// 更新消息小红点
window.updateNoticeBadge = function() {
    const currentUser = localStorage.getItem('current_user');
    const badge = document.getElementById('noticeBadge');
    if (!currentUser || !badge) return;

    const notices = JSON.parse(localStorage.getItem('zhizhitong_notices')) || [];
    const unreadCount = notices.filter(n => n.userId === currentUser && !n.read).length;

    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
};

// 渲染消息列表
window.renderNoticeList = function() {
    const currentUser = localStorage.getItem('current_user');
    if (!currentUser || !noticeModal) return;

    const notices = JSON.parse(localStorage.getItem('zhizhitong_notices')) || [];
    const userNotices = notices.filter(n => n.userId === currentUser);
    const noticeList = noticeModal.querySelector('#noticeList');

    if (userNotices.length === 0) {
        noticeList.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af; font-size: 14px;">暂无消息</div>';
        return;
    }

    // 渲染消息列表
    noticeList.innerHTML = userNotices.map(notice => `
        <div class="notice-item ${notice.read ? '' : 'unread'}" data-notice-id="${notice.id}">
            <div class="notice-title">${notice.title}</div>
            <div class="notice-content">${notice.content}</div>
            <div class="notice-time">${notice.time}</div>
        </div>
    `).join('');

    // 给每条消息绑定点击已读事件
    noticeModal.querySelectorAll('.notice-item').forEach(item => {
        item.addEventListener('click', function() {
            const noticeId = this.getAttribute('data-notice-id');
            markNoticeRead(noticeId);
        });
    });
};

// 标记单条消息已读
window.markNoticeRead = function(noticeId) {
    const notices = JSON.parse(localStorage.getItem('zhizhitong_notices')) || [];
    const updatedNotices = notices.map(n => {
        if (n.id === noticeId) return { ...n, read: true };
        return n;
    });
    localStorage.setItem('zhizhitong_notices', JSON.stringify(updatedNotices));
    updateNoticeBadge();
    renderNoticeList();
};

// 全部标记已读
window.clearAllNotices = function() {
    const currentUser = localStorage.getItem('current_user');
    if (!currentUser) return;

    const notices = JSON.parse(localStorage.getItem('zhizhitong_notices')) || [];
    const updatedNotices = notices.map(n => {
        if (n.userId === currentUser) return { ...n, read: true };
        return n;
    });
    localStorage.setItem('zhizhitong_notices', JSON.stringify(updatedNotices));
    updateNoticeBadge();
    renderNoticeList();
};

// 页面加载初始化
document.addEventListener('DOMContentLoaded', function() {
    const noticeNavItem = document.getElementById('noticeNavItem');
    const isLogin = localStorage.getItem('is_login') === 'true';
    const currentUser = localStorage.getItem('current_user');

    // 1. 先创建消息弹窗（只创建一次，避免重复）
    if (!document.getElementById('noticeModal')) {
        const modal = document.createElement('div');
        modal.className = 'notice-modal';
        modal.id = 'noticeModal';
        modal.innerHTML = `
            <div class="notice-header">
                <h3 style="font-size: 16px; margin: 0;">站内消息</h3>
                <span style="font-size: 12px; color: #1a56db; cursor: pointer;" onclick="clearAllNotices()">全部已读</span>
            </div>
            <div class="notice-list" id="noticeList"></div>
        `;
        document.body.appendChild(modal);
        noticeModal = modal;
    } else {
        noticeModal = document.getElementById('noticeModal');
    }

    // 2. 给消息图标绑定点击事件（核心修复：直接绑定到已存在的元素上）
    if (noticeNavItem && isLogin && currentUser) {
        noticeNavItem.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止a标签默认跳转
            e.stopPropagation(); // 阻止事件冒泡
            noticeModal.classList.toggle('show'); // 切换显示/隐藏
            renderNoticeList(); // 每次点击刷新列表
        });
    }

    // 3. 点击页面其他区域，关闭消息弹窗
    document.addEventListener('click', function(e) {
        // 先判断 noticeModal 和 noticeNavItem 是否存在，再调用 contains
        if (noticeModal && noticeNavItem) {
            if (!noticeModal.contains(e.target) && !noticeNavItem.contains(e.target)) {
                noticeModal.classList.remove('show');
            }
        }
    });

    // 4. 初始化小红点
    updateNoticeBadge();
});



// 全部标记已读
window.clearAllNotices = function() {
    const currentUser = localStorage.getItem('current_user');
    if (!currentUser) return;

    const notices = JSON.parse(localStorage.getItem('zhizhitong_notices')) || [];
    const updatedNotices = notices.map(n => {
        if (n.userId === currentUser) {
            return { ...n, read: true };
        }
        return n;
    });
    localStorage.setItem('zhizhitong_notices', JSON.stringify(updatedNotices));
    updateNoticeBadge();
    renderNoticeList();
};


// ==================== 全局权限校验====================
// 禁止管理员访问居民页面
function checkAdminBanUserPage() {
    // 判断是否是管理员
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const isLogin = localStorage.getItem('is_login') === 'true';

    // 如果是管理员 → 强制跳回后台，弹窗提示
    if (isLogin && isAdmin) {
        alert('权限禁止：管理员无法访问居民页面！\n仅可在管理员后台「代居民提交诉求」');
        window.location.href = 'admin.html';
        return false;
    }
    return true;
}

// 禁止居民访问管理员页面
function checkUserBanAdminPage() {
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const isLogin = localStorage.getItem('is_login') === 'true';

    // 如果是普通用户 → 强制跳回登录页
    if (isLogin && !isAdmin) {
        alert('权限禁止：居民无法访问管理员后台！');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}



// ==================== 公共消息通知函数 ====================
// 1. 获取居民消息列表
function getUserNotices() {
    return JSON.parse(localStorage.getItem('zhizhitong_user_notices')) || [];
}

// 2. 给居民发通知（管理员处理后用）
function sendNotice(userPhone, title, content) {
    const notices = getUserNotices();
    const newNotice = {
        id: Date.now(),
        title: title,
        content: content,
        userPhone: userPhone,
        isRead: false,
        createTime: new Date().toLocaleString()
    };
    notices.unshift(newNotice);
    if (notices.length > 50) notices.splice(50);
    localStorage.setItem('zhizhitong_user_notices', JSON.stringify(notices));
}

// 3. 获取管理员消息列表
function getAdminNotices() {
    return JSON.parse(localStorage.getItem('zhizhitong_admin_notices')) || [];
}

// 4. 给管理员发通知（居民提交诉求/反馈用）
function sendAdminNotice(title, content, appealId) {
    // 初始化存储
    if (!localStorage.getItem('zhizhitong_admin_notices')) {
        localStorage.setItem('zhizhitong_admin_notices', JSON.stringify([]));
    }
    const notices = getAdminNotices();
    const newNotice = {
        id: Date.now(),
        title: title,
        content: content,
        appealId: appealId,
        isRead: false,
        createTime: new Date().toLocaleString()
    };
    notices.unshift(newNotice);
    if (notices.length > 50) notices.splice(50);
    localStorage.setItem('zhizhitong_admin_notices', JSON.stringify(notices));

    // 如果管理员正在打开后台 → 实时刷新小红点+弹窗
    if (window.location.pathname.includes('admin.html')) {
        if (window.refreshNoticeBadge) refreshNoticeBadge();
        if (window.showNewMsgToast) showNewMsgToast(title, content);
    }
}

// 5. 初始化消息存储（页面加载自动执行）
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('zhizhitong_user_notices')) {
        localStorage.setItem('zhizhitong_user_notices', JSON.stringify([]));
    }
    if (!localStorage.getItem('zhizhitong_admin_notices')) {
        localStorage.setItem('zhizhitong_admin_notices', JSON.stringify([]));
    }
});



// ==================== 全局权限校验（修复所有越权问题） ====================
// 1. 判断是否为管理员
function isAdmin() {
    return localStorage.getItem('is_admin') === 'true';
}
// 2. 判断是否已登录（居民/管理员）
function isLogin() {
    return localStorage.getItem('is_login') === 'true';
}
// 3. 管理员禁止访问居民页面（提交诉求/我的诉求），直接弹提示
function adminBanUserPage() {
    if (isAdmin()) {
        alert('管理员无居民操作权限！\n仅支持【代居民提交诉求】，无法自行提交或查看个人诉求');
        window.location.href = 'admin.html';
        return true;
    }
    return false;
}
// 4. 居民禁止访问管理员后台
function userBanAdminPage() {
    if (isLogin() && !isAdmin()) {
        alert('普通用户无权限访问管理员后台！');
        window.location.href = 'index.html';
        return true;
    }
    return false;
}
// 5. 页面加载时统一渲染导航栏权限（所有页面自动生效）
document.addEventListener('DOMContentLoaded', function() {
    const loginNavItem = document.getElementById('loginNavItem');
    const logoutNavItem = document.getElementById('logoutNavItem');
    const profileNavItem = document.getElementById('profileNavItem');
    const adminNavItem = document.getElementById('adminNavItem');
    const noticeNavItem = document.getElementById('noticeNavItem');

    // 未登录：只显示登录
    if (!isLogin()) {
        loginNavItem.style.display = 'block';
        logoutNavItem.style.display = 'none';
        profileNavItem.style.display = 'none';
        adminNavItem.style.display = 'none';
        noticeNavItem.style.display = 'none';
        return;
    }

    // 已登录
    loginNavItem.style.display = 'none';
    logoutNavItem.style.display = 'block';

    // 管理员：隐藏居民入口（我的诉求、提交诉求、个人中心、消息）
    if (isAdmin()) {
        profileNavItem.style.display = 'none';
        adminNavItem.style.display = 'block';
        noticeNavItem.style.display = 'none';
        // 隐藏导航里的居民页面（提交诉求/我的诉求）
        document.querySelectorAll('.nav-menu li').forEach(item => {
            const text = item.innerText;
            if (text.includes('提交诉求') || text.includes('我的诉求')) {
                item.style.display = 'none';
            }
        });
    }
    // 普通居民：隐藏管理员入口
    else {
        profileNavItem.style.display = 'block';
        adminNavItem.style.display = 'none';
        noticeNavItem.style.display = 'block';
    }
});





// ==================== 移动端底部Tab · 自动按权限切换 ====================
document.addEventListener('DOMContentLoaded', function() {
    const mobileTabBar = document.getElementById('mobileTabBar');
    if (!mobileTabBar) return;

    // 读取你现有权限变量
    const is_login = localStorage.getItem('is_login') === 'true';
    const is_admin = localStorage.getItem('is_admin') === 'true';

    // ============== 1. 未登录状态 ==============
    if (!is_login) {
        mobileTabBar.innerHTML = `
        <div class="tab-bar-list">
            <a href="index.html" class="tab-bar-item ${location.pathname.includes('index.html')?'active':''}">
                <i class="fa-solid fa-house"></i><span>首页</span>
            </a>
            <a href="project.html" class="tab-bar-item ${location.pathname.includes('project.html')?'active':''}">
                <i class="fa-solid fa-book"></i><span>项目介绍</span>
            </a>
            <a href="login.html" class="tab-bar-item">
                <i class="fa-solid fa-user"></i><span>登录</span>
            </a>
        </div>`;
        return;
    }

    // ============== 2. 管理员登录 ==============
    if (is_admin) {
        mobileTabBar.innerHTML = `
        <div class="tab-bar-list">
            <a href="index.html" class="tab-bar-item ${location.pathname.includes('index.html')?'active':''}">
                <i class="fa-solid fa-house"></i><span>首页</span>
            </a>
            <a href="project.html" class="tab-bar-item ${location.pathname.includes('project.html')?'active':''}">
                <i class="fa-solid fa-book"></i><span>项目介绍</span>
            </a>
            <a href="admin.html" class="tab-bar-item ${location.pathname.includes('admin.html')?'active':''}">
                <i class="fa-solid fa-user-shield"></i><span>管理后台</span>
            </a>
            <a href="javascript:;" onclick="adminLogout()" class="tab-bar-item">
                <i class="fa-solid fa-right-from-bracket"></i><span>退出</span>
            </a>
        </div>`;
        return;
    }

    // ============== 3. 普通居民登录 ==============
    mobileTabBar.innerHTML = `
    <div class="tab-bar-list">
        <a href="index.html" class="tab-bar-item ${location.pathname.includes('index.html')?'active':''}">
            <i class="fa-solid fa-house"></i><span>首页</span>
        </a>
        <a href="appeal-submit.html" class="tab-bar-item ${location.pathname.includes('appeal-submit.html')?'active':''}">
            <i class="fa-solid fa-file-pen"></i><span>提交诉求</span>
        </a>
        <a href="appeal-query.html" class="tab-bar-item ${location.pathname.includes('appeal-query.html')?'active':''}">
            <i class="fa-solid fa-list-check"></i><span>我的诉求</span>
        </a>
        <a href="profile.html" class="tab-bar-item ${location.pathname.includes('profile.html')?'active':''}">
            <i class="fa-solid fa-user"></i><span>我的</span>
        </a>
    </div>`;
});

// 兼容admin.html里的退出函数
function adminLogout() {
    localStorage.removeItem('is_admin');
    localStorage.removeItem('is_login');
    localStorage.removeItem('current_user');
    alert('退出登录成功');
    window.location.href = 'login.html';
}