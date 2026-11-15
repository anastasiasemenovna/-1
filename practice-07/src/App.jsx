import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import { selectTasks, getTaskStats, resetFilters } from './domain/task-service.js';
import TaskItem from './components/TaskItem.jsx';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

export default function App() {
    const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
    const [filters, setFilters] = useState(createInitialFilters);
    const [editingId, setEditingId] = useState(null);

    const visibleTasks = selectTasks(tasks, filters);
    const stats = getTaskStats(visibleTasks);

    const editingTask = editingId !== null ? tasks.find(t => t.id === editingId) || null : null;

    const handleToggle = (id) => {
        setTasks(prev =>
            prev.map(task =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const handleDelete = (id) => {
        const taskTitle = tasks.find(t => t.id === id)?.title || 'эту задачу';
        const isConfirmed = window.confirm(`Вы уверены, что хотите удалить "${taskTitle}"?`);
        if (!isConfirmed) return;

        setTasks(prev => prev.filter(task => task.id !== id));
        if (editingId === id) {
            setEditingId(null);
        }
    };

    const handleEdit = (id) => {
        setEditingId(id);
    };

    const handleSave = (data) => {
        if (editingId) {
            setTasks(prev =>
                prev.map(task =>
                    task.id === editingId
                        ? { ...task, ...data, completed: task.completed }
                        : task
                )
            );
            setEditingId(null);
        } else {
            setTasks(prev => {
                const maxId = prev.length > 0 ? Math.max(...prev.map(t => Number(t.id))) : 0;
                const newTask = { ...data, id: maxId + 1, completed: false };
                return [...prev, newTask]; // В конец (согласно тестам)
            });
        }
    };

    return (
        <main>
            <h1>Задачи на React</h1>
            <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>
            <p role="status">
                Заготовка запущена. В наборе {tasks.length} задач, категорий: {categories.length}.
            </p>

            <TaskStats stats={stats} />

            <TaskFilters filters={filters} categories={categories} onChange={setFilters} />

            <TaskForm
                key={editingId === null ? 'create' : `edit-${editingId}`}
                categories={categories}
                initialTask={editingTask}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
            />

            <TaskList
                tasks={visibleTasks}
                categories={categories}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </main>
    );
}
