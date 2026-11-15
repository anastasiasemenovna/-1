export default function TaskStats({ stats }) {
    // TODO: реализовать контракт компонента.
    return (
        <section aria-label="Статистика">
            <h2>Статистика</h2>
            <ul>
                <li>Всего: {stats.total}</li>
                <li>Выполнено: {stats.completed}</li>
                <li>В работе: {stats.active}</li>
            </ul>
        </section>
    );
}
