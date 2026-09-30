

// const b = document.getElementById('b'); 
// const d = document.getElementById('d'); 
// const e = document.getElementById('e'); 

// const a = new Audio('ding.mpeg'); 

// function i() {
//     const j = [];
//     let counter = 1;
//     e.querySelectorAll('li').forEach(k => {
//         const rawText = k.firstChild.nodeValue.trim();
        
//         j.push({
//             text: rawText.substring(rawText.indexOf('.') + 1).trim(),
//             done: k.classList.contains('f')
//         });
        
//         k.firstChild.nodeValue = `${counter}. ${j[j.length - 1].text}`;
//         counter++;
//     });
//     localStorage.setItem('tasks', JSON.stringify(j));
// }
// function h() {
//     const j = JSON.parse(localStorage.getItem('tasks')) || [];
//     j.forEach(k => l(k.text, k.done));
//     i(); 
// }
/* =========================================================
   TASKFORGE
   PRODUCTIVITY ENGINE
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const STORAGE_KEY = "taskforge_tasks_v2";
const SETTINGS_KEY = "taskforge_settings_v2";
const ACTIVITY_KEY = "taskforge_activity_v2";
const FOCUS_KEY = "taskforge_focus_v2";

const DEFAULT_SETTINGS = {
    darkMode: true,
    animations: true,
    sound: true
};

const QUOTES = [
    "Small progress is still progress.",
    "Focus on what moves the needle.",
    "Discipline creates freedom.",
    "Your future self is watching.",
    "One task. Full attention.",
    "Consistency beats intensity.",
    "Make today count.",
    "Done is better than perfect.",
    "Build momentum, not pressure.",
    "Start before you're ready."
];

/* =========================================================
   APPLICATION STATE
   ========================================================= */

let tasks = [];
let activities = [];
let settings = {
    ...DEFAULT_SETTINGS
};

let currentFilter = "all";
let currentView = "dashboard";

let timer = {
    total: 25 * 60,
    remaining: 25 * 60,
    running: false,
    interval: null,
    sessions: 0,
    minutes: 0
};

let calendarDate = new Date();

/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);

/* =========================================================
   STORAGE
   ========================================================= */

function loadData() {

    try {

        const savedTasks =
            localStorage.getItem(STORAGE_KEY);

        const savedSettings =
            localStorage.getItem(SETTINGS_KEY);

        const savedActivities =
            localStorage.getItem(ACTIVITY_KEY);

        const savedFocus =
            localStorage.getItem(FOCUS_KEY);

        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }

        if (savedSettings) {

            settings = {
                ...DEFAULT_SETTINGS,
                ...JSON.parse(savedSettings)
            };
        }

        if (savedActivities) {
            activities = JSON.parse(savedActivities);
        }

        if (savedFocus) {

            const focusData =
                JSON.parse(savedFocus);

            timer.sessions =
                focusData.sessions || 0;

            timer.minutes =
                focusData.minutes || 0;
        }

    } catch (error) {

        console.error(
            "Could not load saved data:",
            error
        );

        tasks = [];
        activities = [];
    }
}

function saveTasks() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}

function saveSettings() {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}

function saveActivities() {

    localStorage.setItem(
        ACTIVITY_KEY,
        JSON.stringify(activities)
    );
}

function saveFocus() {

    localStorage.setItem(
        FOCUS_KEY,
        JSON.stringify({
            sessions: timer.sessions,
            minutes: timer.minutes
        })
    );
}

/* =========================================================
   ID GENERATION
   ========================================================= */

function generateId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function todayString() {

    const date = new Date();

    return date
        .toISOString()
        .split("T")[0];
}

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function isToday(dateString) {

    return dateString === todayString();
}

function isOverdue(task) {

    if (
        !task.dueDate ||
        task.completed
    ) {
        return false;
    }

    return task.dueDate < todayString();
}

function getDayName(date) {

    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "short"
        }
    );
}

/* =========================================================
   GREETING
   ========================================================= */

function updateGreeting() {

    const hour =
        new Date().getHours();

    let greeting =
        "Good evening";

    if (hour < 5) {
        greeting = "Still working";
    } else if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    }

    const element =
        $("#greeting");

    if (element) {

        element.textContent =
            `${greeting}, Antariksh.`;
    }
}

/* =========================================================
   CURRENT DATE
   ========================================================= */

function updateCurrentDate() {

    const element =
        $("#currentDate");

    if (!element) return;

    element.textContent =
        new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
}

/* =========================================================
   TASK CREATION
   ========================================================= */

function createTask(data) {

    const task = {

        id: generateId(),

        title:
            data.title.trim(),

        description:
            data.description?.trim() || "",

        priority:
            data.priority || "medium",

        category:
            data.category || "personal",

        dueDate:
            data.dueDate || "",

        dueTime:
            data.dueTime || "",

        tags:
            Array.isArray(data.tags)
                ? data.tags
                : [],

        important:
            Boolean(data.important),

        completed: false,

        createdAt:
            new Date().toISOString(),

        completedAt: null
    };

    tasks.unshift(task);

    saveTasks();

    addActivity(
        "created",
        `Created "${task.title}"`
    );

    renderEverything();

    showToast(
        "Task created",
        task.title
    );

    return task;
}

/* =========================================================
   UPDATE TASK
   ========================================================= */

function updateTask(id, data) {

    const task =
        tasks.find(
            item => item.id === id
        );

    if (!task) return;

    task.title =
        data.title.trim();

    task.description =
        data.description?.trim() || "";

    task.priority =
        data.priority;

    task.category =
        data.category;

    task.dueDate =
        data.dueDate;

    task.dueTime =
        data.dueTime;

    task.tags =
        Array.isArray(data.tags)
            ? data.tags
            : [];

    task.important =
        Boolean(data.important);

    saveTasks();

    addActivity(
        "edited",
        `Edited "${task.title}"`
    );

    renderEverything();

    showToast(
        "Task updated",
        task.title
    );
}

