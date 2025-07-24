import { getSettings, saveSettings } from './global.js';

// --- DOM Element Cache ---
let jsonConfigTextarea, editJsonBtn, saveJsonBtn;

/**
 * Initializes the Advanced Settings tab functionality.
 */
export function init() {
    // Cache DOM elements
    jsonConfigTextarea = document.getElementById('jsonConfig');
    editJsonBtn = document.getElementById('editJsonBtn');
    saveJsonBtn = document.getElementById('saveJsonBtn');

    if (!jsonConfigTextarea) {
        console.error("Advanced settings elements not found. Initialization failed.");
        return;
    }

    // Load initial data
    loadJsonConfig();

    // Attach event listeners
    editJsonBtn.addEventListener('click', enableJsonEdit);
    saveJsonBtn.addEventListener('click', handleSaveJson);
}

/**
 * Loads the current settings and displays them as a formatted JSON string.
 */
function loadJsonConfig() {
    jsonConfigTextarea.value = JSON.stringify(getSettings(), null, 2);
}

/**
 * Enables the JSON configuration textarea for editing.
 */
function enableJsonEdit() {
    jsonConfigTextarea.readOnly = false;
    jsonConfigTextarea.focus();
    editJsonBtn.classList.add('hidden');
    saveJsonBtn.classList.remove('hidden');
    showMessage('JSON editing enabled. Be careful!', 'warn');
}

/**
 * Handles saving the modified JSON configuration.
 */
async function handleSaveJson() {
    try {
        const newSettings = JSON.parse(jsonConfigTextarea.value);
        await saveSettings(newSettings);
        
        jsonConfigTextarea.readOnly = true;
        saveJsonBtn.classList.add('hidden');
        editJsonBtn.classList.remove('hidden');
        
        showMessage('JSON configuration saved successfully. The page will now reload to apply changes.');

        // Reload the page to ensure all components use the new settings
        setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
        showMessage(`Error parsing or saving JSON: ${error.message}`, 'error');
    }
} 