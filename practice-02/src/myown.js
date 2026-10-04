"use strict";

import assert from "node:assert/strict";
import {
    addTask,
    setTaskCompleted,
    renameTask,
    removeTask,
    getTaskStats,
    getPendingTasks,
    getTaskTitles,
    findTaskById,
} from "./task-service.js";

// ============================================================
// Мини-обвязка: печатает заголовок, ждёт ошибок и подводит итог
// ============================================================

let passed = 0;
let failed = 0;

function runCase(title, fn) {
    console.log(`\n=== ${title} ===`);
    try {
        fn();
        console.log("Результат: OK");
        passed += 1;
    } catch (error) {
        console.error("Результат: FAIL");
        console.error(`  ${error.message}`);
        failed += 1;
        process.exitCode = 1;
    }
}

function show(label, value) {
    console.log(`  ${label}:`, value);
}

// ============================================================
// Собственный случай 1. Добавление после удаления
// ============================================================

runCase("Собственный случай 1. Добавление после удаления", () => {
    const start = [
        { id: 1, title: "A", completed: true, priority: "medium" },
        { id: 4, title: "B", completed: false, priority: "high" },
        { id: 7, title: "C", completed: false, priority: "low" },
        { id: 10, title: "D", completed: true, priority: "medium" },
    ];
    show("Исходные id", start.map((t) => t.id));

    // Ожидание
    console.log("  Ожидается: removed = [1,4,10], readded = [1,4,10,7], start = [1,4,7,10]");

    const removed = removeTask(start, 7);
    show("removed.ok", removed.ok);
    show("removed id", removed.tasks.map((t) => t.id));

    const readded = addTask(removed.tasks, 7, "C заново", "low");
    show("readded.ok", readded.ok);
    show("readded id", readded.tasks.map((t) => t.id));
    show("readded[3].title", readded.tasks[3].title);
    show("start id (после всех операций)", start.map((t) => t.id));

    // Проверки
    assert.equal(removed.ok, true);
    assert.deepEqual(removed.tasks.map((t) => t.id), [1, 4, 10]);
    assert.equal(readded.ok, true);
    assert.deepEqual(readded.tasks.map((t) => t.id), [1, 4, 10, 7]);
    assert.equal(readded.tasks[3].title, "C заново");
    assert.deepEqual(start.map((t) => t.id), [1, 4, 7, 10]);
    assert.equal(start[2].title, "C");
    assert.notEqual(removed.tasks, start);
    assert.notEqual(readded.tasks, removed.tasks);
});

// ============================================================
// Собственный случай 2. Изменение первой и последней записи
// ============================================================

runCase("Собственный случай 2. Изменение первой и последней записи", () => {
    const start = [
        { id: 1, title: "A", completed: true, priority: "medium" },
        { id: 4, title: "B", completed: false, priority: "high" },
        { id: 7, title: "C", completed: false, priority: "low" },
        { id: 10, title: "D", completed: true, priority: "medium" },
    ];

    console.log("  Ожидается: first[0].completed = false, last[3].title = 'Последняя задача'");

    const first = setTaskCompleted(start, 1, false);
    show("first.ok", first.ok);
    show("first[0].completed", first.tasks[0].completed);
    show("first[1].completed (не должен меняться)", first.tasks[1].completed);
    show("start[0].completed (не должен меняться)", start[0].completed);

    const last = renameTask(first.tasks, 10, "Последняя задача");
    show("last.ok", last.ok);
    show("last[3].title", last.tasks[3].title);
    show("last[2].title (не должен меняться)", last.tasks[2].title);
    show("start[3].title (не должен меняться)", start[3].title);

    const stats = getTaskStats(last.tasks);
    show("stats", stats);

    assert.equal(first.ok, true);
    assert.equal(first.tasks[0].completed, false);
    assert.equal(first.tasks[1].completed, false);
    assert.equal(start[0].completed, true);
    assert.equal(last.ok, true);
    assert.equal(last.tasks[3].title, "Последняя задача");
    assert.equal(last.tasks[2].title, "C");
    assert.equal(start[3].title, "D");
    assert.equal(stats.total, 4);
    assert.equal(stats.completed, 1);
    assert.equal(stats.pending, 3);
});

