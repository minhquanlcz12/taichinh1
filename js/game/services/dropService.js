(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function getConfig() {
        return (root.GameConfig && root.GameConfig.DropTables) || { profiles: {} };
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getProfile(dropProfileId) {
        return getConfig().profiles?.[dropProfileId] || null;
    }

    function randomInt(min, max, rng = Math.random) {
        const low = Math.floor(toNumber(min, 0));
        const high = Math.floor(toNumber(max, low));
        if (high <= low) return low;
        return low + Math.floor(rng() * (high - low + 1));
    }

    function rollWeighted(list = [], rng = Math.random) {
        const pool = list.filter(Boolean);
        if (!pool.length) return null;
        const total = pool.reduce((sum, entry) => sum + Math.max(0, toNumber(entry.weight, 0)), 0);
        if (total <= 0) return pool[0];
        let roll = rng() * total;
        for (const entry of pool) {
            roll -= Math.max(0, toNumber(entry.weight, 0));
            if (roll <= 0) return entry;
        }
        return pool[pool.length - 1];
    }

    function rollDrop(dropProfileId, context = {}) {
        const rng = context.rng || Math.random;
        const profile = getProfile(dropProfileId);
        const items = {};
        if (!profile) return { dropProfileId, items, equipmentRolls: [] };

        (profile.entries || []).forEach((entry) => {
            const chance = Math.max(0, Math.min(1, toNumber(entry.chance, 0)));
            if (rng() > chance) return;
            const quantity = Array.isArray(entry.quantity)
                ? randomInt(entry.quantity[0], entry.quantity[1], rng)
                : Math.max(1, Math.round(toNumber(entry.quantity, 1)));
            items[entry.itemTemplateId] = toNumber(items[entry.itemTemplateId], 0) + quantity;
        });

        const equipmentRolls = [];
        const equipment = profile.equipment;
        if (equipment) {
            const baseChance = Math.max(0, Math.min(1, toNumber(equipment.chance, 0)));
            const luck = toNumber(context.luck, 0);
            const chance = Math.max(0, Math.min(0.95, baseChance + luck * 0.002));
            const rolls = Math.max(1, Math.round(toNumber(context.rounds, 1)));
            for (let i = 0; i < rolls; i++) {
                if (rng() <= chance) {
                    const rarity = rollWeighted(equipment.rarityWeight, rng)?.rarity || 'white';
                    equipmentRolls.push({ rarity, source: context.source || 'monster' });
                }
            }
        }

        return {
            dropProfileId,
            items,
            equipmentRolls
        };
    }

    function rollEquipmentRarity(context = {}) {
        const rng = context.rng || Math.random;
        const source = context.source || 'monster';
        const won = context.won !== false;
        const luck = toNumber(context.luck, 1);
        const zonePower = toNumber(context.rewardPoints, 1);
        const roll = rng();

        if (source === 'boss') {
            if (!won) return roll < 0.72 ? 'blue' : 'yellow';
            const redChance = Math.min(0.08, 0.012 + zonePower * 0.006 + luck * 0.0015);
            const pinkChance = Math.min(0.18, 0.035 + zonePower * 0.012 + luck * 0.002);
            const orangeChance = Math.min(0.42, 0.12 + zonePower * 0.024 + luck * 0.003);
            if (roll < redChance) return 'red';
            if (roll < redChance + pinkChance) return 'pink';
            if (roll < redChance + pinkChance + orangeChance) return 'orange';
            return roll < 0.82 ? 'green' : 'yellow';
        }

        const greenChance = Math.min(0.12, 0.025 + zonePower * 0.006 + luck * 0.0018);
        const yellowChance = Math.min(0.23, 0.075 + zonePower * 0.01 + luck * 0.002);
        const blueChance = Math.min(0.48, 0.26 + zonePower * 0.018 + luck * 0.002);
        if (roll < greenChance) return 'green';
        if (roll < greenChance + yellowChance) return 'yellow';
        if (roll < greenChance + yellowChance + blueChance) return 'blue';
        return 'white';
    }

    function rollEquipmentDropCount(context = {}) {
        const rng = context.rng || Math.random;
        const source = context.source || 'monster';
        const won = context.won !== false;
        const luck = toNumber(context.luck, 1);
        const zonePower = toNumber(context.rewardPoints, 1);
        const rounds = Math.max(1, Math.round(toNumber(context.rounds, 1)));
        let count = 0;

        if (source === 'boss') {
            const chance = won
                ? Math.min(0.78, 0.28 + zonePower * 0.05 + luck * 0.006)
                : Math.min(0.18, 0.04 + zonePower * 0.012 + luck * 0.002);
            if (rng() < chance) count++;
            if (won && rng() < Math.min(0.22, 0.04 + zonePower * 0.015 + luck * 0.002)) count++;
            return count;
        }

        const checks = source === 'hunt' ? rounds : 1;
        for (let i = 0; i < checks; i++) {
            const chance = source === 'hunt'
                ? Math.min(0.64, 0.28 + zonePower * 0.025 + luck * 0.004)
                : Math.min(0.38, 0.16 + zonePower * 0.018 + luck * 0.003);
            if (rng() < chance) count++;
        }
        return count;
    }

    function rollBossReward(context = {}) {
        const zone = context.zone || {};
        const profile = context.profile || {};
        const won = context.won !== false;
        const rng = context.rng || Math.random;
        const stats = profile.stats || {};
        const luck = toNumber(stats.luck, 1);
        const rewardPoints = won ? Math.max(2, toNumber(zone.rewardPoints, 1) * 4) : 1;
        const mult = won ? 3 : 0.45;
        const classLootMult = toNumber(context.classLootMult, 1);
        const shardMap = {
            training_forest: 'thunderShard',
            ghost_cave: 'moonShard',
            secret_realm: 'fireShard',
            molten_keep: 'fireShard',
            frost_peak: 'thunderShard',
            abyss_gate: 'moonShard'
        };
        const items = {
            goldDust: Math.max(2, Math.round(toNumber(zone.gold, 10) * mult * (0.85 + rng() * 0.45))),
            [zone.material || 'linhThach']: Math.max(1, Math.round(toNumber(zone.rewardPoints, 1) * mult * classLootMult))
        };

        const tableRoll = won ? rollDrop(context.dropProfileId || context.rewardProfileId || 'boss_common', {
            rng,
            luck,
            source: 'boss',
            rounds: 1
        }) : { items: {}, equipmentRolls: [] };
        Object.entries(tableRoll.items || {}).forEach(([key, qty]) => {
            items[key] = toNumber(items[key], 0) + toNumber(qty, 0);
        });

        if (won) {
            const shardChance = Math.min(0.82, 0.22 + toNumber(zone.rewardPoints, 1) * 0.11 + luck * 0.008);
            const coreChance = Math.min(0.34, 0.05 + toNumber(zone.rewardPoints, 1) * 0.045 + luck * 0.006);
            if (rng() < shardChance) items[shardMap[zone.id] || 'thunderShard'] = toNumber(items[shardMap[zone.id] || 'thunderShard'], 0) + 1 + (rng() < 0.18 + luck * 0.004 ? 1 : 0);
            if (rng() < coreChance) items.bossCore = toNumber(items.bossCore, 0) + 1;
        }

        return {
            rewardPoints,
            exp: rewardPoints * toNumber(context.expMultiplier, 80),
            items,
            equipmentRolls: tableRoll.equipmentRolls || [],
            dropProfileId: context.dropProfileId || context.rewardProfileId || 'boss_common',
            generatedAt: toNumber(context.now, Date.now())
        };
    }

    const service = {
        getProfile,
        rollDrop,
        rollWeighted,
        rollEquipmentRarity,
        rollEquipmentDropCount,
        rollBossReward
    };

    GameServices.DropService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
