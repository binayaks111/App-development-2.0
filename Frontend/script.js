const API = "http://127.0.0.1:5000/tasks";
let allTasks = [];
let currentFilter = "all";

// Set today's date in header
document.getElementById("dateTag").textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
}).toUpperCase();

// Set today as default due date
document.getElementById("dueDateInput").value = new Date().toISOString().split("T")[0];

// ===== LOAD TASKS =====
async function loadTasks() {
    try {
        const res = await fetch(API);
        allTasks = await res.json();
        displayTasks();
        updateProgress();
    } catch (err) {
        console.error("Could not connect to backend:", err);
    }
}

// ===== UPDATE PROGRESS BAR =====
function updateProgress() {
    const total = allTasks.length;
    const done = allTasks.filter(t => t.status === "completed").length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    document.getElementById("progressBar").style.width = pct + "%";
    document.getElementById("doneCount").textContent = done;
    document.getElementById("totalCount").textContent = total;
}

// ===== DISPLAY TASKS =====
function displayTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    let filtered = allTasks;
    if (currentFilter === "pending") filtered = allTasks.filter(t => t.status === "pending");
    else if (currentFilter === "completed") filtered = allTasks.filter(t => t.status === "completed");
    else if (["high", "medium", "low"].includes(currentFilter)) {
        filtered = allTasks.filter(t => t.priority === currentFilter);
    }

    if (filtered.length === 0) {
        list.innerHTML = `<p class="empty-msg">— NO TASKS HERE —</p>`;
        return;
    }

    filtered.forEach((task, i) => {
        const li = document.createElement("li");
        li.className = task.status;
        li.style.animationDelay = `${i * 0.05}s`;

        const isOverdue = task.due_date &&
            new Date(task.due_date) < new Date() &&
            task.status !== "completed";

        const dueDateStr = task.due_date
            ? new Date(task.due_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              })
            : "";

        li.innerHTML = `
            <div class="priority-dot ${task.priority || 'medium'}"></div>
            <div class="task-body">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="meta-tag ${task.priority || 'medium'}">
                        ${(task.priority || 'medium').toUpperCase()}
                    </span>
                    ${dueDateStr ? `
                        <span class="due-date ${isOverdue ? 'overdue' : ''}">
                            📅 ${dueDateStr}${isOverdue ? ' OVERDUE' : ''}
                        </span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn done-btn"
                    onclick="toggleTask(${task.id}, '${task.status}')">
                    ${task.status === "pending" ? "✔ DONE" : "↩ UNDO"}
                </button>
                <button class="action-btn delete-btn"
                    onclick="removeTask(${task.id}, this)">✕</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// ===== ADD TASK =====
async function addTask() {
    const input = document.getElementById("taskInput");
    const title = input.value.trim();
    const priority = document.getElementById("prioritySelect").value;
    const due_date = document.getElementById("dueDateInput").value;

    if (!title) {
        input.style.borderColor = "#ff4d4d";
        setTimeout(() => input.style.borderColor = "", 1000);
        return;
    }

    try {
        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, priority, due_date })
        });

        if (res.ok) {
            input.value = "";
            input.focus();
            loadTasks();
        }
    } catch (err) {
        console.error("Error adding task:", err);
    }
}

// ===== TOGGLE STATUS =====
async function toggleTask(id, currentStatus) {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
        await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        loadTasks();
    } catch (err) {
        console.error("Error updating task:", err);
    }
}

// ===== DELETE WITH ANIMATION =====
async function removeTask(id, btn) {
    const li = btn.closest("li");
    li.classList.add("removing");
    setTimeout(async () => {
        try {
            await fetch(`${API}/${id}`, { method: "DELETE" });
            loadTasks();
        } catch (err) {
            console.error("Error deleting task:", err);
        }
    }, 280);
}

// ===== FILTER =====
function filterTasks(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    displayTasks();
}

// ===== ENTER KEY =====
document.getElementById("taskInput").addEventListener("keypress", e => {
    if (e.key === "Enter") addTask();
});

document.getElementById("addBtn").addEventListener("click", addTask);

// ===== START =====
loadTasks();