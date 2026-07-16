export function showMessage(
    message: string, 
    type: 'info' | 'warn' | 'warning' | 'error' | 'success' = 'info',
    duration: number = 5000
): void {
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.error("Message container not found!");
        return;
    }

    const div = document.createElement('div');
    // Map 'warn' and 'warning' to 'warning' for CSS classes
    const displayType = (type === 'warn' || type === 'warning') ? 'warning' : type;
    div.className = `toast toast-${displayType}`;
    
    // 支持多行消息
    if (message.includes('\n')) {
        div.style.whiteSpace = 'pre-line';
        div.style.textAlign = 'left';
    }
    
    div.textContent = message;

    // Add an icon based on the type
    const icon = document.createElement('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else if (type === 'warn' || type === 'warning') {
        icon.className = 'fas fa-exclamation-triangle';
    } else {
        icon.className = 'fas fa-info-circle';
    }
    div.prepend(icon);

    container.appendChild(div);

    // Trigger the animation
    setTimeout(() => {
        div.classList.add('show');
    }, 10); // A small delay to allow the element to be painted first

    // 鼠标悬浮时暂停过期
    let timeoutId: number | null = null;
    let remainingTime = duration;
    let startTime = Date.now();

    const startTimer = () => {
        startTime = Date.now();
        timeoutId = window.setTimeout(() => {
            div.classList.remove('show');
            // Remove the element from DOM after transition ends
            div.addEventListener('transitionend', () => div.remove());
        }, remainingTime);
    };

    const pauseTimer = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            remainingTime -= Date.now() - startTime;
            timeoutId = null;
        }
    };

    const resumeTimer = () => {
        if (timeoutId === null && remainingTime > 0) {
            startTimer();
        }
    };

    // 绑定鼠标事件
    div.addEventListener('mouseenter', pauseTimer);
    div.addEventListener('mouseleave', resumeTimer);

    // 启动定时器
    startTimer();
} 