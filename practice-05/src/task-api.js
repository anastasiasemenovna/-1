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

    async function getTasks(filters = {}, options = {}) {
        const query = normalizeFilters(filters);
        const requestOptions = { ...options, query };
        const payload = await client.requestJson("/tasks", requestOptions);

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

        const payload = Object.keys(options).length === 0
            ? await client.requestJson(`/tasks/${id}`)
            : await client.requestJson(`/tasks/${id}`, options);

        if (!isPlainObject(payload) || !isTask(payload.data)) {
            throw invalidResponse(`Ответ getTaskById(${id}) содержит некорректную задачу.`);
        }
        return { ...payload.data };
    }

    async function getCategories(options = {}) {
        const payload = Object.keys(options).length === 0
            ? await client.requestJson("/categories")
            : await client.requestJson("/categories", options);

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

    return { getTasks, getTaskById, getCategories, loadInitialData };
}