// ============================================================
// Собственный случай 3. Последовательное обновление нескольких задач
// ============================================================

runCase("Собственный случай 3. Последовательное обновление нескольких задач", () => {
    const start = [
        { id: 1, title: "A", completed: true, priority: "medium" },
        { id: 4, title: "B", completed: false, priority: "high" },
        { id: 7, title: "C", completed: false, priority: "low" },
        { id: 10, title: "D", completed: true, priority: "medium" },
    ];

    console.log("  Ожидается: после s1 completed=3, после s2 completed=4, после s3 pending=0, progress=100");

    const s1 = setTaskCompleted(start, 4, true);
    show("s1.ok", s1.ok);
    show("s1 stats", getTaskStats(s1.tasks));

    const s2 = setTaskCompleted(s1.tasks, 7, true);
    show("s2.ok", s2.ok);
    show("s2 stats", getTaskStats(s2.tasks));

    const s3 = setTaskCompleted(s2.tasks, 1, true);
    show("s3.ok", s3.ok);
    show("s3 stats", getTaskStats(s3.tasks));
    show("s3.tasks !== s2.tasks", s3.tasks !== s2.tasks);
    show("s3.tasks[0] !== s2.tasks[0]", s3.tasks[0] !== s2.tasks[0]);
    show("pending id после s3", getPendingTasks(s3.tasks).map((t) => t.id));
    show("start stats (не должны меняться)", getTaskStats(start));

    assert.equal(s1.ok, true);
    assert.equal(getTaskStats(s1.tasks).completed, 3);
    assert.equal(s2.ok, true);
    assert.equal(getTaskStats(s2.tasks).completed, 4);
    assert.equal(s3.ok, true);
    assert.notEqual(s3.tasks, s2.tasks);
    assert.notEqual(s3.tasks[0], s2.tasks[0]);

    const stats = getTaskStats(s3.tasks);
    assert.equal(stats.completed, 4);
    assert.equal(stats.pending, 0);
    assert.equal(stats.progress, 100);
    assert.deepEqual(getPendingTasks(s3.tasks).map((t) => t.id), []);
    assert.equal(getTaskStats(start).completed, 2);
    assert.equal(start.find((t) => t.id === 4).completed, false);
    assert.equal(start.find((t) => t.id === 7).completed, false);
});

// ============================================================
// Собственный случай 4. Переименование с краевыми пробелами
// ============================================================

runCase("Собственный случай 4. Переименование с краевыми пробелами", () => {
    const start = [
        { id: 1, title: "A", completed: true, priority: "medium" },
        { id: 4, title: "B", completed: false, priority: "high" },
    ];

    console.log("  Ожидается: title = 'Новое  имя', остальные поля сохранены");

    const renamed = renameTask(start, 4, "  Новое  имя  ");
    const target = renamed.tasks[1];
    show("renamed.ok", renamed.ok);
    show("target.title", JSON.stringify(target.title));
    show("target.id", target.id);
    show("target.completed", target.completed);
    show("target.priority", target.priority);
    show("start[1].title (не должен меняться)", JSON.stringify(start[1].title));

    assert.equal(renamed.ok, true);
    assert.equal(target.title, "Новое  имя");
    assert.equal(target.id, 4);
    assert.equal(target.completed, false);
    assert.equal(target.priority, "high");
    assert.equal(start[1].title, "B");
});

// ============================================================
// Собственный случай 5. Ошибочные вызовы не меняют состояние
// ============================================================

