// scratch/verify_cycle.js

const getCycleRange = (monthStr) => {
    const parts = monthStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-indexed

    let startYear = year;
    let startMonth = month - 1;
    if (startMonth === 0) {
        startMonth = 12;
        startYear--;
    }
    const startStr = `${startYear}-${String(startMonth).padStart(2, '0')}-10`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-09`;

    return {
        startStr,
        endStr,
        startDate: new Date(`${startStr}T00:00:00`),
        endDate: new Date(`${endStr}T23:59:59`)
    };
};

const getCurrentCycleMonthStr = (date = new Date()) => {
    const y = date.getFullYear();
    const m = date.getMonth(); // 0-indexed
    const d = date.getDate();

    let targetYear = y;
    let targetMonth = m + 1; // 1-indexed

    if (d >= 10) {
        targetMonth++;
        if (targetMonth > 12) {
            targetMonth = 1;
            targetYear++;
        }
    }

    return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
};

const getWorkingDaysInCycle = (startDate, endDate) => {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    let current = new Date(start);
    while (current <= end) {
        if (current.getDay() !== 0) { // Not Sunday
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

const getWorkedWorkingDaysInCycle = (startDate, endDate, mockToday) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    const now = mockToday ? new Date(mockToday) : new Date();
    now.setHours(0,0,0,0);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (yesterday < start) {
        return 0;
    }

    const limitDate = yesterday < end ? yesterday : end;

    let count = 0;
    let current = new Date(start);
    while (current <= limitDate) {
        if (current.getDay() !== 0) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

// Unit tests
console.log("Testing cycle month detection:");
const t1 = new Date("2026-06-04T12:00:00");
console.log("2026-06-04 should belong to cycle:", getCurrentCycleMonthStr(t1)); // Expected: 2026-06
const t2 = new Date("2026-06-11T12:00:00");
console.log("2026-06-11 should belong to cycle:", getCurrentCycleMonthStr(t2)); // Expected: 2026-07

console.log("\nTesting cycle date range extraction for 2026-06:");
const range = getCycleRange("2026-06");
console.log("Start Str:", range.startStr); // Expected: 2026-05-10
console.log("End Str:", range.endStr); // Expected: 2026-06-09

console.log("\nTesting working days in cycle 2026-06:");
const totalWorkingDays = getWorkingDaysInCycle(range.startDate, range.endDate);
console.log("Total working days (Mon-Sat):", totalWorkingDays); // Expected: 26 (since 31 calendar days, 5 Sundays: May 10, 17, 24, 31, and June 7)

console.log("\nTesting worked working days in cycle 2026-06 as of 2026-06-04:");
const workedDays = getWorkedWorkingDaysInCycle(range.startDate, range.endDate, new Date("2026-06-04T12:00:00"));
console.log("Worked days:", workedDays); // Expected: 22 (from May 10 to June 3, excluding Sundays)
