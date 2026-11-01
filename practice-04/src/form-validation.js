const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
    const errors = {};
    const isEditing = editingId !== null && editingId !== undefined;

    // ---------- title ----------
    let titleValue = null;
    if (typeof draft?.title !== "string") {
        errors.title = "Название должно быть строкой.";
    } else {
        const trimmed = draft.title.trim();
        if (trimmed.length < 1) {
            errors.title = "Название не должно быть пустым.";
        } else if (trimmed.length > 100) {
            errors.title = "Название не должно превышать 100 символов.";
        } else {
            titleValue = trimmed;
        }
    }

    // ---------- priority ----------
    let priorityValue = null;
    if (!ALLOWED_PRIORITIES.has(draft?.priority)) {
        errors.priority = 'Приоритет должен быть "low", "medium" или "high".';
    } else {
        priorityValue = draft.priority;
    }

    // ---------- id ----------
    let idValue = null;

    if (isEditing) {
        // В режиме редактирования draft.id игнорируется, берём editingId.
        if (typeof editingId !== "number") {
            errors.id = "Идентификатор редактируемой задачи должен быть числом.";
        } else if (!Number.isSafeInteger(editingId) || editingId <= 0) {
            errors.id = "Идентификатор редактируемой задачи должен быть положительным безопасным целым.";
        } else if (!tasks.some((task) => task.id === editingId)) {
            errors.id = "Редактируемая задача не найдена.";
        } else {
            idValue = editingId;
        }
    } else {
        const raw = draft?.id;

        // Пустая строка не должна превращаться в 0.
        if (typeof raw === "string" && raw.trim() === "") {
            errors.id = "Идентификатор не должен быть пустым.";
        } else {
            // Number("") === 0 — поэтому пустую строку отсекаем выше.
            const numeric = typeof raw === "number" ? raw : Number(raw);
            if (Number.isNaN(numeric)) {
                errors.id = "Идентификатор должен быть числом.";
            } else if (!Number.isSafeInteger(numeric) || numeric <= 0) {
                errors.id = "Идентификатор должен быть положительным безопасным целым.";
            } else if (tasks.some((task) => task.id === numeric)) {
                errors.id = "Задача с таким идентификатором уже существует.";
            } else {
                idValue = numeric;
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        value: { id: idValue, title: titleValue, priority: priorityValue },
    };
}
