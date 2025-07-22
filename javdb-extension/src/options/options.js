// options.js
import { getValue, setValue } from '../utils/storage.js';

document.addEventListener('DOMContentLoaded', async function() {
  // 初始化表单
  const urlInput = document.getElementById('webdavUrl');
  const pathInput = document.getElementById('webdavPath');
  const userInput = document.getElementById('webdavUser');
  const passInput = document.getElementById('webdavPass');
  const form = document.getElementById('webdavForm');

  // 读取已保存设置
  const settings = await getValue('webdavSettings', { url: '', path: '', username: '', password: '' });
  urlInput.value = settings.url || '';
  pathInput.value = settings.path || '';
  userInput.value = settings.username || '';
  passInput.value = settings.password || '';

  form.onsubmit = async function(e) {
    e.preventDefault();
    const newSettings = {
      url: urlInput.value.trim(),
      path: pathInput.value.trim(),
      username: userInput.value.trim(),
      password: passInput.value
    };
    await setValue('webdavSettings', newSettings);
    alert('WebDAV 设置已保存');

    if (!newSettings.url) {
      alert('WebDAV URL 不能为空');
      return;
    }

    chrome.runtime.sendMessage({
      type: 'webdav-test',
      settings: newSettings
    }, resp => {
      if (resp.success) {
        alert('WebDAV 连接成功！');
      } else {
        alert(`WebDAV 连接失败: ${resp.status || ''} ${resp.statusText || resp.error}`);
      }
    });
  };
}); 