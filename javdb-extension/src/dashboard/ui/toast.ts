export function showMessage(message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.error("Message container not found!");
        return;
    }

    const div = document.createElement('div');
    // Map 'warn' to 'info' and handle 'success' correctly for CSS classes
    const displayType = type === 'warn' ? 'info' : type;
    div.className = `toast toast-${displayType}`;
    div.textContent = message;

    // Add an icon based on the type
    const icon = document.createElement('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-info-circle';
    }
    div.prepend(icon);

    container.appendChild(div);

    // Trigger the animation
    setTimeout(() => {
        div.classList.add('show');
    }, 10); // A small delay to allow the element to be painted first

    // Set a timer to remove the toast
    setTimeout(() => {
        div.classList.remove('show');
        // Remove the element from DOM after transition ends
        div.addEventListener('transitionend', () => div.remove());
    }, 5000); // Keep the toast on screen for 5 seconds
} 