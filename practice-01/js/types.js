"use strict";

const result = "8" + 2;
console.log("Результат:", result);
console.log("Тип результата:", typeof result);

const res = "8" - 2;
console.log("Результат:", res);
console.log("Тип результата:", typeof res);

const re = Number("8") + 2;
console.log("Результат:", re);
console.log("Тип результата:", typeof re);

const r = "12" > "3";
console.log("Результат:", r);
console.log("Тип результата:", typeof r);

const a = 12 === "12";
console.log("Результат:", a);
console.log("Тип результата:", typeof a);

const b = Number("");
console.log("Результат:", b);
console.log("Тип результата:", typeof b);

const c = Number("text");
console.log("Результат:", c);
console.log("Тип результата:", typeof c);

const d = Boolean("false");
console.log("Результат:", d);
console.log("Тип результата:", typeof d);

const e = typeof null;
console.log("Результат:", e);
console.log("Тип результата:", typeof e);

const f = typeof NaN;
console.log("Результат:", f);
console.log("Тип результата:", typeof f);