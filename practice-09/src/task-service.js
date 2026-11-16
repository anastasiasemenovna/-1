import { notImplemented } from './errors.js';

// Все фильтры объединяются через И. Исходный массив не изменяется.
// ---------------------------------------------------------------------------
// selectTasks(tasks, filters) — чистая функция, не мутирует вход
// ---------------------------------------------------------------------------

export function selectTasks(tasks, filters) {
    const { completed, priority, categoryId, q } = filters;

    const noConstraints =
        completed === null &&
        priority === null &&
        categoryId === null &&
        q === '';

    if (noConstraints) {
        return tasks.slice();
    }

    const needle = q.toLocaleLowerCase('ru-RU');

    return tasks.filter((task) => {
        if (completed !== null && task.completed !== completed) return false;
        if (priority !== null && task.priority !== priority) return false;
        if (categoryId !== null && task.categoryId !== categoryId) return false;
        if (needle !== '') {
            const title = String(task.title).toLocaleLowerCase('ru-RU');
            if (!title.includes(needle)) return false;
        }
        return true;
    });
}

export function findTask(tasks, id) {
    if (!Array.isArray(tasks)) return null;
    const found = tasks.find((task) => task.id === id);
    return found ?? null;
}
