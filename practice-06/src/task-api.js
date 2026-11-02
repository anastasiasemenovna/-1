import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
    return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
    return Number.isSafeInteger(value) && value > 0;
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTask(value) {
    return Boolean(
        value
        && typeof value === "object"
        && isPositiveSafeInteger(value.id)
        && typeof value.title === "string"
        && value.title.trim().length >= 1
        && value.title.trim().length <= 100
        && typeof value.completed === "boolean"
        && ALLOWED_PRIORITIES.has(value.priority)
        && isPositiveSafeInteger(value.categoryId),
    );
}

function isCategory(value) {
    return Boolean(
        value
        && typeof value === "object"
        && isPositiveSafeInteger(value.id)
        && typeof value.name === "string"
        && value.name.trim().length >= 1
        && value.name.trim().length <= 100,
    );
}

export function createTaskApi(client) {
    if (!client || typeof client.requestJson !== "function") {
        throw new TypeError("client.requestJson должен быть функцией.");
    }

    function requestOptions(options) {
        return options && Object.keys(options).length > 0 ? options : undefined;
    }

    function normalizeFilters(filters = {}) {
        if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
            throw new TypeError("filters должен быть обычным объектом.");
        }

        const normalized = {};

        for (const [key, value] of Object.entries(filters)) {
            if (!ALLOWED_FILTERS.has(key)) {
                throw new TypeError(`Неизвестный фильтр: ${key}.`);
            }
            if (value === undefined || value === null || value === "") continue;

            if (key === "completed") {
                if (typeof value !== "boolean") {
                    throw new TypeError("Фильтр completed должен быть boolean.");
                }
                normalized.completed = value;
            } else if (key === "priority") {
                if (!ALLOWED_PRIORITIES.has(value)) {
                    throw new TypeError('Фильтр priority должен быть "low", "medium" или "high".');
                }
                normalized.priority = value;
            } else if (key === "categoryId") {
                if (typeof value !== "number" || !isPositiveSafeInteger(value)) {
                    throw new TypeError("Фильтр categoryId должен быть положительным безопасным целым.");
                }
                normalized.categoryId = value;
            } else if (key === "q") {
                if (typeof value !== "string") {
                    throw new TypeError("Фильтр q должен быть строкой.");
                }
                const trimmed = value.trim();
                if (trimmed.length === 0) continue;
                if (trimmed.length > 100) {
                    throw new TypeError("Фильтр q не должен превышать 100 символов.");
                }
                normalized.q = trimmed;
            }
        }

        return normalized;
    }

    function assertTask(payload, label) {
        if (!isPlainObject(payload) || !isTask(payload.data)) {
            throw invalidResponse(`Ответ ${label} содержит некорректную задачу.`);
        }
        return { ...payload.data };
    }

    async function getTasks(filters = {}, options = {}) {
        const query = normalizeFilters(filters);
        const payload = await client.requestJson("/tasks", {
            ...(requestOptions(options) ?? {}),
            query,
        });

        if (!isPlainObject(payload) || !Array.isArray(payload.data)) {
            throw invalidResponse("Ответ getTasks не содержит массив data.");
        }
        if (!payload.data.every(isTask)) {
            throw invalidResponse("Ответ getTasks содержит некорректные задачи.");
        }
        if (!isPlainObject(payload.meta)) {
            throw invalidResponse("Ответ getTasks не содержит объект meta.");
        }
        if (typeof payload.meta.total !== "number" || !Number.isSafeInteger(payload.meta.total)) {
            throw invalidResponse("meta.total должен быть целым числом.");
        }
        if (payload.meta.total !== payload.data.length) {
            throw invalidResponse("meta.total не совпадает с длиной data.");
        }

        const seen = new Set();
        for (const task of payload.data) {
            if (seen.has(task.id)) {
                throw invalidResponse(`Дублирующийся id задачи: ${task.id}.`);
            }
            seen.add(task.id);
        }

        return {
            tasks: payload.data.map((task) => ({ ...task })),
            meta: { ...payload.meta },
        };
    }

    async function getTaskById(id, options = {}) {
        if (!isPositiveSafeInteger(id)) {
            throw new TypeError("id должен быть положительным безопасным целым.");
        }

        const payload = await client.requestJson(`/tasks/${id}`, requestOptions(options));
        return assertTask(payload, `getTaskById(${id})`);
    }

    async function getCategories(options = {}) {
        const payload = await client.requestJson("/categories", requestOptions(options));

        if (!isPlainObject(payload) || !Array.isArray(payload.data)) {
            throw invalidResponse("Ответ getCategories не содержит массив data.");
        }
        if (!payload.data.every(isCategory)) {
            throw invalidResponse("Ответ getCategories содержит некорректные категории.");
        }

        const seen = new Set();
        for (const category of payload.data) {
            if (seen.has(category.id)) {
                throw invalidResponse(`Дублирующийся id категории: ${category.id}.`);
            }
            seen.add(category.id);
        }

        return payload.data.map((category) => ({ ...category }));
    }

    async function createTask(draft, options = {}) {
        if (!isPlainObject(draft)) {
            throw new TypeError("draft должен быть обычным объектом.");
        }

        const source = isPlainObject(draft.value) ? draft.value : draft;
        const payload = await client.requestJson("/tasks", {
            ...(requestOptions(options) ?? {}),
            method: "POST",
            body: {
                title: source.title,
                priority: source.priority,
                categoryId: source.categoryId,
            },
        });

        if (!isPlainObject(payload) || !isTask(payload.data)) {
            throw invalidResponse("Ответ createTask содержит некорректную задачу.");
        }
        return { ...payload.data };
    }

    async function updateTask(id, changes, options = {}) {
        if (!isPositiveSafeInteger(id)) {
            throw new TypeError("id должен быть положительным безопасным целым.");
        }
        if (!isPlainObject(changes)) {
            throw new TypeError("changes должен быть обычным объектом.");
        }

        const payload = await client.requestJson(`/tasks/${id}`, {
            ...(requestOptions(options) ?? {}),
            method: "PATCH",
            body: changes,
        });

        if (!isPlainObject(payload) || !isTask(payload.data)) {
            throw invalidResponse(`Ответ updateTask(${id}) содержит некорректную задачу.`);
        }
        return { ...payload.data };
    }

    async function setTaskCompleted(id, completed, options = {}) {
        if (!isPositiveSafeInteger(id)) {
            throw new TypeError("id должен быть положительным безопасным целым.");
        }
        if (typeof completed !== "boolean") {
            throw new TypeError("completed должен быть boolean.");
        }

        const payload = await client.requestJson(`/tasks/${id}`, {
            ...(requestOptions(options) ?? {}),
            method: "PATCH",
            body: { completed },
        });

        return assertTask(payload, `setTaskCompleted(${id})`);
    }

    async function deleteTask(id, options = {}) {
        if (!isPositiveSafeInteger(id)) {
            throw new TypeError("id должен быть положительным безопасным целым.");
        }

        const payload = await client.requestJson(`/tasks/${id}`, {
            ...(requestOptions(options) ?? {}),
            method: "DELETE",
        });

        if (payload !== null) {
            throw invalidResponse(`Ответ deleteTask(${id}) должен быть пустым (204).`);
        }
        return null;
    }

    async function resetDemoData(options = {}) {
        const payload = await client.requestJson("/debug/reset", {
            ...(requestOptions(options) ?? {}),
            method: "POST",
        });

        if (!isPlainObject(payload) || !isPlainObject(payload.data)) {
            throw invalidResponse("Ответ resetDemoData не содержит объект data.");
        }
        return { ...payload.data };
    }

    async function loadInitialData(filters = {}, options = {}) {
        const tasksPromise = getTasks(filters, options);
        const categoriesPromise = getCategories(options);

        const [tasksResult, categories] = await Promise.all([
            tasksPromise,
            categoriesPromise,
        ]);

        return {
            tasks: tasksResult.tasks,
            categories,
            meta: tasksResult.meta,
        };
    }

    return {
        getTasks,
        getTaskById,
        getCategories,
        loadInitialData,
        createTask,
        updateTask,
        setTaskCompleted,
        deleteTask,
        resetDemoData,
    };
}
