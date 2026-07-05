(function (root) {
    const GameServices = root.GameServices || (root.GameServices = {});

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Quests) || { questTemplates: {}, achievementTemplates: {} };
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function makeId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function dateKey(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function getResetKey(repeat = 'once', now = Date.now()) {
        const date = new Date(toNumber(now, Date.now()));
        if (repeat === 'daily') return dateKey(date);
        if (repeat === 'weekly') {
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const mondayOffset = (start.getDay() + 6) % 7;
            start.setDate(start.getDate() - mondayOffset);
            return `week:${dateKey(start)}`;
        }
        if (repeat === 'monthly') return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
        return 'permanent';
    }

    function createCounterBucket() {
        return {
            kills: 0,
            bossWins: 0,
            bossLosses: 0,
            upgradeSuccess: 0,
            equipmentLoot: 0,
            maxUpgradeLevel: 0,
            mapKills: {},
            monsterKills: {},
            mapBossWins: {},
            bossKills: {},
            rarityLoot: {},
            itemDrops: {}
        };
    }

    function ensureQuestState(profile) {
        if (!profile) return null;
        if (!profile.questState || typeof profile.questState !== 'object') profile.questState = {};
        if (!profile.questState.quests || typeof profile.questState.quests !== 'object') profile.questState.quests = {};
        if (!Array.isArray(profile.questState.achievements)) profile.questState.achievements = [];
        if (!profile.questState.counters || typeof profile.questState.counters !== 'object') profile.questState.counters = {};
        if (!profile.questState.counters.allTime) profile.questState.counters.allTime = createCounterBucket();
        if (!profile.questState.counters.daily || typeof profile.questState.counters.daily !== 'object') profile.questState.counters.daily = {};
        if (!profile.questState.counters.weekly || typeof profile.questState.counters.weekly !== 'object') profile.questState.counters.weekly = {};
        if (!Array.isArray(profile.questLogs)) profile.questLogs = [];
        if (!Array.isArray(profile.questEventLog)) profile.questEventLog = [];
        return profile.questState;
    }

    function ensurePeriodBucket(state, repeat, now) {
        const key = getResetKey(repeat, now);
        if (repeat === 'daily') {
            if (!state.counters.daily[key]) state.counters.daily[key] = createCounterBucket();
            return state.counters.daily[key];
        }
        if (repeat === 'weekly') {
            if (!state.counters.weekly[key]) state.counters.weekly[key] = createCounterBucket();
            return state.counters.weekly[key];
        }
        return state.counters.allTime;
    }

    function addMapCount(map, key, count) {
        if (!key) return;
        map[key] = toNumber(map[key], 0) + count;
    }

    function getRarityRank(rarity) {
        const ranks = root.GameConfig?.Equipment?.rarityRanks || {
            white: 1,
            blue: 2,
            yellow: 3,
            green: 4,
            orange: 5,
            pink: 6,
            red: 7
        };
        return toNumber(ranks[rarity], 0);
    }

    function incrementBucket(bucket, event = {}) {
        const count = Math.max(1, Math.round(toNumber(event.count, 1)));
        if (event.type === 'kill_monster') {
            bucket.kills = toNumber(bucket.kills, 0) + count;
            addMapCount(bucket.mapKills, event.mapId, count);
            addMapCount(bucket.monsterKills, event.monsterId, count);
        }
        if (event.type === 'boss_challenge') {
            if (event.won) {
                bucket.bossWins = toNumber(bucket.bossWins, 0) + count;
                addMapCount(bucket.mapBossWins, event.mapId, count);
                addMapCount(bucket.bossKills, event.bossId, count);
            } else {
                bucket.bossLosses = toNumber(bucket.bossLosses, 0) + count;
            }
        }
        if (event.type === 'upgrade_success') {
            bucket.upgradeSuccess = toNumber(bucket.upgradeSuccess, 0) + count;
            bucket.maxUpgradeLevel = Math.max(toNumber(bucket.maxUpgradeLevel, 0), toNumber(event.toLevel, 0));
        }
        (event.equipment || []).forEach((item) => {
            bucket.equipmentLoot = toNumber(bucket.equipmentLoot, 0) + 1;
            addMapCount(bucket.rarityLoot, item?.rarity || 'white', 1);
        });
        Object.entries(event.items || {}).forEach(([key, qty]) => {
            addMapCount(bucket.itemDrops, key, toNumber(qty, 0));
        });
    }

    function buildLegacyAllTime(profile = {}) {
        const bucket = createCounterBucket();
        bucket.kills = Math.max(bucket.kills, toNumber(profile.wildKills, 0));
        bucket.bossWins = Math.max(bucket.bossWins, toNumber(profile.bossWins, 0));
        bucket.bossLosses = Math.max(bucket.bossLosses, toNumber(profile.bossLosses, 0));

        (profile.upgradeLogs || []).forEach((log) => {
            if (!log || log.success === false) return;
            if (log.action === 'item_level' || log.action === 'skin_level' || log.action === 'life_option') {
                bucket.upgradeSuccess += 1;
                bucket.maxUpgradeLevel = Math.max(bucket.maxUpgradeLevel, toNumber(log.toLevel, 0));
            }
        });

        const equipment = [
            ...(Array.isArray(profile.equipmentBag) ? profile.equipmentBag : []),
            ...Object.values(profile.equipment || {}).filter(Boolean)
        ];
        equipment.forEach((item) => {
            bucket.equipmentLoot += 1;
            addMapCount(bucket.rarityLoot, item?.rarity || 'white', 1);
        });
        return bucket;
    }

    function combineBuckets(primary, fallback) {
        const combined = createCounterBucket();
        combined.kills = Math.max(toNumber(primary?.kills, 0), toNumber(fallback?.kills, 0));
        combined.bossWins = Math.max(toNumber(primary?.bossWins, 0), toNumber(fallback?.bossWins, 0));
        combined.bossLosses = Math.max(toNumber(primary?.bossLosses, 0), toNumber(fallback?.bossLosses, 0));
        combined.upgradeSuccess = Math.max(toNumber(primary?.upgradeSuccess, 0), toNumber(fallback?.upgradeSuccess, 0));
        combined.equipmentLoot = Math.max(toNumber(primary?.equipmentLoot, 0), toNumber(fallback?.equipmentLoot, 0));
        combined.maxUpgradeLevel = Math.max(toNumber(primary?.maxUpgradeLevel, 0), toNumber(fallback?.maxUpgradeLevel, 0));
        ['mapKills', 'monsterKills', 'mapBossWins', 'bossKills', 'rarityLoot', 'itemDrops'].forEach((key) => {
            combined[key] = { ...(fallback?.[key] || {}), ...(primary?.[key] || {}) };
        });
        return combined;
    }

    function getBucketForTemplate(profile, template = {}, now = Date.now()) {
        const state = ensureQuestState(profile);
        if (!state) return createCounterBucket();
        const repeat = template.repeat || 'once';
        const bucket = repeat === 'daily' || repeat === 'weekly'
            ? ensurePeriodBucket(state, repeat, now)
            : state.counters.allTime;
        if (repeat === 'daily' || repeat === 'weekly') return bucket;
        return combineBuckets(bucket, buildLegacyAllTime(profile));
    }

    function getProgressValue(profile, template = {}, now = Date.now()) {
        const condition = template.condition || {};
        const bucket = getBucketForTemplate(profile, template, now);
        if (condition.type === 'kill_monster') {
            return condition.mapId ? toNumber(bucket.mapKills?.[condition.mapId], 0) : toNumber(bucket.kills, 0);
        }
        if (condition.type === 'boss_win') {
            return condition.mapId ? toNumber(bucket.mapBossWins?.[condition.mapId], 0) : toNumber(bucket.bossWins, 0);
        }
        if (condition.type === 'upgrade_success') {
            if (condition.minLevel) return toNumber(bucket.maxUpgradeLevel, 0) >= toNumber(condition.minLevel, 0) ? 1 : 0;
            return toNumber(bucket.upgradeSuccess, 0);
        }
        if (condition.type === 'equipment_loot') {
            if (!condition.rarityAtLeast) return toNumber(bucket.equipmentLoot, 0);
            const minRank = getRarityRank(condition.rarityAtLeast);
            return Object.entries(bucket.rarityLoot || {}).reduce((sum, [rarity, amount]) => {
                return sum + (getRarityRank(rarity) >= minRank ? toNumber(amount, 0) : 0);
            }, 0);
        }
        if (condition.type === 'item_collect') {
            return toNumber(profile?.inventory?.[condition.itemKey], 0);
        }
        return 0;
    }

    function getTemplateState(profile, template, now = Date.now()) {
        const state = ensureQuestState(profile);
        const questId = template.questId;
        const repeat = template.repeat || 'once';
        const resetKey = getResetKey(repeat, now);
        if (!state.quests[questId]) state.quests[questId] = {};
        const entry = state.quests[questId];
        const claimed = repeat === 'once'
            ? Boolean(entry.claimed)
            : Boolean(entry.claimed && entry.resetKey === resetKey);
        return { entry, resetKey, claimed };
    }

    function listQuests(profile, options = {}) {
        const now = toNumber(options.now, Date.now());
        ensureQuestState(profile);
        return Object.values(getConfig().questTemplates || {})
            .sort((a, b) => toNumber(a.priority, 999) - toNumber(b.priority, 999))
            .map((template) => {
                const target = Math.max(1, toNumber(template.condition?.count, 1));
                const progress = Math.min(target, getProgressValue(profile, template, now));
                const state = getTemplateState(profile, template, now);
                const complete = progress >= target;
                return {
                    ...template,
                    target,
                    progress,
                    progressPct: Math.max(0, Math.min(100, (progress / target) * 100)),
                    resetKey: state.resetKey,
                    claimed: state.claimed,
                    complete,
                    canClaim: complete && !state.claimed
                };
            });
    }

    function applyReward(profile, reward = {}) {
        if (!profile.inventory) profile.inventory = {};
        Object.entries(reward.items || {}).forEach(([key, qty]) => {
            profile.inventory[key] = toNumber(profile.inventory[key], 0) + toNumber(qty, 0);
        });
        if (reward.statPoints) profile.statPoints = toNumber(profile.statPoints, 0) + toNumber(reward.statPoints, 0);
        if (reward.rewardPoints) profile.totalRewardPoints = toNumber(profile.totalRewardPoints, 0) + toNumber(reward.rewardPoints, 0);
        return reward;
    }

    function appendQuestLog(profile, entry) {
        ensureQuestState(profile);
        profile.questLogs.unshift({
            id: makeId('quest_log'),
            time: Date.now(),
            ...entry
        });
        profile.questLogs = profile.questLogs.slice(0, 120);
    }

    function claimQuest(profile, questId, options = {}) {
        const now = toNumber(options.now, Date.now());
        const quest = listQuests(profile, { now }).find((item) => item.questId === questId);
        if (!quest) return { ok: false, reason: 'missing_quest' };
        if (!quest.complete) return { ok: false, reason: 'not_complete', quest };
        if (!quest.canClaim) return { ok: false, reason: 'already_claimed', quest };

        const state = getTemplateState(profile, quest, now);
        applyReward(profile, quest.reward);
        state.entry.claimed = true;
        state.entry.claimedAt = now;
        state.entry.resetKey = state.resetKey;
        state.entry.claimCount = toNumber(state.entry.claimCount, 0) + 1;
        state.entry.lastProgress = quest.progress;
        state.entry.lastTarget = quest.target;
        appendQuestLog(profile, {
            action: 'claim',
            questId,
            title: quest.title,
            reward: quest.reward,
            resetKey: state.resetKey
        });
        return { ok: true, quest, reward: quest.reward };
    }

    function recordEvent(profile, event = {}) {
        const state = ensureQuestState(profile);
        if (!state) return null;
        const now = toNumber(event.now, Date.now());
        const normalized = {
            id: makeId('quest_event'),
            time: now,
            ...event
        };
        incrementBucket(state.counters.allTime, normalized);
        incrementBucket(ensurePeriodBucket(state, 'daily', now), normalized);
        incrementBucket(ensurePeriodBucket(state, 'weekly', now), normalized);
        profile.questEventLog.unshift(normalized);
        profile.questEventLog = profile.questEventLog.slice(0, 160);
        state.updatedAt = now;
        return normalized;
    }

    function evaluateAchievements(profile, options = {}) {
        const now = toNumber(options.now, Date.now());
        const state = ensureQuestState(profile);
        if (!state) return [];
        const unlocked = [];
        Object.values(getConfig().achievementTemplates || {}).forEach((achievement) => {
            if (!achievement?.achievementId || state.achievements.includes(achievement.achievementId)) return;
            const template = {
                questId: achievement.achievementId,
                repeat: 'once',
                condition: achievement.condition || {}
            };
            const target = Math.max(1, toNumber(template.condition.count, 1));
            if (getProgressValue(profile, template, now) < target) return;
            state.achievements.push(achievement.achievementId);
            unlocked.push(achievement);
            appendQuestLog(profile, {
                action: 'achievement',
                achievementId: achievement.achievementId,
                title: achievement.title
            });
        });
        return unlocked;
    }

    function describeReward(reward = {}) {
        const parts = Object.entries(reward.items || {}).map(([key, qty]) => `${key} x${qty}`);
        if (reward.rewardPoints) parts.push(`EXP point x${reward.rewardPoints}`);
        if (reward.statPoints) parts.push(`stat point x${reward.statPoints}`);
        return parts.join(', ');
    }

    const service = {
        ensureQuestState,
        getResetKey,
        listQuests,
        getProgressValue,
        claimQuest,
        recordEvent,
        evaluateAchievements,
        describeReward
    };

    GameServices.QuestService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
