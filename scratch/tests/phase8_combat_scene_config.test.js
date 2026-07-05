const assert = require('assert');

require('../../js/game/config/mapConfig.js');
require('../../js/game/config/monsterConfig.js');
require('../../js/game/config/dropTableConfig.js');
require('../../js/game/config/bossConfig.js');
require('../../js/game/services/mapService.js');
require('../../js/game/services/monsterService.js');
require('../../js/game/services/dropService.js');
require('../../js/game/services/bossService.js');

const maps = globalThis.GameServices.MapService;
const monsters = globalThis.GameServices.MonsterService;
const drops = globalThis.GameServices.DropService;
const bosses = globalThis.GameServices.BossService;

const coreMap = maps.getMap('core_kpi_sector');
assert.ok(coreMap, 'level 135 combat map must exist');
assert.strictEqual(coreMap.levelRequired, 135);
assert.strictEqual(coreMap.dropProfileId, 'drop_core_kpi_sector');
assert.strictEqual(coreMap.monsterSpawns[0].monsterId, 'core_behemoth');
assert.strictEqual(coreMap.bossSpawns[0].bossId, 'core_monarch');

const unlocked135 = maps.getUnlockedMaps(135).map((map) => map.mapId);
assert.ok(unlocked135.includes('core_kpi_sector'));
assert.ok(unlocked135.includes('sprint_citadel'));

const coreMonster = monsters.getTemplate('core_behemoth');
assert.ok(coreMonster);
assert.strictEqual(coreMonster.level, 135);
assert.strictEqual(coreMonster.dropProfileId, 'drop_core_kpi_sector');

const coreInstance = monsters.createMonsterInstance({
    map: coreMap,
    point: { x: 100, y: 100 },
    now: 1000
});
assert.strictEqual(coreInstance.monsterId, 'core_behemoth');
assert.strictEqual(coreInstance.mapId, 'core_kpi_sector');

const coreBoss = bosses.getBossForMap('core_kpi_sector');
assert.ok(coreBoss);
assert.strictEqual(coreBoss.bossId, 'core_monarch');
assert.strictEqual(coreBoss.rewardProfileId, 'boss_ancient');

const ancientBossDrop = drops.rollDrop('boss_ancient', { rng: () => 0, luck: 50, source: 'boss' });
assert.ok(ancientBossDrop.items.goldDust >= 900);
assert.ok(ancientBossDrop.items.bossCore >= 1);
assert.ok(ancientBossDrop.equipmentRolls.length >= 1);

const highMapDrop = drops.rollDrop('drop_core_kpi_sector', { rng: () => 0, luck: 50, source: 'monster' });
assert.ok(highMapDrop.items.goldDust >= 900);
assert.ok(highMapDrop.items.longAn >= 6);
assert.ok(highMapDrop.equipmentRolls.length >= 1);

console.log('phase8_combat_scene_config.test.js passed');
