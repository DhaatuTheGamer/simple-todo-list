// --- DOM Elements ---
        const todoInput = document.getElementById('todoInput');
        const addTodoBtn = document.getElementById('addTodoBtn');
        const todoList = document.getElementById('todoList'); 
        const emptyListMessage = document.getElementById('emptyListMessage');
        const emptyFilterMessage = document.getElementById('emptyFilterMessage');
        const confirmationModal = document.getElementById('confirmationModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const themeIconSun = document.getElementById('themeIconSun');
        const themeIconMoon = document.getElementById('themeIconMoon');
        const filterButtons = document.querySelectorAll('.sidebar-link'); 
        const inputError = document.getElementById('inputError');
        const taskCountElement = document.getElementById('taskCount');
        const sidebarTaskCountElement = document.getElementById('sidebarTaskCount');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        const clearCompletedContainer = document.getElementById('clearCompletedContainer');
        const clearConfirmationModal = document.getElementById('clearConfirmationModal');
        const confirmClearBtn = document.getElementById('confirmClearBtn');
        const cancelClearBtn = document.getElementById('cancelClearBtn');
        
        // --- App State ---
        let todoIdToDelete = null; 
        let currentFilter = 'all'; 
        let currentSearchTerm = ''; 
        let currentSortOrder = 'default'; 
        let currentParentIdForNewTask = null; 
        let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'; 
        let currentlyEditing = null; 
        let draggedItem = null; 
        let memoizedTodos = null;

        // --- Event Listeners (Initial Setup) ---
        addTodoBtn.addEventListener('click', addTodo); 
        todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); else clearInputError(); }); 
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
           searchInput.addEventListener('input', handleSearchInput);
        }
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
           sortSelect.addEventListener('change', handleSortChange);
        }
        const setRecurrenceBtnMain = document.getElementById('setRecurrenceBtnMain');
        if (setRecurrenceBtnMain) {
            setRecurrenceBtnMain.addEventListener('click', () => toggleRecurrencePanel('mainRecurrenceOptions', null));
        }


        todoList.addEventListener('click', handleListClick); 
        todoList.addEventListener('dblclick', handleListDoubleClick); 
        document.addEventListener('DOMContentLoaded', initializeApp); 
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete); 
        cancelDeleteBtn.addEventListener('click', handleCancelDelete); 
        confirmationModal.addEventListener('click', (e) => e.target === confirmationModal && handleCancelDelete()); 
        clearCompletedBtn.addEventListener('click', showClearConfirmationModal); 
        confirmClearBtn.addEventListener('click', handleConfirmClear); 
        cancelClearBtn.addEventListener('click', hideClearConfirmationModal); 
        clearConfirmationModal.addEventListener('click', (e) => e.target === clearConfirmationModal && hideClearConfirmationModal()); 
        document.addEventListener('keydown', handleGlobalKeyDown); 
        sidebarToggleBtn.addEventListener('click', toggleSidebar); 
        filterButtons.forEach(button => button.addEventListener('click', handleFilterClick)); 
        themeToggleBtn.addEventListener('click', toggleTheme); 

        // --- Drag & Drop Event Listeners ---
        todoList.addEventListener('dragstart', handleDragStart);     
        todoList.addEventListener('dragend', handleDragEnd);         
        todoList.addEventListener('dragover', handleDragOver);       
        todoList.addEventListener('dragleave', handleDragLeave);     
        todoList.addEventListener('drop', handleDrop);               


        // --- Initialization ---
        function initializeApp() {
            loadTheme(); 
            applyInitialSidebarState(); 
            loadTodos(); 
        }

        // --- Core Functions ---
        function addTodo() {
            const todoText = todoInput.value.trim(); 
            if (todoText === '') { 
                showInputError("Task cannot be empty!"); 
                return; 
            }
            clearInputError(); 
            const dueDateInput = document.getElementById('todoDueDateInput'); 
            const dueDateValue = dueDateInput ? dueDateInput.value : null;

            const priorityInput = document.getElementById('todoPriorityInput');
            const priorityValue = priorityInput ? parseInt(priorityInput.value, 10) : 2; 
            
            let parentId = null;
            let level = 0;

            if (currentParentIdForNewTask !== null) {
                parentId = Number(currentParentIdForNewTask);
                const parentTask = getTodosFromStorage().find(t => t.id === parentId);
                if (parentTask) {
                    level = parentTask.level + 1;
                } else {
                    console.error("Parent task not found for sub-task creation. Defaulting to top-level.");
                    parentId = null; 
                }
            }
            
            const recurrenceData = collectRecurrenceData('main');

            const todo = { 
                text: todoText, 
                completed: false, 
                id: Date.now(), 
                starred: false,
                dueDate: dueDateValue || null, 
                priority: isNaN(priorityValue) || ![1,2,3].includes(priorityValue) ? 2 : priorityValue,
                parentId: parentId,
                level: level,
                recurrence: recurrenceData 
            };
            const todos = [...getTodosFromStorage()];
            todos.unshift(todo); 
            saveTodosToStorage(todos);
            
            if (currentParentIdForNewTask !== null) {
                currentParentIdForNewTask = null; 
                todoInput.placeholder = "Add a new task..."; 
            }
            document.getElementById('mainRecurrenceOptions').classList.add('hidden'); // Hide after add

            loadTodos(); 
            
            todoInput.value = ''; 
            if(dueDateInput) dueDateInput.value = ''; 
            if(priorityInput) priorityInput.value = '2'; 
            todoInput.focus(); 
        }

        function renderTodoItem(todo) {
            const li = document.createElement('li');
            li.classList.add('flex', 'items-center', 'bg-list-item', 'hover:bg-list-item-hover', 'transition', 'p-0'); 
            li.dataset.id = todo.id;
            li.dataset.starred = todo.starred;
            li.dataset.completed = todo.completed;
            li.dataset.priority = todo.priority; 
            li.dataset.level = todo.level || 0; 
            li.setAttribute('aria-level', (todo.level || 0) + 1);
            li.style.marginLeft = `${(todo.level || 0) * 25}px`; 

            if (todo.priority === 1) li.classList.add('priority-low');
            else if (todo.priority === 3) li.classList.add('priority-high');
            else li.classList.add('priority-medium'); 
            
            li.draggable = currentSortOrder === 'default' && !todo.completed && (todo.level || 0) === 0;
            li.style.cursor = (li.draggable) ? 'grab' : 'default';

            if (todo.completed) li.classList.add('completed'); 
            if (todo.starred) li.classList.add('starred');

            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('flex', 'items-center', 'flex-grow', 'min-w-0', 'py-3', 'pl-4', 'pr-2'); 
            const checkbox = document.createElement('div');
            checkbox.classList.add('checkbox-icon');
            checkbox.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
            checkbox.dataset.action = 'toggleComplete'; 
            checkbox.setAttribute('role', 'checkbox'); checkbox.setAttribute('aria-checked', todo.completed); checkbox.setAttribute('aria-label', 'Mark task as complete');
            const textSpan = document.createElement('span');
            textSpan.textContent = todo.text;
            textSpan.classList.add('todo-text', 'flex-grow', 'text-main', 'mx-3', 'min-w-0', 'truncate'); 
            
            contentWrapper.appendChild(checkbox); 
            contentWrapper.appendChild(textSpan); 

            if (todo.dueDate) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.classList.add('task-due-date', 'text-xs', 'text-meta', 'ml-2', 'whitespace-nowrap', 'pl-1', 'pr-1'); 
                dueDateSpan.textContent = `Due: ${todo.dueDate}`; 
                contentWrapper.appendChild(dueDateSpan); 
            }
             // Display recurrence info if present
            const recurrenceSummary = getRecurrenceSummary(todo.recurrence);
            if (recurrenceSummary) {
                const recurrenceSpan = document.createElement('span');
                recurrenceSpan.classList.add('task-recurrence-info', 'text-xs', 'text-blue-500', 'dark:text-blue-400', 'ml-2', 'whitespace-nowrap', 'pl-1', 'pr-1', 'italic');
                recurrenceSpan.textContent = recurrenceSummary;
                contentWrapper.appendChild(recurrenceSpan);
            }

            const buttonWrapper = document.createElement('div');
            buttonWrapper.classList.add('flex', 'items-center', 'flex-shrink-0', 'pr-3', 'py-3'); 
            const starBtn = document.createElement('button');
            starBtn.classList.add('star-btn', 'p-1', 'rounded-full'); 
            starBtn.dataset.action = 'star'; 
            starBtn.innerHTML = `<svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"></path></svg>`;
            starBtn.setAttribute('aria-label', todo.starred ? 'Unstar task' : 'Star task'); starBtn.setAttribute('aria-pressed', todo.starred);
            
            const MAX_SUBTASK_LEVEL = 2; 
            if ((todo.level || 0) < MAX_SUBTASK_LEVEL) {
                const addSubtaskBtn = document.createElement('button');
                addSubtaskBtn.classList.add('add-subtask-btn', 'ml-2', 'p-1', 'rounded-full', 'hover:bg-gray-200', 'dark:hover:bg-gray-700');
                addSubtaskBtn.title = "Add sub-task";
                addSubtaskBtn.dataset.action = 'addSubtask';
                addSubtaskBtn.dataset.parentId = todo.id;
                addSubtaskBtn.innerHTML = `<svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`;
                buttonWrapper.appendChild(addSubtaskBtn); 
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn', 'ml-2', 'p-1', 'rounded-full'); 
            deleteBtn.dataset.action = 'delete'; 
            deleteBtn.innerHTML = `<svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
            deleteBtn.setAttribute('aria-label', 'Delete task');
            
            buttonWrapper.appendChild(starBtn); 
            buttonWrapper.appendChild(deleteBtn);

            li.appendChild(contentWrapper); li.appendChild(buttonWrapper);
            todoList.appendChild(li); 
        }

        // --- Event Handlers ---
        function handleListClick(event) {
            if (currentlyEditing !== null) return; 
            const target = event.target; 
            const li = target.closest('li[data-id]'); 
            if (!li) return; 
            const todoId = Number(li.dataset.id); 
            const actionTarget = target.closest('[data-action]'); 
            if (actionTarget) {
                const action = actionTarget.dataset.action; 
                if (action === 'delete') showConfirmationModal(todoId); 
                else if (action === 'star') toggleStar(todoId, li, actionTarget); 
                else if (action === 'toggleComplete') toggleComplete(todoId, li, actionTarget); 
                else if (action === 'addSubtask') {
                    const parentId = actionTarget.dataset.parentId;
                    currentParentIdForNewTask = parentId;
                    const parentTask = getTodosFromStorage().find(t => t.id === Number(parentId));
                    const parentText = parentTask ? parentTask.text : '';
                    todoInput.placeholder = `Adding sub-task to: "${parentText.substring(0,20)}${parentText.length > 20 ? '...' : ''}"`;
                    todoInput.focus();
                }
            } 
        }
        
        function handleListDoubleClick(event) {
            const target = event.target;
            if (target.classList.contains('todo-text') && !target.closest('li.completed')) {
                const li = target.closest('li[data-id]');
                if (li && currentlyEditing === null) { 
                    enterEditMode(li, target, Number(li.dataset.id)); 
                }
            }
        }
        
        function handleGlobalKeyDown(event) {
             if (event.key === 'Escape') {
                 if (confirmationModal.classList.contains('visible')) handleCancelDelete(); 
                 if (clearConfirmationModal.classList.contains('visible')) hideClearConfirmationModal(); 
                 if (currentlyEditing !== null) { 
                    const li = todoList.querySelector(`li[data-id="${currentlyEditing}"]`);
                    const textEditInput = li?.querySelector('.edit-input'); 
                    if(li && textEditInput) saveEdit(li, textEditInput, currentlyEditing, true); 
                 }
             }
        }

        // --- Edit Mode ---
        function createEditControls(todoId, originalTextContent, taskDataForEdit) {
            const editWrapper = document.createElement('div');
            editWrapper.classList.add('edit-controls-wrapper'); 

            const textEditInput = document.createElement('input');
            textEditInput.type = 'text';
            textEditInput.value = originalTextContent;
            textEditInput.classList.add('edit-input'); 

            const editDueDateInput = document.createElement('input');
            editDueDateInput.type = 'date';
            editDueDateInput.id = 'editDueDateInput'; 
            editDueDateInput.classList.add('edit-due-date-input'); 
            if (taskDataForEdit && taskDataForEdit.dueDate) editDueDateInput.value = taskDataForEdit.dueDate;
            
            const editPriorityInput = document.createElement('select');
            editPriorityInput.id = 'editPriorityInput';
            editPriorityInput.classList.add('edit-priority-select'); 
            const priorities = [{value: 1, text: 'Low'}, {value: 2, text: 'Medium'}, {value: 3, text: 'High'}];
            priorities.forEach(p => {
                const option = document.createElement('option');
                option.value = p.value; option.textContent = p.text;
                if (taskDataForEdit && taskDataForEdit.priority === p.value) option.selected = true;
                editPriorityInput.appendChild(option);
            });

            const setRecurrenceBtnEdit = document.createElement('button');
            setRecurrenceBtnEdit.type = 'button';
            setRecurrenceBtnEdit.textContent = 'Set Recurrence';
            setRecurrenceBtnEdit.classList.add('btn-text', 'text-xs', 'ml-auto'); 
            const editRecurrencePanelId = `editRecurrenceOptions_${todoId}`;
            setRecurrenceBtnEdit.onclick = () => toggleRecurrencePanel(editRecurrencePanelId, todoId);

            editWrapper.appendChild(textEditInput); 
            editWrapper.appendChild(editDueDateInput);
            editWrapper.appendChild(editPriorityInput);
            editWrapper.appendChild(setRecurrenceBtnEdit); 
            
            const editRecurrencePanel = document.createElement('div');
            editRecurrencePanel.id = editRecurrencePanelId;
            editRecurrencePanel.classList.add('edit-recurrence-panel', 'hidden', 'w-full'); 
            editWrapper.appendChild(editRecurrencePanel); 

            return {
                editWrapper,
                textEditInput,
                editDueDateInput,
                editPriorityInput
            };
        }

        function setupEditModeEventListeners(li, todoId, controls) {
            const { editWrapper, textEditInput, editDueDateInput, editPriorityInput } = controls;
            
            const saveOnBlurOrEnter = (event) => {
                const targetIsInsideEditWrapper = editWrapper.contains(event.relatedTarget);
                const targetIsRecurrencePanelItself = event.relatedTarget && event.relatedTarget.closest('.edit-recurrence-panel, .recurrence-options-panel');

                if (event.type === 'blur' && (targetIsInsideEditWrapper || targetIsRecurrencePanelItself)) {
                    return; 
                }
                document.removeEventListener('click', outsideClickListener, true); 
                textEditInput.removeEventListener('blur', saveOnBlurOrEnter);
                editDueDateInput.removeEventListener('blur', saveOnBlurOrEnter);
                editPriorityInput.removeEventListener('blur', saveOnBlurOrEnter);
                saveEdit(li, textEditInput, todoId, false); 
            };
            
            const outsideClickListener = (event) => {
                if (!li.contains(event.target) && !event.target.closest('.modal-overlay')) { 
                    saveOnBlurOrEnter(event); 
                }
            };

            // Expose for external access like removing listener
            controls.outsideClickListener = outsideClickListener;

            setTimeout(() => {
                document.addEventListener('click', outsideClickListener, true); 
            }, 0);
            
            textEditInput.addEventListener('blur', saveOnBlurOrEnter);
            editDueDateInput.addEventListener('blur', saveOnBlurOrEnter);
            editPriorityInput.addEventListener('blur', saveOnBlurOrEnter);

            textEditInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveOnBlurOrEnter(e); } 
                else if (e.key === 'Escape') { saveEdit(li, textEditInput, todoId, true); } 
            });
            editDueDateInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') saveEdit(li, textEditInput, todoId, true); });
            editPriorityInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') saveEdit(li, textEditInput, todoId, true); });
        }

        function enterEditMode(li, textSpan, todoId) {
            currentlyEditing = todoId;
            li.classList.add('editing');
            li.draggable = false;
            li.style.cursor = 'default';

            const taskDataForEdit = getTodosFromStorage().find(t => t.id === todoId);

            const originalTextSpan = li.querySelector('.todo-text');
            const actionButtons = li.querySelector('.flex-shrink-0');

            if (originalTextSpan) originalTextSpan.classList.add('hidden');
            if (actionButtons) actionButtons.classList.add('hidden');

            const controls = createEditControls(todoId, originalTextSpan ? originalTextSpan.textContent : '', taskDataForEdit);
            const { editWrapper, textEditInput } = controls;

            const checkbox = li.querySelector('.checkbox-icon');
            if (checkbox) checkbox.after(editWrapper);

            textEditInput.focus();
            textEditInput.select();

            setupEditModeEventListeners(li, todoId, controls);

            // To ensure we can access it on saveEdit/exitEditMode
            li._outsideClickListener = controls.outsideClickListener;
        }

        function exitEditMode(li, editWrapper, textSpanToUnhide, actionButtonsToUnhide) {
            if (editWrapper) editWrapper.remove();
            if (textSpanToUnhide) textSpanToUnhide.classList.remove('hidden');
            if (actionButtonsToUnhide) actionButtonsToUnhide.classList.remove('hidden');
            li.classList.remove('editing');

            const isCompleted = li.classList.contains('completed');
            li.draggable = currentSortOrder === 'default' && !isCompleted && (parseInt(li.dataset.level) || 0) === 0;
            li.style.cursor = (li.draggable) ? 'grab' : 'default';
            currentlyEditing = null;
            if (li._outsideClickListener) {
                document.removeEventListener('click', li._outsideClickListener, true);
                delete li._outsideClickListener;
                delete li.dataset.outsideClickListener;
            }
        }

        function applyTaskVisualUpdates(li, textSpanToUnhide, updatedProperties) {
            if (updatedProperties.text !== undefined && textSpanToUnhide) {
               textSpanToUnhide.textContent = updatedProperties.text;
            }

            let dueDateSpan = li.querySelector('.task-due-date');
            if (updatedProperties.dueDate !== undefined) {
                if (updatedProperties.dueDate) {
                    if (!dueDateSpan) {
                        dueDateSpan = document.createElement('span');
                        dueDateSpan.classList.add('task-due-date', 'text-xs', 'text-meta', 'ml-2', 'whitespace-nowrap', 'pl-1', 'pr-1');
                        if(textSpanToUnhide) textSpanToUnhide.after(dueDateSpan);
                        else if(li.querySelector('.checkbox-icon')) li.querySelector('.checkbox-icon').after(dueDateSpan);
                    }
                    dueDateSpan.textContent = `Due: ${updatedProperties.dueDate}`;
                } else if (dueDateSpan) {
                    dueDateSpan.remove();
                }
            }

            if (updatedProperties.priority !== undefined) {
               li.dataset.priority = updatedProperties.priority;
               li.classList.remove('priority-low', 'priority-medium', 'priority-high');
               if (updatedProperties.priority === 1) li.classList.add('priority-low');
               else if (updatedProperties.priority === 3) li.classList.add('priority-high');
               else li.classList.add('priority-medium');
            }

            let recurrenceSpan = li.querySelector('.task-recurrence-info');
            if (updatedProperties.recurrence !== undefined) {
                const summary = getRecurrenceSummary(updatedProperties.recurrence);
                if (summary) {
                    if (!recurrenceSpan) {
                        recurrenceSpan = document.createElement('span');
                        recurrenceSpan.classList.add('task-recurrence-info', 'text-xs', 'text-blue-500', 'dark:text-blue-400', 'ml-2', 'italic');
                        (dueDateSpan || textSpanToUnhide || li.querySelector('.checkbox-icon')).after(recurrenceSpan);
                    }
                    recurrenceSpan.textContent = summary;
                } else if (recurrenceSpan) {
                    recurrenceSpan.remove();
                }
            }
        }

        function saveEdit(li, textInput, todoId, isCancelled) { 
             if (currentlyEditing !== todoId && !isCancelled) return; 

             const textSpanToUnhide = li.querySelector('.todo-text'); 
             const actionButtonsToUnhide = li.querySelector('.flex-shrink-0'); 
            
             const editWrapper = li.querySelector('.edit-controls-wrapper');
             const editDueDateInput = editWrapper ? editWrapper.querySelector('#editDueDateInput') : null;
             const editPriorityInput = editWrapper ? editWrapper.querySelector('#editPriorityInput') : null;

             const newText = textInput.value.trim(); 
             const newDueDate = editDueDateInput ? (editDueDateInput.value || null) : null;
             let newPriority = editPriorityInput ? parseInt(editPriorityInput.value, 10) : null;
            
             if (newPriority !== null && (isNaN(newPriority) || ![1,2,3].includes(newPriority))) {
               newPriority = null; 
             }
            
             const editRecurrencePanelId = `editRecurrenceOptions_${todoId}`;
             const newRecurrence = getRecurrenceDataFromPanel(editRecurrencePanelId);

            exitEditMode(li, editWrapper, textSpanToUnhide, actionButtonsToUnhide);

            if (isCancelled) return;

            const originalTaskData = getTodosFromStorage().find(t => t.id === todoId);
            if (!originalTaskData) { console.error("Original task data not found for saving edit."); return; }

            const updatedProperties = {};
            let hasChanges = false;

            if (newText !== '' && newText !== originalTaskData.text) {
                updatedProperties.text = newText;
                hasChanges = true;
            } else if (newText === '' && originalTaskData.text !== '') {
                if(textSpanToUnhide) textSpanToUnhide.textContent = originalTaskData.text; 
                return; 
            }

            if (newDueDate !== originalTaskData.dueDate) {
               updatedProperties.dueDate = newDueDate;
               hasChanges = true;
            }
            if (newPriority !== null && newPriority !== originalTaskData.priority) {
               updatedProperties.priority = newPriority;
               hasChanges = true;
            }
            if (JSON.stringify(newRecurrence) !== JSON.stringify(originalTaskData.recurrence)) {
                updatedProperties.recurrence = newRecurrence;
                hasChanges = true;
            }


            if (hasChanges) {
                applyTaskVisualUpdates(li, textSpanToUnhide, updatedProperties);
                updateTodoInStorage(todoId, updatedProperties); 
            }
        }


        // --- Action Handlers ---
        function toggleComplete(todoId, li, checkbox) {
            const isCompleted = !li.classList.contains('completed'); 
            li.classList.toggle('completed', isCompleted); li.dataset.completed = isCompleted; checkbox.setAttribute('aria-checked', isCompleted); 
            li.draggable = currentSortOrder === 'default' && !isCompleted && (parseInt(li.dataset.level) || 0) === 0; 
            li.style.cursor = (li.draggable) ? 'grab' : 'default';
            
            if(isCompleted && li.classList.contains('editing')) { 
                 const textEditInput = li.querySelector('.edit-input');
                 if(textEditInput) saveEdit(li, textEditInput, todoId, true); 
            }
            
            // Recurrence Logic for completing a task
            if (isCompleted) {
                let todos = [...getTodosFromStorage()]; // Get a mutable copy of all todos
                const currentTaskIndex = todos.findIndex(t => t.id === todoId);
                if (currentTaskIndex === -1) {
                    console.error("Task to complete not found in storage.");
                    return; // Should not happen
                }
                const currentTask = { ...todos[currentTaskIndex] }; // Work with a copy of the current task

                if (currentTask.recurrence && currentTask.recurrence.type !== 'none' && currentTask.dueDate) {
                    const nextInstanceDueDate = calculateNextDueDate(currentTask.dueDate, currentTask.recurrence);
                    
                    if (nextInstanceDueDate) {
                        const nextInstanceTodo = {
                            ...currentTask, // text, priority, parentId, level, etc.
                            id: Date.now(), 
                            completed: false, 
                            dueDate: nextInstanceDueDate, 
                            recurrence: JSON.parse(JSON.stringify(currentTask.recurrence)), 
                            starred: false 
                        };
                        
                        todos[currentTaskIndex] = { ...currentTask, completed: true, recurrence: null };
                        todos.push(nextInstanceTodo);
                        
                        saveTodosToStorage(todos); 
                        loadTodos(); 
                        return; 
                    } else {
                        todos[currentTaskIndex] = { ...currentTask, completed: true, recurrence: null };
                        saveTodosToStorage(todos);
                    }
                } else {
                    todos[currentTaskIndex] = { ...currentTask, completed: true };
                    saveTodosToStorage(todos);
                }
            } else {
                updateTodoInStorage(todoId, { completed: false });
            }
            
            applyFiltersAndSearch(); 
            updateTaskCount(); 
            updateClearButtonVisibility(); 
        }

        function toggleStar(todoId, li, starBtn) {
            const isStarred = !li.classList.contains('starred'); 
            li.classList.toggle('starred', isStarred); li.dataset.starred = isStarred; 
            starBtn.setAttribute('aria-label', isStarred ? 'Unstar task' : 'Star task'); starBtn.setAttribute('aria-pressed', isStarred); 
            updateTodoInStorage(todoId, { starred: isStarred });
            applyFiltersAndSearch(); 
        }

        function deleteTodo(todoId) {
            const liToDelete = todoList.querySelector(`li[data-id="${todoId}"]`);
            if (liToDelete) {
                liToDelete.classList.add('deleting');
                liToDelete.addEventListener('animationend', () => {
                    liToDelete.remove();
                    let todos = getTodosFromStorage();
                    const idsToDelete = new Set([todoId]);

                    const childrenMap = new Map();
                    for (const todo of todos) {
                        if (todo.parentId !== null) {
                            let siblings = childrenMap.get(todo.parentId);
                            if (!siblings) {
                                siblings = [];
                                childrenMap.set(todo.parentId, siblings);
                            }
                            siblings.push(todo);
                        }
                    }

                    const stack = [todoId];
                    while (stack.length > 0) {
                        const currentId = stack.pop();
                        const children = childrenMap.get(currentId) || [];
                        for (const child of children) {
                            idsToDelete.add(child.id);
                            stack.push(child.id);
                        }
                    }
                    
                    todos = todos.filter(todo => !idsToDelete.has(todo.id));
                    saveTodosToStorage(todos);
                    loadTodos(); 
                }, { once: true });
            } else {
                 console.warn("Delete failed: Element not found visually:", todoId);
                 const todos = getTodosFromStorage().filter(todo => todo.id !== todoId); 
                 saveTodosToStorage(todos);
                 loadTodos();
            }
        }

        // --- Input Error Handling ---
        function showInputError(message) {
            inputError.textContent = message; inputError.classList.remove('hidden'); 
            todoInput.classList.add('shake-input', 'border-red-500'); 
            todoInput.addEventListener('animationend', () => todoInput.classList.remove('shake-input'), { once: true });
        }
        function clearInputError() { 
            inputError.classList.add('hidden'); todoInput.classList.remove('border-red-500'); 
        }

        // --- Modals ---
        function showConfirmationModal(todoId) { todoIdToDelete = todoId; confirmationModal.classList.add('visible'); cancelDeleteBtn.focus(); }
        function hideConfirmationModal() { todoIdToDelete = null; confirmationModal.classList.remove('visible'); }
        function handleConfirmDelete() { if (todoIdToDelete !== null) { deleteTodo(todoIdToDelete); } hideConfirmationModal(); }
        function handleCancelDelete() { hideConfirmationModal(); }
        function showClearConfirmationModal() { clearConfirmationModal.classList.add('visible'); cancelClearBtn.focus(); }
        function hideClearConfirmationModal() { clearConfirmationModal.classList.remove('visible'); }
        function handleConfirmClear() {
            const todos = getTodosFromStorage();
            const completedTodos = todos.filter(todo => todo.completed);
            const activeTodos = todos.filter(todo => !todo.completed); 
            if (completedTodos.length > 0) {
                completedTodos.forEach(todo => {
                    const li = todoList.querySelector(`li[data-id="${todo.id}"]`);
                    if (li) { li.classList.add('deleting'); li.addEventListener('animationend', () => li.remove(), { once: true }); }
                });
                setTimeout(() => { 
                    saveTodosToStorage(activeTodos); 
                    loadTodos();
                }, 50); 
            }
            hideClearConfirmationModal(); 
        }
        function updateClearButtonVisibility() { 
            const hasCompleted = getTodosFromStorage().some(todo => todo.completed); 
            clearCompletedContainer.classList.toggle('hidden', !hasCompleted); 
        }

        // --- Filtering, Searching & Sorting ---
        function handleSearchInput(event) {
            currentSearchTerm = event.target.value.toLowerCase();
            applyFiltersAndSearch();
        }

        function handleSortChange(event) {
            currentSortOrder = event.target.value;
            loadTodos(); 
        }

        function handleFilterClick(event) {
            if (currentlyEditing !== null) { 
                const li = todoList.querySelector(`li[data-id="${currentlyEditing}"]`); 
                const textEditInput = li?.querySelector('.edit-input');
                if (li && textEditInput) { saveEdit(li, textEditInput, currentlyEditing, false); } 
            }
            const selectedFilter = event.currentTarget.dataset.filter; 
            if (selectedFilter === currentFilter) return; 
            currentFilter = selectedFilter; 
            filterButtons.forEach(button => button.classList.toggle('active', button.dataset.filter === currentFilter));
            applyFiltersAndSearch();
        }

        function applyFiltersAndSearch() { 
            const listItems = todoList.querySelectorAll('li'); 
            const searchTerm = currentSearchTerm; 
            const allTodos = getTodosFromStorage();

            const hideMap = {};
            for (let i = 0; i < allTodos.length; i++) {
                const todo = allTodos[i];
                const taskText = (todo.text || '').toLowerCase();
                const isStarred = todo.starred === true;
                const isCompleted = todo.completed === true;

                let matchesFilter = true; 
                switch (currentFilter) {
                    case 'starred': matchesFilter = isStarred; break; 
                    case 'active': matchesFilter = !isCompleted; break; 
                    case 'completed': matchesFilter = isCompleted; break; 
                    case 'all': default: matchesFilter = true; break;
                }

                const matchesSearch = searchTerm === '' || taskText.includes(searchTerm);
                hideMap[todo.id] = !(matchesFilter && matchesSearch);
            }

            for (let i = 0; i < listItems.length; i++) {
                const li = listItems[i];
                const hide = hideMap[li.dataset.id];
                if (hide !== undefined) {
                    li.classList.toggle('hidden', hide);
                }
            }

            updateEmptyMessageVisibility(); 
        }

        // --- Task Count ---
        function updateTaskCount() {
            const todos = getTodosFromStorage(); 
            const activeTasks = todos.filter(todo => !todo.completed).length; 
            const totalTasks = todos.length;
            let countText = '';
            if (activeTasks === 0 && totalTasks > 0) { countText = 'All tasks completed!'; } 
            else if (activeTasks === 1) { countText = '1 active task'; } 
            else { countText = `${activeTasks} active tasks`; }
            taskCountElement.textContent = countText; 
            sidebarTaskCountElement.textContent = `${activeTasks} active`;
        }

        // --- Empty Messages ---
        function updateEmptyMessageVisibility() {
            const allTodos = getTodosFromStorage(); 
            const visibleItems = todoList.querySelectorAll('li:not(.hidden)'); 
            const isListEmpty = allTodos.length === 0; 
            
            const hasActiveSearch = currentSearchTerm !== '';
            const noResultsForSearch = hasActiveSearch && visibleItems.length === 0 && !isListEmpty;
            const noResultsForFilter = !hasActiveSearch && currentFilter !== 'all' && visibleItems.length === 0 && !isListEmpty;

            emptyListMessage.classList.toggle('hidden', !isListEmpty); 
            
            const filterTextElement = emptyFilterMessage.querySelector('p');
            if (noResultsForSearch) {
                filterTextElement.textContent = `No tasks match your search for "${currentSearchTerm}".`;
                emptyFilterMessage.classList.remove('hidden');
            } else if (noResultsForFilter) {
                 switch(currentFilter) {
                    case 'starred': filterTextElement.textContent = 'No starred tasks.'; break; 
                    case 'active': filterTextElement.textContent = 'No active tasks.'; break; 
                    case 'completed': filterTextElement.textContent = 'No completed tasks.'; break; 
                    default: filterTextElement.textContent = 'No tasks match the current filter.';  
                }
                emptyFilterMessage.classList.remove('hidden');
            } else {
                emptyFilterMessage.classList.add('hidden');
            }
            
            todoList.classList.toggle('hidden', isListEmpty || noResultsForSearch || noResultsForFilter);

            if (isListEmpty) { 
                clearCompletedContainer.classList.add('hidden'); 
            } else {
                 updateClearButtonVisibility(); 
            }
        }

        // --- Sidebar ---
        function applyInitialSidebarState() { 
            sidebar.classList.toggle('collapsed', isSidebarCollapsed); 
            mainContent.classList.toggle('sidebar-collapsed', isSidebarCollapsed); 
        }
        function toggleSidebar() { 
            isSidebarCollapsed = !isSidebarCollapsed; 
            sidebar.classList.toggle('collapsed', isSidebarCollapsed); 
            mainContent.classList.toggle('sidebar-collapsed', isSidebarCollapsed); 
            localStorage.setItem('sidebarCollapsed', isSidebarCollapsed); 
        }

        // --- Theme ---
        function loadTheme() { 
            const savedTheme = localStorage.getItem('theme') || 'light'; 
            const isDark = savedTheme === 'dark'; 
            document.documentElement.classList.toggle('dark', isDark); 
            themeIconSun.classList.toggle('icon-hidden', isDark); 
            themeIconMoon.classList.toggle('icon-hidden', !isDark); 
        }
        function toggleTheme() { 
            if (currentlyEditing !== null) { 
                const li = todoList.querySelector(`li[data-id="${currentlyEditing}"]`); 
                const textEditInput = li?.querySelector('.edit-input');
                if (li && textEditInput) { saveEdit(li, textEditInput, currentlyEditing, false); } 
            } 
            const isDark = document.documentElement.classList.toggle('dark'); 
            localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
            themeIconSun.classList.toggle('icon-hidden', isDark); 
            themeIconMoon.classList.toggle('icon-hidden', !isDark); 
        }

        // --- Drag & Drop Handlers ---
        function handleDragStart(e) {
            const target = e.target;
            if (currentSortOrder !== 'default' || (parseInt(target.dataset.level) || 0) > 0 || target.classList.contains('completed') || target.classList.contains('editing') || e.target.closest('button, input, .checkbox-icon, .edit-controls-wrapper')) {
                e.preventDefault(); return;
            }
            draggedItem = target; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', draggedItem.dataset.id); 
            setTimeout(() => { if(draggedItem) draggedItem.classList.add('dragging'); }, 0);
        }
        function handleDragEnd(e) { if (draggedItem) { draggedItem.classList.remove('dragging'); } clearDragOverIndicators(); draggedItem = null; }
        function handleDragOver(e) {
            e.preventDefault(); e.dataTransfer.dropEffect = 'move'; 
            const targetItem = e.target.closest('li[draggable="true"]'); 
            if (!targetItem || targetItem === draggedItem || (parseInt(targetItem.dataset.level) || 0) > 0) { 
                 clearDragOverIndicators(); return; 
            }
             const rect = targetItem.getBoundingClientRect(); const midpoint = rect.top + rect.height / 2; const isOverTopHalf = e.clientY < midpoint; 
             clearDragOverIndicators(targetItem); 
             if (isOverTopHalf) { targetItem.classList.remove('drag-over-bottom'); targetItem.classList.add('drag-over-top'); } 
             else { targetItem.classList.remove('drag-over-top'); targetItem.classList.add('drag-over-bottom'); }
        }
        function handleDragLeave(e) {
            const targetItem = e.target.closest('li');
            if (targetItem && !targetItem.contains(e.relatedTarget)) { targetItem.classList.remove('drag-over-top', 'drag-over-bottom'); }
             if (!e.currentTarget.contains(e.relatedTarget)) { clearDragOverIndicators(); }
        }
        function handleDrop(e) {
            e.preventDefault(); 
            const targetItem = e.target.closest('li[draggable="true"]');
            if (!targetItem || !draggedItem || targetItem === draggedItem || (parseInt(targetItem.dataset.level) || 0) > 0) { 
                clearDragOverIndicators(); return; 
            }
            const dropBefore = targetItem.classList.contains('drag-over-top');
            if (dropBefore) { todoList.insertBefore(draggedItem, targetItem); } 
            else { todoList.insertBefore(draggedItem, targetItem.nextSibling); }
            targetItem.classList.remove('drag-over-top', 'drag-over-bottom');
            if (currentSortOrder === 'default') { 
                updateStorageOrder(); 
            }
        }
        function clearDragOverIndicators(exceptItem = null) { document.querySelectorAll('#todoList li.drag-over-top, #todoList li.drag-over-bottom').forEach(li => { if (li !== exceptItem) { li.classList.remove('drag-over-top', 'drag-over-bottom'); } }); }
        
        function updateStorageOrder() { 
            const listItems = Array.from(todoList.querySelectorAll('li'));
            const topLevelItemIds = listItems
                .filter(item => (parseInt(item.dataset.level) || 0) === 0)
                .map(li => Number(li.dataset.id));
            
            const currentTodos = getTodosFromStorage();
            let orderedStorageTodos = [];
            const processedIds = new Set();

            const currentTodosMap = new Map(currentTodos.map(t => [t.id, t]));

            topLevelItemIds.forEach(id => {
                const task = currentTodosMap.get(id);
                if (task) {
                    orderedStorageTodos.push(task);
                    processedIds.add(id);
                }
            });

            currentTodos.forEach(task => {
                if (!processedIds.has(task.id)) {
                    orderedStorageTodos.push(task);
                }
            });
            
            if (orderedStorageTodos.length === currentTodos.length) { 
                saveTodosToStorage(orderedStorageTodos); 
            } else { 
                console.warn("Storage order update mismatch. Saving currentTodos as fallback.", currentTodos.length, orderedStorageTodos.length);
                saveTodosToStorage(currentTodos); 
            }
        }



        // --- Recurrence Summary Helper ---
        function getRecurrenceSummary(recurrenceRule) {
            if (!recurrenceRule || recurrenceRule.type === 'none') {
                return '';
            }

            const type = recurrenceRule.type;
            let summary = `Recurs ${type}`;

            if (type === 'weekly' || type === 'specific_days') { // Consolidate for display
                if (recurrenceRule.daysOfWeek && recurrenceRule.daysOfWeek.length > 0) {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const selectedDayNames = recurrenceRule.daysOfWeek
                        .map(dayIndex => dayNames[dayIndex])
                        .join(', ');
                    summary += ` on ${selectedDayNames}`;
                } else {
                    summary = `Recurs ${type} (no days selected)`; 
                }
            }
            return summary;
        }


        // --- Task Hierarchy Building ---
        function buildHierarchicalTaskArray(allTasks, parentId = null, level = 0) {
            let result = [];
            const children = allTasks.filter(task => task.parentId === parentId);
            
            if (currentSortOrder !== 'default') {
                 children.sort(sortTasksLogic); 
            }

            children.forEach(task => {
                task.level = level; 
                result.push(task);
                result = result.concat(buildHierarchicalTaskArray(allTasks, task.id, level + 1));
            });
            return result;
        }
        
        function sortTasksLogic(a,b){ 
             switch (currentSortOrder) {
                case 'dueDateAsc':
                case 'dueDateDesc':
                    if (a.dueDate === b.dueDate) return 0; 
                    if (!a.dueDate) return 1; 
                    if (!b.dueDate) return -1;
                    return currentSortOrder === 'dueDateAsc'
                        ? new Date(a.dueDate) - new Date(b.dueDate)
                        : new Date(b.dueDate) - new Date(a.dueDate);
                case 'priorityDesc': 
                    return (b.priority || 0) - (a.priority || 0);
                case 'priorityAsc': 
                    return (a.priority || 0) - (b.priority || 0);
                case 'nameAZ':
                    return a._lowerText.localeCompare(b._lowerText);
                case 'nameZA':
                    return b._lowerText.localeCompare(a._lowerText);
                default: return 0; 
            }
        }


        // --- Local Storage Functions ---
        function normalizeTodos(todos) {
            return (Array.isArray(todos) ? todos : []).map(todo => {
                const text = todo.text ?? 'Untitled Task';
                return {
                    text: text,
                    _lowerText: typeof text === 'string' ? text.toLowerCase() : '',
                    completed: todo.completed ?? false,
                    id: todo.id ?? Date.now(),
                    starred: todo.starred ?? false,
                    dueDate: todo.dueDate ?? null,
                    priority: todo.priority ?? 2,
                    parentId: todo.parentId ?? null,
                    level: todo.level ?? 0,
                    recurrence: todo.recurrence ?? null
                };
            }).filter(todo => todo.id && typeof todo.text === 'string');
        }

        function getTodosFromStorage() {
            if (memoizedTodos) {
                return memoizedTodos;
            }
            try {
                const todosString = localStorage.getItem('todos'); 
                const todos = todosString ? JSON.parse(todosString) : []; 
                memoizedTodos = normalizeTodos(todos);
                return memoizedTodos;
            } catch (e) { console.error("Error reading todos from localStorage:", e); return []; }
        }

        function saveTodosToStorage(todos) { 
            try { 
                memoizedTodos = normalizeTodos(todos);
                localStorage.setItem('todos', JSON.stringify(memoizedTodos));
            } catch (e) { 
                console.error("Error saving todos to localStorage:", e); 
            } 
        }

        function updateTodoInStorage(todoId, updatedProperties) {
            const todos = getTodosFromStorage(); 
            let found = false;
            const updatedTodos = todos.map(todo => { 
                if (todo.id === todoId) { 
                    found = true; 
                    return { ...todo, ...updatedProperties }; 
                } 
                return todo; 
            });
            if (found) { 
                saveTodosToStorage(updatedTodos); 
            } else { 
                console.warn("Update failed: Todo not found in storage:", todoId); 
            }
        }

        function loadTodos() {
            let allTasks = getTodosFromStorage(); 
            
            if (currentSortOrder !== 'default') {
                allTasks = [...allTasks].sort(sortTasksLogic);
            }
            
            let hierarchicallyOrderedTasks = buildHierarchicalTaskArray(allTasks, null, 0);

            todoList.innerHTML = ''; 
            hierarchicallyOrderedTasks.forEach(todo => renderTodoItem(todo)); 
            
            applyFiltersAndSearch(); 
            updateTaskCount(); 
            updateClearButtonVisibility(); 
        }

        // --- Recurrence UI Management ---
        function createTypeSelectGroup(panelId) {
            const typeDiv = document.createElement('div');
            typeDiv.className = 'flex items-center mb-2';

            const typeLabel = document.createElement('label');
            typeLabel.setAttribute('for', `${panelId}_type`);
            typeLabel.className = 'mr-2';
            typeLabel.textContent = 'Repeats:';

            const typeSelect = document.createElement('select');
            typeSelect.id = `${panelId}_type`;
            typeSelect.className = 'border border-input p-1 rounded text-sm';

            const options = [
                { value: 'none', text: 'None' },
                { value: 'daily', text: 'Daily' },
                { value: 'weekly', text: 'Weekly' },
                { value: 'specific_days', text: 'Specific Days' }
            ];

            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                typeSelect.appendChild(option);
            });

            typeDiv.appendChild(typeLabel);
            typeDiv.appendChild(typeSelect);

            return { typeDiv, typeSelect };
        }

        function createDaysOfWeekGroup(panelId) {
            const daysOfWeekDiv = document.createElement('div');
            daysOfWeekDiv.id = `${panelId}_daysOfWeek`;
            daysOfWeekDiv.className = 'recurrence-days-of-week hidden';

            const onSpan = document.createElement('span');
            onSpan.textContent = 'On:';
            daysOfWeekDiv.appendChild(onSpan);

            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day, index) => {
                const label = document.createElement('label');
                label.className = 'ml-2';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = `${panelId}_day`;
                checkbox.value = index;

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${day}`));
                daysOfWeekDiv.appendChild(label);
            });

            return daysOfWeekDiv;
        }

        function createClearButtonGroup(panelId) {
            const clearDiv = document.createElement('div');
            clearDiv.className = 'mt-3 flex justify-end';
            
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.id = `${panelId}_clear`;
            clearBtn.className = 'btn-text text-xs text-red-500 mr-2';
            clearBtn.textContent = 'Clear Recurrence';

            clearDiv.appendChild(clearBtn);

            return { clearDiv, clearBtn };
        }

        function buildRecurrenceFormFields(panelId, recurrenceData = null) {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            panel.innerHTML = '';

            const { typeDiv, typeSelect } = createTypeSelectGroup(panelId);
            panel.appendChild(typeDiv);

            const daysOfWeekDiv = createDaysOfWeekGroup(panelId);
            panel.appendChild(daysOfWeekDiv);

            const { clearDiv, clearBtn } = createClearButtonGroup(panelId);
            panel.appendChild(clearDiv);

            typeSelect.onchange = () => {
                // Show daysOfWeekDiv if type is 'weekly' OR 'specific_days'
                daysOfWeekDiv.classList.toggle('hidden', !['weekly', 'specific_days'].includes(typeSelect.value));
            };
            
            if (recurrenceData) {
                typeSelect.value = recurrenceData.type || 'none';
                if (['weekly', 'specific_days'].includes(recurrenceData.type)) {
                    if (recurrenceData.daysOfWeek && Array.isArray(recurrenceData.daysOfWeek)) {
                        recurrenceData.daysOfWeek.forEach(dayIndex => {
                            const checkbox = panel.querySelector(`input[name="${panelId}_day"][value="${dayIndex}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                }
            }
            typeSelect.onchange(); 

            clearBtn.onclick = () => {
                typeSelect.value = 'none';
                panel.querySelectorAll(`input[name="${panelId}_day"]`).forEach(cb => cb.checked = false);
                typeSelect.onchange(); 
                if(panelId.startsWith('editRecurrenceOptions_')) { 
                    const todoId = parseInt(panelId.split('_')[1]);
                    const li = todoList.querySelector(`li[data-id="${todoId}"]`);
                    const textInput = li?.querySelector('.edit-input'); 
                    if (li && textInput) saveEdit(li, textInput, todoId, false);
                }
            };
        }

        function toggleRecurrencePanel(panelId, todoIdForEdit = null) {
            const panel = document.getElementById(panelId);
            if (!panel) return;
            const isHidden = panel.classList.toggle('hidden');
            if (!isHidden) { 
                let taskRecurrenceData = null;
                if (todoIdForEdit !== null) { 
                    const task = getTodosFromStorage().find(t => t.id === todoIdForEdit);
                    taskRecurrenceData = task ? task.recurrence : null;
                }
                buildRecurrenceFormFields(panelId, taskRecurrenceData);
            }
        }

        function getRecurrenceDataFromPanel(panelId) {
            const panel = document.getElementById(panelId);
            if (!panel || panel.classList.contains('hidden')) return null;

            const type = panel.querySelector(`#${panelId}_type`).value;
            if (type === 'none') return null;

            const recurrence = { type: type }; 

            if (type === 'weekly' || type === 'specific_days') { // Collect daysOfWeek for both
                recurrence.daysOfWeek = Array.from(panel.querySelectorAll(`input[name="${panelId}_day"]:checked`))
                                           .map(cb => parseInt(cb.value));
                if(recurrence.daysOfWeek.length === 0) return null; // Requires at least one day if type is weekly/specific
            }
            return recurrence;
        }

        function collectRecurrenceData(sourceType, entityId = null) { 
            if (sourceType === 'main') {
                return getRecurrenceDataFromPanel('mainRecurrenceOptions');
            } else if (sourceType === 'edit' && entityId !== null) {
                return getRecurrenceDataFromPanel(`editRecurrenceOptions_${entityId}`);
            }
            return null;
        }

// --- Exports for testing ---
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        normalizeTodos,
        buildHierarchicalTaskArray,
        sortTasksLogic,
        getRecurrenceSummary,
        _setCurrentSortOrder: (order) => { currentSortOrder = order; },
        _setTodos: (todos) => { memoizedTodos = todos; }
    };
}
