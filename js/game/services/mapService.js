(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Maps) || { maps: {} };
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getMap(mapId) {
        return getConfig().maps?.[mapId] || null;
    }

    function getAllMaps() {
        return Object.values(getConfig().maps || {});
    }

    function getUnlockedMaps(level = 1) {
        const currentLevel = Math.max(1, Math.floor(toNumber(level, 1)));
        return getAllMaps()
            .filter((map) => currentLevel >= toNumber(map.levelRequired, 1))
            .sort((a, b) => toNumber(a.levelRequired, 1) - toNumber(b.levelRequired, 1));
    }

    function canEnterMap(mapId, context = {}) {
        const map = getMap(mapId);
        if (!map) return { ok: false, reason: 'missing_map' };
        const level = Math.max(1, Math.floor(toNumber(context.level, 1)));
        if (level < toNumber(map.levelRequired, 1)) {
            return { ok: false, reason: 'level_required', requiredLevel: toNumber(map.levelRequired, 1), map };
        }
        return { ok: true, map };
    }

    function chooseRecommendedMap(context = {}) {
        const level = Math.max(1, Math.floor(toNumber(context.level, 1)));
        const power = Math.max(0, toNumber(context.combatPower, 0));
        const selectedMapId = context.selectedMapId;
        const manual = Boolean(context.manual);
        const unlocked = getUnlockedMaps(level);
        if (!unlocked.length) return getMap('training_forest');

        const selected = selectedMapId ? getMap(selectedMapId) : null;
        if (manual && selected && unlocked.some((map) => map.mapId === selected.mapId)) return selected;

        const suitable = unlocked.filter((map) => power >= toNumber(map.recommendedPower, 0) * 0.72);
        const pool = (suitable.length ? suitable : unlocked).slice(-3);
        const totalWeight = pool.reduce((sum, map) => sum + toNumber(map.legacy?.rewardPoints, 1), 0);
        let roll = Math.random() * Math.max(1, totalWeight);
        for (const map of pool) {
            roll -= toNumber(map.legacy?.rewardPoints, 1);
            if (roll <= 0) return map;
        }
        return pool[pool.length - 1];
    }

    function mergeLegacyZone(map, legacyZone = {}) {
        if (!map) return legacyZone || null;
        return {
            ...legacyZone,
            id: legacyZone.id || map.mapId,
            mapId: map.mapId,
            name: legacyZone.name || map.name,
            minLevel: legacyZone.minLevel ?? map.levelRequired,
            rewardPoints: legacyZone.rewardPoints ?? map.legacy?.rewardPoints ?? 1,
            gold: legacyZone.gold ?? map.legacy?.gold ?? 10,
            material: legacyZone.material ?? map.legacy?.material ?? 'linhThach',
            dropProfileId: map.dropProfileId,
            recommendedPower: map.recommendedPower,
            monsterSpawns: map.monsterSpawns || [],
            bossSpawns: map.bossSpawns || []
        };
    }

    const service = {
        getMap,
        getAllMaps,
        getUnlockedMaps,
        canEnterMap,
        chooseRecommendedMap,
        mergeLegacyZone
    };

    GameServices.MapService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
