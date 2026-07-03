(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function getConfig() {
        return (root.GameConfig && root.GameConfig.Equipment) || {};
    }

    function getItemService() {
        return GameServices.ItemService;
    }

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getItemId(item) {
        return getItemService()?.getItemId(item) || item?.id || item?.uid || null;
    }

    function normalizeSlot(slot) {
        return getItemService()?.normalizeSlot(slot) || slot;
    }

    function normalizeItem(item, context) {
        return getItemService()?.normalizeItemInstance(item, context) || item;
    }

    function appendItemLog(profile, entry) {
        if (!profile) return;
        if (!Array.isArray(profile.itemLogs)) profile.itemLogs = [];
        profile.itemLogs.unshift({
            id: `item_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            time: Date.now(),
            ...entry
        });
        profile.itemLogs = profile.itemLogs.slice(0, 80);
    }

    function findInBag(profile, itemId) {
        const id = String(itemId || '');
        const bag = Array.isArray(profile?.equipmentBag) ? profile.equipmentBag : [];
        const index = bag.findIndex((item) => String(getItemId(item)) === id || String(item?.uid) === id);
        return { bag, index, item: index >= 0 ? bag[index] : null };
    }

    function findEquipped(profile, itemOrSlot) {
        const target = String(itemOrSlot || '');
        const equipment = profile?.equipment || {};
        const slot = normalizeSlot(target);
        if (equipment[slot]) return { slot, item: equipment[slot] };

        const entries = Object.entries(equipment);
        const byId = entries.find(([, item]) => String(getItemId(item)) === target || String(item?.uid) === target);
        if (byId) return { slot: byId[0], item: byId[1] };

        const byAlias = entries.find(([key]) => normalizeSlot(key) === slot);
        if (byAlias) return { slot: byAlias[0], item: byAlias[1] };

        return { slot, item: null };
    }

    function ensureInventoryProfile(profile, context = {}) {
        if (!profile || typeof profile !== 'object') return profile;
        if (!profile.inventory || typeof profile.inventory !== 'object') profile.inventory = {};
        if (!Array.isArray(profile.equipmentBag)) profile.equipmentBag = [];
        if (!profile.equipment || typeof profile.equipment !== 'object') profile.equipment = {};
        if (!Array.isArray(profile.inventorySlots)) profile.inventorySlots = [];

        const ownerId = context.ownerId || context.username || profile.username || 'unknown';
        const seen = new Set();
        profile.equipmentBag = profile.equipmentBag
            .filter(Boolean)
            .map((item) => normalizeItem(item, { ownerId }))
            .filter((item) => {
                const id = getItemId(item);
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .slice(0, getConfig().maxEquipmentBagSlots || 120);

        const normalizedEquipment = {};
        Object.entries(profile.equipment).forEach(([slotKey, item]) => {
            if (!item) return;
            const normalized = normalizeItem(item, { ownerId, slot: slotKey });
            if (!normalized) return;
            const canonicalSlot = normalizeSlot(normalized.slot || slotKey);
            normalized.slot = canonicalSlot;
            normalized.location = { type: 'equipment', slot: canonicalSlot };
            normalizedEquipment[canonicalSlot] = normalized;
        });
        profile.equipment = normalizedEquipment;

        const equippedIds = new Set(Object.values(profile.equipment).map(getItemId).filter(Boolean));
        profile.equipmentBag = profile.equipmentBag.filter((item) => !equippedIds.has(getItemId(item)));

        profile.equipmentBag.forEach((item, index) => {
            item.location = { type: 'equipmentBag', slotIndex: index };
        });

        return profile;
    }

    function findItem(profile, itemOrSlot) {
        const bagHit = findInBag(profile, itemOrSlot);
        if (bagHit.item) return { location: 'equipmentBag', ...bagHit };
        const equipped = findEquipped(profile, itemOrSlot);
        if (equipped.item) return { location: 'equipment', ...equipped };
        return { location: null, item: null, index: -1, bag: Array.isArray(profile?.equipmentBag) ? profile.equipmentBag : [] };
    }

    function getEquipmentSlotEntries(profile, context = {}) {
        ensureInventoryProfile(profile, context);
        const slots = getConfig().slots || [];
        return slots.map((slotConfig) => {
            const item = profile.equipment?.[slotConfig.id] || null;
            return {
                id: slotConfig.id,
                label: slotConfig.label,
                item,
                itemId: getItemId(item),
                empty: !item,
                name: item?.name || '',
                icon: item?.icon || '',
                color: item?.color || '',
                power: toNumber(item?.power, 0),
                level: item ? `+${toNumber(item.power, 0) || toNumber(item.level, 0)}` : ''
            };
        });
    }

    function validateEquip(profile, item, context = {}) {
        if (!item) return { ok: false, reason: 'missing_item' };
        if (item.locked) return { ok: false, reason: 'locked_item' };
        const ownerId = context.ownerId || context.username || profile?.username;
        if (ownerId && item.ownerId && String(item.ownerId) !== String(ownerId)) return { ok: false, reason: 'wrong_owner' };
        const level = Math.max(1, toNumber(context.level ?? root.Auth?.currentUser?.level, 1));
        if (level < toNumber(item.levelReq, 1)) return { ok: false, reason: 'level_required', requiredLevel: toNumber(item.levelReq, 1) };
        const slot = normalizeSlot(item.slot);
        const slotConfig = (getConfig().slots || []).find((entry) => entry.id === slot);
        if (!slotConfig) return { ok: false, reason: 'invalid_slot' };
        return { ok: true, slot };
    }

    function validateOwner(profile, item, context = {}) {
        const ownerId = context.ownerId || context.username || profile?.username;
        if (ownerId && item?.ownerId && String(item.ownerId) !== String(ownerId)) {
            return { ok: false, reason: 'wrong_owner' };
        }
        return { ok: true };
    }

    function equipItem(profile, itemId, context = {}) {
        ensureInventoryProfile(profile, context);
        const hit = findInBag(profile, itemId);
        if (hit.index < 0 || !hit.item) return { ok: false, reason: 'not_in_bag' };

        const item = normalizeItem(hit.item, { ownerId: context.ownerId || profile.username });
        const validation = validateEquip(profile, item, context);
        if (!validation.ok) return validation;

        const targetSlot = validation.slot;
        const current = profile.equipment[targetSlot] || null;
        hit.bag.splice(hit.index, 1);
        if (current && getItemId(current)) {
            current.location = { type: 'equipmentBag', slotIndex: 0 };
            hit.bag.unshift(current);
        }

        item.slot = targetSlot;
        item.location = { type: 'equipment', slot: targetSlot };
        item.updatedAt = Date.now();
        profile.equipment[targetSlot] = item;
        profile.equipmentBag = hit.bag.slice(0, getConfig().maxEquipmentBagSlots || 120);
        appendItemLog(profile, { action: 'equip', itemId: getItemId(item), slot: targetSlot, name: item.name });
        return { ok: true, item, previousItem: current, slot: targetSlot };
    }

    function unequipItem(profile, slotOrItemId, context = {}) {
        ensureInventoryProfile(profile, context);
        const equipped = findEquipped(profile, slotOrItemId);
        if (!equipped.item) return { ok: false, reason: 'not_equipped' };
        if (equipped.item.locked) return { ok: false, reason: 'locked_item' };
        const ownerValidation = validateOwner(profile, equipped.item, context);
        if (!ownerValidation.ok) return ownerValidation;
        if (profile.equipmentBag.length >= (getConfig().maxEquipmentBagSlots || 120)) return { ok: false, reason: 'bag_full' };

        const slot = normalizeSlot(equipped.slot || equipped.item.slot);
        const item = normalizeItem(equipped.item, { ownerId: context.ownerId || profile.username, slot });
        delete profile.equipment[equipped.slot];
        delete profile.equipment[slot];
        item.location = { type: 'equipmentBag', slotIndex: 0 };
        item.updatedAt = Date.now();
        profile.equipmentBag.unshift(item);
        appendItemLog(profile, { action: 'unequip', itemId: getItemId(item), slot, name: item.name });
        return { ok: true, item, slot };
    }

    function sellItem(profile, itemId, context = {}) {
        ensureInventoryProfile(profile, context);
        const hit = findInBag(profile, itemId);
        if (hit.index < 0 || !hit.item) return { ok: false, reason: 'not_in_bag' };
        const item = hit.item;
        if (item.locked) return { ok: false, reason: 'locked_item' };
        const ownerValidation = validateOwner(profile, item, context);
        if (!ownerValidation.ok) return ownerValidation;
        const goldKey = getConfig().goldCurrencyKey || 'goldDust';
        const gold = getItemService()?.getSaleValue(item, context) || 0;
        hit.bag.splice(hit.index, 1);
        profile.equipmentBag = hit.bag;
        profile.inventory[goldKey] = toNumber(profile.inventory[goldKey], 0) + gold;
        appendItemLog(profile, { action: 'sell', itemId: getItemId(item), name: item.name, gold });
        return { ok: true, item, gold };
    }

    function lockItem(profile, itemId, locked = true, context = {}) {
        ensureInventoryProfile(profile, context);
        const hit = findItem(profile, itemId);
        if (!hit.item) return { ok: false, reason: 'not_found' };
        const ownerValidation = validateOwner(profile, hit.item, context);
        if (!ownerValidation.ok) return ownerValidation;
        hit.item.locked = Boolean(locked);
        hit.item.updatedAt = Date.now();
        appendItemLog(profile, { action: hit.item.locked ? 'lock' : 'unlock', itemId: getItemId(hit.item), name: hit.item.name });
        return { ok: true, item: hit.item };
    }

    function moveItem(profile, fromIndex, toIndex, context = {}) {
        ensureInventoryProfile(profile, context);
        const bag = profile.equipmentBag;
        const from = Math.floor(toNumber(fromIndex, -1));
        const to = Math.floor(toNumber(toIndex, -1));
        if (from < 0 || to < 0 || from >= bag.length || to >= (getConfig().maxEquipmentBagSlots || 120)) {
            return { ok: false, reason: 'invalid_slot' };
        }
        const ownerValidation = validateOwner(profile, bag[from], context);
        if (!ownerValidation.ok) return ownerValidation;
        const [item] = bag.splice(from, 1);
        bag.splice(Math.min(to, bag.length), 0, item);
        bag.forEach((entry, index) => {
            entry.location = { type: 'equipmentBag', slotIndex: index };
        });
        appendItemLog(profile, { action: 'move', itemId: getItemId(item), from, to });
        return { ok: true, item, from, to };
    }

    const service = {
        ensureInventoryProfile,
        getEquipmentSlotEntries,
        findItem,
        equipItem,
        unequipItem,
        moveItem,
        sellItem,
        lockItem,
        appendItemLog
    };

    GameServices.InventoryService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
