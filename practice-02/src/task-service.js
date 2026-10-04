// Заготовка модуля. throw ниже отмечает отсутствие реализации,
// а не способ обработки некорректных данных в готовом решении.
// Для предусмотренных ошибок необходимо возвращать { ok: false, error: "..." }.
// console.log(), prompt(), document и чтение внешнего состояния здесь не нужны.
"use strict";

function validateId(id) {
    if (typeof id !== "number") {
        return { ok: false, error: "Идентификатор должен быть числом." };
    }
    if (Number.isNaN(id)) {
        return { ok: false, error: "Идентификатор не должен быть NaN." };
    }
    if (!Number.isSafeInteger(id)) {
        return {
            ok: false,
            error: "Идентификатор должен быть безопасным целым числом.",
        };
    }
    if (id <= 0) {
        return { ok: false, error: "Идентификатор должен быть положительным." };
    }
    return null;
}

function validateTitle(title) {
    if (typeof title !== "string") {
        return { ok: false, error: "Название должно быть строкой." };
    }
    const cleanTitle = title.trim();
    if (cleanTitle.length < 1) {
        return { ok: false, error: "Название не должно быть пустым." };
    }
    if (cleanTitle.length > 100) {
        return {
            ok: false,
            error: "Название не должно превышать 100 символов.",
        };
    }
    return { ok: true, title: cleanTitle };
}

export function createTask(id, title, priority = "medium") {
    const idError = validateId(id);
    if (idError) {
        return idError;
    }

    const titleResult = validateTitle(title);
    if (!titleResult.ok) {
        return titleResult;
    }

    if (priority !== "low" && priority !== "medium" && priority !== "high") {
        return {
            ok: false,
            error: 'Приоритет должен быть "low", "medium" или "high".',
        };
    }

    return {
        ok: true,
        task: {
            id: id,
            title: titleResult.title,
            completed: false,
            priority: priority,
        },
    };
}

export function getTaskTitles(tasks) {
    return tasks.map((task) => task.title);
}

export function findTaskById(tasks, id) {
    return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
    return tasks.filter((task) => task.completed === false);
}

export function getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed === true).length;
    const pending = total - completed;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, pending, progress };
}

// ============================================================
// Задание 4. Добавление, изменение и удаление
// ============================================================

export function addTask(tasks, id, title, priority = "medium") {
    const idError = validateId(id);
    if (idError) {
        return idError;
    }

    // Проверка уникальности id в текущем списке (строгое сравнение).
    if (tasks.some((task) => task.id === id)) {
        return {
            ok: false,
            error: "Задача с таким идентификатором уже существует.",
        };
    }

    // Создание задачи через createTask — единый источник проверок title/priority.
    const created = createTask(id, title, priority);
    if (!created.ok) {
        return created;
    }

    // Новый массив: исходный не изменяется.
    return { ok: true, tasks: [...tasks, created.task] };
}

/**
 * Изменяет признак выполнения выбранной задачи.
 * Принимает только true или false.
 */
export function setTaskCompleted(tasks, id, completed) {
    const idError = validateId(id);
    if (idError) {
        return idError;
    }

    if (typeof completed !== "boolean") {
        return {
            ok: false,
            error: "Признак выполнения должен быть логическим значением.",
        };
    }

    const exists = tasks.some((task) => task.id === id);
    if (!exists) {
        return { ok: false, error: "Задача с указанным идентификатором не найдена." };
    }

    // map + spread объекта: изменённая запись — новый объект,
    // остальные записи переиспользуются как есть.
    const nextTasks = tasks.map((task) =>
        task.id === id ? { ...task, completed: completed } : task
    );

    return { ok: true, tasks: nextTasks };
}

/**
 * Изменяет название выбранной задачи.
 * Остальные поля сохраняются.
 */
export function renameTask(tasks, id, title) {
    const idError = validateId(id);
    if (idError) {
        return idError;
    }

    const titleResult = validateTitle(title);
    if (!titleResult.ok) {
        return titleResult;
    }

    const exists = tasks.some((task) => task.id === id);
    if (!exists) {
        return { ok: false, error: "Задача с указанным идентификатором не найдена." };
    }

    const nextTasks = tasks.map((task) =>
        task.id === id ? { ...task, title: titleResult.title } : task
    );

    return { ok: true, tasks: nextTasks };
}

/**
 * Удаляет задачу по идентификатору.
 * Порядок остальных записей сохраняется.
 */
export function removeTask(tasks, id) {
    const idError = validateId(id);
    if (idError) {
        return idError;
    }

    const exists = tasks.some((task) => task.id === id);
    if (!exists) {
        return { ok: false, error: "Задача с указанным идентификатором не найдена." };
    }

    // filter создаёт новый массив; исходный не изменяется.
    const nextTasks = tasks.filter((task) => task.id !== id);

    return { ok: true, tasks: nextTasks };
}
