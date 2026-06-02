import { describe, expect, it } from 'vitest';
import {
  buildInsightsModelOptions,
  resolveModelCustomInputState,
  resolveModelRestoredState,
  resolveModelSelectionState,
} from './modelDropdownModel';

describe('insights model dropdown model', () => {
  it('builds follow, available model, and custom options', () => {
    expect(buildInsightsModelOptions({
      selectedModel: 'global-model',
      enabled: true,
      models: [
        { id: 'gpt-a', name: 'GPT A' },
        { id: 'gpt-b' },
      ],
    })).toEqual([
      { value: '', label: '跟随全局（global-model）' },
      { value: 'gpt-a', label: 'GPT A (gpt-a)' },
      { value: 'gpt-b', label: 'gpt-b' },
      { value: '__custom__', label: '自定义…' },
    ]);
  });

  it('restores saved built-in and custom model overrides', () => {
    expect(resolveModelRestoredState('gpt-a', ['', 'gpt-a', '__custom__'])).toEqual({
      selectValue: 'gpt-a',
      customValue: '',
      customVisible: false,
      pageModelOverride: 'gpt-a',
    });

    expect(resolveModelRestoredState('custom-model', ['', 'gpt-a', '__custom__'])).toEqual({
      selectValue: '__custom__',
      customValue: 'custom-model',
      customVisible: true,
      pageModelOverride: 'custom-model',
    });

    expect(resolveModelRestoredState('', ['', 'gpt-a', '__custom__'])).toEqual({
      selectValue: '',
      customValue: '',
      customVisible: false,
      pageModelOverride: undefined,
    });
  });

  it('resolves selection and custom input state', () => {
    expect(resolveModelSelectionState('__custom__', ' custom ')).toEqual({
      customVisible: true,
      pageModelOverride: 'custom',
      storageValue: 'custom',
    });

    expect(resolveModelSelectionState('gpt-a', '')).toEqual({
      customVisible: false,
      pageModelOverride: 'gpt-a',
      storageValue: 'gpt-a',
    });

    expect(resolveModelCustomInputState('   ')).toEqual({
      pageModelOverride: undefined,
      storageValue: undefined,
    });
  });
});
