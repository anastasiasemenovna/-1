"use strict";

const totalTasksInput = "12";
const completedTasksInput = "5";

if (typeof totalTasksInput !== "string" || typeof completedTasksInput !== "string") {
    console.log("Ошибка: ожидались строки с количеством задач.");
} else {
    const totalTrimmed = totalTasksInput.trim();
    const completedTrimmed = completedTasksInput.trim();

    if (totalTrimmed === "" || completedTrimmed === "") {
        console.log("Ошибка: пустой ввод количества задач.");
    } else {
        const totalTasks = Number(totalTrimmed);
        const completedTasks = Number(completedTrimmed);

        if (Number.isNaN(totalTasks) || Number.isNaN(completedTasks)) {
            console.log("Ошибка: недопустимое числовое значение.");
        } else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
            console.log("Ошибка: недопустимое числовое значение.");
        } else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
            console.log("Ошибка: дробное количество.");
        } else if (totalTasks < 0 || completedTasks < 0) {
            console.log("Ошибка: отрицательное количество.");
        } else if (totalTasks > 1000) {
            console.log("Ошибка: превышена верхняя граница.");
        } else if (completedTasks > totalTasks) {
            console.log("Ошибка: выполнено больше, чем существует.");
        } else if (totalTasks === 0 && completedTasks === 0) {
            console.log("Задач пока нет.");
        } else {
            const remainingTasks = totalTasks - completedTasks;
            const progress = (completedTasks / totalTasks) * 100;

            let status;
            if (completedTasks === 0) {
                status = "Не начато";
            } else if (completedTasks === totalTasks) {
                status = "Завершено";
            } else {
                status = "В работе";
            }

            console.log(`Всего задач: ${totalTasks}`);
            console.log(`Выполнено: ${completedTasks}`);
            console.log(`Осталось: ${remainingTasks}`);
            console.log(`Прогресс: ${progress.toFixed(1)}%`);
            console.log(`Статус: ${status}`);
        }
    }
}