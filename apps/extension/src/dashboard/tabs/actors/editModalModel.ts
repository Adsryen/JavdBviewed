import type { ActorRecord } from '../../../types';

export type ActorEditableField = 'name' | 'aliases' | 'gender' | 'category' | 'avatarUrl';

export interface ActorEditFormValues {
  id: string;
  name: string;
  aliases: string;
  gender: ActorRecord['gender'];
  category: ActorRecord['category'];
  avatarUrl: string;
  blacklisted: boolean;
}

export function buildActorEditModalHtml(actor: ActorRecord): string {
  return `
                <div class="edit-modal-content">
                    <div class="edit-modal-header">
                        <h3><i class="fas fa-user-edit"></i> 编辑演员: ${escapeHtml(actor.name)}</h3>
                        <button class="edit-modal-close">&times;</button>
                    </div>
                    <div class="edit-modal-body">
                        <div class="edit-form-container">
                            <div class="json-editor-container">
                                <div class="json-editor">
                                    <label for="edit-actor-json">原始JSON数据 <small style="color: #888;">(自动同步)</small>:</label>
                                    <textarea id="edit-actor-json" rows="30">${escapeTextareaValue(JSON.stringify(actor, null, 2))}</textarea>
                                </div>
                            </div>
                            <div class="edit-form">
                                <h4><i class="fas fa-id-card"></i> 基本信息</h4>
                                <div class="form-group">
                                    <label for="edit-actor-id">演员ID: <span class="required">*</span></label>
                                    <input type="text" id="edit-actor-id" value="${escapeAttribute(actor.id)}" />
                                    <small class="form-hint">修改ID后会创建新记录，原记录将被删除</small>
                                </div>
                                ${buildLockedFormGroupHtml(actor, 'name', '姓名', `<input type="text" id="edit-actor-name" value="${escapeAttribute(actor.name)}" />`, true)}
                                ${buildLockedFormGroupHtml(actor, 'aliases', '别名 (用逗号分隔)', `<textarea id="edit-actor-aliases" rows="2" placeholder="别名1, 别名2">${escapeTextareaValue((actor.aliases || []).join(', '))}</textarea>`)}

                                <div class="form-row">
                                    ${buildLockedFormGroupHtml(actor, 'gender', '性别', `
                                        <select id="edit-actor-gender">
                                            <option value="female" ${actor.gender === 'female' ? 'selected' : ''}>女性</option>
                                            <option value="male" ${actor.gender === 'male' ? 'selected' : ''}>男性</option>
                                            <option value="unknown" ${actor.gender === 'unknown' ? 'selected' : ''}>未知</option>
                                        </select>
                                    `)}
                                    ${buildLockedFormGroupHtml(actor, 'category', '分类', `
                                        <select id="edit-actor-category">
                                            <option value="censored" ${actor.category === 'censored' ? 'selected' : ''}>有码</option>
                                            <option value="uncensored" ${actor.category === 'uncensored' ? 'selected' : ''}>无码</option>
                                            <option value="western" ${actor.category === 'western' ? 'selected' : ''}>欧美</option>
                                            <option value="unknown" ${actor.category === 'unknown' ? 'selected' : ''}>未知</option>
                                        </select>
                                    `)}
                                </div>

                                ${buildLockedFormGroupHtml(actor, 'avatarUrl', '头像URL', `<input type="url" id="edit-actor-avatar" value="${escapeAttribute(actor.avatarUrl || '')}" placeholder="https://..." />`)}

                                <div class="form-group-checkbox">
                                    <input type="checkbox" id="edit-actor-blacklisted" ${actor.blacklisted ? 'checked' : ''} />
                                    <label for="edit-actor-blacklisted">加入黑名单</label>
                                    <small class="form-hint">仅本地偏好，不影响收藏同步</small>
                                </div>

                                ${buildActorWikiDataHtml(actor)}
                            </div>
                        </div>
                    </div>
                    <div class="edit-modal-footer">
                        <button id="save-actor" class="btn-primary"><i class="fas fa-save"></i> 保存</button>
                        <button id="cancel-actor-edit" class="btn-secondary"><i class="fas fa-times"></i> 取消</button>
                    </div>
                </div>
            `;
}