/* =========================================================
   TOGGLE TASK
   ========================================================= */

function toggleTask(id) {

    const task =
        tasks.find(
            item => item.id === id
        );

    if (!task) return;

    task.completed =
        !task.completed;

    if (task.completed) {

        task.completedAt =
            new Date().toISOString();

        addActivity(
            "completed",
            `Completed "${task.title}"`
        );

        playSound("complete");

        if (
            getPendingTasks().length === 0 &&
            tasks.length > 0
        ) {

            launchConfetti();

            showToast(
                "Perfect day!",
                "You completed every active task."
            );
        } else {

            showToast(
                "Task completed",
                task.title
            );
        }

    } else {

        task.completedAt =
            null;

        addActivity(
            "reopened",
            `Reopened "${task.title}"`
        );

        showToast(
            "Task reopened",
            task.title
        );
    }

    saveTasks();

    renderEverything();
}

/* =========================================================
   DELETE TASK
   ========================================================= */

function deleteTask(id) {

    const index =
        tasks.findIndex(
            task => task.id === id
        );

    if (index === -1) return;

    const task =
        tasks[index];

    const confirmed =
        confirm(
            `Delete "${task.title}"?`
        );

    if (!confirmed) {
        return;
    }

    tasks.splice(index, 1);

    saveTasks();

    addActivity(
        "deleted",
        `Deleted "${task.title}"`
    );

    playSound("delete");

    renderEverything();

    showToast(
        "Task deleted",
        "The task has been removed."
    );
}

/* =========================================================
   TOGGLE IMPORTANT
   ========================================================= */

function toggleImportant(id) {

    const task =
        tasks.find(
            item => item.id === id
        );

    if (!task) return;

    task.important =
        !task.important;

    saveTasks();

    addActivity(
        "important",
        task.important
            ? `Marked "${task.title}" important`
            : `Removed "${task.title}" from important`
    );

    renderEverything();
}

/* =========================================================
   FILTERING
   ========================================================= */

function getFilteredTasks() {

    let result =
        [...tasks];

    if (currentFilter === "active") {

        result =
            result.filter(
                task => !task.completed
            );
    }

    if (currentFilter === "completed") {

        result =
            result.filter(
                task => task.completed
            );
    }

    if (currentFilter === "important") {

        result =
            result.filter(
                task => task.important
            );
    }

    return sortTasks(
        result
    );
}

/* =========================================================
   SORTING
   ========================================================= */

function sortTasks(list) {

    const mode =
        $("#sortTasks")?.value ||
        "newest";

    return list.sort(
        (a, b) => {

            if (mode === "newest") {

                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );
            }

            if (mode === "oldest") {

                return (
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
                );
            }

            if (mode === "priority") {

                const values = {
                    urgent: 4,
                    high: 3,
                    medium: 2,
                    low: 1
                };

                return (
                    values[b.priority] -
                    values[a.priority]
                );
            }

            if (mode === "due") {

                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;

                return (
                    new Date(a.dueDate) -
                    new Date(b.dueDate)
                );
            }

            return 0;
        }
    );
}

/* =========================================================
   TASK HTML
   ========================================================= */

function taskHTML(task) {

    const dateClass =
        isOverdue(task)
            ? "overdue"
            : isToday(task.dueDate)
                ? "today"
                : "";

    const priority =
        task.priority || "medium";

    const tags =
        task.tags
            .slice(0, 3)
            .map(
                tag =>
                    `<span class="task-category">
                        #${escapeHTML(tag)}
                    </span>`
            )
            .join("");

    return `
        <div
            class="task-item ${task.completed ? "completed" : ""}"
            data-task-id="${task.id}"
        >

            <button
                class="task-check"
                data-action="toggle"
                aria-label="Complete task"
            >
                ${task.completed ? "✓" : ""}
            </button>

            <div class="task-body">

                <div class="task-title-row">

                    <span class="task-title">
                        ${escapeHTML(task.title)}
                    </span>

                    <span class="priority-badge ${priority}">
                        ${priority}
                    </span>

                </div>

                ${
                    task.description
                        ? `
                            <div class="task-description">
                                ${escapeHTML(task.description)}
                            </div>
                        `
                        : ""
                }

                <div class="task-meta">

                    <span class="task-category">
                        ${escapeHTML(task.category)}
                    </span>

                    ${
                        task.dueDate
                            ? `
                                <span class="task-date ${dateClass}">
                                    ◷ ${formatDate(task.dueDate)}
                                    ${
                                        task.dueTime
                                            ? ` · ${task.dueTime}`
                                            : ""
                                    }
                                </span>
                            `
                            : ""
                    }

                    ${tags}

                </div>

            </div>

            <button
                class="task-star ${task.important ? "active" : ""}"
                data-action="important"
                title="Important"
            >
                ★
            </button>

            <div class="task-actions">

                <button
                    class="task-action"
                    data-action="edit"
                    title="Edit"
                >
                    ✎
                </button>

                <button
                    class="task-action"
                    data-action="delete"
                    title="Delete"
                >
                    ×
                </button>

            </div>

        </div>
    `;
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}

/* =========================================================
   RENDER TASKS
   ========================================================= */

function renderTaskList() {

    const list =
        $("#taskList");

    if (!list) return;

    const filtered =
        getFilteredTasks();

    list.innerHTML =
        filtered
            .map(taskHTML)
            .join("");

    const empty =
        $("#emptyState");

    if (empty) {

        if (filtered.length === 0) {
            empty.classList.add("visible");
        } else {
            empty.classList.remove("visible");
        }
    }
}

/* =========================================================
   RENDER TODAY
   ========================================================= */

