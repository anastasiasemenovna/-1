const PRIORITY_LABELS = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
};

const STATUS_LABELS = {
    in_progress: 'В работе',
    done: 'Выполнена',
};

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
    const priorityLabel = PRIORITY_LABELS[task.priority] || task.priority;
    const statusLabel = task.completed ? 'Выполнена' : 'В работе';

    return (
        <li className="task-item">
            <div className="task-item__main">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggle(task.id)}
                    aria-label={`Отметить задачу "${task.title}" как выполненную`}
                />
                <div>
                    <h3 className="task-item__title">{task.title}</h3>
                    <div className="task-item__meta">
                        <span className={`priority-${task.priority}`}>{priorityLabel}</span>
                        <span className={task.completed ? 'status-done' : 'status-active'}>
                            {statusLabel}
                        </span>
                        <span className="category-badge">{categoryName}</span>
                    </div>
                </div>
            </div>
            <div className="task-item__actions">
                <button onClick={() => onEdit(task.id)} aria-label={`Редактировать задачу "${task.title}"`}>
                    Редактировать
                </button>
                <button onClick={() => onDelete(task.id)} aria-label={`Удалить задачу "${task.title}"`}>
                    Удалить
                </button>
            </div>
        </li>
    );
}
