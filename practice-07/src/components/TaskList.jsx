import TaskItem from './TaskItem.jsx';
export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    if (!tasks || tasks.length === 0) {
        return (
            <section aria-label="Список задач">
                <h2>Задачи</h2>
                <p>Список задач пуст. Добавьте новую задачу, чтобы начать работу.</p>
            </section>
        );
    }

    return (
        <section aria-label="Список задач">
            <h2>Задачи</h2>
            <ul className="task-list">
                {tasks.map(task => {
                    const categoryName = categoryMap.get(task.categoryId) || 'Без категории';

                    // Ключ (key) передается сюда как пропс, но React игнорирует его в рендере.
                    // Настоящий ключ для списка указывается при вызове TaskList в родителе.
                    return (
                        <TaskItem
                            key={task.id}
                            task={task}
                            categoryName={categoryName}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    );
                })}
            </ul>
        </section>
    );
}