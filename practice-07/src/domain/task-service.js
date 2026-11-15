// Чистые функции: без React, DOM, сети, случайных значений и изменения аргументов.
// Точные контракты и допустимые входы приведены в методичке.

export function validateTaskDraft(draft, categories) {
    const errors = {};
    const value = {};

    // 1. Название
    const title = typeof draft.title === 'string' ? draft.title.trim() : '';
    if (title.length > 100) {
        errors.title = 'Название не может превышать 100 символов';
    } else if (!title) {
        errors.title = 'Название задачи обязательно';
    } else if (title.length < 3) {
        errors.title = 'Название должно содержать минимум 3 символа';
    } else {
        value.title = title;
    }

    // 2. Приоритет
    const validPriorities = ['low', 'medium', 'high'];
    const priority = draft.priority;
    if (!priority || !validPriorities.includes(priority)) {
        errors.priority = 'Выберите приоритет';
    } else {
        value.priority = priority;
    }

    // 3. Категория (исправленная логика)
    const rawCategoryId = draft.categoryId;
    let parsedCategoryId;

    if (rawCategoryId !== undefined && rawCategoryId !== null) {
        if (typeof rawCategoryId === 'number') {
            // Проверяем, что число целое и положительное
            if (!Number.isInteger(rawCategoryId) || rawCategoryId <= 0) {
                errors.categoryId = 'Выберите существующую категорию';
            } else {
                parsedCategoryId = rawCategoryId;
            }
        }

        if (typeof rawCategoryId === 'string') {
            const trimmed = rawCategoryId.trim();
            const num = parseInt(trimmed, 10);

            // ГЛАВНАЯ ПРОВЕРКА: 
            // 1. Строка не должна быть пустой.
            // 2. Строка должна состоять ТОЛЬКО из цифр (trimmed === String(num)).
            //    Это отсечет "2x", "1.5abc" и т.д.
            // 3. Число должно быть > 0.
            if (trimmed === '' || trimmed !== String(num) || num <= 0) {
                errors.categoryId = 'Выберите существующую категорию';
            } else {
                parsedCategoryId = num;
            }
        }
    }

    // Проверка существования ID в справочнике
    const categoryExists = parsedCategoryId !== undefined && categories.some(cat => cat.id === parsedCategoryId);

    if (parsedCategoryId === undefined || !categoryExists) {
        if (!errors.categoryId) {
            errors.categoryId = 'Выберите существующую категорию';
        }
    } else {
        value.categoryId = parsedCategoryId;
    }

    return {
        valid: Object.keys(errors).length === 0,
        value,
        errors,
    };
}

export function selectTasks(tasks, filters) {
    const f = filters ?? {};

    const q = String(f.q ?? '').trim().toLowerCase();
    const completed = f.completed ?? '';
    const priority = f.priority ?? '';
    const categoryId = f.categoryId ?? '';

    return tasks.filter(task => {
        // 1. Поиск
        if (q && !String(task.title).toLowerCase().includes(q)) return false;

        // 2. Статус: понимаем и 'true'/'false' (тесты), и 'active'/'done' (TaskFilters)
        const wantsDone =
            completed === 'true' || completed === true || completed === 'done';
        const wantsActive =
            completed === 'false' || completed === false || completed === 'active';

        if (wantsDone && !task.completed) return false;
        if (wantsActive && task.completed) return false;

        // 3. Приоритет
        if (priority && task.priority !== priority) return false;

        // 4. Категория
        if (categoryId !== '' && Number(task.categoryId) !== Number(categoryId)) {
            return false;
        }

        return true;
    });
}

export function getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    return { total, completed, active };
}

// Функция для сброса фильтров согласно требованию (четыре пустые строки)
export function resetFilters() {
    return {
        status: '',
        priority: '',
        categoryId: '',
        search: '',
    };
}

export function addTask(tasks, value, id) {
    // Проверка на дубликат
    if (tasks.some(task => task.id === id)) {
        throw new Error('Duplicate ID');
    }

    // Проверка на неположительный или нецелый id
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Invalid ID');
    }

    // ВАЖНО: тесты ожидают, что новая задача добавится в КОНЕЦ массива
    // (судя по ошибке, где actual.id 34, а expected.id 35 при массиве из 34 элементов)
    return [...tasks, {
        id,
        ...value,
        completed: value.completed ?? false,
    }];
}

export function updateTask(tasks, id, value) {
    return tasks.map(task =>
        task.id === id
            ? {
                ...task,
                title: value.title,
                priority: value.priority,
                categoryId: value.categoryId,
                // id и completed сохраняются
            }
            : task
    );
}

export function toggleTask(tasks, id) {
    return tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );
}

export function removeTask(tasks, id) {
    return tasks.filter(task => task.id !== id);
}