function renderToday() {

    const container =
        $("#todayTaskList");

    if (!container) return;

    const today =
        tasks.filter(
            task =>
                !task.completed &&
                (
                    task.dueDate ===
                    todayString()
                    ||
                    !task.dueDate
                )
        );

    container.innerHTML =
        today.length
            ? today.map(taskHTML).join("")
            : emptyListHTML(
                "No tasks for today",
                "Enjoy the breathing room or create something new."
            );
}

/* =========================================================
   RENDER UPCOMING
   ========================================================= */

function renderUpcoming() {

    const container =
        $("#upcomingList");

    if (!container) return;

    const upcoming =
        tasks
            .filter(
                task =>
                    !task.completed &&
                    task.dueDate &&
                    task.dueDate >= todayString()
            )
            .sort(
                (a,b) =>
                    new Date(a.dueDate) -
                    new Date(b.dueDate)
            );

    container.innerHTML =
        upcoming.length
            ? upcoming.map(taskHTML).join("")
            : emptyListHTML(
                "No upcoming tasks",
                "Your future looks clear."
            );
}

/* =========================================================
   RENDER COMPLETED
   ========================================================= */

function renderCompleted() {

    const container =
        $("#completedList");

    if (!container) return;

    const completed =
        tasks.filter(
            task => task.completed
        );

    container.innerHTML =
        completed.length
            ? completed.map(taskHTML).join("")
            : emptyListHTML(
                "No completed tasks",
                "Complete a task and it will appear here."
            );
}

/* =========================================================
   RENDER IMPORTANT
   ========================================================= */

function renderImportant() {

    const container =
        $("#importantList");

    if (!container) return;

    const important =
        tasks.filter(
            task =>
                task.important &&
                !task.completed
        );

    container.innerHTML =
        important.length
            ? important.map(taskHTML).join("")
            : emptyListHTML(
                "No important tasks",
                "Star important tasks to see them here."
            );
}

/* =========================================================
   EMPTY LIST HTML
   ========================================================= */

function emptyListHTML(
    title,
    description
) {

    return `
        <div class="empty-state visible">

            <div class="empty-icon">
                ✓
            </div>

            <h3>
                ${title}
            </h3>

            <p>
                ${description}
            </p>

        </div>
    `;
}

/* =========================================================
   STATISTICS
   ========================================================= */

function getCompletedTasks() {

    return tasks.filter(
        task => task.completed
    );
}

function getPendingTasks() {

    return tasks.filter(
        task => !task.completed
    );
}

function getOverdueTasks() {

    return tasks.filter(
        task => isOverdue(task)
    );
}

function calculateCompletion() {

    if (tasks.length === 0) {
        return 0;
    }

    return Math.round(
        (
            getCompletedTasks().length /
            tasks.length
        ) * 100
    );
}

function calculateProductivity() {

    const completed =
        getCompletedTasks().length;

    const total =
        tasks.length;

    if (total === 0) {
        return 0;
    }

    const completion =
        completed / total;

    const consistency =
        calculateStreak() > 0
            ? Math.min(
                calculateStreak() / 7,
                1
            )
            : 0;

    return Math.round(
        (
            completion * .75 +
            consistency * .25
        ) * 100
    );
}

/* =========================================================
   UPDATE STATS
   ========================================================= */

function updateStats() {

    const total =
        tasks.length;

    const completed =
        getCompletedTasks().length;

    const pending =
        getPendingTasks().length;

    const overdue =
        getOverdueTasks().length;

    const completion =
        calculateCompletion();

    const productivity =
        calculateProductivity();

    setText(
        "#totalTasks",
        total
    );

    setText(
        "#completedTasks",
        completed
    );

    setText(
        "#pendingTasks",
        pending
    );

    setText(
        "#completedPercentage",
        `${completion}%`
    );

    setText(
        "#productivityScore",
        `${productivity}%`
    );

    setText(
        "#overdueLabel",
        `${overdue} overdue`
    );

    setText(
        "#todayCount",
        tasks.filter(
            task =>
                !task.completed &&
                task.dueDate === todayString()
        ).length
    );

    updateProgress();

    updatePriorityCounts();

    updateStreak();
}

/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
    selector,
    value
) {

    const element =
        $(selector);

    if (element) {
        element.textContent =
            value;
    }
}

/* =========================================================
   PROGRESS
   ========================================================= */

function updateProgress() {

    const total =
        tasks.length;

    const completed =
        getCompletedTasks().length;

    const percentage =
        total
            ? Math.round(
                completed / total * 100
            )
            : 0;

    const degrees =
        percentage * 3.6;

    const ring =
        $("#progressRing");

    if (ring) {

        ring.style.background =
            `
            conic-gradient(
                var(--primary)
                ${degrees}deg,
                rgba(255,255,255,.06)
                ${degrees}deg
            )
            `;
    }

    setText(
        "#progressPercentage",
        `${percentage}%`
    );

    setText(
        "#progressDone",
        completed
    );

    setText(
        "#progressRemaining",
        total - completed
    );
}

/* =========================================================
   PRIORITY COUNTS
   ========================================================= */

function updatePriorityCounts() {

    const priorities = [
        "urgent",
        "high",
        "medium",
        "low"
    ];

    priorities.forEach(
        priority => {

            const count =
                tasks.filter(
                    task =>
                        task.priority ===
                        priority &&
                        !task.completed
                ).length;

            setText(
                `#${priority}Count`,
                count
            );
        }
    );
}

/* =========================================================
   STREAK
   ========================================================= */

