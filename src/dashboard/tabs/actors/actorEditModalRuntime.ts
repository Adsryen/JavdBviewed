import type { ActorRecord } from '../../../types';
import {
  buildActorEditModalHtml,
  buildActorRecordFromEditFormValues,
  getActorEditFormValuesFromRecord,
  normalizeActorEditableFieldValue,
  shouldAutoLockActorField,
  type ActorEditableField,
} from './editModalModel';

export type ActorEditModalToastType = 'success' | 'error' | 'info' | 'warning';

export interface ActorEditModalSaveContext {
  originalActor: ActorRecord;
  lockedFields: string[];
  closeModal(): void;
}

export interface ActorEditModalRuntimeHandlers {
  saveActor(updatedActor: ActorRecord, context: ActorEditModalSaveContext): Promise<void>;
  showMessage(message: string, type: ActorEditModalToastType): void;
  logError(context: string, error: unknown): void;
}

export function showActorEditModalRuntime(
  actor: ActorRecord,
  handlers: ActorEditModalRuntimeHandlers,
  doc: Document = document,
): void {
  const modal = doc.createElement('div');
  modal.className = 'edit-actor-modal';
  modal.innerHTML = buildActorEditModalHtml(actor);
  doc.body.appendChild(modal);

  const idInput = modal.querySelector('#edit-actor-id') as HTMLInputElement;
  const nameInput = modal.querySelector('#edit-actor-name') as HTMLInputElement;
  const aliasesInput = modal.querySelector('#edit-actor-aliases') as HTMLTextAreaElement;
  const genderSelect = modal.querySelector('#edit-actor-gender') as HTMLSelectElement;
  const categorySelect = modal.querySelector('#edit-actor-category') as HTMLSelectElement;
  const avatarInput = modal.querySelector('#edit-actor-avatar') as HTMLInputElement;
  const blacklistedCheckbox = modal.querySelector('#edit-actor-blacklisted') as HTMLInputElement;
  const jsonTextarea = modal.querySelector('#edit-actor-json') as HTMLTextAreaElement;
  const lockedFields = new Set<string>(actor.manuallyEditedFields || []);

  let isUpdatingFromForm = false;
  let isUpdatingFromJson = false;

  const closeModal = () => {
    if (modal.parentElement) {
      modal.parentElement.removeChild(modal);
    }
  };

  const setLockIconState = (lockIcon: Element, isLocked: boolean) => {
    if (isLocked) {
      lockIcon.classList.remove('fas', 'fa-lock-open', 'unlocked');
      lockIcon.classList.add('fas', 'fa-lock', 'locked');
      lockIcon.setAttribute('title', '此字段已锁定，不会被自动同步覆盖。点击解锁');
      return;
    }

    lockIcon.classList.remove('fas', 'fa-lock', 'locked');
    lockIcon.classList.add('fas', 'fa-lock-open', 'unlocked');
    lockIcon.setAttribute('title', '此字段会自动同步。编辑后将自动锁定');
  };

  const formToJson = () => {
    if (isUpdatingFromJson) return;
    isUpdatingFromForm = true;

    const formData = buildActorRecordFromEditFormValues(
      actor,
      {
        id: idInput.value,
        name: nameInput.value,
        aliases: aliasesInput.value,
        gender: genderSelect.value as ActorRecord['gender'],
        category: categorySelect.value as ActorRecord['category'],
        avatarUrl: avatarInput.value,
        blacklisted: !!(blacklistedCheckbox && blacklistedCheckbox.checked),
      },
      lockedFields,
    );
    jsonTextarea.value = JSON.stringify(formData, null, 2);

    isUpdatingFromForm = false;
  };

  const jsonToForm = () => {
    if (isUpdatingFromForm) return;
    isUpdatingFromJson = true;

    try {
      const jsonData = JSON.parse(jsonTextarea.value);
      const formValues = getActorEditFormValuesFromRecord(jsonData);
      idInput.value = formValues.id;
      nameInput.value = formValues.name;
      aliasesInput.value = formValues.aliases;
      genderSelect.value = formValues.gender;
      categorySelect.value = formValues.category;
      avatarInput.value = formValues.avatarUrl;
      if (blacklistedCheckbox) blacklistedCheckbox.checked = formValues.blacklisted;

      jsonTextarea.style.borderColor = '';
      jsonTextarea.title = '';
    } catch (error) {
      jsonTextarea.style.borderColor = '#ff4444';
      jsonTextarea.title = 'JSON格式错误';
    }

    isUpdatingFromJson = false;
  };

  bindLockIcons(modal, lockedFields, setLockIconState, formToJson);
  bindAutoLockFields(modal, actor, lockedFields, setLockIconState, {
    name: nameInput,
    aliases: aliasesInput,
    gender: genderSelect,
    category: categorySelect,
    avatarUrl: avatarInput,
  });

  [idInput, nameInput, aliasesInput, genderSelect, categorySelect, avatarInput, blacklistedCheckbox].forEach(element => {
    element.addEventListener('input', formToJson);
    element.addEventListener('change', formToJson);
  });
  jsonTextarea.addEventListener('input', jsonToForm);

  modal.querySelector('.edit-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#cancel-actor-edit')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal.querySelector('#save-actor')?.addEventListener('click', async () => {
    try {
      const updatedActor = JSON.parse(jsonTextarea.value) as ActorRecord;

      if (!updatedActor.id || !updatedActor.name) {
        handlers.showMessage('ID和姓名是必填字段', 'error');
        return;
      }

      updatedActor.updatedAt = Date.now();
      updatedActor.manuallyEditedFields = Array.from(lockedFields);

      await handlers.saveActor(updatedActor, {
        originalActor: actor,
        lockedFields: Array.from(lockedFields),
        closeModal,
      });
    } catch (error: any) {
      handlers.logError('[Actor] Failed to save actor:', error);
      handlers.showMessage(`保存失败: ${error.message}`, 'error');
    }
  });
}

function bindLockIcons(
  modal: HTMLElement,
  lockedFields: Set<string>,
  setLockIconState: (lockIcon: Element, isLocked: boolean) => void,
  formToJson: () => void,
): void {
  modal.querySelectorAll('.field-lock').forEach(lockIcon => {
    lockIcon.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const formGroup = (event.target as HTMLElement).closest('.form-group') as HTMLElement;
      const fieldName = formGroup?.getAttribute('data-field-name');
      if (!fieldName) return;

      const isCurrentlyLocked = lockedFields.has(fieldName);
      if (isCurrentlyLocked) {
        lockedFields.delete(fieldName);
      } else {
        lockedFields.add(fieldName);
      }

      setLockIconState(lockIcon, !isCurrentlyLocked);
      formToJson();
    });
  });
}

function bindAutoLockFields(
  modal: HTMLElement,
  actor: ActorRecord,
  lockedFields: Set<string>,
  setLockIconState: (lockIcon: Element, isLocked: boolean) => void,
  trackableFields: Record<ActorEditableField, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
): void {
  Object.entries(trackableFields).forEach(([fieldName, input]) => {
    input.addEventListener('change', () => {
      const editableField = fieldName as ActorEditableField;
      const currentValue = normalizeActorEditableFieldValue(editableField, input.value);

      if (shouldAutoLockActorField(actor, editableField, currentValue, lockedFields)) {
        lockedFields.add(fieldName);
        const formGroup = modal.querySelector(`[data-field-name="${fieldName}"]`);
        const lockIcon = formGroup?.querySelector('.field-lock');
        if (lockIcon) {
          setLockIconState(lockIcon, true);
        }
      }
    });
  });
}
