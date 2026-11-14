const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
    const errors = {};

    // ---------- title ----------
    let titleValue = null;
    const rawTitle = draft?.title;
    if (typeof rawTitle !== "string") {
        errors.title = "Название должно быть строкой.";
    } else {
        const trimmed = rawTitle.trim();
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
    const rawPriority = draft?.priority;
    if (!ALLOWED_PRIORITIES.has(rawPriority)) {
        errors.priority = 'Приоритет должен быть "low", "medium" или "high".';
    } else {
        priorityValue = rawPriority;
    }

    // ---------- categoryId ----------
    let categoryIdValue = null;
    const rawCategoryId = draft?.categoryId;
    const numericCategoryId = typeof rawCategoryId === "number"
        ? rawCategoryId
        : Number(rawCategoryId);

    if (!Number.isSafeInteger(numericCategoryId) || numericCategoryId <= 0) {
        errors.categoryId = "Идентификатор категории должен быть положительным целым числом.";
    } else if (!Array.isArray(categories) || !categories.some((c) => c?.id === numericCategoryId)) {
        errors.categoryId = "Категория с указанным идентификатором не найдена.";
    } else {
        categoryIdValue = numericCategoryId;
    }

    if (Object.keys(errors).length > 0) {
        return {
            valid: false,
            value: { title: null, priority: null, categoryId: null },
            errors,
        };
    }

    return {
        valid: true,
        value: {
            title: titleValue,
            priority: priorityValue,
            categoryId: categoryIdValue,
        },
        errors: {},
    };
}
