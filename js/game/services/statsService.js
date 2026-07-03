(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    const fallbackConfig = {
        baseStats: { strength: 1, agility: 1, vitality: 1, energy: 1, command: 1, luck: 1 },
        legacyAliases: { str: 'strength', agi: 'agility', vit: 'vitality', int: 'energy', command: 'command', luck: 'luck' },
        canonicalToLegacy: { strength: 'str', agility: 'agi', vitality: 'vit', energy: 'int', command: 'command', luck: 'luck' },
        formulas: {
            hpBase: 1200,
            hpPerVitality: 280,
            hpPerLevel: 120,
            mpBase: 700,
            mpPerEnergy: 210,
            mpPerLevel: 82,
            damagePerStrength: 18,
            damagePerEnergy: 20,
            defensePerVitality: 22,
            defensePerAgility: 8,
            critBase: 5,
            critPerAgility: 1.2,
            critPerLuck: 0.9,
            dodgeBase: 3,
            dodgePerAgility: 0.9,
            combatPower: {
                level: 120,
                strength: 34,
                energy: 36,
                agility: 30,
                vitality: 42,
                luck: 24,
                equipmentEnhance: 90,
                skinLevel: 45,
                hunt: 16,
                rewardPoint: 20,
                unlockedSkin: 75
            }
        }
    };

    const statKeys = ['strength', 'agility', 'vitality', 'energy', 'command', 'luck'];

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Character) || fallbackConfig;
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function positive(value, fallback = 1) {
        return Math.max(1, toNumber(value, fallback));
    }

    function emptyStats() {
        return { strength: 0, agility: 0, vitality: 0, energy: 0, command: 0, luck: 0 };
    }

    function emptyDerived() {
        return { damage: 0, defense: 0, hp: 0, mp: 0, crit: 0, dodge: 0, hitRate: 0 };
    }

    function canonicalStatKey(key) {
        const cfg = getConfig();
        return cfg.legacyAliases[key] || key;
    }

    function normalizeBaseStats(profile) {
        const characterBase = profile?.character?.baseStats || {};
        const rootBase = profile?.baseStats || {};
        const legacy = profile?.stats || {};

        const stats = {
            strength: positive(characterBase.strength ?? rootBase.strength ?? legacy.str ?? legacy.strength, 1),
            agility: positive(characterBase.agility ?? rootBase.agility ?? legacy.agi ?? legacy.agility, 1),
            vitality: positive(characterBase.vitality ?? rootBase.vitality ?? legacy.vit ?? legacy.vitality, 1),
            energy: positive(characterBase.energy ?? rootBase.energy ?? legacy.int ?? legacy.energy, 1),
            command: positive(characterBase.command ?? rootBase.command ?? legacy.command ?? legacy.cmd ?? legacy.luck, 1),
            luck: positive(characterBase.luck ?? rootBase.luck ?? legacy.luck ?? legacy.command, 1)
        };

        return stats;
    }

    function toLegacyStats(canonicalStats) {
        return {
            str: positive(canonicalStats.strength, 1),
            agi: positive(canonicalStats.agility, 1),
            vit: positive(canonicalStats.vitality, 1),
            int: positive(canonicalStats.energy, 1),
            command: positive(canonicalStats.command, 1),
            luck: positive(canonicalStats.luck, 1)
        };
    }

    function addStat(target, key, value) {
        const amount = toNumber(value, 0);
        const canonical = canonicalStatKey(key);
        if (statKeys.includes(canonical)) {
            target.stats[canonical] += amount;
            return;
        }
        if (canonical === 'damage') target.derived.damage += amount;
        if (canonical === 'defense') target.derived.defense += amount;
        if (canonical === 'hp') target.derived.hp += amount;
        if (canonical === 'mp') target.derived.mp += amount;
        if (canonical === 'crit') target.derived.crit += amount;
        if (canonical === 'dodge') target.derived.dodge += amount;
        if (canonical === 'hitRate') target.derived.hitRate += amount;
    }

    function collectEquipmentStats(profile) {
        const result = {
            stats: emptyStats(),
            derived: emptyDerived(),
            power: 0,
            enhancePower: 0
        };

        Object.values(profile?.equipment || {}).filter(Boolean).forEach((item) => {
            result.power += toNumber(item.power, 0);
            result.enhancePower += toNumber(item.enhance, 0) * getConfig().formulas.combatPower.equipmentEnhance;

            Object.entries(item.stats || {}).forEach(([key, value]) => {
                addStat(result, key, value);
            });

            (item.attrLines || item.excellentOptions || []).forEach((line) => {
                if (!line) return;
                if (typeof line === 'string') return;
                addStat(result, line.key, line.value);
            });
        });

        return result;
    }

    function collectBuffStats(profile) {
        const result = {
            stats: emptyStats(),
            derived: emptyDerived()
        };

        (profile?.buffs || []).filter(Boolean).forEach((buff) => {
            Object.entries(buff.stats || {}).forEach(([key, value]) => addStat(result, key, value));
            Object.entries(buff.derived || {}).forEach(([key, value]) => addStat(result, key, value));
        });

        return result;
    }

    function getFallbackExpForLevel(level) {
        if (level <= 1) return 0;
        let total = 0;
        for (let i = 2; i <= level; i++) {
            total += Math.round(70 * i + Math.pow(i, 1.85) * 18);
        }
        return total;
    }

    function getLevelSnapshot(context = {}) {
        const auth = context.auth || root.Auth || {};
        const authUser = context.authUser || auth.currentUser || {};
        const level = Math.max(1, Math.floor(toNumber(context.level ?? authUser.level, 1)));
        const exp = Math.max(0, Math.floor(toNumber(context.exp ?? authUser.exp, 0)));
        const getExpForLevel = typeof auth.getExpForLevel === 'function' ? auth.getExpForLevel : getFallbackExpForLevel;
        return {
            level,
            exp,
            currentLevelExp: getExpForLevel(level),
            nextExp: getExpForLevel(level + 1)
        };
    }

    function calculateCharacterStats(profile, context = {}) {
        const cfg = getConfig();
        const formulas = cfg.formulas;
        const levelInfo = getLevelSnapshot(context);
        const baseStats = normalizeBaseStats(profile);
        const equipment = collectEquipmentStats(profile);
        const buffs = collectBuffStats(profile);
        const totalStats = emptyStats();

        statKeys.forEach((key) => {
            totalStats[key] = baseStats[key] + equipment.stats[key] + buffs.stats[key];
        });

        const maxHp = Math.round(
            formulas.hpBase +
            totalStats.vitality * formulas.hpPerVitality +
            levelInfo.level * formulas.hpPerLevel +
            equipment.derived.hp +
            buffs.derived.hp
        );
        const maxMp = Math.round(
            formulas.mpBase +
            totalStats.energy * formulas.mpPerEnergy +
            levelInfo.level * formulas.mpPerLevel +
            equipment.derived.mp +
            buffs.derived.mp
        );
        const damage = Math.round(
            totalStats.strength * formulas.damagePerStrength +
            totalStats.energy * formulas.damagePerEnergy +
            equipment.derived.damage +
            buffs.derived.damage
        );
        const defense = Math.round(
            totalStats.vitality * formulas.defensePerVitality +
            totalStats.agility * formulas.defensePerAgility +
            equipment.derived.defense +
            buffs.derived.defense
        );
        const crit = Math.min(75, Math.round(
            formulas.critBase +
            totalStats.agility * formulas.critPerAgility +
            totalStats.luck * formulas.critPerLuck +
            equipment.derived.crit +
            buffs.derived.crit
        ));
        const dodge = Math.min(60, Math.round(
            formulas.dodgeBase +
            totalStats.agility * formulas.dodgePerAgility +
            equipment.derived.dodge +
            buffs.derived.dodge
        ));

        const cp = formulas.combatPower;
        const levelPower = levelInfo.level * cp.level;
        const statPower =
            totalStats.strength * cp.strength +
            totalStats.energy * cp.energy +
            totalStats.agility * cp.agility +
            totalStats.vitality * cp.vitality +
            totalStats.luck * cp.luck;
        const equipmentPower = equipment.power + equipment.enhancePower;
        const skinPower = Object.values(profile?.skinLevels || {}).reduce((sum, value) => {
            return sum + Math.max(0, toNumber(value, 1) - 1) * cp.skinLevel;
        }, 0);
        const activityPower =
            toNumber(profile?.totalHunts, 0) * cp.hunt +
            toNumber(profile?.totalRewardPoints, 0) * cp.rewardPoint +
            Math.max(1, (profile?.unlockedSkins || ['basic']).length) * cp.unlockedSkin;

        const combatPower = Math.round(levelPower + statPower + equipmentPower + skinPower + activityPower);
        const stamina = Math.max(0, Math.min(toNumber(profile?.maxStamina, cfg.maxStamina || 100), toNumber(profile?.stamina, cfg.maxStamina || 100)));

        return {
            level: levelInfo.level,
            exp: levelInfo.exp,
            currentLevelExp: levelInfo.currentLevelExp,
            nextExp: levelInfo.nextExp,
            baseStats,
            equipmentStats: equipment.stats,
            buffStats: buffs.stats,
            totalStats,
            legacyStats: toLegacyStats(baseStats),
            derived: {
                hp: maxHp,
                maxHp,
                mp: maxMp,
                maxMp,
                stamina,
                maxStamina: cfg.maxStamina || 100,
                damage,
                defense,
                crit,
                dodge,
                hitRate: Math.min(95, Math.round(70 + totalStats.agility * 0.35 + equipment.derived.hitRate + buffs.derived.hitRate))
            },
            combatPower,
            combatPowerBreakdown: {
                levelPower,
                statPower,
                equipmentPower,
                skinPower,
                activityPower
            }
        };
    }

    const service = {
        canonicalStatKey,
        normalizeBaseStats,
        toLegacyStats,
        getLevelSnapshot,
        calculateCharacterStats
    };

    GameServices.StatsService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
