import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

// ============================================================
// Вспомогательная функция для вывода состояния
// ============================================================

function printState(label, tasks) {
    const { total, completed, pending, progress } = getTaskStats(tasks);
    console.log(`\n--- ${label} ---`);
    console.log(`Идентификаторы: [${tasks.map((t) => t.id).join(", ")}]`);
    console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
    if (total === 0) {
        console.log("Задач пока нет");
    } else {
        console.log(`Прогресс: ${progress.toFixed(1)}%`);
    }
}

// ============================================================
// Общий сценарий (раздел 6.5)
// ============================================================

console.log("ПР2. Демонстрационный сценарий");
console.log("Количество задач в общем наборе:", demoTasks.length);
console.log("Номер варианта:", variantNumber);
console.log("Количество задач в индивидуальном наборе:", variantTasks.length);

let currentTasks = demoTasks;

// --- Чтение исходного набора ---
console.log("\n=== Исходные данные ===");
console.log("Задачи:");
console.table(demoTasks);
console.log("Названия:", getTaskTitles(demoTasks));
console.log(
    "Невыполненные (id):",
    getPendingTasks(demoTasks).map((t) => t.id)
);
printState("Исходный набор", currentTasks);

// --- Шаг 1. Добавление id = 20 ---
const addResult = addTask(
    currentTasks,
    20,
    "Добавить проверку",
    "high"
);
if (addResult.ok) {
    currentTasks = addResult.tasks;
} else {
    console.error(`Ошибка: ${addResult.error}`);
}
printState("После добавления id = 20", currentTasks);

// --- Шаг 2. Установка completed = true для id = 4 ---
const doneResult = setTaskCompleted(currentTasks, 4, true);
if (doneResult.ok) {
    currentTasks = doneResult.tasks;
} else {
    console.error(`Ошибка: ${doneResult.error}`);
}
printState("После выполнения id = 4", currentTasks);

// --- Шаг 3. Переименование id = 10 ---
const renameResult = renameTask(
    currentTasks,
    10,
    "Подготовить инструкцию запуска"
);
if (renameResult.ok) {
    currentTasks = renameResult.tasks;
} else {
    console.error(`Ошибка: ${renameResult.error}`);
}
printState("После переименования id = 10", currentTasks);

// --- Шаг 4. Удаление id = 7 ---
const removeResult = removeTask(currentTasks, 7);
if (removeResult.ok) {
    currentTasks = removeResult.tasks;
} else {
    console.error(`Ошибка: ${removeResult.error}`);
}
printState("После удаления id = 7", currentTasks);

// --- Шаг 5. Обработка отказа ---
console.log("\n=== Обработка отказа ===");
const failResult = addTask(currentTasks, 20, "Дубль", "high");
if (failResult.ok) {
    currentTasks = failResult.tasks;
} else {
    console.error(`Ошибка: ${failResult.error}`);
}
// Состояние НЕ заменяется при ошибке:
printState("После отказа (состояние не изменилось)", currentTasks);

// --- Шаг 6. Проверка неизменности demoTasks ---
console.log("\n=== Проверка неизменности demoTasks ===");
console.log("Идентификаторы demoTasks:", demoTasks.map((t) => t.id));
console.log("Длина demoTasks:", demoTasks.length);
console.log(
    "id = 4 completed в demoTasks:",
    demoTasks.find((t) => t.id === 4).completed
);
console.log(
    "id = 10 title в demoTasks:",
    demoTasks.find((t) => t.id === 10).title
);

const snapshotOk = demoTasks.every(
    (t) =>
        t.id !== undefined &&
        t.title !== undefined &&
        t.completed !== undefined &&
        t.priority !== undefined
);
console.log("Все исходные поля на месте:", snapshotOk);
console.log(
    "currentTasks !== demoTasks:",
    currentTasks !== demoTasks
);

console.log("\n=== Итог общего сценария ===");
console.log("Итоговые идентификаторы:", currentTasks.map((t) => t.id));
console.log(
    "Невыполненные (id):",
    getPendingTasks(currentTasks).map((t) => t.id)
);

// ============================================================
// Индивидуальный сценарий (раздел 7)
// ============================================================

console.log("\n\n=== Индивидуальный вариант ===");
console.log("Номер варианта:", variantNumber);
console.log("Задачи варианта:");
console.table(variantTasks);

let variantState = variantTasks;

console.log("\n--- Исходное состояние варианта ---");
printState("Вариант: исходный", variantState);

// --- Чтение варианта ---
console.log(
    "Невыполненные варианта (id):",
    getPendingTasks(variantState).map((t) => t.id)
);
console.log("Названия варианта:", getTaskTitles(variantState));

// --- Добавление в вариант ---
const variantAdded = addTask(
    variantState,
    100,
    "Задача из варианта",
    "low"
);
if (variantAdded.ok) {
    variantState = variantAdded.tasks;
} else {
    console.error(`Ошибка: ${variantAdded.error}`);
}
printState("Вариант: после добавления id = 100", variantState);

// --- Установка статуса в варианте ---
const firstVariantId = variantState[0].id;
const variantDone = setTaskCompleted(variantState, firstVariantId, true);
if (variantDone.ok) {
    variantState = variantDone.tasks;
} else {
    console.error(`Ошибка: ${variantDone.error}`);
}
printState(`Вариант: после completed=true id = ${firstVariantId}`, variantState);

// --- Удаление в варианте ---
const lastVariantId = variantState[variantState.length - 1].id;
const variantRemoved = removeTask(variantState, lastVariantId);
if (variantRemoved.ok) {
    variantState = variantRemoved.tasks;
} else {
    console.error(`Ошибка: ${variantRemoved.error}`);
}
printState(`Вариант: после удаления id = ${lastVariantId}`, variantState);

// --- Проверка, что variantTasks не изменился ---
console.log("\nИдентификаторы variantTasks:", variantTasks.map((t) => t.id));
console.log("variantState !== variantTasks:", variantState !== variantTasks);