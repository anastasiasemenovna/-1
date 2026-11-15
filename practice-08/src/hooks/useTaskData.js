import { useState, useEffect, useRef } from 'react';

export function useTaskData({ api, filters }) {
    const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [mutationError, setMutationError] = useState(null);
    const [pending, setPending] = useState(false);
    const [revision, setRevision] = useState(0);

    const mountedRef = useRef(true);
    const mutationLockRef = useRef(false);
    const mutationControllerRef = useRef(null);

    //служебный эффект — восстанавливает признак активности в setup (StrictMode),
    // в cleanup отменяет текущую мутацию и снимает блокировку.
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            mutationControllerRef.current?.abort();
            mutationControllerRef.current = null;
            mutationLockRef.current = false;
        };
    }, []);

    //загрузка через loadInitialData с явными полями фильтров
    useEffect(() => {
        let isActual = true;
        const controller = new AbortController();

        setStatus('loading');
        setError(null);
        // старый snapshot сохраняется — setSnapshot здесь не вызываем

        (async () => {
            try {
                const result = await api.loadInitialData(
                    {
                        q: filters.q,
                        completed: filters.completed,
                        priority: filters.priority,
                        categoryId: filters.categoryId,
                    },
                    { signal: controller.signal }
                );
                if (!isActual) return; // запоздавший/отменённый успех
                setSnapshot({
                    tasks: result?.tasks ?? [],
                    categories: result?.categories ?? [],
                    meta: result?.meta ?? { total: 0 },
                });
                setStatus('ready');
            } catch (err) {
                if (!isActual) return;            // отмена/неактуальность — не трогаем
                if (err?.name === 'AbortError') return;
                setError(err);                    // снимок НЕ очищаем
                setStatus('error');
            }
        })();

        return () => {
            isActual = false;
            controller.abort();
        };
    }, [api, filters, revision]);

    //общая функция мутации (без изменений по логике)
    const mutate = async (operation) => {
        if (!mountedRef.current) return false;
        if (mutationLockRef.current) return false;

        mutationLockRef.current = true;
        const controller = new AbortController();
        mutationControllerRef.current = controller;

        setPending(true);
        setMutationError(null);

        try {
            await operation(controller.signal);

            if (!mountedRef.current) return false;
            if (mutationControllerRef.current !== controller) return false;
            if (controller.signal.aborted) return false;

            // после успеха — новый GET по актуальным filters (не захваченным при старте)
            setRevision((r) => r + 1);
            return true;
        } catch (err) {
            if (err?.name === 'AbortError') return false;
            if (!mountedRef.current) return false;
            if (mutationControllerRef.current !== controller) return false;
            setMutationError(err); // отдельно от error
            return false;
        } finally {
            if (mutationControllerRef.current === controller) {
                mutationControllerRef.current = null;
                mutationLockRef.current = false;
                if (mountedRef.current) setPending(false);
            }
        }
    };

    //методы поверх mutate
    const saveTask = (id, value) =>
        mutate((signal) =>
            id == null
                ? api.createTask(value, { signal })
                : api.updateTask(id, value, { signal })
        );

    const toggleTask = (task) =>
        mutate((signal) =>
            api.setTaskCompleted(task.id, !task.completed, { signal })
        );

    const deleteTask = (id) =>
        mutate((signal) => api.deleteTask(id, { signal }));

    const resetData = () =>
        mutate((signal) => api.resetDemoData({ signal }));

    const refresh = () => setRevision((r) => r + 1);

    return {
        snapshot, status, error, mutationError, pending,
        refresh,
        saveTask, toggleTask, deleteTask, resetData,
    };
}
