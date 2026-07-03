(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Equipment) || {};
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getSlotAliases() {
        const aliases = {};
        (getConfig().slots || []).forEach((slot) => {
            aliases[slot.id] = slot.id;
            (slot.legacyAliases || []).forEach((alias) => {
                aliases[alias] = slot.id;
            });
        });
        return aliases;
    }

    function normalizeSlot(slot) {
        const aliases = getSlotAliases();
        const raw = String(slot || '').trim();
        return aliases[raw] || raw || 'misc';
    }

    function getSlotConfig(slot) {
        const canonical = normalizeSlot(slot);
        return (getConfig().slots || []).find((entry) => entry.id === canonical) || null;
    }

    function inferItemType(item) {
        if (item?.itemType) return String(item.itemType);
        if (item?.type && item.type !== 'equipment') return String(item.type);
        const slot = normalizeSlot(item?.slot);
        const slotConfig = getSlotConfig(slot);
        if (slotConfig?.itemTypes?.length) return slotConfig.itemTypes[0];
        return 'equipment';
    }

    function generateItemId(item = {}, context = {}) {
        const source = [
            item.templateId || item.name || item.slot || 'item',
            context.ownerId || item.ownerId || item.username || 'owner',
            item.createdAt || Date.now(),
            Math.random().toString(36).slice(2, 10)
        ].join('_');
        return `item_${String(source).toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}`;
    }

    function getItemId(item) {
        return item?.id || item?.itemInstanceId || item?.uid || null;
    }

    function normalizeItemInstance(item, context = {}) {
        if (!item || typeof item !== 'object') return null;
        const now = Date.now();
        const id = getItemId(item) || generateItemId(item, context);
        const ownerId = item.ownerId || context.ownerId || context.username || 'unknown';
        const slot = normalizeSlot(item.slot || context.slot);
        const itemType = inferItemType({ ...item, slot });
        const maxLevel = Number(getConfig().maxEnhanceLevel || 15);
        const level = clamp(Math.floor(toNumber(item.level ?? item.enhance, 0)), 0, maxLevel);
        const maxDurability = Math.max(1, Math.floor(toNumber(item.maxDurability ?? item.durability, getConfig().defaultDurability || 100)));
        const durability = clamp(Math.floor(toNumber(item.durability, maxDurability)), 0, maxDurability);
        const rarity = item.rarityId || item.rarity || 'white';

        return {
            ...item,
            id,
            itemInstanceId: id,
            uid: item.uid || id,
            templateId: item.templateId || `${itemType}_${slot}_${rarity}`,
            ownerId,
            slot,
            legacySlot: item.legacySlot || item.slot,
            itemType,
            type: 'equipment',
            rarity,
            rarityId: item.rarityId || rarity,
            level,
            enhance: level,
            durability,
            maxDurability,
            hasLuck: Boolean(item.hasLuck),
            hasSkill: Boolean(item.hasSkill),
            excellentOptions: Array.isArray(item.excellentOptions) ? item.excellentOptions : [],
            socketOptions: Array.isArray(item.socketOptions) ? item.socketOptions : [],
            bindStatus: item.bindStatus || getConfig().bindStatus?.none || 'none',
            locked: Boolean(item.locked),
            createdAt: item.createdAt || now,
            updatedAt: item.updatedAt || item.createdAt || now
        };
    }

    function isEquipmentItem(item) {
        return Boolean(item) && (item.type === 'equipment' || item.itemType || item.slot);
    }

    function getRarityRank(rarity) {
        return Number((getConfig().rarityRanks || {})[rarity] || 0);
    }

    function getSaleValue(item, context = {}) {
        if (!item) return 0;
        if (typeof context.getSaleValue === 'function') return context.getSaleValue(item);
        const rank = Math.max(1, getRarityRank(item.rarity));
        const power = toNumber(item.power, 0);
        const levelReq = toNumber(item.levelReq, 1);
        const level = toNumber(item.level, 0);
        return Math.max(1, Math.round(8 + rank * 9 + power * 0.08 + levelReq * 2 + level * 12));
    }

    const service = {
        normalizeSlot,
        getSlotConfig,
        normalizeItemInstance,
        getItemId,
        isEquipmentItem,
        getRarityRank,
        getSaleValue
    };

    GameServices.ItemService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