runCase("Собственный случай 5. Ошибочные вызовы не меняют состояние", () => {
    const start = [
        { id: 1, title: "A", completed: true, priority: "medium" },
        { id: 4, title: "B", completed: false, priority: "high" },
    ];
    const snapshot = start.map((t) => ({ ...t }));
    show("snapshot", snapshot);

    console.log("  Ожидается: все вызовы ok:false, массив не изменён");

    const results = {
        "addTask(4, дубль)": addTask(start, 4, "Дубль"),
        "addTask(1.5)": addTask(start, 1.5, "Дробный id"),
        "addTask(2, title=42)": addTask(start, 2, 42),
        "setTaskCompleted(1, 'true')": setTaskCompleted(start, 1, "true"),
        "setTaskCompleted(1, 1)": setTaskCompleted(start, 1, 1),
        "setTaskCompleted(1, null)": setTaskCompleted(start, 1, null),
        "setTaskCompleted(777, true)": setTaskCompleted(start, 777, true),
        "renameTask(1, '')": renameTask(start, 1, ""),
        "renameTask(1, '   ')": renameTask(start, 1, "   "),
        "renameTask(1, 101 симв.)": renameTask(start, 1, "A".repeat(101)),
        "renameTask(777, 'X')": renameTask(start, 777, "X"),
        "removeTask('1')": removeTask(start, "1"),
        "removeTask(777)": removeTask(start, 777),
    };

    for (const [label, result] of Object.entries(results)) {
        show(label, result.ok === false ? `ok:false — ${result.error}` : "ok:true (НЕ ОЖИДАЛОСЬ)");
    }

    show("start после всех ошибок", start.map((t) => ({ ...t })));

    for (const [label, result] of Object.entries(results)) {
        assert.equal(result.ok, false, `${label} должен вернуть ok:false`);
    }
    assert.deepEqual(
        start.map((t) => ({ ...t })),
        snapshot,
        "Массив после всех ошибок идентичен исходному"
    );
});

// ============================================================
// Собственный случай 6. Работа с пустым списком
// ============================================================

runCase("Собственный случай 6. Работа с пустым списком", () => {
    const empty = [];

    console.log("  Ожидается: stats = {0,0,0,0}, addTask = ok:true, остальные = ok:false");

    const stats = getTaskStats(empty);
    show("getTaskStats([])", stats);

    const added = addTask(empty, 1, "Первая", "low");
    show("addTask([]) ok", added.ok);
    show("addTask([]) длина нового массива", added.tasks.length);
    show("пустой массив после addTask", empty);

    const setEmpty = setTaskCompleted(empty, 1, true);
    show("setTaskCompleted([], 1, true)", setEmpty);

    const renameEmpty = renameTask(empty, 1, "X");
    show("renameTask([], 1, 'X')", renameEmpty);

    const removeEmpty = removeTask(empty, 1);
    show("removeTask([], 1)", removeEmpty);

    assert.equal(stats.total, 0);
    assert.equal(stats.completed, 0);
    assert.equal(stats.pending, 0);
    assert.equal(stats.progress, 0);
    assert.equal(added.ok, true);
    assert.equal(added.tasks.length, 1);
    assert.equal(empty.length, 0);
    assert.equal(setEmpty.ok, false);
    assert.equal(renameEmpty.ok, false);
    assert.equal(removeEmpty.ok, false);
});

// ============================================================
// Собственный случай 7. Удаление единственной задачи
// ============================================================

runCase("Собственный случай 7. Удаление единственной задачи", () => {
    const start = [
        { id: 5, title: "Единственная", completed: false, priority: "medium" },
    ];

    console.log("  Ожидается: removed.ok = true, removed.tasks = [], start.length = 1");

    const removed = removeTask(start, 5);
    show("removed.ok", removed.ok);
    show("removed.tasks.length", removed.tasks.length);
    show("start.length (не должен меняться)", start.length);
    show("start[0].id", start[0].id);

    assert.equal(removed.ok, true);
    assert.equal(removed.tasks.length, 0);
    assert.equal(start.length, 1);
    assert.equal(start[0].id, 5);
});

// ============================================================
// Итог
// ============================================================

console.log(`\n============================================================`);
console.log(`Пройдено: ${passed}, провалено: ${failed}`);
if (failed === 0) {
    console.log("Все собственные проверки пройдены.");
} else {
    console.log("Есть проваленные проверки — см. вывод выше.");
}