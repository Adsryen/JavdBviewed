// background.js
// 负责长驻任务、WebDAV网络请求、消息转发等

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    async function handleWebdav() {
        console.log('Received WebDAV message:', message);

        if (message.type === 'webdav-test') {
            const { url, username, password } = message.settings;
            console.log('Testing WebDAV connection to:', url);
            try {
                const response = await fetch(url, {
                    method: 'PROPFIND',
                    headers: {
                        'Depth': '0',
                        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                    }
                });
                console.log('WebDAV test response:', response.status, response.statusText);
                if (response.status >= 200 && response.status < 300) {
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: `${response.status} ${response.statusText}` });
                }
            } catch (error) {
                console.error('WebDAV test fetch error:', error);
                sendResponse({ success: false, error: error.message });
            }
        } else if (message.type === 'webdav-upload') {
            const { settings, data } = message;
            const { url, username, password, path } = settings;
            console.log('Uploading to WebDAV path:', path);

            const json = JSON.stringify(data, null, 2);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `javdb-backup_${timestamp}.json`;
            const remotePath = path.endsWith('/') ? path : `${path}/`;
            const fullFolderPath = new URL(remotePath, url).href;
            const fullFilePath = new URL(filename, fullFolderPath).href;
            console.log('Full folder path:', fullFolderPath);
            console.log('Full file path:', fullFilePath);

            const headers = {
                'Authorization': 'Basic ' + btoa(`${username}:${password}`)
            };

            try {
                // 1. Create directory
                console.log('Attempting to create directory (MKCOL):', fullFolderPath);
                const mkcolResponse = await fetch(fullFolderPath, {
                    method: 'MKCOL',
                    headers: headers
                });
                console.log('MKCOL response:', mkcolResponse.status, mkcolResponse.statusText);

                // A 405 Method Not Allowed error means the directory likely already exists, which is acceptable.
                if (mkcolResponse.status !== 201 && mkcolResponse.status !== 405 && !(mkcolResponse.status >= 200 && mkcolResponse.status < 300)) {
                    throw new Error(`创建目录失败: ${mkcolResponse.status} ${mkcolResponse.statusText}`);
                }

                // 2. Upload file
                console.log('Attempting to upload file (PUT):', fullFilePath);
                const putResponse = await fetch(fullFilePath, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json;charset=utf-8' },
                    body: json
                });
                console.log('PUT response:', putResponse.status, putResponse.statusText);

                if (putResponse.status >= 200 && putResponse.status < 300) {
                    console.log('WebDAV upload successful.');
                    sendResponse({ success: true });
                } else {
                    throw new Error(`上传失败: ${putResponse.status} ${putResponse.statusText}`);
                }
            } catch (error) {
                console.error('WebDAV upload error:', error);
                sendResponse({ success: false, error: error.message });
            }
        }
    }

    if (message.type.startsWith('webdav-')) {
        handleWebdav();
        return true; // Indicates that the response is sent asynchronously
    }
}); 