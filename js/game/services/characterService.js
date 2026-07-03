(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Character) || {};
    }

    function getStatsService() {
        return GameServices.StatsService;
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function createCharacterId(username) {
        const safeName = String(username || 'guest').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_') || 'guest';
        return `char_${safeName}`;
    }

    function getStatMeta() {
        return { ...(getConfig().statMeta || {}) };
    }

    function canonicalToLegacy(canonical) {
        return (getConfig().canonicalToLegacy || {})[canonical] || canonical;
    }

    function resolveStatKey(statKey) {
        const meta = getStatMeta();
        if (meta[statKey]) return meta[statKey].canonical || statKey;
        const statsService = getStatsService();
        return statsService?.canonicalStatKey ? statsService.canonicalStatKey(statKey) : statKey;
    }

    function ensureLegacyStats(profile, baseStats) {
        const statsService = getStatsService();
        const legacy = statsService?.toLegacyStats ? statsService.toLegacyStats(baseStats) : {
            str: baseStats.strength,
            agi: baseStats.agility,
            vit: baseStats.vitality,
            int: baseStats.energy,
            command: baseStats.command,
            luck: baseStats.luck
        };

        profile.stats = {
            ...(profile.stats || {}),
            ...legacy
        };

        return profile.stats;
    }

    function hydrateProfile(profile, context = {}) {
        const statsService = getStatsService();
        if (!statsService?.calculateCharacterStats) return profile;

        const username = context.username || profile?.username || context.authUser?.username || root.Auth?.currentUser?.username || 'guest';
        const snapshot = statsService.calculateCharacterStats(profile, context);
        const existing = profile.character || {};
        const classId = profile.classId || existing.classId || 'kiem_tong';
        const classStage = Number(existing.classStage || profile.classStage || 1);
        const statPoints = Math.max(0, toNumber(profile.statPoints ?? existing.statPoints, 0));

        ensureLegacyStats(profile, snapshot.baseStats);
        profile.statPoints = statPoints;
        profile.character = {
            ...existing,
            characterId: existing.characterId || createCharacterId(username),
            ownerId: existing.ownerId || username,
            level: snapshot.level,
            exp: snapshot.exp,
            nextExp: snapshot.nextExp,
            classId,
            classStage,
            strength: snapshot.totalStats.strength,
            agility: snapshot.totalStats.agility,
            vitality: snapshot.totalStats.vitality,
            energy: snapshot.totalStats.energy,
            command: snapshot.totalStats.command,
            hp: snapshot.derived.hp,
            maxHp: snapshot.derived.maxHp,
            mp: snapshot.derived.mp,
            maxMp: snapshot.derived.maxMp,
            stamina: snapshot.derived.stamina,
            maxStamina: snapshot.derived.maxStamina,
            combatPower: snapshot.combatPower,
            statPoints,
            baseStats: snapshot.baseStats,
            equipmentStats: snapshot.equipmentStats,
            buffStats: snapshot.buffStats,
            totalStats: snapshot.totalStats,
            derived: snapshot.derived,
            updatedAt: existing.updatedAt || profile.updatedAt || Date.now()
        };

        return profile;
    }

    function calculateCharacterStats(profile, context = {}) {
        return getStatsService()?.calculateCharacterStats(profile, context);
    }

    function addStatPoint(profile, statKey, amount = 1) {
        if (!profile) return { ok: false, reason: 'missing_profile' };
        const totalAmount = Math.max(1, Math.floor(toNumber(amount, 1)));
        const points = Math.floor(toNumber(profile.statPoints, 0));
        if (points < totalAmount) return { ok: false, reason: 'not_enough_points' };

        const canonical = resolveStatKey(statKey);
        const allowed = ['strength', 'agility', 'vitality', 'energy', 'command', 'luck'];
        if (!allowed.includes(canonical)) return { ok: false, reason: 'invalid_stat' };

        const statsService = getStatsService();
        const baseStats = statsService?.normalizeBaseStats ? statsService.normalizeBaseStats(profile) : {};
        baseStats[canonical] = Math.max(1, toNumber(baseStats[canonical], 1) + totalAmount);
        profile.statPoints = points - totalAmount;

        if (!profile.character) profile.character = {};
        profile.character.baseStats = {
            ...(profile.character.baseStats || {}),
            ...baseStats
        };
        ensureLegacyStats(profile, baseStats);

        return { ok: true, statKey, canonical, amount: totalAmount, remainingPoints: profile.statPoints };
    }

    function autoAllocateStats(profile) {
        if (!profile) return { ok: false, reason: 'missing_profile' };
        let points = Math.floor(toNumber(profile.statPoints, 0));
        if (points <= 0) return { ok: false, reason: 'not_enough_points' };

        const cfg = getConfig();
        const plans = cfg.allocationPlans || {};
        const plan = plans[profile.classId] || plans.kiem_tong || ['strength', 'vitality', 'agility', 'luck'];
        const statsService = getStatsService();
        const baseStats = statsService?.normalizeBaseStats ? statsService.normalizeBaseStats(profile) : {};
        let index = 0;

        while (points > 0) {
            const canonical = resolveStatKey(plan[index % plan.length]);
            baseStats[canonical] = Math.max(1, toNumber(baseStats[canonical], 1) + 1);
            points--;
            index++;
        }

        profile.statPoints = 0;
        if (!profile.character) profile.character = {};
        profile.character.baseStats = {
            ...(profile.character.baseStats || {}),
            ...baseStats
        };
        ensureLegacyStats(profile, baseStats);

        return { ok: true, allocated: index };
    }

    const service = {
        getStatMeta,
        hydrateProfile,
        calculateCharacterStats,
        addStatPoint,
        autoAllocateStats,
        resolveStatKey,
        createCharacterId
    };

    GameServices.CharacterService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
