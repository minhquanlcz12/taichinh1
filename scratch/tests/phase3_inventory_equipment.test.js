const assert = require('assert');

require('../../js/game/config/equipmentConfig.js');
require('../../js/game/services/itemService.js');
require('../../js/game/services/inventoryService.js');

const ownerId = 'tester';
const profile = {
    username: ownerId,
    inventory: { goldDust: 0 },
    equipment: {
        weapon: {
            uid: 'old_weapon',
            name: 'Old Blade',
            ownerId,
            slot: 'weapon',
            rarity: 'white',
            power: 20
        },
        glove: {
            uid: 'legacy_glove',
            name: 'Legacy Glove',
            ownerId,
            slot: 'glove',
            rarity: 'blue',
            power: 12
        }
    },
    equipmentBag: [
        {
            uid: 'old_weapon',
            name: 'Old Blade Duplicate',
            ownerId,
            slot: 'weapon',
            rarity: 'white',
            power: 20
        },
        {
            uid: 'new_weapon',
            name: 'New Blade',
            ownerId,
            slot: 'weapon',
            rarity: 'yellow',
            power: 120,
            levelReq: 1,
            attrLines: [{ key: 'str', label: 'Luc', value: 4 }]
        },
        {
            uid: 'sell_boots',
            name: 'Sell Boots',
            ownerId,
            slot: 'boots',
            rarity: 'blue',
            power: 30
        }
    ],
    itemLogs: []
};

const inventory = globalThis.GameServices.InventoryService;

inventory.ensureInventoryProfile(profile, { ownerId });

assert.strictEqual(profile.equipment.weapon.id, 'old_weapon');
assert.strictEqual(profile.equipment.gloves.id, 'legacy_glove');
assert.strictEqual(profile.equipmentBag.some((item) => item.id === 'old_weapon'), false);
assert.strictEqual(profile.equipmentBag[0].itemInstanceId, 'new_weapon');

const equipResult = inventory.equipItem(profile, 'new_weapon', { ownerId, level: 10 });
assert.strictEqual(equipResult.ok, true);
assert.strictEqual(profile.equipment.weapon.id, 'new_weapon');
assert.strictEqual(profile.equipmentBag.some((item) => item.id === 'old_weapon'), true);
assert.strictEqual(profile.equipmentBag.some((item) => item.id === 'new_weapon'), false);

const lockResult = inventory.lockItem(profile, 'old_weapon', true, { ownerId });
assert.strictEqual(lockResult.ok, true);
assert.strictEqual(lockResult.item.locked, true);

const lockedSell = inventory.sellItem(profile, 'old_weapon', { ownerId });
assert.strictEqual(lockedSell.ok, false);
assert.strictEqual(lockedSell.reason, 'locked_item');

inventory.lockItem(profile, 'old_weapon', false, { ownerId });
const sellResult = inventory.sellItem(profile, 'old_weapon', { ownerId });
assert.strictEqual(sellResult.ok, true);
assert.ok(profile.inventory.goldDust > 0);
assert.strictEqual(profile.equipmentBag.some((item) => item.id === 'old_weapon'), false);

const wrongOwner = {
    username: ownerId,
    inventory: { goldDust: 0 },
    equipment: {},
    equipmentBag: [{ uid: 'foreign_item', ownerId: 'other', slot: 'boots', name: 'Foreign Boots' }]
};
inventory.ensureInventoryProfile(wrongOwner, { ownerId });
assert.strictEqual(inventory.sellItem(wrongOwner, 'foreign_item', { ownerId }).reason, 'wrong_owner');

assert.ok(profile.itemLogs.some((log) => log.action === 'equip'));
assert.ok(profile.itemLogs.some((log) => log.action === 'sell'));

console.log('phase3_inventory_equipment.test.js passed');
