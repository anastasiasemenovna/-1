import { Router } from 'express';
import { ApiError } from './errors.js';
import { parseTaskDraft } from './validation.js';

// ---------------------------------------------------------------------------
// Константы
// ---------------------------------------------------------------------------
const ALLOWED_QUERY = new Set(['completed', 'priority', 'categoryId', 'q']);
const PRIORITIES = new Set(['low', 'medium', 'high']); // регистрозависимо
const MAX_Q_LENGTH = 100;

const DEFAULT_FILTERS = Object.freeze({
    completed: null,
    priority: null,
    categoryId: null,
    q: '',
});

// ---------------------------------------------------------------------------
// parsePositiveId(raw) -> number | null
// ---------------------------------------------------------------------------
export function parsePositiveId(raw) {
    if (typeof raw !== 'string') return null;
    if (!/^[1-9]\d*$/.test(raw)) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : null;
}

// ---------------------------------------------------------------------------
// parseFilters(searchParams) -> filters (или бросает ApiError 400 INVALID_QUERY)
// ---------------------------------------------------------------------------
export function parseFilters(searchParams) {
    const filters = { ...DEFAULT_FILTERS };
    const seen = new Set();

    for (const [name, raw] of searchParams) {
        if (!ALLOWED_QUERY.has(name)) {
            throw new ApiError(400, 'INVALID_QUERY', `Unknown query parameter: ${name}`);
        }
        if (seen.has(name)) {
            throw new ApiError(400, 'INVALID_QUERY', `Duplicate query parameter: ${name}`);
        }
        seen.add(name);

        switch (name) {
            case 'completed': {
                if (raw !== 'true' && raw !== 'false') {
                    throw new ApiError(400, 'INVALID_QUERY', 'completed must be "true" or "false"');
                }
                filters.completed = raw === 'true';
                break;
            }
            case 'priority': {
                if (!PRIORITIES.has(raw)) {
                    throw new ApiError(400, 'INVALID_QUERY', 'priority must be low|medium|high');
                }
                filters.priority = raw;
                break;
            }
            case 'categoryId': {
                const id = parsePositiveId(raw);
                if (id === null) {
                    throw new ApiError(400, 'INVALID_QUERY', 'categoryId must be a positive safe integer');
                }
                filters.categoryId = id;
                break;
            }
            case 'q': {
                if (raw.length > MAX_Q_LENGTH) {
                    throw new ApiError(400, 'INVALID_QUERY', 'q is too long');
                }
                const trimmed = raw.trim();
                if (trimmed.length > MAX_Q_LENGTH) {
                    throw new ApiError(400, 'INVALID_QUERY', 'q is too long');
                }
                filters.q = trimmed.toLocaleLowerCase('ru-RU');
                break;
            }
        }
    }

    return filters;
}

// ---------------------------------------------------------------------------
// Роутер
// ---------------------------------------------------------------------------
export function createRouter(store) {
    const router = Router({ caseSensitive: true });

    // --- GET /health ---
    router.get('/health', (req, res) => {
        res.json({ data: { status: 'ok' } });
    });

    // --- GET /categories ---
    router.get('/categories', (req, res) => {
        const data = store.listCategories();
        res.json({ data, meta: { total: data.length } });
    });

    // --- GET /tasks ---
    router.get('/tasks', (req, res) => {
        const url = new URL(req.originalUrl, 'http://localhost');
        const filters = parseFilters(url.searchParams);
        const data = store.listTasks(filters);
        res.json({ data, meta: { total: data.length, filters } });
    });

    // --- GET /tasks/:id ---
    router.get('/tasks/:id', (req, res) => {
        const id = parsePositiveId(req.params.id);
        if (id === null) {
            throw new ApiError(400, 'INVALID_ID', 'Некорректный идентификатор задачи.');
        }
        const task = store.getTask(id);
        if (!task) {
            throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
        }
        res.json({ data: task });
    });

    // --- POST /tasks (ДО router.all!) ---
    router.post('/tasks', (req, res) => {
        const draft = parseTaskDraft(req.body);
        const task = store.createTask(draft);
        res.status(201).json({ data: task });
    });

    // --- 405 для известных путей с неподдерживаемыми методами ---
    // Регистрируем ПОСЛЕ всех реальных маршрутов.
    const allowByPath = {
        '/health':     'GET, HEAD, OPTIONS',
        '/categories': 'GET, HEAD, OPTIONS',
        '/tasks':      'GET, HEAD, OPTIONS, POST',
        '/tasks/:id':  'GET, HEAD, OPTIONS',
    };
    for (const [path, allow] of Object.entries(allowByPath)) {
        router.all(path, (req, res) => {
            res.set('Allow', allow);
            res.status(405).json({
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: 'Метод не поддерживается.',
                },
            });
        });
    }

    return router;
}