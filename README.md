# Simple To-Do List App

> A straightforward, fully-featured To-Do List application built for the web.

This project is a functional, responsive, and easy-to-use To-Do List that operates directly in your web browser. It solves the problem of local, private task management by storing all data persistently in your browser's Local Storage. The application is built using standard web technologies (HTML, CSS, JavaScript) alongside Tailwind CSS to ensure a lightweight footprint, high performance, and ease of modification without complex build steps for the core application.

---

## Table of Contents

- [Features](#features)
- [Installation & Requirements](#installation--requirements)
- [Usage Instructions & Examples](#usage-instructions--examples)
- [Technologies Used](#technologies-used)
- [Testing Instructions](#testing-instructions)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)

---

## Features

- **Advanced Task Management:** Create tasks with due dates, priority levels (Low, Medium, High), and star important items.
- **Hierarchical Sub-tasks:** Organize tasks with up to 3 levels of depth.
- **Task Recurrence:** Set tasks to repeat daily, weekly, monthly, or on specific days of the week.
- **Drag & Drop:** Reorder tasks intuitively with a drag-and-drop interface.
- **Filtering & Search:** Easily filter active/completed tasks and search by text content.
- **Theme Support:** Built-in Light and Dark modes.
- **Local Storage:** Zero database setup needed; all data persists locally in your browser.

---

## Installation & Requirements

Since this is a client-side JavaScript application, the installation process is minimal.

**Requirements:**
- A modern web browser (Chrome, Firefox, Safari, Edge).
- **Node.js (v14+) & npm** (Only required if you wish to run the automated tests).

**Steps:**

1. **Clone the repository** (or download the ZIP):
   ```bash
   git clone https://github.com/DhaatuTheGamer/simple-todo-list.git
   ```

2. **Navigate to the project directory:**
   ```bash
   cd simple-todo-list
   ```

3. **Launch the application:**
   You do not need a web server. Simply open `index.html` in your web browser:
   - Double-click `index.html` in your file explorer, OR
   - Open it from your terminal (e.g., `open index.html` on macOS or `start index.html` on Windows).

4. **(Optional) Install development dependencies** for testing:
   ```bash
   npm install
   ```

---

## Usage Instructions & Examples

### Adding a Task
1. Type your task details in the top input bar.
2. Select a due date and priority if needed.
3. Click **Add Task** or press `Enter`.

### Setting up Recurrence
When generating a task, click on the **Recurrence** settings to choose how often the task should repeat (e.g., "Daily", or "Weekly" on specific days). When you complete a recurring task, its next instance is calculated and cloned automatically.

### Managing Sub-Tasks
Click the **+ (Plus)** icon on any parent task to quickly add a sub-task. The sub-task will be visibly indented under the parent. Note that deleting a parent task will automatically delete all its associated sub-tasks.

---

## Technologies Used

- **HTML5 & CSS3:** Semantic structure and custom styling (theme variables, layout, animations).
- **JavaScript (ES6+):** Core application logic, DOM manipulation, drag-and-drop mechanics, recurrence calculations, and Local Storage synchronization.
- **Tailwind CSS:** Utility-first CSS framework for rapid and responsive UI styling via CDN.
- **Jest:** JavaScript testing framework used for writing and running automated unit tests.

---

## Testing Instructions

Automated tests are included to verify the application's core logic, such as date formatting and task recurrence generation under various circumstances.

1. Ensure you have installed the testing dependencies by running:
   ```bash
   npm install
   ```

2. Run the test suite:
   ```bash
   npm test
   ```

This command invokes the Jest test runner against `recurrence.test.js` to ensure the mathematical and logical integrity of the recurring task engine.

---

## Contribution Guidelines

Contributions, issues, and feature requests are welcome! 

Please read our [Contribution Guidelines](CONTRIBUTING.md) for details on our code of conduct, and the standardized process for submitting pull requests. We proudly adhere to the Contributor Covenant.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
