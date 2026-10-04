"use strict";

import { demoTasks } from "./data.js";
import {
    findTaskById,
    getPendingTasks,
    getTaskTitles,
    getTaskStats,
} from "./task-service.js";

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr === expectedStr) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}`);
        console.log(`   ожидалось: ${expectedStr}`);
        console.log(`   получено:  ${actualStr}`);
        failed++;
    }
}

console.log("=== findTaskById ===");
check(
    "поиск id=4",
    findTaskById(demoTasks, 4),
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" }
);
check("поиск id=777", findTaskById(demoTasks, 777), undefined);
check('поиск строкового "4"', findTaskById(demoTasks, "4"), undefined);
check("поиск в пустом массиве", findTaskById([], 4), undefined);

console.log("\n=== getPendingTasks ===");
check(
    "невыполненные из demoTasks (id)",
    getPendingTasks(demoTasks).map((t) => t.id),
    [4, 7]
);
check("отбор из []", getPendingTasks([]), []);
check(
    "отбор из списка, где всё выполнено",
    getPendingTasks([
        { id: 1, title: "A", completed: true, priority: "low" },
    ]),
    []
);
check(
    "отбор из списка, где ничего не выполнено",
    getPendingTasks([
        { id: 1, title: "A", completed: false, priority: "low" },
        { id: 2, title: "B", completed: false, priority: "high" },
    ]).map((t) => t.id),
    [1, 2]
);

console.log("\n=== getTaskTitles ===");
check(
    "названия demoTasks",
    getTaskTitles(demoTasks),
    [
        "Изучить функции",
        "Подготовить модель задач",
        "Проверить методы массивов",
        "Оформить README",
    ]
);
check("названия пустого списка", getTaskTitles([]), []);

console.log("\n=== getTaskStats ===");
check(
    "сводка demoTasks",
    getTaskStats(demoTasks),
    { total: 4, completed: 2, pending: 2, progress: 50 }
);
check("сводка []", getTaskStats([]), {
    total: 0,
    completed: 0,
    pending: 0,
    progress: 0,
});
check(
    "4 задачи, ни одна не выполнена",
    getTaskStats([
        { id: 1, title: "A", completed: false, priority: "low" },
        { id: 2, title: "B", completed: false, priority: "low" },
        { id: 3, title: "C", completed: false, priority: "low" },
        { id: 4, title: "D", completed: false, priority: "low" },
    ]).progress,
    0
);
check(
    "4 задачи, все выполнены",
    getTaskStats([
        { id: 1, title: "A", completed: true, priority: "low" },
        { id: 2, title: "B", completed: true, priority: "low" },
        { id: 3, title: "C", completed: true, priority: "low" },
        { id: 4, title: "D", completed: true, priority: "low" },
    ]).progress,
    100
);

console.log("\n=== Немутируемость и отображение ===");
const before = JSON.stringify(demoTasks);
findTaskById(demoTasks, 4);
getPendingTasks(demoTasks);
getTaskTitles(demoTasks);
getTaskStats(demoTasks);
check("demoTasks не изменился", JSON.stringify(demoTasks), before);

const progress = getTaskStats([
    { id: 1, title: "A", completed: true, priority: "low" },
    { id: 2, title: "B", completed: false, priority: "low" },
    { id: 3, title: "C", completed: false, priority: "low" },
]).progress;
check("progress — число, не строка", typeof progress, "number");
check("отображение toFixed(1)", progress.toFixed(1), "33.3");

console.log("\n=== Проверка нового массива ===");
const pending = getPendingTasks(demoTasks);
check("getPendingTasks вернул новый массив", pending === demoTasks, false);
const titles = getTaskTitles(demoTasks);
check("getTaskTitles вернул новый массив", titles === demoTasks, false);

console.log(`\nИтог: ${passed} пройдено, ${failed} провалено`);