import { ApiError } from './errors.js';

// ---------------------------------------------------------------------------
// Константы
// ---------------------------------------------------------------------------
const ALLOWED_QUERY = new Set(['completed', 'priority', 'categoryId', 'q']);
const PRIORITIES = new Set(['low', 'medium', 'high']); // регистрозависимо
const MAX_Q_LENGTH = 100;
const MAX_TITLE_LENGTH = 200;

// ---------------------------------------------------------------------------
// parsePositiveId(raw: string) -> number | null
// ---------------------------------------------------------------------------
export function parsePositiveId(raw) {
    if (typeof raw !== 'string') return null;
    if (!/^[1-9]\d*$/.test(raw)) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : null;
}

// ---------------------------------------------------------------------------
// parseFilters(searchParams: URLSearchParams) -> filters
// Бросает ApiError(400, 'INVALID_QUERY', ...).
// ---------------------------------------------------------------------------
export function parseFilters(searchParams) {
    for (const name of searchParams.keys()) {
        if (!ALLOWED_QUERY.has(name)) {
            throw new ApiError(400, 'INVALID_QUERY', `Unknown query parameter: ${name}`);
        }
    }

    const seen = new Set();
    for (const name of searchParams.keys()) {
        if (seen.has(name)) {
            throw new ApiError(400, 'INVALID_QUERY', `Duplicate query parameter: ${name}`);
        }
        seen.add(name);
    }

    const result = {
        completed: null,
        priority: null,
        categoryId: null,
        q: '',
    };

    if (searchParams.has('completed')) {
        const raw = searchParams.get('completed');
        if (raw !== 'true' && raw !== 'false') {
            throw new ApiError(400, 'INVALID_QUERY', 'completed must be "true" or "false"');
        }
        result.completed = raw === 'true';
    }

    if (searchParams.has('priority')) {
        const raw = searchParams.get('priority');
        if (!PRIORITIES.has(raw)) {
            throw new ApiError(400, 'INVALID_QUERY', 'priority must be low|medium|high');
        }
        result.priority = raw;
    }

    if (searchParams.has('categoryId')) {
        const raw = searchParams.get('categoryId');
        const id = parsePositiveId(raw);
        if (id === null) {
            throw new ApiError(400, 'INVALID_QUERY', 'categoryId must be a positive safe integer');
        }
        result.categoryId = id;
    }

    if (searchParams.has('q')) {
        const raw = searchParams.get('q');
        const trimmed = raw.trim();
        if (trimmed.length > MAX_Q_LENGTH) {
            throw new ApiError(400, 'INVALID_QUERY', 'q must be at most 100 characters');
        }
        result.q = trimmed;
    }

    return result;
}

export function parseTaskDraft(body) {
    const errors = [];

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Тело запроса должно быть JSON-объектом.', {
            fields: [{ field: 'body', message: 'must be a JSON object' }],
        });
    }

    const rawTitle = body.title;
    if (typeof rawTitle !== 'string') {
        errors.push({ field: 'title', message: 'title должен быть строкой.' });
    } else {
        const title = rawTitle.trim();
        if (title === '') {
            errors.push({ field: 'title', message: 'title не должен быть пустым.' });
        } else if (title.length > MAX_TITLE_LENGTH) {
            errors.push({ field: 'title', message: `title длиннее ${MAX_TITLE_LENGTH} символов.` });
        }
    }

    if (errors.length > 0) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Некорректные данные задачи.', { fields: errors });
    }

    return {
        title: rawTitle.trim(),
        completed: typeof body.completed === 'boolean' ? body.completed : false,
        priority: ['low', 'medium', 'high'].includes(body.priority) ? body.priority : 'medium',
        categoryId: body.categoryId ?? null,
    };
}