export function buildActorWikiDataHtml(actor: ActorRecord): string {
  if (!actor.wikiData) {
    return '';
  }

  return `
                <div class="wiki-data-section">
                    <h4><i class="fas fa-info-circle"></i> Wiki数据</h4>
                    <div class="wiki-data-grid">
                        ${actor.wikiData.age ? `<div class="wiki-item"><span class="wiki-label">年龄:</span> <span class="wiki-value">${actor.wikiData.age}岁</span></div>` : ''}
                        ${actor.wikiData.heightCm ? `<div class="wiki-item"><span class="wiki-label">身高:</span> <span class="wiki-value">${actor.wikiData.heightCm}cm</span></div>` : ''}
                        ${actor.wikiData.cup ? `<div class="wiki-item"><span class="wiki-label">罩杯:</span> <span class="wiki-value">${escapeHtml(actor.wikiData.cup)}</span></div>` : ''}
                        ${actor.wikiData.retired ? '<div class="wiki-item"><span class="wiki-label">状态:</span> <span class="wiki-value retired">已引退</span></div>' : ''}
                        ${actor.wikiData.wikiUrl ? `<div class="wiki-item"><a href="${escapeAttribute(actor.wikiData.wikiUrl)}" target="_blank" class="wiki-link"><i class="fas fa-external-link-alt"></i> Wikipedia</a></div>` : ''}
                        ${actor.wikiData.ig ? `<div class="wiki-item"><a href="${escapeAttribute(actor.wikiData.ig)}" target="_blank" class="social-link"><i class="fab fa-instagram"></i> Instagram</a></div>` : ''}
                        ${actor.wikiData.tw ? `<div class="wiki-item"><a href="${escapeAttribute(actor.wikiData.tw)}" target="_blank" class="social-link"><i class="fab fa-twitter"></i> Twitter</a></div>` : ''}
                    </div>
                </div>
            `;
}

export function buildLockedFormGroupHtml(
  actor: ActorRecord,
  fieldName: ActorEditableField,
  label: string,
  inputHtml: string,
  isRequired = false,
): string {
  const isLocked = actor.manuallyEditedFields?.includes(fieldName) || false;
  const lockIcon = isLocked
    ? '<i class="fas fa-lock field-lock locked" title="此字段已锁定，不会被自动同步覆盖。点击解锁"></i>'
    : '<i class="fas fa-lock-open field-lock unlocked" title="此字段会自动同步。编辑后将自动锁定"></i>';

  return `
                    <div class="form-group" data-field-name="${fieldName}">
                        <label>
                            ${escapeHtml(label)}${isRequired ? ': <span class="required">*</span>' : ':'}
                            ${lockIcon}
                        </label>
                        ${inputHtml}
                    </div>
                `;
}

export function buildActorRecordFromEditFormValues(
  actor: ActorRecord,
  values: ActorEditFormValues,
  lockedFields: Set<string> | string[],
  updatedAt = Date.now(),
): ActorRecord {
  const manuallyEditedFields = Array.isArray(lockedFields) ? lockedFields : Array.from(lockedFields);

  return {
    ...actor,
    id: values.id.trim(),
    name: values.name.trim(),
    aliases: parseActorAliases(values.aliases),
    gender: values.gender,
    category: values.category,
    avatarUrl: values.avatarUrl.trim() || undefined,
    blacklisted: values.blacklisted,
    manuallyEditedFields,
    updatedAt,
  };
}

export function getActorEditFormValuesFromRecord(record: Partial<ActorRecord>): ActorEditFormValues {
  return {
    id: record.id || '',
    name: record.name || '',
    aliases: record.aliases ? record.aliases.join(', ') : '',
    gender: record.gender || 'unknown',
    category: record.category || 'unknown',
    avatarUrl: record.avatarUrl || '',
    blacklisted: !!record.blacklisted,
  };
}

export function parseActorAliases(value: string): string[] {
  return value
    .split(',')
    .map(alias => alias.trim())
    .filter(Boolean);
}

export function normalizeActorEditableFieldValue(
  fieldName: ActorEditableField,
  rawValue: string,
): string | string[] | undefined {
  if (fieldName === 'aliases') {
    return parseActorAliases(rawValue);
  }

  return rawValue.trim() || undefined;
}

export function shouldAutoLockActorField(
  actor: ActorRecord,
  fieldName: ActorEditableField,
  currentValue: string | string[] | undefined,
  lockedFields: Set<string>,
): boolean {
  const originalValue = actor[fieldName];
  const hasChanged = JSON.stringify(originalValue) !== JSON.stringify(currentValue);

  return hasChanged && !lockedFields.has(fieldName);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function escapeTextareaValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
