// import './dashboard.css';
import { initializeGlobalState } from './components/global.js';
// Utility functions are now imported directly into the components that need them.

document.addEventListener('DOMContentLoaded', async () => {
    await initializeGlobalState();
    initTabs();
    initGlobalEventListeners();
});

const loadedTabs = new Set();

async function loadTab(tabName) {
    if (loadedTabs.has(tabName) || !tabName) {
        return;
    }

    try {
        // Use chrome.runtime.getURL to get the absolute path for the module.
        // This is the correct way to handle dynamic imports in Manifest V3.
        const modulePath = chrome.runtime.getURL(`dashboard/components/${tabName}.js`);
        const module = await import(modulePath);

        if (module && typeof module.init === 'function') {
            module.init();
            loadedTabs.add(tabName);
        } else {
            console.error(`Module for tab '${tabName}' might not exist or lacks an init function.`);
        }
        
        // Also use getURL for the CSS path to be consistent.
        const cssPath = chrome.runtime.getURL(`dashboard/components/${tabName}.css`);
        const response = await fetch(cssPath, { method: 'HEAD' });
        if (response.ok) {
            const head = document.head;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = cssPath;
            head.appendChild(link);
        }
    } catch (error) {
        console.error(`Failed to load tab component '${tabName}':`, error);
    }
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    const switchTab = (tabButton) => {
        if (!tabButton) return;
        const tabId = tabButton.getAttribute('data-tab');
        const tabName = tabId.replace('tab-', '');

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tabButton.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        loadTab(tabName);
        
        if (history.pushState) {
            history.pushState(null, null, `#${tabId}`);
        } else {
            location.hash = `#${tabId}`;
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab));
    });

    const currentHash = window.location.hash.substring(1) || 'tab-records';
    const targetTab = document.querySelector(`.tab-link[data-tab="${currentHash}"]`);
    switchTab(targetTab || tabs[0]);
}

function initGlobalEventListeners() {
    // This is where you would initialize things that are *always* on the page,
    // like sidebar buttons, if their logic is not part of a specific tab.
} 