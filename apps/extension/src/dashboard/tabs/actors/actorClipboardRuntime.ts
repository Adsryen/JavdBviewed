export type ActorClipboardToastType = 'success' | 'error';

export interface ActorClipboardRuntimeHandlers {
  writeClipboard?(text: string): Promise<void>;
  execCopy?(text: string, textArea: HTMLTextAreaElement): boolean;
  showMessage(message: string, type: ActorClipboardToastType): void;
  logCopy(actorId: string, name: string, usedFallback: boolean): void | Promise<void>;
  logError(context: string, error: unknown): void;
}

export async function copyActorNameRuntime(
  actorId: string,
  name: string,
  event: Event | undefined,
  handlers: ActorClipboardRuntimeHandlers,
  doc: Document = document,
): Promise<void> {
  const restoreCopyAnimation = startCopyAnimation(event);

  try {
    await writeClipboardText(name, handlers);
    handlers.showMessage(`已复制：${name}`, 'success');
    void handlers.logCopy(actorId, name, false);
  } catch (error) {
    try {
      const successful = runFallbackCopy(name, handlers, doc);
      if (!successful) {
        throw new Error('Copy command failed');
      }

      handlers.showMessage(`已复制：${name}`, 'success');
      void handlers.logCopy(actorId, name, true);
    } catch (fallbackError) {
      handlers.logError('[Actor] Failed to copy actor name:', fallbackError);
      handlers.showMessage('复制失败，请手动复制', 'error');
      restoreCopyAnimation();
    }
  }
}

function startCopyAnimation(event: Event | undefined): () => void {
  const clickedElement = event?.target as HTMLElement | undefined;
  const nameElement = clickedElement?.closest('.actor-card-name, .actor-alias');

  if (!nameElement) {
    return () => {};
  }

  nameElement.classList.add('copying');
  const copyIcon = nameElement.querySelector('.actor-name-copy-icon, .actor-alias-copy-icon') as HTMLElement | null;
  if (!copyIcon) {
    return () => nameElement.classList.remove('copying');
  }

  const originalClass = copyIcon.className;
  copyIcon.className = copyIcon.className.replace('fa-copy', 'fa-check');
  copyIcon.style.color = '#28a745';

  const restore = () => {
    copyIcon.className = originalClass;
    copyIcon.style.color = '';
    nameElement.classList.remove('copying');
  };

  setTimeout(restore, 1000);
  return restore;
}

async function writeClipboardText(name: string, handlers: ActorClipboardRuntimeHandlers): Promise<void> {
  if (handlers.writeClipboard) {
    await handlers.writeClipboard(name);
    return;
  }

  await navigator.clipboard.writeText(name);
}

function runFallbackCopy(name: string, handlers: ActorClipboardRuntimeHandlers, doc: Document): boolean {
  const textArea = doc.createElement('textarea');
  textArea.value = name;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  textArea.style.opacity = '0';
  doc.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    return handlers.execCopy ? handlers.execCopy(name, textArea) : doc.execCommand('copy');
  } finally {
    doc.body.removeChild(textArea);
  }
}