function calculateStreak() {

    const completionDates =
        [
            ...new Set(
                tasks
                    .filter(
                        task =>
                            task.completedAt
                    )
                    .map(
                        task =>
                            task.completedAt
                                .split("T")[0]
                    )
            )
        ]
        .sort()
        .reverse();

    if (
        completionDates.length === 0
    ) {
        return 0;
    }

    let streak = 0;

    let current =
        new Date(todayString());

    for (
        let i = 0;
        i < completionDates.length;
        i++
    ) {

        const date =
            new Date(
                completionDates[i]
            );

        const difference =
            Math.round(
                (
                    current - date
                ) /
                86400000
            );

        if (
            difference === 0 ||
            difference === 1
        ) {

            streak++;

            current = date;

        } else {

            break;
        }
    }

    return streak;
}

function updateStreak() {

    const streak =
        calculateStreak();

    setText(
        "#sidebarStreak",
        `${streak} day streak`
    );

    setText(
        "#analyticsStreak",
        `${streak} days`
    );
}

/* =========================================================
   ANALYTICS
   ========================================================= */

function renderAnalytics() {

    setText(
        "#analyticsCompletion",
        `${calculateCompletion()}%`
    );

    setText(
        "#analyticsCompleted",
        getCompletedTasks().length
    );

    setText(
        "#analyticsCreated",
        tasks.length
    );

    const streak =
        calculateStreak();

    setText(
        "#analyticsStreak",
        `${streak} days`
    );

    const score =
        calculateProductivity();

    setText(
        "#bigScore",
        score
    );

    const scoreBar =
        $("#scoreBar");

    if (scoreBar) {
        scoreBar.style.width =
            `${score}%`;
    }

    renderWeeklyChart();

    renderPriorityChart();
}

/* =========================================================
   WEEKLY CHART
   ========================================================= */

function renderWeeklyChart() {

    const chart =
        $("#weeklyChart");

    if (!chart) return;

    const days = [];

    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        const dateString =
            date.toISOString()
                .split("T")[0];

        const count =
            tasks.filter(
                task =>
                    task.completedAt &&
                    task.completedAt
                        .startsWith(dateString)
            ).length;

        days.push({
            label:
                getDayName(date),

            count
        });
    }

    const max =
        Math.max(
            ...days.map(
                day => day.count
            ),
            1
        );

    chart.innerHTML =
        days.map(
            day => {

                const height =
                    Math.max(
                        5,
                        day.count / max * 100
                    );

                return `
                    <div class="chart-column">

                        <span class="chart-value">
                            ${day.count}
                        </span>

                        <div
                            class="chart-bar"
                            style="height:${height}%"
                        ></div>

                        <span class="chart-day">
                            ${day.label}
                        </span>

                    </div>
                `;
            }
        ).join("");
}

/* =========================================================
   PRIORITY CHART
   ========================================================= */

function renderPriorityChart() {

    const chart =
        $("#priorityChart");

    if (!chart) return;

    const priorities = [
        ["Urgent", "urgent"],
        ["High", "high"],
        ["Medium", "medium"],
        ["Low", "low"]
    ];

    const activeTasks =
        getPendingTasks();

    const max =
        Math.max(
            ...priorities.map(
                ([, priority]) =>
                    activeTasks.filter(
                        task =>
                            task.priority ===
                            priority
                    ).length
            ),
            1
        );

    chart.innerHTML =
        priorities.map(
            ([label, priority]) => {

                const count =
                    activeTasks.filter(
                        task =>
                            task.priority ===
                            priority
                    ).length;

                const width =
                    count / max * 100;

                return `
                    <div class="bar-row">

                        <span class="bar-label">
                            ${label}
                        </span>

                        <div class="bar-track">

                            <div
                                class="bar-fill"
                                style="width:${width}%"
                            ></div>

                        </div>

                        <span class="bar-value">
                            ${count}
                        </span>

                    </div>
                `;
            }
        ).join("");
}

/* =========================================================
   ACTIVITY
   ========================================================= */

function addActivity(
    type,
    message
) {

    activities.unshift({

        id: generateId(),

        type,

        message,

        timestamp:
            new Date().toISOString()
    });

    activities =
        activities.slice(
            0,
            50
        );

    saveActivities();

    renderActivity();
}

