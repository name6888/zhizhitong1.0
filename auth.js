// ==================== 通用错误处理函数 ====================
// 清除所有错误提示
function clearErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => error.classList.remove('show'));
}

// 显示错误提示+输入框抖动动画
function showError(inputId, message) {
    const errorElement = document.getElementById(inputId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    // 抖动动画
    const input = document.getElementById(inputId);
    if (input) {
        input.style.animation = 'none';
        setTimeout(() => input.style.animation = 'shake 0.5s ease', 10);
        input.focus();
    }
    // 注入抖动样式
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

// ==================== 通用表单校验正则 ====================
// 手机号校验正则
const phoneRegExp = /^1[3-9]\d{9}$/;

// ==================== 验证码倒计时通用函数 ====================
function startCountdown(btnElement, totalSeconds = 60) {
    let countdown = totalSeconds;
    btnElement.disabled = true;
    btnElement.textContent = `重新获取(${countdown}s)`;
    const timer = setInterval(() => {
        countdown--;
        btnElement.textContent = `重新获取(${countdown}s)`;
        if (countdown <= 0) {
            clearInterval(timer);
            btnElement.disabled = false;
            btnElement.textContent = '获取验证码';
        }
    }, 1000);
}

