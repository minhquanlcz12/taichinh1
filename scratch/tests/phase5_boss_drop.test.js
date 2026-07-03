const assert = require('assert');

require('../../js/game/config/dropTableConfig.js');
require('../../js/game/config/bossConfig.js');
require('../../js/game/services/dropService.js');
require('../../js/game/services/bossService.js');

const drops = globalThis.GameServices.DropService;
const bosses = globalThis.GameServices.BossService;

const zone = {
    id: 'secret_realm',
    name: 'Ai Boss KPI',
    monster: 'Boss KPI',
    minLevel: 6,
    staminaCost: 20,
    rewardPoints: 3,
    gold: 56,
    material: 'longAn'
};

const template = bosses.getBossForMap('secret_realm');
assert.strictEqual(template.bossId, 'kpi_overlord');
assert.strictEqual(template.rewardProfileId, 'boss_common');

const cost = bosses.getChallengeCost(zone, template);
assert.ok(cost >= 18);

const power = bosses.getBossPower(zone, template, { playerLevel: 10 });
assert.ok(power > template.basePower);

const profile = {
    username: 'tester',
    stats: { vit: 30, luck: 25 },
    bossLogs: []
};

const chance = bosses.calculateWinChance({
    profile,
    zone,
    template,
    playerPower: 99999,
    bossPower: power,
    totalStats: { vitality: 30, luck: 25 }
});
assert.strictEqual(chance, 0.92);

const challenge = bosses.resolveChallenge({
    profile,
    zone,
    template,
    ownerId: 'tester',
    playerLevel: 10,
    playerPower: 99999,
    bossPower: power,
    totalStats: { vitality: 30, luck: 25 },
    classLootMult: 1,
    expMultiplier: 80,
    now: 12345,
    rng: () => 0
});

assert.strictEqual(challenge.ok, true);
assert.strictEqual(challenge.won, true);
assert.strictEqual(challenge.bossInstance.status, 'defeated');
assert.strictEqual(challenge.bossInstance.hp, 0);
assert.strictEqual(challenge.damageRanking.length, 1);
assert.ok(challenge.reward.items.goldDust > 0);
assert.ok(challenge.reward.items.bossCore >= 1);
assert.strictEqual(challenge.reward.dropProfileId, 'boss_common');

bosses.appendBossLog(profile, challenge, { equipment: [{ id: 'item_1' }], soldGold: 0 });
assert.strictEqual(profile.bossLogs.length, 1);
assert.strictEqual(profile.bossLogs[0].bossId, 'kpi_overlord');
assert.strictEqual(profile.bossLogs[0].won, true);

const dropRoll = drops.rollDrop('boss_common', { rng: () => 0, luck: 10, source: 'boss' });
assert.ok(dropRoll.items.goldDust > 0);
assert.ok(dropRoll.items.bossCore >= 1);
assert.ok(dropRoll.equipmentRolls.length >= 1);

assert.strictEqual(drops.rollEquipmentRarity({ source: 'boss', won: true, rewardPoints: 10, luck: 20, rng: () => 0 }), 'red');
assert.ok(drops.rollEquipmentDropCount({ source: 'boss', won: true, rewardPoints: 10, luck: 20, rng: () => 0 }) >= 1);

console.log('phase5_boss_drop.test.js passed');
