import { createApiClient, buildUrl } from "./src/api-client.js";
import { createTaskApi } from "./src/task-api.js";

const BASE_URL = "http://127.0.0.1:5505/api";
const client = createApiClient({ baseUrl: BASE_URL });
const api = createTaskApi(client);

const filters = { completed: false, priority: "high" };
console.log("URL:", buildUrl(BASE_URL, "/tasks", filters));

const result = await api.getTasks(filters);
console.log("ids:", result.tasks.map((task) => task.id));
console.log("meta.total:", result.meta.total);