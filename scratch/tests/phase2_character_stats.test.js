const assert = require('assert');

require('../../js/game/config/characterConfig.js');
require('../../js/game/services/statsService.js');
require('../../js/game/services/characterService.js');

function getExpForLevel(level) {
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += Math.round(70 * i + Math.pow(i, 1.85) * 18);
    }
    return total;
}

globalThis.Auth = {
    currentUser: {
        username: 'tester',
        level: 5,
        exp: getExpForLevel(5) + 120
    },
    getExpForLevel
};

const profile = {
    username: 'tester',
    classId: 'kiem_tong',
    statPoints: 3,
    stats: {
        str: 5,
        int: 3,
        agi: 4,
        vit: 6,
        luck: 2
    },
    stamina: 80,
    skinLevels: { basic: 1 },
    unlockedSkins: ['basic'],
    totalHunts: 2,
    totalRewardPoints: 10,
    equipment: {
        weapon: {
            power: 100,
            enhance: 1,
            attrLines: [
                { key: 'str', value: 2 },
                { key: 'damage', value: 20 }
            ]
        }
    }
};

const stats = globalThis.GameServices.StatsService.calculateCharacterStats(profile, {
    auth: globalThis.Auth,
    authUser: globalThis.Auth.currentUser
});

assert.strictEqual(stats.baseStats.strength, 5);
assert.strictEqual(stats.totalStats.strength, 7);
assert.strictEqual(stats.derived.stamina, 80);
assert.ok(stats.derived.maxHp > 0);
assert.ok(stats.derived.damage > 0);
assert.ok(stats.combatPower > 0);

globalThis.GameServices.CharacterService.hydrateProfile(profile, {
    username: 'tester',
    auth: globalThis.Auth,
    authUser: globalThis.Auth.currentUser
});

assert.strictEqual(profile.character.level, 5);
assert.strictEqual(profile.character.baseStats.strength, 5);
assert.strictEqual(profile.character.combatPower, stats.combatPower);

const addResult = globalThis.GameServices.CharacterService.addStatPoint(profile, 'str', 1);
assert.strictEqual(addResult.ok, true);
assert.strictEqual(profile.statPoints, 2);
assert.strictEqual(profile.stats.str, 6);
assert.strictEqual(profile.character.baseStats.strength, 6);

const autoResult = globalThis.GameServices.CharacterService.autoAllocateStats(profile);
assert.strictEqual(autoResult.ok, true);
assert.strictEqual(profile.statPoints, 0);

const recalculated = globalThis.GameServices.StatsService.calculateCharacterStats(profile, {
    auth: globalThis.Auth,
    authUser: globalThis.Auth.currentUser
});
assert.ok(recalculated.combatPower > stats.combatPower);

console.log('phase2_character_stats.test.js passed');
