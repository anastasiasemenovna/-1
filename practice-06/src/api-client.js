export class ApiError extends Error {
    constructor(message, {
        kind,
        status = null,
        code = null,
        details = null,
        url = null,
        cause,
    } = {}) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = "ApiError";
        this.kind = kind;
        this.status = status;
        this.code = code;
        this.details = details;
        this.url = url;
    }
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
    // ---------- baseUrl ----------
    if (typeof baseUrl !== "string" || baseUrl.length === 0) {
        throw new ApiError("baseUrl должен быть непустой строкой.", { kind: "config" });
    }

    let base;
    try {
        base = new URL(baseUrl);
    } catch {
        throw new ApiError("baseUrl должен быть абсолютным URL.", { kind: "config" });
    }

    if (base.protocol !== "http:" && base.protocol !== "https:") {
        throw new ApiError("baseUrl должен использовать http или https.", { kind: "config" });
    }
    if (base.search !== "" || base.hash !== "") {
        throw new ApiError("baseUrl не должен содержать query или hash.", { kind: "config" });
    }

    // ---------- path ----------
    if (typeof path !== "string" || path.length === 0) {
        throw new ApiError("path должен быть непустой строкой.", { kind: "config" });
    }

    // Отсекаем абсолютные и схема-относительные URL, чтобы path оставался относительным.
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path) || path.startsWith("//")) {
        throw new ApiError("path должен быть относительным путём.", { kind: "config" });
    }

    // ---------- склейка без двойного / ----------
    const basePath = base.pathname.replace(/\/+$/, "");          // без хвостовых /
    const relPath = path.replace(/^\/+/, "");                     // без ведущих /
    const fullPath = `${basePath}/${relPath}` || "/";

    // ---------- query ----------
    if (query === null || typeof query !== "object" || Array.isArray(query)) {
        throw new ApiError("query должен быть обычным объектом.", { kind: "config" });
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        // Пропускаем undefined, null и пустую строку. false и 0 сохраняются.
        if (value === undefined || value === null || value === "") continue;
        searchParams.append(key, String(value));
    }

    const url = new URL(base.origin);
    url.pathname = fullPath;
    url.search = searchParams.toString();

    // Входной query не мутирован: мы только читали Object.entries.
    return url.toString();
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toApiErrorFromHttp(response, payload, url) {
    let code = null;
    let details = null;
    let message = `HTTP ${response.status}`;

    if (isPlainObject(payload) && isPlainObject(payload.error)) {
        if (typeof payload.error.code === "string") code = payload.error.code;
        if (typeof payload.error.message === "string" && payload.error.message !== "") {
            message = payload.error.message;
        }
        if (payload.error.details !== undefined) details = payload.error.details;
    }

    return new ApiError(message, {
        kind: "http",
        status: response.status,
        code,
        details,
        url,
    });
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

export function createApiClient({
    baseUrl,
    fetchFn = globalThis.fetch,
    timeoutMs = 2000,
} = {}) {
    // 1. Проверка конфигурации фабрики.
    if (typeof baseUrl !== "string" || baseUrl.length === 0) {
        throw new TypeError("baseUrl должен быть непустой строкой.");
    }

    let normalizedBase;
    try {
        normalizedBase = new URL(baseUrl);
    } catch {
        throw new TypeError("baseUrl должен быть абсолютным URL.");
    }
    if (normalizedBase.protocol !== "http:" && normalizedBase.protocol !== "https:") {
        throw new TypeError("baseUrl должен использовать http или https.");
    }
    if (normalizedBase.search !== "" || normalizedBase.hash !== "") {
        throw new TypeError("baseUrl не должен содержать query или hash.");
    }

    if (typeof fetchFn !== "function") {
        throw new TypeError("fetchFn должен быть функцией.");
    }
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
        throw new TypeError("timeoutMs должен быть положительным числом.");
    }

    // 2. requestJson.
    async function requestJson(
        path,
        { query = {}, signal: externalSignal, timeoutMs: callTimeoutMs, method = "GET", body } = {},
    ) {
        const effectiveTimeout = callTimeoutMs ?? timeoutMs;

        // --- метод ---
        if (typeof method !== "string") {
            throw new TypeError("method должен быть строкой.");
        }
        const normalizedMethod = method.toUpperCase();
        if (!ALLOWED_METHODS.has(normalizedMethod)) {
            throw new TypeError(
                'method должен быть одним из "GET", "POST", "PATCH", "DELETE".',
            );
        }

        // --- GET с body отклоняется до сетевого запроса ---
        if (normalizedMethod === "GET" && body !== undefined) {
            throw new TypeError("GET-запрос не должен содержать body.");
        }

        // --- URL ---
        const url = buildUrl(baseUrl, path, query);

        // --- тайм-аут + внешняя отмена (как в ПР5) ---
        const timeoutController = new AbortController();
        const timer = setTimeout(() => {
            timeoutController.abort(
                new ApiError("Время ожидания истекло.", { kind: "timeout", url }),
            );
        }, effectiveTimeout);

        let controller = timeoutController;

        if (externalSignal !== undefined && externalSignal !== null) {
            if (!(externalSignal instanceof AbortSignal)) {
                clearTimeout(timer);
                throw new TypeError("signal должен быть AbortSignal.");
            }
            if (externalSignal.aborted) {
                clearTimeout(timer);
                throw new ApiError("Запрос отменён.", {
                    kind: "aborted",
                    url,
                    cause: externalSignal.reason,
                });
            }
            const combined = new AbortController();
            controller = combined;
            externalSignal.addEventListener(
                "abort",
                () => combined.abort(externalSignal.reason),
                { once: true },
            );
            timeoutController.signal.addEventListener(
                "abort",
                () => combined.abort(timeoutController.signal.reason),
                { once: true },
            );
        }

        // --- заголовки ---
        const headers = { Accept: "application/json" };
        let requestBody;
        if (body !== undefined) {
            headers["Content-Type"] = "application/json";
            try {
                requestBody = JSON.stringify(body);
            } catch (error) {
                clearTimeout(timer);
                throw new ApiError("Не удалось сериализовать body в JSON.", {
                    kind: "invalid-response",
                    url,
                    cause: error,
                });
            }
        }

        // --- fetch ---
        let response;
        try {
            response = await fetchFn(url, {
                method: normalizedMethod,
                headers,
                body: requestBody,
                signal: controller.signal,
            });
        } catch (error) {
            clearTimeout(timer);

            if (error instanceof ApiError) throw error;

            if (timeoutController.signal.aborted) {
                throw new ApiError("Время ожидания истекло.", {
                    kind: "timeout",
                    url,
                    cause: error,
                });
            }
            if (controller.signal.aborted) {
                throw new ApiError("Запрос отменён.", {
                    kind: "aborted",
                    url,
                    cause: error,
                });
            }
            throw new ApiError(
                `Сетевая ошибка: ${error?.message ?? "неизвестная ошибка"}.`,
                { kind: "network", url, cause: error },
            );
        }
        clearTimeout(timer);

        // --- проверка типа Response ---
        if (
            response === null ||
            typeof response !== "object" ||
            typeof response.status !== "number" ||
            typeof response.ok !== "boolean" ||
            typeof response.headers?.get !== "function" ||
            typeof response.text !== "function"
        ) {
            throw new ApiError("fetchFn вернул некорректный Response.", {
                kind: "invalid-response",
                url,
            });
        }

        // --- HTTP-ошибка раньше Content-Type ---
        if (!response.ok) {
            let payload = null;
            try {
                const text = await response.text();
                if (text.length > 0) {
                    try { payload = JSON.parse(text); } catch { payload = null; }
                }
            } catch {
                payload = null;
            }
            throw toApiErrorFromHttp(response, payload, url);
        }

        // --- 204 ---
        if (response.status === 204) {
            return null;
        }

        // --- Content-Type ---
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
            throw new ApiError("Ответ не содержит application/json.", {
                kind: "invalid-response",
                url,
            });
        }

        // --- JSON ---
        const text = await response.text();
        if (text.length === 0) {
            throw new ApiError("Пустой ответ при ожидаемом JSON.", {
                kind: "invalid-response",
                url,
            });
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            throw new ApiError("Ответ не является корректным JSON.", {
                kind: "invalid-response",
                url,
                cause: error,
            });
        }
    }

    return { requestJson };
}
