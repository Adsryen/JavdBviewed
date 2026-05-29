export type RuntimeMessage = {
  type: string;
  [key: string]: any;
};

export function sendRuntimeMessage<TResponse = any>(message: RuntimeMessage): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      reject(new Error('Chrome runtime is not available'));
      return;
    }

    chrome.runtime.sendMessage(message, (response: TResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}
