(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    const normalEquipment = [
        { rarity: 'white', weight: 52 },
        { rarity: 'blue', weight: 31 },
        { rarity: 'yellow', weight: 12 },
        { rarity: 'green', weight: 5 }
    ];

    const bossEquipment = [
        { rarity: 'yellow', weight: 25 },
        { rarity: 'green', weight: 34 },
        { rarity: 'orange', weight: 24 },
        { rarity: 'pink', weight: 12 },
        { rarity: 'red', weight: 5 }
    ];

    GameConfig.DropTables = {
        version: '2026.07.03_phase5_boss_drop',
        profiles: {
            drop_training_forest: {
                dropProfileId: 'drop_training_forest',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [12, 28] },
                    { itemTemplateId: 'linhThach', itemType: 'material', chance: 1, quantity: [1, 1] },
                    { itemTemplateId: 'thunderShard', itemType: 'material', chance: 0.16, quantity: [1, 1] }
                ],
                equipment: { chance: 0.20, rarityWeight: normalEquipment }
            },
            drop_ghost_cave: {
                dropProfileId: 'drop_ghost_cave',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [18, 42] },
                    { itemTemplateId: 'daCuongHoa', itemType: 'material', chance: 1, quantity: [1, 1] },
                    { itemTemplateId: 'moonShard', itemType: 'material', chance: 0.22, quantity: [1, 1] }
                ],
                equipment: { chance: 0.25, rarityWeight: normalEquipment }
            },
            drop_secret_realm: {
                dropProfileId: 'drop_secret_realm',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [28, 64] },
                    { itemTemplateId: 'longAn', itemType: 'material', chance: 1, quantity: [1, 1] },
                    { itemTemplateId: 'fireShard', itemType: 'material', chance: 0.30, quantity: [1, 1] }
                ],
                equipment: { chance: 0.32, rarityWeight: normalEquipment }
            },
            drop_molten_keep: {
                dropProfileId: 'drop_molten_keep',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [44, 98] },
                    { itemTemplateId: 'longAn', itemType: 'material', chance: 1, quantity: [1, 2] },
                    { itemTemplateId: 'fireShard', itemType: 'material', chance: 0.38, quantity: [1, 1] }
                ],
                equipment: { chance: 0.40, rarityWeight: normalEquipment }
            },
            drop_frost_peak: {
                dropProfileId: 'drop_frost_peak',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [68, 146] },
                    { itemTemplateId: 'daCuongHoa', itemType: 'material', chance: 1, quantity: [2, 3] },
                    { itemTemplateId: 'thunderShard', itemType: 'material', chance: 0.46, quantity: [1, 2] }
                ],
                equipment: { chance: 0.46, rarityWeight: normalEquipment }
            },
            drop_abyss_gate: {
                dropProfileId: 'drop_abyss_gate',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [100, 220] },
                    { itemTemplateId: 'longAn', itemType: 'material', chance: 1, quantity: [2, 4] },
                    { itemTemplateId: 'moonShard', itemType: 'material', chance: 0.54, quantity: [1, 2] }
                ],
                equipment: { chance: 0.52, rarityWeight: normalEquipment }
            },
            boss_common: {
                dropProfileId: 'boss_common',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [60, 260] },
                    { itemTemplateId: 'bossCore', itemType: 'material', chance: 0.12, quantity: [1, 1] }
                ],
                equipment: { chance: 0.46, rarityWeight: bossEquipment }
            },
            boss_high: {
                dropProfileId: 'boss_high',
                entries: [
                    { itemTemplateId: 'goldDust', itemType: 'gold', chance: 1, quantity: [160, 520] },
                    { itemTemplateId: 'bossCore', itemType: 'material', chance: 0.24, quantity: [1, 1] },
                    { itemTemplateId: 'longAn', itemType: 'material', chance: 0.7, quantity: [1, 3] }
                ],
                equipment: { chance: 0.72, rarityWeight: bossEquipment }
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.DropTables;
    }
})(typeof window !== 'undefined' ? window : globalThis);
