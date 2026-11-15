import { useState, useEffect } from 'react';
import { validateTaskDraft } from 'C:/Users/user/Desktop/jk/-1/practice-07/src/domain/task-service.js';

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
    // 1. Определение режима (создание или редактирование)
    const isEdit = initialTask !== null;

    // 2. Функция для получения дефолтной категории
    const getDefaultCategoryId = () => {
        if (!categories || categories.length === 0) return '';
        return String(categories[0].id);
    };

    // 3. Состояние черновика
    const [draft, setDraft] = useState({
        title: isEdit ? initialTask.title : '',
        priority: isEdit ? initialTask.priority : 'medium',
        categoryId: isEdit ? String(initialTask.categoryId) : getDefaultCategoryId(),
    });

    const [errors, setErrors] = useState({});
    const [submitStatus, setSubmitStatus] = useState(null); // success, error или null

    // 4. Синхронизация черновика при смене initialTask (например, при клике на разные задачи)
    useEffect(() => {
        setDraft({
            title: initialTask?.title || '',
            priority: initialTask?.priority || 'medium',
            categoryId: initialTask ? String(initialTask.categoryId) : getDefaultCategoryId(),
        });
        setErrors({});
        setSubmitStatus(null);
    }, [initialTask, categories]);

    // 5. Обработчики изменений
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDraft(prev => ({ ...prev, [name]: value }));
        setSubmitStatus(null);
    };

    // 6. Обработчик отправки формы
    const handleSubmit = (e) => {
        e.preventDefault();

        // Проверка ограничения 100 символов (maxLength в JSX не используется)
        if (draft.title.length > 100) {
            setSubmitStatus('error');
            setErrors({ title: 'Название не может превышать 100 символов' });
            return;
        }

        const result = validateTaskDraft(draft, categories);

        if (!result.valid) {
            setSubmitStatus('error');
            setErrors(result.errors);
            return;
        }

        // Успех: передаем нормализованные данные
        setErrors({});
        onSave(result.value);
        setSubmitStatus('success');

        // Очистка черновика ТОЛЬКО после успешного создания
        if (!isEdit) {
            setDraft({
                title: '',
                priority: 'medium',
                categoryId: getDefaultCategoryId(),
            });
        }
    };

    // 7. Обработчик отмены (только для режима редактирования)
    const handleCancel = () => {
        onCancel();
        setErrors({});
        setSubmitStatus(null);
    };

    // ID для aria-describedby
    const titleErrorId = 'title-error';
    const priorityErrorId = 'priority-error';
    const categoryErrorId = 'category-error';

    return (
        <section aria-label="Форма задачи">
            <h2>{isEdit ? 'Редактирование задачи' : 'Создание задачи'}</h2>

            {/* Сообщение об успехе */}
            {submitStatus === 'success' && (
                <div role="status">
                    {isEdit ? 'Задача успешно обновлена' : 'Задача успешно создана'}
                </div>
            )}

            {/* Блок ошибок валидации */}
            {submitStatus === 'error' && Object.keys(errors).length > 0 && (
                <div role="alert">Пожалуйста, исправьте ошибки в форме.</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div>
                    <label htmlFor="title">Название</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={draft.title}
                        onChange={handleChange}
                        aria-invalid={!!errors.title}
                        aria-describedby={errors.title ? titleErrorId : undefined}
                    />
                    {errors.title && (
                        <span id={titleErrorId} className="error-text">
                            {errors.title}
                        </span>
                    )}
                </div>

                <div>
                    <label htmlFor="priority">Приоритет</label>
                    <select
                        id="priority"
                        name="priority"
                        value={draft.priority}
                        onChange={handleChange}
                        aria-invalid={!!errors.priority}
                        aria-describedby={errors.priority ? priorityErrorId : undefined}
                    >
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                    </select>
                    {errors.priority && (
                        <span id={priorityErrorId} className="error-text">
                            {errors.priority}
                        </span>
                    )}
                </div>

                <div>
                    <label htmlFor="categoryId">Категория</label>
                    <select
                        id="categoryId"
                        name="categoryId"
                        value={draft.categoryId}
                        onChange={handleChange}
                        aria-invalid={!!errors.categoryId}
                        aria-describedby={errors.categoryId ? categoryErrorId : undefined}
                    >
                        <option value="">Выберите категорию</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={String(cat.id)}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    {errors.categoryId && (
                        <span id={categoryErrorId} className="error-text">
                            {errors.categoryId}
                        </span>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit">{isEdit ? 'Сохранить' : 'Создать'}</button>
                    {isEdit && (
                        <button type="button" onClick={handleCancel}>
                            Отмена
                        </button>
                    )}
                </div>
            </form>
        </section>
    );
}