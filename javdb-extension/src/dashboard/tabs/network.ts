// javdb-extension/src/dashboard/tabs/network.ts

/**
 * 模拟 ping 功能，测试到指定 URL 的网络延迟。
 * @param url 要测试的 URL
 * @param onProgress 回调函数，用于报告每次测试的进度
 * @param count 测试次数，默认为 4
 * @returns 返回一个包含所有延迟时间的数组
 */
async function ping(
  url: string,
  onProgress: (message: string, success: boolean, latency?: number) => void,
  count = 4
): Promise<number[]> {
  const latencies: number[] = [];
  const testUrl = url; // The URL should be pre-formatted

  onProgress(`正在 Ping ${testUrl} ...`, true);

  for (let i = 0; i < count; i++) {
    const startTime = Date.now();
    try {
      const cacheBuster = `?t=${new Date().getTime()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(testUrl + cacheBuster, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;
      latencies.push(latency);
      onProgress(`来自 ${testUrl} 的回复`, true, latency);

      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      let errorMessage = '未知错误';
      if (error instanceof Error) {
        errorMessage = error.name === 'AbortError' ? '请求超时' : error.message;
      }
      onProgress(`请求失败: ${errorMessage}`, false, latency);
      latencies.push(-1);
    }
  }
  return latencies;
}

async function runPingTest(
    url: string,
    resultsContainer: HTMLDivElement,
    onProgress: (message: string, success: boolean, latency?: number) => void
) {
    try {
        const latencies = await ping(url, onProgress, 4);
        
        // Remove the "Pinging..." message for this specific test
        const pingingMessage = Array.from(resultsContainer.children).find(child => child.textContent?.includes(`正在 Ping ${url}`));
        if (pingingMessage) {
            resultsContainer.removeChild(pingingMessage);
        }

        const validLatencies = latencies.filter(l => l >= 0);
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'ping-summary';

        if (validLatencies.length > 0) {
            const sum = validLatencies.reduce((a, b) => a + b, 0);
            const avg = Math.round(sum / validLatencies.length);
            const min = Math.min(...validLatencies);
            const max = Math.max(...validLatencies);
            const loss = ((latencies.length - validLatencies.length) / latencies.length) * 100;
            
            summaryDiv.innerHTML = `
                <h5>Ping 统计信息 for ${url}</h5>
                <p><strong>数据包:</strong> 已发送 = ${latencies.length}, 已接收 = ${validLatencies.length}, 丢失 = ${latencies.length - validLatencies.length} (${loss}% 丢失)</p>
                <p><strong>往返行程的估计时间 (ms):</strong></p>
                <p style="margin-left: 15px;">最短 = ${min}ms, 最长 = ${max}ms, 平均 = ${avg}ms</p>
            `;
        } else {
            summaryDiv.innerHTML = `
                <h5>Ping 统计信息 for ${url}</h5>
                <p>所有 ping 请求均失败。请检查 URL 或您的网络连接。</p>
            `;
        }
        resultsContainer.appendChild(summaryDiv);
    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ping-result-item failure';
        const message = error instanceof Error ? error.message : String(error);
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle icon"></i><span>测试 ${url} 过程中出现错误: ${message}</span>`;
        resultsContainer.appendChild(errorDiv);
    }
}

/**
 * 初始化网络测试选项卡的功能
 */
export function initializeNetworkTestTab(): void {
  const startButton = document.getElementById('start-ping-test') as HTMLButtonElement;
  const urlInput = document.getElementById('ping-url') as HTMLInputElement;
  const resultsContainer = document.getElementById('ping-results') as HTMLDivElement;
  const resultsContainerWrapper = document.getElementById('ping-results-container') as HTMLDivElement;
  const buttonText = startButton.querySelector('.button-text') as HTMLSpanElement;
  const spinner = startButton.querySelector('.spinner') as HTMLDivElement;

  if (!startButton || !urlInput || !resultsContainer || !resultsContainerWrapper || !buttonText || !spinner) {
    console.error('无法找到网络测试选项卡的相关元素。');
    return;
  }

  startButton.addEventListener('click', async () => {
    const urlValue = urlInput.value.trim();
    if (!urlValue) {
        // 显示结果容器并显示错误信息
        resultsContainerWrapper.style.display = 'block';
        resultsContainer.innerHTML = '<div class="ping-result-item failure"><i class="fas fa-times-circle icon"></i><span>请输入一个有效的 URL。</span></div>';
        return;
    }

    // 显示结果容器
    resultsContainerWrapper.style.display = 'block';

    startButton.disabled = true;
    buttonText.textContent = '测试中...';
    spinner.classList.remove('hidden');
    resultsContainer.innerHTML = '';

    const onProgress = (message: string, success: boolean, latency?: number) => {
        const item = document.createElement('div');
        item.classList.add('ping-result-item');
        item.classList.add(success ? 'success' : 'failure');
        const iconClass = success ? 'fa-check-circle' : 'fa-times-circle';
        let content = `<i class="fas ${iconClass} icon"></i>`;
        if (typeof latency !== 'undefined') {
            content += `<span>${message}: 时间=${latency}ms</span>`;
        } else {
            content += `<span>${message}</span>`;
        }
        item.innerHTML = content;
        resultsContainer.appendChild(item);
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
    };

    const urlsToTest: string[] = [];
    if (urlValue.match(/^https?:\/\//)) {
        urlsToTest.push(urlValue);
    } else {
        urlsToTest.push(`https://${urlValue}`);
        urlsToTest.push(`http://${urlValue}`);
    }

    for (const url of urlsToTest) {
        await runPingTest(url, resultsContainer, onProgress);
        // Add a separator if there are more tests to run
        if (urlsToTest.length > 1 && url !== urlsToTest[urlsToTest.length - 1]) {
            const separator = document.createElement('hr');
            separator.style.marginTop = '20px';
            separator.style.marginBottom = '20px';
            separator.style.border = 'none';
            separator.style.borderTop = '1px solid #ccc';
            resultsContainer.appendChild(separator);
        }
    }

    startButton.disabled = false;
    buttonText.textContent = '开始测试';
    spinner.classList.add('hidden');
  });
} 