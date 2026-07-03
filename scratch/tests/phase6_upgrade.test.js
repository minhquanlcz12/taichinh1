const assert = require('assert');

require('../../js/game/config/equipmentConfig.js');
require('../../js/game/config/upgradeConfig.js');
require('../../js/game/services/itemService.js');
require('../../js/game/services/inventoryService.js');
require('../../js/game/services/upgradeService.js');

const upgrade = globalThis.GameServices.UpgradeService;

const profile = {
    username: 'tester',
    inventory: {
        goldDust: 5000,
        linhThach: 10,
        daCuongHoa: 20,
        longAn: 10,
        bossCore: 3
    },
    equipment: {},
    equipmentBag: [
        {
            uid: 'sword_1',
            name: 'Test Sword',
            ownerId: 'tester',
            slot: 'weapon',
            rarity: 'yellow',
            level: 0,
            enhance: 0,
            power: 100
        }
    ],
    upgradeLogs: []
};

const success = upgrade.upgradeItem(profile, 'sword_1', { ownerId: 'tester', rng: () => 0 });
assert.strictEqual(success.ok, true);
assert.strictEqual(success.success, true);
assert.strictEqual(success.toLevel, 1);
assert.strictEqual(profile.equipmentBag[0].level, 1);
assert.strictEqual(profile.inventory.linhThach, 9);
assert.ok(profile.inventory.goldDust < 5000);
assert.strictEqual(profile.upgradeLogs[0].action, 'item_level');

profile.equipmentBag[0].level = 9;
profile.equipmentBag[0].enhance = 9;
const fail = upgrade.upgradeItem(profile, 'sword_1', { ownerId: 'tester', rng: () => 1 });
assert.strictEqual(fail.ok, true);
assert.strictEqual(fail.success, false);
assert.strictEqual(fail.fromLevel, 9);
assert.strictEqual(fail.toLevel, 8);
assert.strictEqual(profile.equipmentBag[0].level, 8);

const life = upgrade.upgradeLifeOption(profile, 'sword_1', { ownerId: 'tester', rng: () => 0 });
assert.strictEqual(life.ok, true);
assert.strictEqual(life.success, true);
assert.strictEqual(profile.equipmentBag[0].lifeOptionLevel, 1);
assert.ok(profile.equipmentBag[0].attrLines.some((line) => line.key === 'lifeOption'));

const missing = upgrade.upgradeItem({
    username: 'poor',
    inventory: { goldDust: 0 },
    equipment: {},
    equipmentBag: [{ uid: 'poor_item', ownerId: 'poor', slot: 'boots', name: 'Poor Boots', level: 0 }]
}, 'poor_item', { ownerId: 'poor', rng: () => 0 });
assert.strictEqual(missing.ok, false);
assert.strictEqual(missing.reason, 'missing_material');

const lockedProfile = {
    username: 'tester',
    inventory: { goldDust: 999, linhThach: 9 },
    equipment: {},
    equipmentBag: [{ uid: 'locked_item', ownerId: 'tester', slot: 'helm', name: 'Locked Helm', locked: true }]
};
const locked = upgrade.upgradeItem(lockedProfile, 'locked_item', { ownerId: 'tester' });
assert.strictEqual(locked.ok, false);
assert.strictEqual(locked.reason, 'locked_item');

const combine = upgrade.chaosCombine(profile, 'wing_core', { rng: () => 0 });
assert.strictEqual(combine.ok, true);
assert.strictEqual(combine.success, true);
assert.strictEqual(profile.inventory.wing_core_fragment, 1);

const skinCost = upgrade.getSkinUpgradeCost(3, { vip: true, shard: 'fireShard' });
assert.deepStrictEqual(skinCost, { daCuongHoa: 8, fireShard: 2 });

console.log('phase6_upgrade.test.js passed');
