const assert = require('assert');

require('../../js/game/config/mapConfig.js');
require('../../js/game/config/monsterConfig.js');
require('../../js/game/services/mapService.js');
require('../../js/game/services/monsterService.js');
require('../../js/game/services/farmService.js');

const maps = globalThis.GameServices.MapService;
const monsters = globalThis.GameServices.MonsterService;
const farm = globalThis.GameServices.FarmService;

const unlockedLow = maps.getUnlockedMaps(1);
assert.ok(unlockedLow.some((map) => map.mapId === 'training_forest'));
assert.ok(!unlockedLow.some((map) => map.mapId === 'ghost_cave'));

const unlockedHigh = maps.getUnlockedMaps(22);
assert.ok(unlockedHigh.some((map) => map.mapId === 'abyss_gate'));

const ghostMap = maps.getMap('ghost_cave');
const monster = monsters.createMonsterInstance({
    map: ghostMap,
    legacyZone: { id: 'ghost_cave', monster: 'Bug Ma', rewardPoints: 2, material: 'daCuongHoa' },
    point: { x: 100, y: 100 },
    now: 1000
});

assert.strictEqual(monster.mapId, 'ghost_cave');
assert.strictEqual(monster.zoneId, 'ghost_cave');
assert.strictEqual(monster.monsterId, 'bug_wraith');
assert.ok(monster.maxHp > 0);
assert.ok(monster.defense > 0);

const mobs = {
    [monster.id]: monster,
    side_mob: monsters.createMonsterInstance({
        map: ghostMap,
        legacyZone: { id: 'ghost_cave', monster: 'Bug Ma', rewardPoints: 2, material: 'daCuongHoa' },
        point: { x: 140, y: 100 },
        now: 1000,
        id: 'side_mob'
    }),
    far_mob: monsters.createMonsterInstance({
        map: ghostMap,
        legacyZone: { id: 'ghost_cave', monster: 'Bug Ma', rewardPoints: 2, material: 'daCuongHoa' },
        point: { x: 900, y: 900 },
        now: 1000,
        id: 'far_mob'
    })
};

const nearest = farm.findNearestMonster(mobs, { x: 95, y: 95 }, 999);
assert.strictEqual(nearest.monster.id, monster.id);

const result = farm.resolveAttack({
    monsters: mobs,
    targetId: monster.id,
    skill: { id: 'test_aoe', aoeRadius: 90, aoeDamageRatio: 0.5 },
    damage: 999,
    now: 2000
});

assert.strictEqual(result.ok, true);
assert.strictEqual(result.hitTargets.length, 2);
assert.ok(result.defeatedTargets.some((entry) => entry.id === monster.id));
assert.ok(!result.hitTargets.some((entry) => entry.id === 'far_mob'));

const reward = farm.buildKillReward({
    monster,
    map: ghostMap,
    legacyZone: { id: 'ghost_cave', rewardPoints: 2, material: 'daCuongHoa', gold: 32 },
    expMultiplier: 80
});

assert.strictEqual(reward.rewardPoints, 2);
assert.ok(reward.exp >= 160);
assert.ok(reward.items.goldDust > 0);
assert.strictEqual(reward.items.daCuongHoa, 1);
assert.strictEqual(reward.dropProfileId, 'drop_ghost_cave');

const session = farm.startFarm({ ownerId: 'tester', mapId: 'ghost_cave', now: 3000 });
assert.strictEqual(session.status, 'running');
farm.tickFarm(session, { now: 3500 });
assert.strictEqual(session.lastTickAt, 3500);
farm.stopFarm(session, { now: 4000 });
assert.strictEqual(session.status, 'stopped');

console.log('phase4_monster_map_farm.test.js passed');
