import { categories as seedCategories, tasks as seedTasks } from './data.js';
import { selectTasks, findTask } from './task-service.js';

// Для каждого приложения собственные копии данных, без открытия порта.
export function createStore() {
    const tasks = seedTasks.map(task => ({ ...task }));
    const categories = seedCategories.map(category => ({ ...category }));

    // Следующий свободный id. Исходные id разреженные (1, 4, 7, …, 34),
    // поэтому берём максимум + 1, а не длину массива.
    let nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;

    return {
        listTasks: filters => selectTasks(tasks, filters),
        getTask: id => findTask(tasks, id),
        listCategories: () => categories.map(category => ({ ...category })),

        createTask(draft) {
            const task = {
                id: nextId++,
                title: draft.title,
                completed: draft.completed,
                priority: draft.priority,
                categoryId: draft.categoryId,
            };
            tasks.push(task);
            return { ...task };
        },
    };
}