function renderActivity() {

    const container =
        $("#activityList");

    if (!container) return;

    if (activities.length === 0) {

        container.innerHTML =
            `
                <div class="empty-state visible">
                    <p>
                        Your activity will appear here.
                    </p>
                </div>
            `;

        return;
    }

    container.innerHTML =
        activities
            .slice(0, 8)
            .map(
                activity => {

                    const icon =
                        activity.type === "completed"
                            ? "✓"
                            : activity.type === "deleted"
                                ? "×"
                                : activity.type === "created"
                                    ? "+"
                                    : "•";

                    return `
                        <div class="activity-item">

                            <div class="activity-icon">
                                ${icon}
                            </div>

                            <div class="activity-content">

                                <strong>
                                    ${escapeHTML(activity.message)}
                                </strong>

                                <span>
                                    ${timeAgo(activity.timestamp)}
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

/* =========================================================
   TIME AGO
   ========================================================= */

function timeAgo(timestamp) {

    const seconds =
        Math.floor(
            (
                Date.now() -
                new Date(timestamp).getTime()
            ) / 1000
        );

    if (seconds < 10) {
        return "Just now";
    }

    if (seconds < 60) {
        return `${seconds}s ago`;
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days =
        Math.floor(hours / 24);

    return `${days}d ago`;
}

/* =========================================================
   MODAL
   ========================================================= */

function openTaskModal(task = null) {

    const modal =
        $("#taskModal");

    if (!modal) return;

    modal.classList.add("open");

    const form =
        $("#taskForm");

    form.reset();

    if (task) {

        setText(
            "#modalTitle",
            "Edit task"
        );

        $("#editingTaskId").value =
            task.id;

        $("#taskTitle").value =
            task.title;

        $("#taskDescription").value =
            task.description;

        $("#taskPriority").value =
            task.priority;

        $("#taskCategory").value =
            task.category;

        $("#taskDueDate").value =
            task.dueDate;

        $("#taskDueTime").value =
            task.dueTime;

        $("#taskTags").value =
            task.tags.join(", ");

        $("#taskImportant").checked =
            task.important;

    } else {

        setText(
            "#modalTitle",
            "Create a task"
        );

        $("#editingTaskId").value =
            "";

        $("#taskDueDate").value =
            todayString();
    }

    setTimeout(
        () =>
            $("#taskTitle").focus(),
        100
    );
}

function closeTaskModal() {

    $("#taskModal")
        ?.classList
        .remove("open");
}

/* =========================================================
   FORM SUBMISSION
   ========================================================= */

function handleTaskSubmit(event) {

    event.preventDefault();

    const title =
        $("#taskTitle").value.trim();

    if (!title) {

        showToast(
            "Missing title",
            "Give your task a name first."
        );

        return;
    }

    const data = {

        title,

        description:
            $("#taskDescription")
                .value,

        priority:
            $("#taskPriority")
                .value,

        category:
            $("#taskCategory")
                .value,

        dueDate:
            $("#taskDueDate")
                .value,

        dueTime:
            $("#taskDueTime")
                .value,

        tags:
            $("#taskTags")
                .value
                .split(",")
                .map(tag => tag.trim())
                .filter(Boolean),

        important:
            $("#taskImportant")
                .checked
    };

    const editingId =
        $("#editingTaskId")
            .value;

    if (editingId) {

        updateTask(
            editingId,
            data
        );

    } else {

        createTask(data);
    }

    closeTaskModal();
}

/* =========================================================
   EVENT DELEGATION
   ========================================================= */

function handleTaskListClick(event) {

    const actionButton =
        event.target.closest(
            "[data-action]"
        );

    if (!actionButton) return;

    const taskElement =
        event.target.closest(
            "[data-task-id]"
        );

    if (!taskElement) return;

    const id =
        taskElement.dataset.taskId;

    const action =
        actionButton.dataset.action;

    if (action === "toggle") {

        toggleTask(id);
    }

    if (action === "important") {

        toggleImportant(id);
    }

    if (action === "delete") {

        deleteTask(id);
    }

    if (action === "edit") {

        const task =
            tasks.find(
                item => item.id === id
            );

        if (task) {
            openTaskModal(task);
        }
    }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function switchView(view) {

    currentView =
        view;

    $$(".view").forEach(
        section =>
            section.classList.remove(
                "active-view"
            )
    );

    const target =
        $(`#${view}View`);

    if (target) {

        target.classList.add(
            "active-view"
        );
    }

    $$(".nav-item").forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.view === view
            );
        }
    );

    closeMobileSidebar();

    if (view === "analytics") {
        renderAnalytics();
    }

    if (view === "calendar") {
        renderCalendar();
    }
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function openMobileSidebar() {

    $("#sidebar")
        ?.classList
        .add("open");

    $("#mobileOverlay")
        ?.classList
        .add("active");
}

function closeMobileSidebar() {

    $("#sidebar")
        ?.classList
        .remove("open");

    $("#mobileOverlay")
        ?.classList
        .remove("active");
}

/* =========================================================
   SEARCH
   ========================================================= */

function openSearch() {

    const modal =
        $("#searchModal");

    modal.classList.add("open");

    $("#searchInput").value = "";

    renderSearchResults("");

    setTimeout(
        () =>
            $("#searchInput").focus(),
        100
    );
}

function closeSearch() {

    $("#searchModal")
        ?.classList
        .remove("open");
}

function renderSearchResults(query) {

    const container =
        $("#searchResults");

    if (!container) return;

    const normalized =
        query
            .toLowerCase()
            .trim();

    if (!normalized) {

        container.innerHTML =
            `
                <div class="search-result">

                    <strong>
                        Search your workspace
                    </strong>

                    <span>
                        Search by title, description,
                        category or tag.
                    </span>

                </div>
            `;

        return;
    }

    const results =
        tasks.filter(
            task =>
                task.title
                    .toLowerCase()
                    .includes(normalized)
                ||
                task.description
                    .toLowerCase()
                    .includes(normalized)
                ||
                task.category
                    .toLowerCase()
                    .includes(normalized)
                ||
                task.tags.some(
                    tag =>
                        tag
                            .toLowerCase()
                            .includes(normalized)
                )
        );

    if (!results.length) {

        container.innerHTML =
            `
                <div class="search-result">
                    <strong>No results</strong>
                    <span>
                        Try a different search term.
                    </span>
                </div>
            `;

        return;
    }

    container.innerHTML =
        results
            .slice(0, 10)
            .map(
                task =>
                    `
                    <div
                        class="search-result"
                        data-search-id="${task.id}"
                    >

                        <strong>
                            ${escapeHTML(task.title)}
                        </strong>

                        <span>
                            ${task.completed ? "Completed" : "Active"}
                            ·
                            ${task.category}
                            ·
                            ${task.priority}
                        </span>

                    </div>
                    `
            )
            .join("");
}

/* =========================================================
   SEARCH RESULT CLICK
   ========================================================= */

function handleSearchClick(event) {

    const result =
        event.target.closest(
            "[data-search-id]"
        );

    if (!result) return;

    const task =
        tasks.find(
            item =>
                item.id ===
                result.dataset.searchId
        );

    closeSearch();

    if (task) {

        switchView("dashboard");

        currentFilter = "all";

        renderTaskList();

        setTimeout(
            () => {

                const element =
                    document.querySelector(
                        `[data-task-id="${task.id}"]`
                    );

                if (element) {

                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    element.style.outline =
                        "2px solid var(--primary)";

                    setTimeout(
                        () =>
                            element.style.outline =
                                "",
                        1500
                    );
                }

            },
            100
        );
    }
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    title,
    message
) {

    const container =
        $("#toastContainer");

    if (!container) return;

    const toast =
        document.createElement("div");

    toast.className =
        "toast";

    toast.innerHTML =
        `
            <div class="toast-icon">
                ✓
            </div>

            <div class="toast-content">

                <strong>
                    ${escapeHTML(title)}
                </strong>

                <span>
                    ${escapeHTML(message)}
                </span>

            </div>
        `;

    container.appendChild(toast);

    setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateX(20px)";

            setTimeout(
                () =>
                    toast.remove(),
                250
            );

        },
        3200
    );
}

