"use strict";

import { createTask } from "./task-service.js";

// Успешный вызов
console.log(createTask(20, "Новая задача", "high"));
// { ok: true, task: { id: 20, title: 'Новая задача', completed: false, priority: 'high' } }

// Приоритет не передан — подставится "medium"
console.log(createTask(20, "Новая задача"));
// { ok: true, task: { id: 20, title: 'Новая задача', completed: false, priority: 'medium' } }

// Нормализация пробелов
console.log(createTask(20, "  Проверить  данные  "));
// title: 'Проверить  данные'

// Ошибки
console.log(createTask(0, "A"));           // { ok: false, error: '...' }
console.log(createTask(20, ""));           // { ok: false, error: '...' }
console.log(createTask(20, 42));           // { ok: false, error: '...' }
console.log(createTask(20, "A", "urgent")); // { ok: false, error: '...' }