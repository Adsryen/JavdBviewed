import { getSettings } from '../../utils/storage';
import { getDrive115V2Service, Drive115V2Task } from '../../services/drive115v2';

/**
 * 115网盘下载任务管理
 */
export class Drive115TasksManager {
  private container: HTMLElement | null = null;
  private loadingIndicator: HTMLElement | null = null;
  private statsContainer: HTMLElement | null = null;
  private paginationContainer: HTMLElement | null = null;
  
  private currentPage = 1;
  private isLoading = false;
  private tasks: Drive115V2Task[] = [];
  private totalCount = 0;
  private pageCount = 0;

  constructor() {
    this.initializeElements();
    this.bindEvents();
  }

  private initializeElements(): void {
    this.container = document.getElementById('drive115TasksContainer');
    this.loadingIndicator = document.getElementById('drive115TasksLoading');
    this.statsContainer = document.getElementById('drive115TasksStatsContainer');
    this.paginationContainer = document.getElementById('drive115TasksPaginationContainer');
  }

  private bindEvents(): void {
    // 添加任务按钮
    const addTaskBtn = document.getElementById('drive115AddTaskBtn');
    addTaskBtn?.addEventListener('click', () => this.handleAddTask());

    // 刷新任务列表按钮
    const refreshBtn = document.getElementById('drive115RefreshTasksBtn');
    refreshBtn?.addEventListener('click', () => this.refreshTasks());

    // 清空所有任务按钮
    const clearBtn = document.getElementById('drive115ClearTasksBtn');
    clearBtn?.addEventListener('click', () => this.handleClearTasks());

    // 输入框回车添加任务
    const urlInput = document.getElementById('drive115TaskUrlInput') as HTMLInputElement;
    urlInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleAddTask();
      }
    });
  }

  /**
   * 初始化任务列表页面
   */
  async initialize(): Promise<void> {
    this.showStats();
    await this.loadTasks();
  }

  /**
   * 显示统计信息
   */
  private showStats(): void {
    if (!this.statsContainer) return;

    const statsHtml = `
      <div class="stat-item">
        <div class="stat-value" id="totalTasksCount">-</div>
        <div class="stat-label">总任务数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="runningTasksCount">-</div>
        <div class="stat-label">下载中</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="completedTasksCount">-</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="failedTasksCount">-</div>
        <div class="stat-label">失败</div>
      </div>
    `;
    this.statsContainer.innerHTML = statsHtml;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const totalElement = document.getElementById('totalTasksCount');
    const runningElement = document.getElementById('runningTasksCount');
    const completedElement = document.getElementById('completedTasksCount');
    const failedElement = document.getElementById('failedTasksCount');

    if (totalElement) totalElement.textContent = this.totalCount.toString();

    const runningCount = this.tasks.filter(task => task.status === 1).length;
    const completedCount = this.tasks.filter(task => task.status === 2).length;
    const failedCount = this.tasks.filter(task => task.status === -1).length;

    if (runningElement) runningElement.textContent = runningCount.toString();
    if (completedElement) completedElement.textContent = completedCount.toString();
    if (failedElement) failedElement.textContent = failedCount.toString();
  }

  /**
   * 加载任务列表
   */
  async loadTasks(page: number = 1): Promise<void> {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      this.showLoading(true);

      const settings = await getSettings();
      const accessToken = settings?.drive115?.v2AccessToken;
      
      if (!accessToken) {
        this.showError('请先在设置中配置115网盘授权信息');
        return;
      }

      const drive115Service = getDrive115V2Service();
      const result = await drive115Service.getTaskList({
        accessToken: accessToken,
        page
      });

      if (!result.success) {
        this.showError(result.message || '获取任务列表失败');
        return;
      }

      const data = result.data || {};
      this.tasks = data.tasks || [];
      this.totalCount = data.count || 0;
      this.pageCount = data.page_count || 1;
      this.currentPage = page;

      this.renderTasks();
      this.renderPagination();
      this.updateStats();

    } catch (error: any) {
      console.error('加载任务列表失败:', error);
      this.showError(error.message || '加载任务列表失败');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * 渲染任务列表
   */
  private renderTasks(): void {
    if (!this.container) return;

    if (this.tasks.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-cloud-download-alt"></i>
          <h3>暂无下载任务</h3>
          <p>在上方输入框中添加下载链接开始使用</p>
        </div>
      `;
      return;
    }

    const tasksHtml = this.tasks.map(task => this.renderTaskItem(task)).join('');
    this.container.innerHTML = `<div class="tasks-list">${tasksHtml}</div>`;

    // 绑定任务项事件
    this.bindTaskEvents();
  }

  /**
   * 渲染单个任务项
   */
  private renderTaskItem(task: Drive115V2Task): string {
    const statusText = this.getStatusText(task.status);
    const statusClass = this.getStatusClass(task.status);
    const progress = task.percentDone || 0;
    const sizeText = this.formatSize(task.size || 0);
    const addTime = task.add_time ? new Date(task.add_time * 1000).toLocaleString() : '';

    return `
      <div class="task-item" data-hash="${task.info_hash}">
        <div class="task-header">
          <div class="task-icon">
            <i class="fas fa-file"></i>
          </div>
          <div class="task-info">
            <div class="task-name" title="${task.name || ''}">${task.name || '未知任务'}</div>
            <div class="task-meta">
              <span class="task-size">${sizeText}</span>
              <span class="task-time">添加时间: ${addTime}</span>
            </div>
          </div>
          <div class="task-status ${statusClass}">
            ${statusText}
          </div>
        </div>
        <div class="task-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">${progress}%</div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn delete-btn" data-action="delete" data-hash="${task.info_hash}" title="删除任务">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 绑定任务项事件
   */
  private bindTaskEvents(): void {
    const deleteButtons = this.container?.querySelectorAll('.delete-btn');
    deleteButtons?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const hash = (e.currentTarget as HTMLElement).dataset.hash;
        if (hash) {
          this.handleDeleteTask(hash);
        }
      });
    });
  }

  /**
   * 渲染分页控件
   */
  private renderPagination(): void {
    if (!this.paginationContainer || this.pageCount <= 1) {
      if (this.paginationContainer) {
        this.paginationContainer.innerHTML = '';
      }
      return;
    }

    let paginationHtml = '';
    
    // 上一页
    if (this.currentPage > 1) {
      paginationHtml += `<button class="page-btn" data-page="${this.currentPage - 1}">上一页</button>`;
    }

    // 页码
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.pageCount, this.currentPage + 2);

    if (startPage > 1) {
      paginationHtml += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        paginationHtml += `<span class="page-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      paginationHtml += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    if (endPage < this.pageCount) {
      if (endPage < this.pageCount - 1) {
        paginationHtml += `<span class="page-ellipsis">...</span>`;
      }
      paginationHtml += `<button class="page-btn" data-page="${this.pageCount}">${this.pageCount}</button>`;
    }

    // 下一页
    if (this.currentPage < this.pageCount) {
      paginationHtml += `<button class="page-btn" data-page="${this.currentPage + 1}">下一页</button>`;
    }

    this.paginationContainer.innerHTML = paginationHtml;

    // 绑定分页事件
    const pageButtons = this.paginationContainer.querySelectorAll('.page-btn');
    pageButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt((e.currentTarget as HTMLElement).dataset.page || '1');
        this.loadTasks(page);
      });
    });
  }

  /**
   * 处理添加任务
   */
  private async handleAddTask(): Promise<void> {
    const urlInput = document.getElementById('drive115TaskUrlInput') as HTMLInputElement;
    const urls = urlInput?.value?.trim();

    if (!urls) {
      this.showMessage('请输入下载链接', 'warning');
      return;
    }

    try {
      const settings = await getSettings();
      const accessToken = settings?.drive115?.v2AccessToken;
      
      if (!accessToken) {
        this.showMessage('请先在设置中配置115网盘授权信息', 'error');
        return;
      }

      const drive115Service = getDrive115V2Service();
      const result = await drive115Service.addTaskUrls({
        accessToken: accessToken,
        urls
      });

      if (!result.success) {
        this.showMessage(result.message || '添加任务失败', 'error');
        return;
      }

      this.showMessage('任务添加成功', 'success');
      urlInput.value = '';
      
      // 刷新任务列表
      await this.loadTasks(this.currentPage);

    } catch (error: any) {
      console.error('添加任务失败:', error);
      this.showMessage(error.message || '添加任务失败', 'error');
    }
  }

  /**
   * 处理删除任务
   */
  private async handleDeleteTask(infoHash: string): Promise<void> {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      const settings = await getSettings();
      const accessToken = settings?.drive115?.v2AccessToken;
      
      if (!accessToken) {
        this.showMessage('请先在设置中配置115网盘授权信息', 'error');
        return;
      }

      const drive115Service = getDrive115V2Service();
      const result = await drive115Service.deleteTask({
        accessToken: accessToken,
        info_hash: infoHash
      });

      if (!result.success) {
        this.showMessage(result.message || '删除任务失败', 'error');
        return;
      }

      this.showMessage('任务删除成功', 'success');
      
      // 刷新任务列表
      await this.loadTasks(this.currentPage);

    } catch (error: any) {
      console.error('删除任务失败:', error);
      this.showMessage(error.message || '删除任务失败', 'error');
    }
  }

  /**
   * 处理清空所有任务
   */
  private async handleClearTasks(): Promise<void> {
    if (!confirm('确定要清空所有任务吗？此操作不可恢复！')) {
      return;
    }

    try {
      const settings = await getSettings();
      const accessToken = settings?.drive115?.v2AccessToken;
      
      if (!accessToken) {
        this.showMessage('请先在设置中配置115网盘授权信息', 'error');
        return;
      }

      const drive115Service = getDrive115V2Service();
      const result = await drive115Service.clearTasks({
        accessToken: accessToken,
        flag: 1 // 清空全部任务
      });

      if (!result.success) {
        this.showMessage(result.message || '清空任务失败', 'error');
        return;
      }

      this.showMessage('任务清空成功', 'success');
      
      // 刷新任务列表
      await this.loadTasks(1);

    } catch (error: any) {
      console.error('清空任务失败:', error);
      this.showMessage(error.message || '清空任务失败', 'error');
    }
  }

  /**
   * 刷新任务列表
   */
  async refreshTasks(): Promise<void> {
    await this.loadTasks(this.currentPage);
  }

  /**
   * 显示/隐藏加载指示器
   */
  private showLoading(show: boolean): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * 显示错误信息
   */
  private showError(message: string): void {
    if (this.container) {
      this.container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>加载失败</h3>
          <p>${message}</p>
          <button class="button-like" onclick="window.drive115TasksManager?.refreshTasks()">重试</button>
        </div>
      `;
    }
  }

  /**
   * 显示消息提示
   */
  private showMessage(message: string, type: 'success' | 'warning' | 'error' = 'error'): void {
    // 创建消息提示元素
    const messageEl = document.createElement('div');
    messageEl.className = `message-toast ${type}`;
    messageEl.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(messageEl);

    // 3秒后自动移除
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  /**
   * 获取任务状态文本
   */
  private getStatusText(status?: number): string {
    switch (status) {
      case -1: return '下载失败';
      case 0: return '分配中';
      case 1: return '下载中';
      case 2: return '下载成功';
      default: return '未知状态';
    }
  }

  /**
   * 获取任务状态样式类
   */
  private getStatusClass(status?: number): string {
    switch (status) {
      case -1: return 'status-failed';
      case 0: return 'status-pending';
      case 1: return 'status-running';
      case 2: return 'status-completed';
      default: return 'status-unknown';
    }
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 全局实例
declare global {
  interface Window {
    drive115TasksManager?: Drive115TasksManager;
  }
}