/* =========================================================
   SOUND
   ========================================================= */

function playSound(type) {

    if (!settings.sound) {
        return;
    }

    const element =
        type === "complete"
            ? $("#completeSound")
            : $("#deleteSound");

    if (!element) return;

    element.currentTime = 0;

    element.play()
        .catch(
            () => {}
        );
}

/* =========================================================
   CONFETTI
   ========================================================= */

function launchConfetti() {

    const container =
        $("#confettiContainer");

    if (!container) return;

    const pieces = 80;

    for (
        let i = 0;
        i < pieces;
        i++
    ) {

        const piece =
            document.createElement("div");

        piece.className =
            "confetti";

        piece.style.left =
            `${Math.random() * 100}%`;

        piece.style.background =
            [
                "#7c5cff",
                "#22c55e",
                "#3b82f6",
                "#f59e0b",
                "#ec4899",
                "#06b6d4"
            ][
                Math.floor(
                    Math.random() * 6
                )
            ];

        piece.style.animationDelay =
            `${Math.random() * .5}s`;

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;

        container.appendChild(piece);

        setTimeout(
            () =>
                piece.remove(),
            2200
        );
    }
}

/* =========================================================
   DAILY QUOTE
   ========================================================= */

function renderQuote() {

    const day =
        Math.floor(
            Date.now() /
            86400000
        );

    const quote =
        QUOTES[
            day % QUOTES.length
        ];

    setText(
        "#dailyQuote",
        quote
    );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function applySettings() {

    document.body.classList.toggle(
        "light-mode",
        !settings.darkMode
    );

    document.body.classList.toggle(
        "no-animations",
        !settings.animations
    );

    const darkToggle =
        $("#darkModeToggle");

    if (darkToggle) {
        darkToggle.checked =
            settings.darkMode;
    }

    const animationToggle =
        $("#animationsToggle");

    if (animationToggle) {
        animationToggle.checked =
            settings.animations;
    }

    const soundToggle =
        $("#soundToggle");

    if (soundToggle) {
        soundToggle.checked =
            settings.sound;
    }

    const themeButton =
        $("#themeButton");

    if (themeButton) {

        themeButton.textContent =
            settings.darkMode
                ? "☾"
                : "☀";
    }

    saveSettings();
}

/* =========================================================
   EXPORT
   ========================================================= */

function exportTasks() {

    const data = {

        version: 2,

        exportedAt:
            new Date().toISOString(),

        tasks,

        activities,

        settings
    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const anchor =
        document.createElement("a");

    anchor.href = url;

    anchor.download =
        `taskforge-backup-${todayString()}.json`;

    anchor.click();

    URL.revokeObjectURL(url);

    showToast(
        "Backup exported",
        "Your TaskForge data was downloaded."
    );
}

/* =========================================================
   IMPORT
   ========================================================= */

function importTasks(file) {

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload =
        event => {

            try {

                const data =
                    JSON.parse(
                        event.target.result
                    );

                if (
                    !Array.isArray(
                        data.tasks
                    )
                ) {

                    throw new Error(
                        "Invalid backup"
                    );
                }

                tasks =
                    data.tasks;

                if (
                    Array.isArray(
                        data.activities
                    )
                ) {

                    activities =
                        data.activities;
                }

                saveTasks();
                saveActivities();

                renderEverything();

                showToast(
                    "Backup imported",
                    `${tasks.length} tasks restored.`
                );

            } catch (error) {

                showToast(
                    "Import failed",
                    "That file is not a valid TaskForge backup."
                );
            }
        };

    reader.readAsText(file);
}

/* =========================================================
   CLEAR DATA
   ========================================================= */

function clearAllData() {

    const confirmed =
        confirm(
            "Delete ALL tasks, activity and saved data?"
        );

    if (!confirmed) return;

    tasks = [];
    activities = [];

    saveTasks();
    saveActivities();

    renderEverything();

    showToast(
        "Workspace cleared",
        "All task data has been removed."
    );
}

function clearCompleted() {

    const completed =
        getCompletedTasks();

    if (!completed.length) {

        showToast(
            "Nothing to clear",
            "There are no completed tasks."
        );

        return;
    }

    const confirmed =
        confirm(
            `Delete ${completed.length} completed tasks?`
        );

    if (!confirmed) return;

    tasks =
        tasks.filter(
            task => !task.completed
        );

    saveTasks();

    renderEverything();

    showToast(
        "Completed tasks cleared",
        `${completed.length} tasks removed.`
    );
}

/* =========================================================
   CALENDAR
   ========================================================= */

function renderCalendar() {

    const grid =
        $("#calendarGrid");

    if (!grid) return;

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();

    const monthName =
        calendarDate.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );

    setText(
        "#calendarMonth",
        monthName
    );

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];

    let html =
        weekdays
            .map(
                day =>
                    `
                    <div class="calendar-weekday">
                        ${day}
                    </div>
                    `
            )
            .join("");

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        html +=
            `
                <div class="calendar-day empty"></div>
            `;
    }

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );

        const dateString =
            date
                .toISOString()
                .split("T")[0];

        const dayTasks =
            tasks.filter(
                task =>
                    task.dueDate ===
                    dateString
            );

        const todayClass =
            dateString === todayString()
                ? "today"
                : "";

        html +=
            `
                <div
                    class="calendar-day ${todayClass}"
                >

                    <div class="calendar-number">
                        ${day}
                    </div>

                    ${dayTasks
                        .slice(0, 3)
                        .map(
                            task =>
                                `
                                <div class="calendar-task">
                                    ${escapeHTML(task.title)}
                                </div>
                                `
                        )
                        .join("")}

                </div>
            `;
    }

    grid.innerHTML =
        html;
}

