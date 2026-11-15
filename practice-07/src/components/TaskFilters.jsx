
export default function TaskFilters({ filters, categories, onChange }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        // Сбрасываем в пустые СТРОКИ, как того требует Шаг 7 и createInitialFilters
        onChange({
            completed: '',
            priority: '',
            categoryId: '',
            q: '',
        });
    };

    return (
        <section aria-label="Фильтры">
            <h2>Фильтры</h2>
            <form onSubmit={e => e.preventDefault()}>

                {/* СТАТУС: name="completed" (а не status) */}
                <div>
                    <label htmlFor="filter-status">Статус</label>
                    <select
                        id="filter-status"
                        name="completed"
                        value={filters.completed}
                        onChange={handleChange}
                    >
                        <option value="">Все</option>
                        <option value="active">В работе</option>
                        <option value="done">Выполнена</option>
                    </select>
                </div>

                {/* ПРИОРИТЕТ */}
                <div>
                    <label htmlFor="filter-priority">Приоритет</label>
                    <select
                        id="filter-priority"
                        name="priority"
                        value={filters.priority}
                        onChange={handleChange}
                    >
                        <option value="">Все</option>
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                    </select>
                </div>

                {/* КАТЕГОРИЯ */}
                <div>
                    <label htmlFor="filter-category">Категория</label>
                    <select
                        id="filter-category"
                        name="categoryId"
                        value={filters.categoryId}
                        onChange={handleChange}
                    >
                        <option value="">Все</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={String(cat.id)}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ПОИСК: name="q" (а не search) */}
                <div>
                    <label htmlFor="filter-search">Поиск</label>
                    <input
                        id="filter-search"
                        name="q"
                        type="search"
                        value={filters.q}
                        onChange={handleChange}
                        placeholder="Введите текст..."
                    />
                </div>

                <button type="button" onClick={handleReset}>
                    Сбросить
                </button>
            </form>
        </section>
    );
}
