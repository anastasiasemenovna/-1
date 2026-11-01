// ---- Проверочный вызов (check-get-task-999.mjs) ----
import { createApiClient } from "./src/api-client.js";
import { createTaskApi } from "./src/task-api.js";

const client = createApiClient({ baseUrl: "http://127.0.0.1:5505/api" });
const api = createTaskApi(client);

try {
    const task = await api.getTaskById(999);
    console.log("UNEXPECTED:", task);
} catch (error) {
    console.log("kind:", error.kind);
    console.log("status:", error.status);
}