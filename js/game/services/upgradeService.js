(function (root) {
    const GameServices = root.GameServices || (root.GameServices = {});

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Upgrade) || {};
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getItemId(item) {
        return GameServices.ItemService?.getItemId
            ? GameServices.ItemService.getItemId(item)
            : (item?.id || item?.itemInstanceId || item?.uid);
    }

    function ensureUpgradeLogs(profile) {
        if (!profile) return [];
        if (!Array.isArray(profile.upgradeLogs)) profile.upgradeLogs = [];
        return profile.upgradeLogs;
    }

    function appendUpgradeLog(profile, entry) {
        const logs = ensureUpgradeLogs(profile);
        logs.unshift({
            id: `upgrade_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            time: Date.now(),
            ...entry
        });
        profile.upgradeLogs = logs.slice(0, 120);
    }

    function getRateForLevel(level, table) {
        const current = Math.max(0, Math.floor(toNumber(level, 0)));
        return (table || []).find((rate) => current >= toNumber(rate.minLevel, 0) && current <= toNumber(rate.maxLevel, 0)) || null;
    }

    function findItem(profile, itemId) {
        if (GameServices.InventoryService?.findItem) {
            return GameServices.InventoryService.findItem(profile, itemId);
        }
        const id = String(itemId || '');
        const bag = Array.isArray(profile?.equipmentBag) ? profile.equipmentBag : [];
        const bagItem = bag.find((item) => String(getItemId(item)) === id || String(item?.uid) === id);
        if (bagItem) return { location: 'equipmentBag', item: bagItem };
        const equipped = Object.values(profile?.equipment || {}).find((item) => String(getItemId(item)) === id || String(item?.uid) === id);
        if (equipped) return { location: 'equipment', item: equipped };
        return { location: null, item: null };
    }

    function getMaterialKey(materialId) {
        const material = getConfig().materials?.[materialId];
        return material?.inventoryKey || materialId;
    }

    function buildCost(rate = {}) {
        const cost = {};
        const materialKey = getMaterialKey(rate.materialId);
        if (materialKey) cost[materialKey] = toNumber(cost[materialKey], 0) + Math.max(1, toNumber(rate.materialQty, 1));
        Object.entries(rate.secondaryMaterials || {}).forEach(([key, qty]) => {
            cost[key] = toNumber(cost[key], 0) + Math.max(1, toNumber(qty, 1));
        });
        if (toNumber(rate.goldCost, 0) > 0) cost.goldDust = toNumber(cost.goldDust, 0) + toNumber(rate.goldCost, 0);
        return cost;
    }

    function hasCost(profile, cost) {
        return Object.entries(cost || {}).every(([key, qty]) => toNumber(profile?.inventory?.[key], 0) >= toNumber(qty, 0));
    }

    function consumeCost(profile, cost) {
        if (!profile.inventory) profile.inventory = {};
        Object.entries(cost || {}).forEach(([key, qty]) => {
            profile.inventory[key] = Math.max(0, toNumber(profile.inventory[key], 0) - toNumber(qty, 0));
        });
    }

    function addItemPower(item, delta) {
        item.power = Math.max(0, Math.round(toNumber(item.power, 0) + toNumber(delta, 0)));
    }

    function normalizeItem(profile, item) {
        if (!item) return null;
        if (GameServices.ItemService?.normalizeItemInstance) {
            const normalized = GameServices.ItemService.normalizeItemInstance(item, {
                ownerId: profile?.username,
                username: profile?.username,
                slot: item?.slot
            });
            Object.assign(item, normalized);
        }
        return item;
    }

    function upgradeItem(profile, itemId, options = {}) {
        if (!profile) return { ok: false, reason: 'missing_profile' };
        if (!profile.inventory) profile.inventory = {};
        if (GameServices.InventoryService?.ensureInventoryProfile) {
            GameServices.InventoryService.ensureInventoryProfile(profile, { ownerId: options.ownerId || profile.username });
        }

        const hit = findItem(profile, itemId);
        const item = normalizeItem(profile, hit.item);
        if (!item) return { ok: false, reason: 'item_not_found' };
        if (item.locked) return { ok: false, reason: 'locked_item' };

        const currentLevel = Math.max(0, Math.floor(toNumber(item.level ?? item.enhance, 0)));
        const maxLevel = toNumber(getConfig().maxItemLevel, 15);
        if (currentLevel >= maxLevel) return { ok: false, reason: 'max_level', item };

        const rate = getRateForLevel(currentLevel, getConfig().itemLevelRates || []);
        if (!rate) return { ok: false, reason: 'missing_rate', item };

        const cost = buildCost(rate);
        if (!hasCost(profile, cost)) return { ok: false, reason: 'missing_material', cost, item };

        consumeCost(profile, cost);
        const rng = options.rng || Math.random;
        const successRate = Math.max(0, Math.min(1, toNumber(rate.successRate, 0)));
        const success = rng() <= successRate;
        let nextLevel = currentLevel;

        if (success) {
            nextLevel = currentLevel + 1;
            item.level = nextLevel;
            item.enhance = nextLevel;
            addItemPower(item, 70 + nextLevel * 18);
            item.updatedAt = Date.now();
        } else if (rate.fail === 'downgrade_one') {
            nextLevel = Math.max(0, currentLevel - 1);
            item.level = nextLevel;
            item.enhance = nextLevel;
            addItemPower(item, -35);
            item.updatedAt = Date.now();
        }

        appendUpgradeLog(profile, {
            action: 'item_level',
            itemId: getItemId(item),
            name: item.name,
            fromLevel: currentLevel,
            toLevel: nextLevel,
            success,
            successRate,
            cost
        });

        return { ok: true, item, success, fromLevel: currentLevel, toLevel: nextLevel, cost, successRate };
    }

    function upgradeLifeOption(profile, itemId, options = {}) {
        if (!profile) return { ok: false, reason: 'missing_profile' };
        if (!profile.inventory) profile.inventory = {};
        if (GameServices.InventoryService?.ensureInventoryProfile) {
            GameServices.InventoryService.ensureInventoryProfile(profile, { ownerId: options.ownerId || profile.username });
        }

        const hit = findItem(profile, itemId);
        const item = normalizeItem(profile, hit.item);
        if (!item) return { ok: false, reason: 'item_not_found' };
        if (item.locked) return { ok: false, reason: 'locked_item' };

        const currentLevel = Math.max(0, Math.floor(toNumber(item.lifeOptionLevel, 0)));
        const maxLevel = toNumber(getConfig().maxLifeOptionLevel, 7);
        if (currentLevel >= maxLevel) return { ok: false, reason: 'max_life_option', item };

        const rate = getRateForLevel(currentLevel, getConfig().lifeOptionRates || []);
        if (!rate) return { ok: false, reason: 'missing_rate', item };

        const cost = buildCost(rate);
        if (!hasCost(profile, cost)) return { ok: false, reason: 'missing_material', cost, item };

        consumeCost(profile, cost);
        const rng = options.rng || Math.random;
        const successRate = Math.max(0, Math.min(1, toNumber(rate.successRate, 0)));
        const success = rng() <= successRate;
        let nextLevel = currentLevel;

        if (success) {
            nextLevel = currentLevel + 1;
        } else if (rate.fail === 'downgrade_one') {
            nextLevel = Math.max(0, currentLevel - 1);
        }

        item.lifeOptionLevel = nextLevel;
        item.lifeOptionValue = nextLevel * 4;
        item.attrLines = Array.isArray(item.attrLines) ? item.attrLines.filter((line) => line.key !== 'lifeOption') : [];
        if (nextLevel > 0) item.attrLines.push({ key: 'lifeOption', label: 'Sinh menh', value: item.lifeOptionValue });
        addItemPower(item, success ? 28 : -12);
        item.updatedAt = Date.now();

        appendUpgradeLog(profile, {
            action: 'life_option',
            itemId: getItemId(item),
            name: item.name,
            fromLevel: currentLevel,
            toLevel: nextLevel,
            success,
            successRate,
            cost
        });

        return { ok: true, item, success, fromLevel: currentLevel, toLevel: nextLevel, cost, successRate };
    }

    function chaosCombine(profile, recipeId, options = {}) {
        const recipe = getConfig().chaosRecipes?.[recipeId];
        if (!profile) return { ok: false, reason: 'missing_profile' };
        if (!recipe) return { ok: false, reason: 'missing_recipe' };
        if (!profile.inventory) profile.inventory = {};
        if (!hasCost(profile, recipe.cost)) return { ok: false, reason: 'missing_material', cost: recipe.cost };

        consumeCost(profile, recipe.cost);
        const rng = options.rng || Math.random;
        const successRate = Math.max(0, Math.min(1, toNumber(recipe.successRate, 0)));
        const success = rng() <= successRate;
        if (success && recipe.output?.itemTemplateId) {
            const key = recipe.output.itemTemplateId;
            profile.inventory[key] = toNumber(profile.inventory[key], 0) + Math.max(1, toNumber(recipe.output.quantity, 1));
        }

        appendUpgradeLog(profile, {
            action: 'chaos_combine',
            recipeId,
            name: recipe.name,
            success,
            successRate,
            cost: recipe.cost,
            output: success ? recipe.output : null
        });

        return { ok: true, success, recipe, successRate, output: success ? recipe.output : null };
    }

    function getSkinUpgradeCost(currentLevel, skin = {}) {
        const cfg = getConfig().skinUpgrade || {};
        const level = Math.max(1, Math.floor(toNumber(currentLevel, 1)));
        const stoneCost = Math.max(1, level * toNumber(cfg.baseStoneCost, 2) + (skin.vip ? toNumber(cfg.vipExtraStoneCost, 2) : 0));
        const shardCost = skin.shard ? Math.max(1, Math.ceil(level / Math.max(1, toNumber(cfg.shardLevelDivisor, 2)))) : 0;
        const cost = { daCuongHoa: stoneCost };
        if (skin.shard) cost[skin.shard] = shardCost;
        return cost;
    }

    const service = {
        getRateForLevel,
        buildCost,
        hasCost,
        consumeCost,
        upgradeItem,
        upgradeLifeOption,
        chaosCombine,
        appendUpgradeLog,
        getSkinUpgradeCost
    };

    GameServices.UpgradeService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
