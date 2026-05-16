export type EnhancementUiStylesHost = any;

export function handleActorOpacityChange(host: EnhancementUiStylesHost): void {
  if (!host.actorWatermarkOpacity) return;
  const value = host.actorWatermarkOpacity.value;
  const opacityFloat = parseFloat(value);
  const percentage = Math.round(opacityFloat * 100);
  if (host.actorWatermarkOpacityValue) host.actorWatermarkOpacityValue.textContent = `${percentage}%`;
  const group = host.actorWatermarkOpacity.closest('.volume-control-group') as HTMLElement | null;
  const trackFill = group?.querySelector('.range-track-fill') as HTMLElement | null;
  if (trackFill) trackFill.style.width = `${percentage}%`;
  host.handleSettingChange();
}

export function handleColumnCountChange(host: EnhancementUiStylesHost): void {
  if (!host.listColumnCount) return;
  const value = parseInt(host.listColumnCount.value);
  if (host.listColumnCountValue) host.listColumnCountValue.textContent = `${value} 列`;
  const group = host.listColumnCount.closest('.form-group') as HTMLElement | null;
  const trackFill = group?.querySelector('.range-track-fill') as HTMLElement | null;
  if (trackFill) trackFill.style.width = `${((value - 1) / 7) * 100}%`;
  host.updateContainerWidthMax();
  host.handleSettingChange();
}

export function handleContainerWidthChange(host: EnhancementUiStylesHost): void {
  if (!host.listContainerWidth) return;
  const value = parseInt(host.listContainerWidth.value);
  if (host.listContainerWidthValue) host.listContainerWidthValue.textContent = `${value}%`;
  const group = host.listContainerWidth.closest('.volume-control-group') as HTMLElement | null;
  const trackFill = group?.querySelector('.range-track-fill') as HTMLElement | null;
  if (trackFill) trackFill.style.width = `${((value - 50) / 100) * 100}%`;
  host.handleSettingChange();
}

export function updateContainerWidthMax(host: EnhancementUiStylesHost): void {
  if (!host.listContainerWidth || !host.listColumnCount) return;

  const columnCount = parseInt(host.listColumnCount.value) || 4;
  const enableContainerExpansion = host.enableContainerExpansion?.checked === true;

  let maxWidth: number;
  if (enableContainerExpansion) {
    maxWidth = Math.floor(100 * columnCount / (columnCount - 0.3));
  } else {
    maxWidth = Math.floor(100 * columnCount / (columnCount - 0.8));
    if (columnCount >= 4 && columnCount <= 8) {
      maxWidth = Math.floor(maxWidth * 1.1);
    }
  }

  host.listContainerWidth.max = maxWidth.toString();

  const currentWidth = parseInt(host.listContainerWidth.value);
  if (currentWidth > maxWidth) {
    host.listContainerWidth.value = maxWidth.toString();
    if (host.listContainerWidthValue) {
      host.listContainerWidthValue.textContent = `${maxWidth}%`;
    }
    const group = host.listContainerWidth.closest('.volume-control-group') as HTMLElement | null;
    const trackFill = group?.querySelector('.range-track-fill') as HTMLElement | null;
    if (trackFill) trackFill.style.width = `${((maxWidth - 50) / 100) * 100}%`;
  }

  console.log('[Enhancement] Container width max updated to:', maxWidth, 'for column count:', columnCount, 'expansion:', enableContainerExpansion);
}

export function getPreferredPreviewSource(host: EnhancementUiStylesHost): 'auto' | 'javdb' | 'javspyl' | 'avpreview' | 'vbgfl' {
  if (host.previewSourceJavDB?.checked) return 'javdb';
  if (host.previewSourceJavSpyl?.checked) return 'javspyl';
  if (host.previewSourceAVPreview?.checked) return 'avpreview';
  if (host.previewSourceVBGFL?.checked) return 'vbgfl';
  return 'auto';
}

