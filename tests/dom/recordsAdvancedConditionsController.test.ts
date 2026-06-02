import { describe, expect, it, vi } from 'vitest';
import { createRecordsAdvancedConditionsController } from '../../src/dashboard/tabs/records/advancedConditionsController';
import type { RecordsAdvancedCondition } from '../../src/dashboard/tabs/records/advancedConditionModel';

function createController(initialConditions: RecordsAdvancedCondition[] = []) {
  document.body.innerHTML = `
    <div id="advConditions"></div>
    <select id="quickTimeField">
      <option value="createdAt">创建时间</option>
      <option value="updatedAt">更新时间</option>
    </select>
    <input id="quickTimeValue" />
    <select id="quickTimeUnit">
      <option value="days">天</option>
      <option value="hours">小时</option>
    </select>
    <span id="quickTimePreview"></span>
  `;
  const onConditionsChange = vi.fn();
  const showMessage = vi.fn();
  const controller = createRecordsAdvancedConditionsController({
    container: document.getElementById('advConditions') as HTMLDivElement,
    quickTimeField: document.getElementById('quickTimeField') as HTMLSelectElement,
    quickTimeValue: document.getElementById('quickTimeValue') as HTMLInputElement,
    quickTimeUnit: document.getElementById('quickTimeUnit') as HTMLSelectElement,
    quickTimePreview: document.getElementById('quickTimePreview') as HTMLSpanElement,
    getConditions: () => initialConditions,
    setConditions: (conditions) => {
      initialConditions.splice(0, initialConditions.length, ...conditions);
    },
    onConditionsChange,
    showMessage,
    now: () => new Date('2026-06-01T00:00:00Z').getTime(),
  });
  return { controller, onConditionsChange, showMessage, conditions: initialConditions };
}

describe('records advanced conditions controller', () => {
  it('creates condition rows with field operators and parses them back', () => {
    const { controller } = createController();

    controller.addCondition({ id: 'cond-1', field: 'tags', op: 'includes_all', value: '高清 字幕' });
    const row = document.querySelector('.adv-condition-row') as HTMLDivElement;

    expect((row.querySelector('.adv-field') as HTMLSelectElement).value).toBe('tags');
    expect((row.querySelector('.adv-operator') as HTMLSelectElement).value).toBe('includes_all');
    expect((row.querySelector('.adv-value') as HTMLInputElement).placeholder).toContain('多个值');
    expect(controller.parseFromUI()).toEqual([
      { id: 'cond-1', field: 'tags', op: 'includes_all', value: '高清 字幕' },
    ]);
  });

  it('hides the value input for empty operators', () => {
    const { controller } = createController();
    controller.addCondition({ id: 'cond-1', field: 'id', op: 'empty' });

    const input = document.querySelector('.adv-value') as HTMLInputElement;

    expect(input.style.display).toBe('none');
    expect(controller.parseFromUI()).toEqual([{ id: 'cond-1', field: 'id', op: 'empty', value: undefined }]);
  });

  it('removes rows and notifies caller', () => {
    const { controller, onConditionsChange, conditions } = createController([
      { id: 'cond-1', field: 'id', op: 'contains', value: 'ABC' },
    ]);
    controller.renderConditions();

    (document.querySelector('.adv-remove') as HTMLButtonElement).click();

    expect(document.querySelector('.adv-condition-row')).toBeNull();
    expect(conditions).toEqual([]);
    expect(onConditionsChange).toHaveBeenCalled();
  });

  it('adds quick relative time conditions and updates preview', () => {
    const { controller, conditions } = createController();
    (document.getElementById('quickTimeValue') as HTMLInputElement).value = '2';
    (document.getElementById('quickTimeUnit') as HTMLSelectElement).value = 'days';

    controller.updateQuickTimePreview();
    controller.addQuickTimeCondition();

    expect((document.getElementById('quickTimePreview') as HTMLSpanElement).textContent).toContain('createdAt ≥');
    expect(conditions).toHaveLength(1);
    expect(conditions[0]).toMatchObject({ field: 'createdAt', op: 'gte' });
  });

  it('shows a warning for invalid quick relative time input', () => {
    const { controller, showMessage, conditions } = createController();
    (document.getElementById('quickTimeValue') as HTMLInputElement).value = '0';

    controller.addQuickTimeCondition();

    expect(showMessage).toHaveBeenCalledWith('请输入有效的数字 N', 'warn');
    expect(conditions).toHaveLength(0);
  });
});