/* =========================================================
   FOCUS TIMER
   ========================================================= */

function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timer.remaining / 60
        );

    const seconds =
        timer.remaining % 60;

    setText(
        "#timerDisplay",
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    );

    const elapsed =
        timer.total -
        timer.remaining;

    const percentage =
        timer.total
            ? elapsed / timer.total * 100
            : 0;

    const progress =
        $("#timerProgress");

    if (progress) {

        progress.style.width =
            `${percentage}%`;
    }

    setText(
        "#focusSessions",
        timer.sessions
    );

    setText(
        "#focusMinutes",
        timer.minutes
    );

    setText(
        "#focusStreak",
        calculateStreak()
    );
}

function startTimer() {

    if (timer.running) {
        return;
    }

    timer.running =
        true;

    timer.interval =
        setInterval(
            () => {

                if (
                    timer.remaining <= 0
                ) {

                    completeFocusSession();

                    return;
                }

                timer.remaining--;

                updateTimerDisplay();

            },
            1000
        );

    setText(
        "#timerMode",
        "Deep work in progress..."
    );
}

function pauseTimer() {

    timer.running =
        false;

    clearInterval(
        timer.interval
    );

    timer.interval =
        null;

    setText(
        "#timerMode",
        "Paused"
    );
}

function resetTimer() {

    pauseTimer();

    timer.remaining =
        timer.total;

    setText(
        "#timerMode",
        "Pomodoro"
    );

    updateTimerDisplay();
}

function setTimerMinutes(minutes) {

    pauseTimer();

    timer.total =
        minutes * 60;

    timer.remaining =
        timer.total;

    setText(
        "#timerMode",
        `${minutes} minute focus`
    );

    $$(".timer-preset")
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    Number(
                        button.dataset.minutes
                    ) === minutes
                );
            }
        );

    updateTimerDisplay();
}

