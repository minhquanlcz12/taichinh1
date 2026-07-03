(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Monsters) || { templates: {} };
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getTemplate(monsterId) {
        return getConfig().templates?.[monsterId] || null;
    }

    function chooseSpawn(map) {
        const spawns = Array.isArray(map?.monsterSpawns) ? map.monsterSpawns : [];
        if (!spawns.length) return null;
        const totalWeight = spawns.reduce((sum, spawn) => sum + Math.max(1, toNumber(spawn.weight, 1)), 0);
        let roll = Math.random() * Math.max(1, totalWeight);
        for (const spawn of spawns) {
            roll -= Math.max(1, toNumber(spawn.weight, 1));
            if (roll <= 0) return spawn;
        }
        return spawns[spawns.length - 1];
    }

    function createMonsterInstance(context = {}) {
        const map = context.map || GameServices.MapService?.getMap?.(context.mapId) || null;
        const legacyZone = context.legacyZone || {};
        const spawn = chooseSpawn(map) || { monsterId: context.monsterId };
        const template = getTemplate(context.monsterId || spawn.monsterId) || {
            monsterId: legacyZone.id || context.mapId || 'unknown_monster',
            name: legacyZone.monster || 'Monster',
            level: legacyZone.minLevel || 1,
            hp: 85 + toNumber(legacyZone.rewardPoints, 1) * 35,
            attack: 10 + toNumber(legacyZone.rewardPoints, 1) * 8,
            defense: 4 + toNumber(legacyZone.rewardPoints, 1) * 4,
            expReward: toNumber(legacyZone.rewardPoints, 1) * 80,
            rewardPoints: toNumber(legacyZone.rewardPoints, 1),
            dropProfileId: map?.dropProfileId || legacyZone.dropProfileId
        };

        const now = toNumber(context.now, Date.now());
        const variance = 0.9 + Math.random() * 0.22;
        const hp = Math.max(1, Math.round(toNumber(template.hp, 100) * variance + toNumber(legacyZone.rewardPoints, 1) * 8));
        const point = context.point || { x: 0, y: 0 };
        const id = context.id || `wild_${now}_${Math.random().toString(36).slice(2, 7)}`;

        return {
            id,
            monsterId: template.monsterId,
            mapId: map?.mapId || legacyZone.id || context.mapId || 'training_forest',
            zoneId: map?.mapId || legacyZone.id || context.mapId || 'training_forest',
            name: template.name,
            level: toNumber(template.level, legacyZone.minLevel || 1),
            attack: toNumber(template.attack, 1),
            defense: toNumber(template.defense, 0),
            expReward: toNumber(template.expReward, 80),
            rewardPoints: toNumber(template.rewardPoints, legacyZone.rewardPoints || 1),
            dropProfileId: template.dropProfileId || map?.dropProfileId || legacyZone.dropProfileId,
            x: point.x,
            y: point.y,
            targetX: point.x,
            targetY: point.y,
            hp,
            maxHp: hp,
            nextMoveAt: now + 600 + Math.random() * 1200,
            lastDamage: 0,
            lastHitAt: 0,
            defeated: false,
            claimed: false,
            createdAt: now
        };
    }

    function applyDamage(monster, rawDamage, context = {}) {
        if (!monster || monster.defeated) return { ok: false, reason: 'invalid_target', monster };
        const ignoreDefense = Boolean(context.ignoreDefense);
        const defense = ignoreDefense ? 0 : toNumber(monster.defense, 0);
        const damage = Math.max(1, Math.round(toNumber(rawDamage, 1) - defense * 0.18));
        monster.hp = Math.max(0, toNumber(monster.hp, 0) - damage);
        monster.lastDamage = damage;
        monster.lastHitAt = toNumber(context.now, Date.now());
        const defeated = monster.hp <= 0;
        if (defeated) monster.defeated = true;
        return { ok: true, monster, damage, defeated };
    }

    const service = {
        getTemplate,
        chooseSpawn,
        createMonsterInstance,
        applyDamage
    };

    GameServices.MonsterService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
