interface ModelOptionInput {
  id: string;
  name?: string;
}

interface BuildModelOptionsInput {
  selectedModel?: string;
  enabled: boolean;
  models?: ModelOptionInput[];
}

interface ModelOption {
  value: string;
  label: string;
}

interface ModelRestoredState {
  selectValue: string;
  customValue: string;
  customVisible: boolean;
  pageModelOverride?: string;
}

interface ModelSelectionState {
  customVisible: boolean;
  pageModelOverride?: string;
  storageValue?: string;
}

interface ModelCustomInputState {
  pageModelOverride?: string;
  storageValue?: string;
}

export function buildInsightsModelOptions(input: BuildModelOptionsInput): ModelOption[] {
  const options: ModelOption[] = [{
    value: '',
    label: input.selectedModel ? `跟随全局（${input.selectedModel}）` : '跟随全局（未选择）',
  }];

  if (input.enabled) {
    for (const model of input.models || []) {
      options.push({
        value: model.id,
        label: model.name ? `${model.name} (${model.id})` : model.id,
      });
    }
  }

  options.push({ value: '__custom__', label: '自定义…' });
  return options;
}

export function resolveModelRestoredState(restoredValue: string, optionValues: string[]): ModelRestoredState {
  const restored = (restoredValue || '').trim();
  if (restored && optionValues.includes(restored)) {
    return {
      selectValue: restored,
      customValue: '',
      customVisible: false,
      pageModelOverride: restored,
    };
  }

  if (restored) {
    return {
      selectValue: '__custom__',
      customValue: restored,
      customVisible: true,
      pageModelOverride: restored,
    };
  }

  return {
    selectValue: '',
    customValue: '',
    customVisible: false,
    pageModelOverride: undefined,
  };
}

export function resolveModelSelectionState(selectedValue: string, customValue: string): ModelSelectionState {
  const selected = selectedValue || '';
  if (selected === '__custom__') {
    const custom = (customValue || '').trim();
    return {
      customVisible: true,
      pageModelOverride: custom || undefined,
      storageValue: custom || undefined,
    };
  }

  return {
    customVisible: false,
    pageModelOverride: selected || undefined,
    storageValue: selected || undefined,
  };
}

export function resolveModelCustomInputState(customValue: string): ModelCustomInputState {
  const custom = (customValue || '').trim();
  return {
    pageModelOverride: custom || undefined,
    storageValue: custom || undefined,
  };
}
