import { getRecords, getSettings } from './global.js';
import { VIDEO_STATUS } from '../../config.js';

// --- STATE for this component ---
let currentPage = 1;
const recordsPerPage = 20;
let filteredRecords = [];

// --- DOM Elements ---
let searchInput, filterSelect, videoList, paginationContainer;

/**
 * Initializes the Records tab functionality.
 */
export function init() {
    // Cache DOM elements
    searchInput = document.getElementById('searchInput');
    filterSelect = document.getElementById('filterSelect');
    videoList = document.getElementById('videoList');
    paginationContainer = document.querySelector('.pagination');

    if (!searchInput || !videoList) {
        console.error("Records tab elements not found. Initialization failed.");
        return;
    }

    // Attach event listeners
    searchInput.addEventListener('input', () => {
        currentPage = 1; // Reset to first page on new search
        updateFilteredRecords();
        render();
    });
    filterSelect.addEventListener('change', () => {
        currentPage = 1; // Reset to first page on filter change
        updateFilteredRecords();
        render();
    });

    // Initial load
    updateFilteredRecords();
    render();
}

/**
 * Updates the `filteredRecords` array based on current search and filter values.
 */
function updateFilteredRecords() {
    const allRecords = getRecords();
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;

    filteredRecords = allRecords.filter(record => {
        const matchesSearch = !searchTerm || 
                              record.id.toLowerCase().includes(searchTerm) ||
                              record.title.toLowerCase().includes(searchTerm);
        
        const matchesFilter = filterValue === 'all' || record.status === filterValue;

        return matchesSearch && matchesFilter;
    });
}

/**
 * Renders the video list and pagination for the current page.
 */
function render() {
    renderVideoList();
    renderPagination();
}

/**
 * Renders the list of video records for the current page.
 */
function renderVideoList() {
    videoList.innerHTML = '';
    
    if (filteredRecords.length === 0) {
        videoList.innerHTML = '<li class="empty-list">No records match your criteria.</li>';
        return;
    }

    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const recordsToRender = filteredRecords.slice(startIndex, endIndex);

    const searchEngines = getSettings().searchEngines || [];
    const defaultEngine = searchEngines.find(e => e.isDefault) || searchEngines[0];

    recordsToRender.forEach(record => {
        const li = document.createElement('li');
        li.className = 'video-item';
        li.dataset.uid = record.uid;

        let searchUrl = '#';
        if (defaultEngine && defaultEngine.url) {
            searchUrl = defaultEngine.url.replace('{{ID}}', encodeURIComponent(record.id));
        }

        li.innerHTML = `
            <span class="video-id"><a href="${searchUrl}" target="_blank">${record.id}</a></span>
            <span class="video-title">${record.title}</span>
            <span class="video-status status-${record.status}">${VIDEO_STATUS[record.status] || 'Unknown'}</span>
        `;
        videoList.appendChild(li);
    });
}

/**
 * Renders the pagination controls.
 */
function renderPagination() {
    paginationContainer.innerHTML = '';
    const pageCount = Math.ceil(filteredRecords.length / recordsPerPage);

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = 'page-button';
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentPage = i;
            render();
        });
        paginationContainer.appendChild(button);
    }
} 