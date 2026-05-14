let hideTimer: number | null = null;

function ensureStyles(): void {
  if (document.getElementById('enhancement-loading-styles')) return;
  const style = document.createElement('style');
  style.id = 'enhancement-loading-styles';
  style.textContent = `
    @keyframes enhancementSlideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes enhancementSlideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes enhancementSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function getIndicator(): HTMLElement | null {
  return document.getElementById('enhancement-loading');
}

function createIndicator(): HTMLElement {
  ensureStyles();
  const indicator = document.createElement('div');
  indicator.id = 'enhancement-loading';
  indicator.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
    color: white;
    padding: 12px 18px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    backdrop-filter: blur(10px);
    animation: enhancementSlideInRight 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  `;

  const spinner = document.createElement('span');
  spinner.className = 'enhancement-spinner';
  spinner.style.cssText = `
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: enhancementSpin 0.8s linear infinite;
  `;

  const text = document.createElement('span');
  text.className = 'enhancement-text';

  indicator.appendChild(spinner);
  indicator.appendChild(text);
  return indicator;
}

export function showEnhancementLoading(pageType: 'video' | 'actor'): void {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  const indicator = getIndicator() || createIndicator();
  const spinner = indicator.querySelector('.enhancement-spinner') as HTMLElement | null;
  if (!spinner) {
    const newSpinner = document.createElement('span');
    newSpinner.className = 'enhancement-spinner';
    newSpinner.style.cssText = `width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: enhancementSpin 0.8s linear infinite;`;
    indicator.prepend(newSpinner);
  }
  const text = indicator.querySelector('.enhancement-text') as HTMLElement | null;
  if (text) text.textContent = pageType === 'actor' ? '正在加载演员页增强...' : '正在获取增强信息...';
  indicator.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95))';
  indicator.style.animation = 'enhancementSlideInRight 0.3s ease-out';
  if (!indicator.parentElement) document.body.appendChild(indicator);
}

export function showEnhancementDone(): void {
  const indicator = getIndicator() || createIndicator();
  const spinner = indicator.querySelector('.enhancement-spinner');
  if (spinner) spinner.remove();
  const text = indicator.querySelector('.enhancement-text') as HTMLElement | null;
  if (text) text.textContent = '✓ 增强完成';
  indicator.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))';
  if (!indicator.parentElement) document.body.appendChild(indicator);
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    hideEnhancementIndicator();
  }, 1800);
}

export function hideEnhancementIndicator(): void {
  const indicator = getIndicator();
  if (!indicator) return;
  indicator.style.animation = 'enhancementSlideOutRight 0.3s ease-out';
  window.setTimeout(() => {
    if (indicator.parentElement) indicator.remove();
  }, 300);
}
