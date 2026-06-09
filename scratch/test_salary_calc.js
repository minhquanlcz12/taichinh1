const fs = require('fs');
const path = require('path');

// Mock browser objects
global.window = {};
global.document = {
  getElementById: () => ({ innerHTML: '' })
};

// Mock Utils
global.Utils = {
  formatCurrency: (val) => val.toLocaleString('vi-VN') + 'đ',
  getUserDisplayName: (username) => username,
};

// Mock Auth
global.Auth = {
  currentUser: { username: 'long.dao', role: 'user' },
  getAccounts: async () => [
    { username: 'long.dao', role: 'user', baseSalary: 6500000 }
  ]
};

// Mock Attendance
global.Attendance = {
  loadData: async () => [
    // May 10th - May 31st: 22 days total.
    // Sundays: May 10, 17, 24, 31 (4 Sundays).
    // Mon-Sat: 22 - 4 = 18 days.
    // Let's add 18 "on_time" check-ins in May.
    ...Array.from({length: 18}, (_, i) => {
      // Days from May 11 to May 30, skipping Sundays
      const day = i + 11;
      let actualDay = day;
      if (actualDay >= 17) actualDay++;
      if (actualDay >= 24) actualDay++;
      return {
        username: 'long.dao',
        dateStr: `2026-05-${String(actualDay).padStart(2, '0')}`,
        status: 'on_time',
        timestamp: Date.parse(`2026-05-${String(actualDay).padStart(2, '0')}T08:15:00`)
      };
    }),
    // June 1st - June 3rd (3 days of June inside the cycle, no Sundays).
    // Let's mock 3 "on_time" check-ins in June.
    { username: 'long.dao', dateStr: '2026-06-01', status: 'on_time', timestamp: Date.parse('2026-06-01T08:15:00') },
    { username: 'long.dao', dateStr: '2026-06-02', status: 'on_time', timestamp: Date.parse('2026-06-02T08:15:00') },
    { username: 'long.dao', dateStr: '2026-06-03', status: 'on_time', timestamp: Date.parse('2026-06-03T08:15:00') },
  ],
  loadLeaveData: async () => []
};

// Mock DB
global.DB = {
  getCustomBonuses: async () => ({
    '2026-06': { 'long.dao': 0 }
  }),
  getBonusApprovals: async () => ({
    '2026-06': { 'long.dao': false }
  })
};

// Mock WorkModule
global.WorkModule = {
  data: { tasks: [] },
  load: async () => {}
};

// Load payroll.js
const payrollJsContent = fs.readFileSync(path.join(__dirname, '../js/payroll.js'), 'utf8');
const modifiedContent = payrollJsContent.replace('const PayrollModule =', 'global.PayrollModule =');
eval(modifiedContent);

// Run calculation
async function runTest() {
  const monthStr = '2026-06'; // Period ending on June 9th, paid June 10th
  console.log("Calculating salary for long.dao in period:", monthStr);

  const cycle = PayrollModule.getCycleRange(monthStr);
  console.log("Cycle start:", cycle.startStr);
  console.log("Cycle end:", cycle.endStr);

  const workingDays = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);
  console.log("Cycle standard working days:", workingDays); // Expected: 26

  const workedWorkingDays = PayrollModule.getWorkedWorkingDaysInCycle(cycle.startDate, cycle.endDate);
  console.log("Worked working days (until yesterday):", workedWorkingDays);

  const salary = await PayrollModule.calculateUserSalary('long.dao', monthStr);
  console.log("Calculated Net Salary:", Utils.formatCurrency(salary));
  
  // Total workdays checked: 18 in May + 3 in June = 21 days.
  // Standard cycle workdays: 26 days.
  // Expected salary = (6,500,000 / 26) * 21 = 250,000 * 21 = 5,250,000đ.
  const expectedSalary = Math.round((6500000 / 26) * 21);
  console.log("Expected Salary:", Utils.formatCurrency(expectedSalary));
  
  if (salary === expectedSalary) {
    console.log("SUCCESS: Calculated salary matches expected!");
  } else {
    console.log("FAILURE: Mismatch in calculations!");
    process.exit(1);
  }
}

runTest().catch(console.error);