export function updateCurrentPreviewDelayDisplay(host: EnhancementUiStylesHost): void {
  const span = document.getElementById('currentPreviewDelay');
  if (!span) return;
  const val = (host.previewDelay?.value || '').trim();
  const n = parseInt(val || '0', 10);
  span.textContent = isNaN(n) ? '—' : String(n);
}
export function setupCheckboxGroupStyles(): void {
  const checkboxGroups = document.querySelectorAll('.form-group.checkbox-group');

  checkboxGroups.forEach(group => {
    const checkboxes = group.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      const label = checkbox.closest('.checkbox-label');
      if (!label) return;

      updateCheckboxLabelState(checkbox as HTMLInputElement, label as HTMLElement);
      checkbox.addEventListener('change', () => {
        updateCheckboxLabelState(checkbox as HTMLInputElement, label as HTMLElement);
      });
    });
  });
}

function updateCheckboxLabelState(checkbox: HTMLInputElement, label: HTMLElement): void {
  if (checkbox.checked) label.classList.add('checked');
  else label.classList.remove('checked');
}

export function setupAnchorConfigStyles(): void {
  const anchorConfigContainer = document.querySelector('.anchor-config-container');
  if (!anchorConfigContainer) return;

  const toggleInput = anchorConfigContainer.querySelector('#showPreviewButton') as HTMLInputElement;
  if (toggleInput) {
    const option = toggleInput.closest('.anchor-config-option');
    if (option) {
      updateAnchorConfigState(toggleInput, option as HTMLElement);
      toggleInput.addEventListener('change', () => {
        updateAnchorConfigState(toggleInput, option as HTMLElement);
      });
    }
  }

  const selectInput = anchorConfigContainer.querySelector('#anchorButtonPosition') as HTMLSelectElement;
  if (selectInput) {
    const option = selectInput.closest('.anchor-config-option');
    if (option) {
      selectInput.addEventListener('focus', () => {
        option.classList.add('active');
      });
      selectInput.addEventListener('blur', () => {
        option.classList.remove('active');
      });
      selectInput.addEventListener('change', () => {
        option.classList.add('active');
        setTimeout(() => {
          option.classList.remove('active');
        }, 1000);
      });
    }
  }
}

function updateAnchorConfigState(input: HTMLInputElement, option: HTMLElement): void {
  if (input.checked) option.classList.add('active');
  else option.classList.remove('active');
}

export function setupVolumeControlStyles(): void {
  console.log('[Enhancement] 开始设置音量控制样式...');

  const volumeSlider = document.getElementById('previewVolume') as HTMLInputElement;
  const volumeGroup = document.querySelector('.volume-control-group') as HTMLElement;

  if (!volumeSlider) {
    console.warn('[Enhancement] 未找到音量滑块元素 #previewVolume');
    return;
  }

  if (!volumeGroup) {
    console.warn('[Enhancement] 未找到音量控制组元素 .volume-control-group');
    return;
  }

  const trackFill = volumeGroup.querySelector('.range-track-fill') as HTMLElement;
  const volumeValue = volumeGroup.querySelector('.volume-percentage') as HTMLElement;

  if (!trackFill) {
    console.warn('[Enhancement] 未找到进度条元素 .range-track-fill');
    return;
  }

  if (!volumeValue) {
    console.warn('[Enhancement] 未找到百分比显示元素 .volume-percentage');
    return;
  }

  console.log('[Enhancement] 所有音量控制元素找到，开始绑定事件...');

  const updateTrackFill = () => {
    const value = parseFloat(volumeSlider.value);
    const percentage = Math.round(value * 100);
    trackFill.style.width = `${percentage}%`;
    volumeValue.textContent = `${percentage}%`;
    console.log(`[Enhancement] 音量更新: ${percentage}%, 进度条宽度: ${trackFill.style.width}`);
  };

  updateTrackFill();
  setTimeout(updateTrackFill, 100);
  volumeSlider.addEventListener('input', updateTrackFill);
  volumeSlider.addEventListener('change', updateTrackFill);
  volumeSlider.addEventListener('mousedown', () => {
    volumeGroup.classList.add('active');
  });
  volumeSlider.addEventListener('mouseup', () => {
    volumeGroup.classList.remove('active');
  });
  volumeSlider.addEventListener('touchstart', () => {
    volumeGroup.classList.add('active');
  });
  volumeSlider.addEventListener('touchend', () => {
    volumeGroup.classList.remove('active');
  });

  console.log('[Enhancement] 音量控制样式设置完成');
}
