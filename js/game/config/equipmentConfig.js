(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    GameConfig.Equipment = {
        version: '2026.07.03_phase3_item_inventory',
        maxEnhanceLevel: 15,
        maxEquipmentBagSlots: 120,
        defaultDurability: 100,
        goldCurrencyKey: 'goldDust',
        slots: [
            { id: 'weapon', label: 'Vu khi', legacyAliases: ['weapon'], itemTypes: ['weapon'] },
            { id: 'offhand', label: 'Tay phu', legacyAliases: ['offhand', 'shield'], itemTypes: ['shield', 'offhand'] },
            { id: 'helm', label: 'Mu', legacyAliases: ['helm'], itemTypes: ['armor'] },
            { id: 'armor', label: 'Ao', legacyAliases: ['armor'], itemTypes: ['armor'] },
            { id: 'pants', label: 'Quan', legacyAliases: ['pants'], itemTypes: ['armor'] },
            { id: 'gloves', label: 'Gang', legacyAliases: ['glove', 'gloves'], itemTypes: ['armor'] },
            { id: 'boots', label: 'Giay', legacyAliases: ['boots'], itemTypes: ['armor'] },
            { id: 'wings', label: 'Canh', legacyAliases: ['wing', 'wings'], itemTypes: ['wings'] },
            { id: 'pendant', label: 'Day chuyen', legacyAliases: ['necklace', 'pendant'], itemTypes: ['jewelry'] },
            { id: 'ringLeft', label: 'Nhan trai', legacyAliases: ['ring', 'ringLeft'], itemTypes: ['jewelry'] },
            { id: 'ringRight', label: 'Nhan phai', legacyAliases: ['ringRight'], itemTypes: ['jewelry'] },
            { id: 'pet', label: 'Pet', legacyAliases: ['pet'], itemTypes: ['pet'] }
        ],
        rarityRanks: {
            white: 1,
            blue: 2,
            yellow: 3,
            green: 4,
            orange: 5,
            pink: 6,
            red: 7
        },
        rarityNames: {
            white: 'Thuong',
            blue: 'Xanh lam',
            yellow: 'Vang',
            green: 'Tinh anh',
            orange: 'Cam',
            pink: 'Hong',
            red: 'Do'
        },
        bindStatus: {
            none: 'none',
            bound: 'bound',
            account: 'account'
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Equipment;
    }
})(typeof window !== 'undefined' ? window : globalThis);
