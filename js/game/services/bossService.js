(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Bosses) || { templates: {} };
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getTemplate(bossId) {
        return getConfig().templates?.[bossId] || null;
    }

    function getBossForMap(mapId) {
        return Object.values(getConfig().templates || {}).find((template) => template.mapId === mapId) || null;
    }

    function getChallengeCost(zone = {}, template = null) {
        const mult = toNumber(template?.challengeCostMultiplier, 1.8);
        return Math.max(18, Math.round(toNumber(zone.staminaCost, 10) * mult));
    }

    function getBossPower(zone = {}, template = null, context = {}) {
        const playerLevel = toNumber(context.playerLevel, 1);
        if (template?.basePower) {
            return Math.round(toNumber(template.basePower, 1) + toNumber(zone.rewardPoints, 1) * 180 + playerLevel * 58);
        }
        return Math.round((toNumber(zone.minLevel, 1) * 210) + (toNumber(zone.rewardPoints, 1) * 420) + (playerLevel * 65));
    }

    function calculateWinChance(context = {}) {
        const profile = context.profile || {};
        const zone = context.zone || {};
        const template = context.template || getBossForMap(zone.id);
        const totalStats = context.totalStats || {};
        const stats = profile.stats || {};
        const playerPower = toNumber(context.playerPower, 1);
        const bossPower = toNumber(context.bossPower, getBossPower(zone, template, context));
        const vitality = toNumber(totalStats.vitality ?? stats.vit, 1);
        const luck = toNumber(totalStats.luck ?? stats.luck, 1);
        const ratio = playerPower / Math.max(1, bossPower);
        return Math.max(0.12, Math.min(0.92, 0.26 + ratio * 0.36 + vitality * 0.006 + luck * 0.004));
    }

    function createBossInstance(context = {}) {
        const template = context.template || getBossForMap(context.mapId) || {};
        const now = toNumber(context.now, Date.now());
        const maxHp = Math.max(1, Math.round(toNumber(template.hp, 1000) * (0.96 + Math.random() * 0.08)));
        return {
            instanceId: context.instanceId || `boss_${template.bossId || context.mapId || 'unknown'}_${now}_${Math.random().toString(36).slice(2, 8)}`,
            bossId: template.bossId || context.bossId || 'unknown_boss',
            mapId: template.mapId || context.mapId || 'training_forest',
            ownerId: context.ownerId || 'unknown',
            name: template.name || context.name || 'Boss',
            level: toNumber(template.level, 1),
            hp: maxHp,
            maxHp,
            attack: toNumber(template.attack, 1),
            defense: toNumber(template.defense, 0),
            status: 'active',
            damageRanking: [],
            createdAt: now,
            updatedAt: now
        };
    }

    function resolveChallenge(context = {}) {
        const rng = context.rng || Math.random;
        const profile = context.profile || {};
        const zone = context.zone || {};
        const template = context.template || getBossForMap(zone.id) || {};
        const now = toNumber(context.now, Date.now());
        const playerPower = toNumber(context.playerPower, 1);
        const bossPower = getBossPower(zone, template, context);
        const cost = getChallengeCost(zone, template);
        const chance = calculateWinChance({ ...context, profile, zone, template, playerPower, bossPower });
        const won = rng() < chance;
        const instance = createBossInstance({
            template,
            mapId: zone.id,
            ownerId: context.ownerId || profile.username,
            now
        });
        const damage = won
            ? instance.maxHp
            : Math.max(1, Math.round(instance.maxHp * Math.max(0.15, Math.min(0.82, playerPower / Math.max(1, bossPower)))));
        instance.hp = won ? 0 : Math.max(1, instance.maxHp - damage);
        instance.status = won ? 'defeated' : 'escaped';
        instance.damageRanking = [{
            ownerId: context.ownerId || profile.username || 'unknown',
            damage,
            power: playerPower,
            at: now
        }];
        instance.updatedAt = now;

        const reward = GameServices.DropService?.rollBossReward
            ? GameServices.DropService.rollBossReward({
                zone,
                profile,
                won,
                rng,
                now,
                rewardProfileId: template.rewardProfileId,
                dropProfileId: template.rewardProfileId,
                classLootMult: toNumber(context.classLootMult, 1),
                expMultiplier: toNumber(context.expMultiplier, 80)
            })
            : {
                rewardPoints: won ? Math.max(2, toNumber(zone.rewardPoints, 1) * 4) : 1,
                exp: (won ? Math.max(2, toNumber(zone.rewardPoints, 1) * 4) : 1) * toNumber(context.expMultiplier, 80),
                items: { goldDust: 1 },
                generatedAt: now
            };

        return {
            ok: true,
            boss: template,
            bossInstance: instance,
            won,
            cost,
            chance,
            playerPower,
            bossPower,
            reward,
            damageRanking: instance.damageRanking,
            cooldownMs: toNumber(template.cooldownMs, getConfig().defaultCooldownMs || 0),
            resolvedAt: now
        };
    }

    function appendBossLog(profile, challenge, rewardResult = {}) {
        if (!profile || !challenge) return;
        if (!Array.isArray(profile.bossLogs)) profile.bossLogs = [];
        profile.bossLogs.unshift({
            id: `boss_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            time: challenge.resolvedAt || Date.now(),
            bossId: challenge.boss?.bossId,
            bossName: challenge.boss?.name || challenge.bossInstance?.name,
            mapId: challenge.bossInstance?.mapId,
            instanceId: challenge.bossInstance?.instanceId,
            won: Boolean(challenge.won),
            cost: challenge.cost,
            chance: Math.round(toNumber(challenge.chance, 0) * 100),
            playerPower: challenge.playerPower,
            bossPower: challenge.bossPower,
            rewardPoints: challenge.reward?.rewardPoints,
            items: challenge.reward?.items || {},
            equipment: rewardResult.equipment || [],
            soldEquipment: rewardResult.soldEquipment || [],
            soldGold: rewardResult.soldGold || 0,
            damageRanking: challenge.damageRanking || []
        });
        profile.bossLogs = profile.bossLogs.slice(0, 80);
    }

    const service = {
        getTemplate,
        getBossForMap,
        getChallengeCost,
        getBossPower,
        calculateWinChance,
        createBossInstance,
        resolveChallenge,
        appendBossLog
    };

    GameServices.BossService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
