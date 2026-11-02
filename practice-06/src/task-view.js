const PRIORITY_LABELS = Object.freeze({
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
});

export function createTaskElement(task, category) {
    const li = document.createElement("li");
    li.className = "task-card";
    li.dataset.taskId = String(task.id);
    if (task.completed) {
        li.classList.add("is-completed");
    }

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;
    li.append(title);

    const status = document.createElement("p");
    status.className = "task-status";
    status.textContent = task.completed ? "Выполнена" : "В работе";
    li.append(status);

    const priority = document.createElement("p");
    priority.className = "task-priority";
    priority.textContent = PRIORITY_LABELS[task.priority] ?? "";
    li.append(priority);

    const categoryNode = document.createElement("p");
    categoryNode.className = "task-category";
    categoryNode.textContent = category ? category.name : "Без категории";
    li.append(categoryNode);

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

export function renderTaskList(list, tasks, categories) {
    const categoriesById = new Map(
        (Array.isArray(categories) ? categories : []).map((category) => [category.id, category]),
    );

    const nodes = tasks.map((task) =>
        createTaskElement(task, categoriesById.get(task.categoryId)),
    );
    list.replaceChildren(...nodes);
}
