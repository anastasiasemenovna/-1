export const STORAGE_VERSION = 1;

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

function isPlainTask(task) {
    return (
        task !== null &&
        typeof task === "object" &&
        !Array.isArray(task) &&
        typeof task.id === "number" &&
        Number.isSafeInteger(task.id) &&
        task.id > 0 &&
        typeof task.title === "string" &&
        task.title.length >= 1 &&
        task.title.length <= 100 &&
        typeof task.completed === "boolean" &&
        ALLOWED_PRIORITIES.has(task.priority)
    );
}

function cloneTask(task) {
    return {
        id: task.id,
        title: task.title,
        completed: task.completed,
        priority: task.priority,
    };
}

function cloneTaskList(tasks) {
    return tasks.map(cloneTask);
}

export function isValidTaskList(value) {
    if (!Array.isArray(value)) {
        return false;
    }

    const seen = new Set();
    for (const task of value) {
        if (!isPlainTask(task)) {
            return false;
        }
        if (seen.has(task.id)) {
            return false;
        }
        seen.add(task.id);
    }
    return true;
}

export function loadTasks(storage, key, fallbackTasks) {
    const fallbackCopy = cloneTaskList(fallbackTasks);

    let raw;
    try {
        raw = storage.getItem(key);
    } catch (error) {
        return {
            ok: false,
            source: "fallback",
            tasks: fallbackCopy,
            error: `Не удалось прочитать сохранённые задачи: ${error?.message ?? "неизвестная ошибка"}.`,
        };
    }

    if (raw === null || raw === undefined) {
        return { ok: true, source: "initial", tasks: fallbackCopy };
    }

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        return {
            ok: false,
            source: "fallback",
            tasks: fallbackCopy,
            error: `Сохранённые данные повреждены (некорректный JSON): ${error?.message ?? "ошибка разбора"}.`,
        };
    }

    if (
        parsed === null ||
        typeof parsed !== "object" ||
        parsed.version !== STORAGE_VERSION
    ) {
        return {
            ok: false,
            source: "fallback",
            tasks: fallbackCopy,
            error: "Сохранённые данные не соответствуют ожидаемой версии схемы.",
        };
    }

    if (!isValidTaskList(parsed.tasks)) {
        return {
            ok: false,
            source: "fallback",
            tasks: fallbackCopy,
            error: "Сохранённый список задач содержит некорректные записи.",
        };
    }

    return { ok: true, source: "storage", tasks: cloneTaskList(parsed.tasks) };
}

export function saveTasks(storage, key, tasks) {
    if (!isValidTaskList(tasks)) {
        return {
            ok: false,
            error: "Список задач содержит некорректные записи или повторяющиеся идентификаторы.",
        };
    }

    try {
        const payload = JSON.stringify({ version: STORAGE_VERSION, tasks });
        storage.setItem(key, payload);
    } catch (error) {
        return {
            ok: false,
            error: `Не удалось сохранить задачи: ${error?.message ?? "неизвестная ошибка"}.`,
        };
    }

    return { ok: true };
}

export function removeSavedTasks(storage, key) {
    try {
        storage.removeItem(key);
    } catch (error) {
        return {
            ok: false,
            error: `Не удалось удалить сохранённые задачи: ${error?.message ?? "неизвестная ошибка"}.`,
        };
    }

    return { ok: true };
}
