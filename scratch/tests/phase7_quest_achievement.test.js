const assert = require('assert');

require('../../js/game/config/equipmentConfig.js');
require('../../js/game/config/questConfig.js');
require('../../js/game/services/questService.js');

const quest = globalThis.GameServices.QuestService;
const now = new Date('2026-07-05T09:00:00+07:00').getTime();
const profile = {
    username: 'tester',
    inventory: { goldDust: 0, linhThach: 0, daCuongHoa: 0, longAn: 0, bossCore: 0 },
    equipmentBag: [],
    equipment: {},
    wildKills: 0,
    bossWins: 0,
    bossLosses: 0,
    upgradeLogs: []
};

quest.ensureQuestState(profile);
let quests = quest.listQuests(profile, { now });
let forest = quests.find((item) => item.questId === 'daily_training_forest_kills');
assert.strictEqual(forest.progress, 0);
assert.strictEqual(forest.canClaim, false);

quest.recordEvent(profile, {
    type: 'kill_monster',
    mapId: 'training_forest',
    monsterId: 'deadline_imp',
    count: 5,
    items: { linhThach: 1 },
    equipment: [{ rarity: 'green', uid: 'green_1' }],
    now
});

quests = quest.listQuests(profile, { now });
forest = quests.find((item) => item.questId === 'daily_training_forest_kills');
assert.strictEqual(forest.progress, 5);
assert.strictEqual(forest.canClaim, true);

let claim = quest.claimQuest(profile, 'daily_training_forest_kills', { now });
assert.strictEqual(claim.ok, true);
assert.strictEqual(profile.inventory.linhThach, 2);
assert.strictEqual(profile.inventory.goldDust, 80);
assert.strictEqual(profile.totalRewardPoints, 1);
assert.strictEqual(profile.questLogs[0].action, 'claim');

claim = quest.claimQuest(profile, 'daily_training_forest_kills', { now });
assert.strictEqual(claim.ok, false);
assert.strictEqual(claim.reason, 'already_claimed');

const unlocked = quest.evaluateAchievements(profile, { now }).map((item) => item.achievementId);
assert.ok(unlocked.includes('first_wild_kill'));
assert.ok(unlocked.includes('first_green_drop'));

quest.recordEvent(profile, {
    type: 'boss_challenge',
    mapId: 'secret_realm',
    bossId: 'kpi_overlord',
    won: true,
    items: { bossCore: 1 },
    now
});
const bossQuest = quest.listQuests(profile, { now }).find((item) => item.questId === 'weekly_boss_kpi');
assert.strictEqual(bossQuest.canClaim, true);
claim = quest.claimQuest(profile, 'weekly_boss_kpi', { now });
assert.strictEqual(claim.ok, true);
assert.strictEqual(profile.inventory.bossCore, 1);
assert.strictEqual(profile.inventory.longAn, 1);

quest.recordEvent(profile, { type: 'upgrade_success', itemId: 'sword_1', toLevel: 7, now });
quest.recordEvent(profile, { type: 'upgrade_success', itemId: 'sword_1', toLevel: 8, now });
quest.recordEvent(profile, { type: 'upgrade_success', itemId: 'sword_1', toLevel: 9, now });
const forgeQuest = quest.listQuests(profile, { now }).find((item) => item.questId === 'weekly_molten_upgrade');
assert.strictEqual(forgeQuest.canClaim, true);
assert.ok(quest.evaluateAchievements(profile, { now }).some((item) => item.achievementId === 'first_plus_7'));

const tomorrow = now + 24 * 60 * 60 * 1000;
forest = quest.listQuests(profile, { now: tomorrow }).find((item) => item.questId === 'daily_training_forest_kills');
assert.strictEqual(forest.progress, 0);
assert.strictEqual(forest.claimed, false);

quest.recordEvent(profile, {
    type: 'boss_challenge',
    mapId: 'abyss_gate',
    bossId: 'abyss_executor',
    won: true,
    now
});
const abyss = quest.listQuests(profile, { now }).find((item) => item.questId === 'achievement_abyss_gate_clear');
assert.strictEqual(abyss.canClaim, true);
claim = quest.claimQuest(profile, 'achievement_abyss_gate_clear', { now });
assert.strictEqual(claim.ok, true);
assert.strictEqual(profile.statPoints, 2);

console.log('phase7_quest_achievement.test.js passed');
