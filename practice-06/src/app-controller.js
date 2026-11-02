import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
    if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
    if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
    if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
    if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
    if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
    if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
    return "Не удалось выполнить операцию.";
}

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
    if (!api || typeof api.loadInitialData !== "function" || typeof api.getTasks !== "function") {
        throw new TypeError("api должен содержать loadInitialData и getTasks.");
    }
    if (!view || typeof view.setListState !== "function" || typeof view.setTasks !== "function") {
        throw new TypeError("view должен содержать setListState и setTasks.");
    }

    let tasks = [];
    let categories = [];
    let categoriesLoaded = false;
    let filters = {};
    let editingId = null;
    let activeController = null;
    let loadSequence = 0;

    function isAbort(error) {
        return error instanceof ApiError && error.kind === "aborted";
    }

    function currentTask(id) {
        return tasks.find((task) => task.id === id) ?? null;
    }

    async function performLoad({ initial }) {
        if (activeController) activeController.abort();
        const controller = new AbortController();
        activeController = controller;
        const sequence = ++loadSequence;

        view.setListState("loading");

        try {
            let result;
            if (initial) {
                result = await api.loadInitialData(filters, { signal: controller.signal });
            } else {
                const taskResult = await api.getTasks(filters, { signal: controller.signal });
                result = { tasks: taskResult.tasks, meta: taskResult.meta, categories };
            }

            if (sequence !== loadSequence || controller.signal.aborted) return;

            tasks = result.tasks;
            if (initial) categories = result.categories;
            categoriesLoaded = true;

            view.setCategories(categories);
            view.setTasks(tasks, categories);
            view.setTotal(result.meta?.total ?? tasks.length);
            view.setListState(tasks.length === 0 ? "empty" : "ready");
        } catch (error) {
            if (sequence !== loadSequence) return;
            if (isAbort(error)) return;
            view.setListState("error", messageForError(error));
        } finally {
            if (sequence === loadSequence) activeController = null;
        }
    }

    async function loadCurrentTasks() {
        await performLoad({ initial: !categoriesLoaded });
    }

    async function runMutation(operation, successMessage = "Операция выполнена.") {
        view.setMutationPending(true);
        try {
            await operation();
            view.notify(successMessage, "success");
            await loadCurrentTasks();
        } catch (error) {
            if (isAbort(error)) return;
            view.notify(messageForError(error), "error");
        } finally {
            view.setMutationPending(false);
        }
    }

    async function start(initialFilters = {}) {
        filters = { ...initialFilters };
        categoriesLoaded = false;
        await performLoad({ initial: true });
    }

    async function applyFilters(nextFilters = {}) {
        filters = { ...nextFilters };
        await performLoad({ initial: !categoriesLoaded });
    }

    async function refresh() {
        await performLoad({ initial: !categoriesLoaded });
    }

    async function submit(draft) {
        const validation = validateDraft(draft, categories);
        if (!validation.valid) {
            view.showFormErrors(validation.errors);
            return;
        }

        const value = validation.value;

        await runMutation(async () => {
            if (editingId === null) {
                await api.createTask(value);
            } else {
                await api.updateTask(editingId, value);
            }
        });

        editingId = null;
        view.setFormTask(null);
    }

    function beginEdit(id) {
        const task = currentTask(id);
        if (!task) {
            view.notify(`Задача с идентификатором ${id} не найдена.`, "error");
            return;
        }
        editingId = task.id;
        view.setFormTask(task);
    }

    function cancelEdit() {
        editingId = null;
        view.setFormTask(null);
    }

    async function toggleTask(id) {
        const task = currentTask(id);
        if (!task) {
            view.notify(`Задача с идентификатором ${id} не найдена.`, "error");
            return;
        }
        await runMutation(
            () => api.setTaskCompleted(id, !task.completed),
            "Статус задачи обновлён.",
        );
    }

    async function deleteTask(id) {
        const task = currentTask(id);
        if (!task) {
            view.notify(`Задача с идентификатором ${id} не найдена.`, "error");
            return;
        }
        if (editingId === id) cancelEdit();
        await runMutation(() => api.deleteTask(id), "Задача удалена.");
    }

    async function resetData() {
        view.setMutationPending(true);
        try {
            await api.resetDemoData();
            view.notify("Данные восстановлены.", "success");
            await performLoad({ initial: !categoriesLoaded });
        } catch (error) {
            if (isAbort(error)) return;
            view.notify(messageForError(error), "error");
        } finally {
            view.setMutationPending(false);
        }
    }

    function destroy() {
        if (activeController) {
            activeController.abort();
            activeController = null;
        }
        loadSequence += 1;
    }

    return {
        start,
        applyFilters,
        refresh,
        submit,
        beginEdit,
        cancelEdit,
        toggleTask,
        deleteTask,
        resetData,
        destroy,
    };
}
