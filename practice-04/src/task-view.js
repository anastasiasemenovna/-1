import { getTaskStats } from "./task-service.js";

const PRIORITY_LABELS = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
};

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.
export function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-card";
    li.dataset.taskId = String(task.id);
    if (task.completed) {
        li.classList.add("is-completed");
    }

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;           // безопасный вывод, не innerHTML
    li.append(title);

    const status = document.createElement("p");
    status.className = "task-status";
    status.textContent = task.completed ? "Выполнена" : "В работе";
    li.append(status);

    const priority = document.createElement("p");
    priority.className = "task-priority";
    priority.textContent = PRIORITY_LABELS[task.priority] ?? "";
    li.append(priority);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.dataset.action = "toggle";
    toggle.setAttribute("aria-pressed", task.completed ? "true" : "false");
    const toggleLabel = document.createElement("span");
    toggleLabel.className = "action-label";
    toggleLabel.textContent = "Выполнена";
    toggle.append(toggleLabel);
    actions.append(toggle);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    const editLabel = document.createElement("span");
    editLabel.className = "action-label";
    editLabel.textContent = "Изменить";
    edit.append(editLabel);
    actions.append(edit);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.action = "delete";
    const removeLabel = document.createElement("span");
    removeLabel.className = "action-label";
    removeLabel.textContent = "Удалить";
    remove.append(removeLabel);
    actions.append(remove);

    li.append(actions);

    return li;
}

export function renderTaskList(listElement, tasks) {
    const nodes = tasks.map(createTaskElement);
    listElement.replaceChildren(...nodes);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
    const stats = getTaskStats(tasks);

    const total = stats.total ?? 0;
    const completed = stats.completed ?? 0;
    const pending = stats.pending ?? (total - completed);

    const setText = (selector, value) => {
        const node = summaryElement.querySelector(selector);
        if (node) node.textContent = String(value);
    };

    setText('[data-stat="total"]', total);
    setText('[data-stat="completed"]', completed);
    setText('[data-stat="pending"]', pending);

    // Процент считаем сами — не зависим от имени поля в getTaskStats.
    const percent = total === 0 ? 0 : (completed / total) * 100;
    const safePercent = Number.isFinite(percent) ? percent : 0;
    setText('[data-stat="progress"]', `${safePercent.toFixed(1)}%`);

    setText('[data-stat="visible"]', visibleCount);
}

export function renderEmptyState(messageElement, total, visibleCount) {
    if (visibleCount > 0) {
        messageElement.textContent = "";
        messageElement.hidden = true;
        return;
    }
    messageElement.hidden = false;
    messageElement.textContent = total === 0
        ? "Список задач пуст."
        : "Нет задач по выбранному фильтру.";
}