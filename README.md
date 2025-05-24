# Simple To-Do List App

## Description

This is a straightforward and easy-to-use To-Do List application created using basic web technologies: HTML, CSS (with Tailwind CSS for styling), and JavaScript. It helps you keep track of your tasks directly in your web browser. All tasks are saved in your browser's local storage, so they persist even if you close the browser window or refresh the page.

## Features

* **Add Tasks:** Quickly add new tasks using the input field, including setting due dates, priorities, and recurrence rules.
* **Hierarchical Sub-tasks:**
    * Organize tasks into a hierarchy by creating sub-tasks under parent tasks.
    * Sub-tasks are visually indented under their parent for clarity.
    * Use the "Add sub-task" button (plus icon) on a task to create a child task for it.
    * A maximum depth of 3 levels is supported (parent -> child -> grandchild).
    * Deleting a parent task will also delete all its sub-tasks.
* **Task Recurrence:**
    * Set tasks to recur daily, weekly, monthly, or on specific days of the week (e.g., every Monday and Wednesday).
    * When a recurring task with a due date is marked complete, the next instance of the task is automatically generated with its due date advanced according to the rule. The completed instance becomes non-recurring.
    * Recurrence rules (including selecting specific days for 'weekly' or 'specific_days' types) can be set or modified when adding or editing a task via a dedicated "Recurrence" options panel.
* **Mark as Complete:** Click the circle next to a task to mark it as done (it will be crossed out).
* **Edit Tasks:** Double-click on the text of an active task to edit its details, including text, due date, priority, and recurrence settings. Press Enter or click away to save.
* **Due Dates:** Assign a due date to your tasks, which will be displayed alongside the task.
* **Priority Levels:** Set a priority (Low, Medium, High) for each task, visually indicated by a colored border on the left.
* **Star Tasks:** Click the star icon to mark important tasks.
* **Delete Tasks:** Click the trash can icon to remove a task (a confirmation will appear).
* **Filter Tasks:** Use the sidebar to view All, Starred, Active, or Completed tasks.
* **Task Searching:** Use the search bar to quickly find tasks by matching text content across all tasks, including sub-tasks.
* **Automatic Sorting:** Sort tasks by due date (oldest or newest first), priority (high-low or low-high), or name (A-Z or Z-A). Sub-tasks are sorted relative to their siblings under the same parent.
* **Drag & Drop Reordering:** When in 'Default' sort order, click and drag top-level active tasks to change their order manually. Sub-tasks cannot be independently dragged.
* **Clear Completed:** A button appears to easily remove all completed tasks at once.
* **Light/Dark Theme:** Toggle between light and dark modes using the sun/moon icon.
* **Local Storage:** Your tasks are automatically saved in your browser.

## How to Use

1.  Download the `index.html` file.
2.  Open the `index.html` file in your preferred web browser (like Chrome, Firefox, Edge, etc.).
3.  That's it! Start adding and managing your tasks.

## Technologies Used

* **HTML:** Structures the content of the web page.
* **CSS:** Styles the appearance.
    * **Tailwind CSS:** A utility-first CSS framework used for quick styling (loaded via CDN).
    * **Custom CSS:** Additional styles for theme variables, animations, and specific component looks.
* **JavaScript:** Handles all the interactivity, task management, filtering, drag & drop, sub-tasks, recurrence, and saving data to Local Storage.

## Future Ideas (Optional)

* Implement more advanced recurrence options (e.g., "every X days/weeks/months", "every 2nd Tuesday", specific end dates for recurrence).
* Allow parent task completion to optionally complete all its sub-tasks.
* Add visual cues for tasks with upcoming or past due dates.
* Implement task reminders or notifications.
* User accounts and cloud synchronization.

[end of README.md]