function completeFocusSession() {

    pauseTimer();

    timer.sessions++;

    timer.minutes +=
        Math.round(
            timer.total / 60
        );

    saveFocus();

    playSound("complete");

    launchConfetti();

    showToast(
        "Focus session complete",
        "Excellent work. Take a short break."
    );

    timer.remaining =
        timer.total;

    updateTimerDisplay();
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function renderNotifications() {

    const container =
        $("#notifications");

    if (!container) return;

    const overdue =
        getOverdueTasks();

    const dueToday =
        tasks.filter(
            task =>
                !task.completed &&
                task.dueDate === todayString()
        );

    let notifications = [];

    if (overdue.length) {

        notifications.push({
            title:
                `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,
            message:
                "Some work needs your attention."
        });
    }

    if (dueToday.length) {

        notifications.push({
            title:
                `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`,
            message:
                "Make sure today's priorities get done."
        });
    }

    if (!notifications.length) {

        notifications.push({
            title:
                "You're all clear",
            message:
                "No urgent notifications right now."
        });
    }

    container.innerHTML =
        notifications
            .map(
                item =>
                    `
                    <div class="notification-item">

                        <div class="activity-icon">
                            !
                        </div>

                        <div>

                            <strong>
                                ${item.title}
                            </strong>

                            <span>
                                ${item.message}
                            </span>

                        </div>

                    </div>
                    `
            )
            .join("");
}

/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

    renderTaskList();

    renderToday();

    renderUpcoming();

    renderCompleted();

    renderImportant();

    updateStats();

    renderAnalytics();

    renderActivity();

    renderNotifications();

    updateTimerDisplay();
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initializeEvents() {

    /* Navigation */

    $$(".nav-item")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        switchView(
                            button.dataset.view
                        )
                );
            }
        );

    /* Task lists */

    document.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "[data-action]"
                )
            ) {

                handleTaskListClick(
                    event
                );
            }
        }
    );

    /* Add buttons */

    $("#heroAddButton")
        ?.addEventListener(
            "click",
            () => openTaskModal()
        );

    $("#panelAddButton")
        ?.addEventListener(
            "click",
            () => openTaskModal()
        );

    $("#sidebarQuickAdd")
        ?.addEventListener(
            "click",
            () => openTaskModal()
        );

    $("#emptyAddButton")
        ?.addEventListener(
            "click",
            () => openTaskModal()
        );

    $$("[data-open-modal='task']")
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    () =>
                        openTaskModal()
                )
        );

    /* Modal */

    $("#closeTaskModal")
        ?.addEventListener(
            "click",
            closeTaskModal
        );

    $("#cancelTask")
        ?.addEventListener(
            "click",
            closeTaskModal
        );

    $("#taskForm")
        ?.addEventListener(
            "submit",
            handleTaskSubmit
        );

    $("#taskModal .modal-backdrop")
        ?.addEventListener(
            "click",
            closeTaskModal
        );

    /* Quick task */

    $("#quickAddButton")
        ?.addEventListener(
            "click",
            quickAddTask
        );

    $("#quickTaskInput")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    quickAddTask();
                }
            }
        );

    /* Filters */

    $$(".filter-tab")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        currentFilter =
                            button.dataset.filter;

                        $$(".filter-tab")
                            .forEach(
                                item =>
                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    )
                            );

                        renderTaskList();
                    }
                );
            }
        );

    $("#sortTasks")
        ?.addEventListener(
            "change",
            renderTaskList
        );

    /* Search */

    $("#globalSearchButton")
        ?.addEventListener(
            "click",
            openSearch
        );

    $("#searchInput")
        ?.addEventListener(
            "input",
            event =>
                renderSearchResults(
                    event.target.value
                )
        );

    $("#searchResults")
        ?.addEventListener(
            "click",
            handleSearchClick
        );

    $("#searchModal .modal-backdrop")
        ?.addEventListener(
            "click",
            closeSearch
        );

    /* Theme */

    $("#themeButton")
        ?.addEventListener(
            "click",
            toggleTheme
        );

    $("#darkModeToggle")
        ?.addEventListener(
            "change",
            event => {

                settings.darkMode =
                    event.target.checked;

                applySettings();
            }
        );

    $("#animationsToggle")
        ?.addEventListener(
            "change",
            event => {

                settings.animations =
                    event.target.checked;

                applySettings();
            }
        );

    $("#soundToggle")
        ?.addEventListener(
            "change",
            event => {

                settings.sound =
                    event.target.checked;

                applySettings();
            }
        );

    /* Mobile */

    $("#openSidebar")
        ?.addEventListener(
            "click",
            openMobileSidebar
        );

    $("#closeSidebar")
        ?.addEventListener(
            "click",
            closeMobileSidebar
        );

    $("#mobileOverlay")
        ?.addEventListener(
            "click",
            closeMobileSidebar
        );

    /* Notifications */

    $("#notificationButton")
        ?.addEventListener(
            "click",
            () =>
                $("#notificationPanel")
                    .classList
                    .toggle("open")
        );

    $("#closeNotifications")
        ?.addEventListener(
            "click",
            () =>
                $("#notificationPanel")
                    .classList
                    .remove("open")
        );

    /* Activity */

    $("#clearActivity")
        ?.addEventListener(
            "click",
            () => {

                activities = [];

                saveActivities();

                renderActivity();
            }
        );

    /* Completed */

    $("#clearCompletedButton")
        ?.addEventListener(
            "click",
            clearCompleted
        );

    /* Data */

    $("#exportButton")
        ?.addEventListener(
            "click",
            exportTasks
        );

    $("#importButton")
        ?.addEventListener(
            "click",
            () =>
                $("#importFile").click()
        );

    $("#importFile")
        ?.addEventListener(
            "change",
            event =>
                importTasks(
                    event.target.files[0]
                )
        );

    $("#clearAllButton")
        ?.addEventListener(
            "click",
            clearAllData
        );

    /* Calendar */

    $("#previousMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );

                renderCalendar();
            }
        );

    $("#nextMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );

                renderCalendar();
            }
        );

    /* Timer */

    $("#timerStart")
        ?.addEventListener(
            "click",
            startTimer
        );

    $("#timerPause")
        ?.addEventListener(
            "click",
            pauseTimer
        );

    $("#timerReset")
        ?.addEventListener(
            "click",
            resetTimer
        );

    $$(".timer-preset")
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    () =>
                        setTimerMinutes(
                            Number(
                                button.dataset.minutes
                            )
                        )
                )
        );

    /* Keyboard */

    document.addEventListener(
        "keydown",
        handleKeyboard
    );
}

/* =========================================================
   QUICK ADD
   ========================================================= */

function quickAddTask() {

    const input =
        $("#quickTaskInput");

    const title =
        input.value.trim();

    if (!title) {

        input.focus();

        return;
    }

    createTask({

        title,

        description: "",

        priority:
            $("#quickPriority").value,

        category:
            "personal",

        dueDate:
            todayString(),

        dueTime: "",

        tags: [],

        important: false
    });

    input.value = "";

    input.focus();
}

/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

    settings.darkMode =
        !settings.darkMode;

    applySettings();

    showToast(
        settings.darkMode
            ? "Dark mode"
            : "Light mode",
        "Appearance updated."
    );
}

/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function handleKeyboard(event) {

    const target =
        event.target;

    const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

    if (
        event.key === "Escape"
    ) {

        closeTaskModal();
        closeSearch();
        closeMobileSidebar();

        $("#notificationPanel")
            ?.classList
            .remove("open");

        return;
    }

    if (
        event.ctrlKey &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        openSearch();

        return;
    }

    if (
        !typing &&
        event.key.toLowerCase() === "n"
    ) {

        event.preventDefault();

        openTaskModal();

        return;
    }

    if (
        !typing &&
        event.key.toLowerCase() === "d"
    ) {

        switchView("dashboard");
    }
}

/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeApp() {

    loadData();

    applySettings();

    updateGreeting();

    updateCurrentDate();

    renderQuote();

    initializeEvents();

    renderEverything();

    renderCalendar();

    updateTimerDisplay();

    /* Initial notification */

    setTimeout(
        renderNotifications,
        100
    );

    /* Refresh relative times */

    setInterval(
        renderActivity,
        60000
    );

    /* Refresh date */

    setInterval(
        () => {

            updateCurrentDate();
            updateGreeting();

        },
        60000
    );
}

/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

// function l(m, n = false) {
//     if (!m) return;

//     const o = document.createElement('li');

//     o.textContent = m;

//     const p = document.createElement('button');
//     p.textContent = 'x';
//     p.className = 'g';
    
//     if (n) {
//         o.classList.add('f');
//     }

//     o.appendChild(p);
//     e.appendChild(o);

//     o.addEventListener('click', function(q) {
        
//         if (q.target !== p) { 
//             o.classList.toggle('f'); 
           
//             i();
//         }
//     });

//     p.addEventListener('click', function() {
//         e.removeChild(o);
//         a.play();
//                 i();
//     });

//     i(); 
// }

// d.addEventListener('click', function() {
//     const m = b.value.trim();
//     if (m) {
//         l(m);
//         b.value = '';
//     }
// });

// b.addEventListener('keypress', function(r) {
//     if (r.key === 'Enter') {
//         d.click(); 
//     }
// });

// h();
