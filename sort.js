/**
 * Task Sorting Logic
 * @param {Object} a - The first task object
 * @param {Object} b - The second task object
 * @param {string} currentSortOrder - The sort order (e.g., 'dueDateAsc', 'priorityDesc', 'nameAZ')
 * @returns {number} - 0 if equal, negative if a < b, positive if a > b
 */
function sortTasksLogic(a, b, currentSortOrder) {
    switch (currentSortOrder) {
        case 'dueDateAsc':
            if (!a.dueDate && !b.dueDate) return 0;
            if (a.dueDate === b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        case 'dueDateDesc':
            if (!a.dueDate && !b.dueDate) return 0;
            if (a.dueDate === b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(b.dueDate) - new Date(a.dueDate);
        case 'priorityDesc':
            return (b.priority || 0) - (a.priority || 0);
        case 'priorityAsc':
            return (a.priority || 0) - (b.priority || 0);
        case 'nameAZ':
            return (a.text || '').toLowerCase().localeCompare((b.text || '').toLowerCase());
        case 'nameZA':
            return (b.text || '').toLowerCase().localeCompare((a.text || '').toLowerCase());
        default: return 0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sortTasksLogic
    };
}
