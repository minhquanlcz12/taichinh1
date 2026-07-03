(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    GameConfig.Upgrade = {
        version: '2026.07.03_phase6_upgrade',
        maxItemLevel: 15,
        maxLifeOptionLevel: 7,
        materials: {
            blessingStone: {
                id: 'blessingStone',
                publicName: 'Linh thach chuc phuc',
                inventoryKey: 'linhThach'
            },
            soulStone: {
                id: 'soulStone',
                publicName: 'Da cuong hoa linh hon',
                inventoryKey: 'daCuongHoa'
            },
            lifeStone: {
                id: 'lifeStone',
                publicName: 'Long an sinh menh',
                inventoryKey: 'longAn'
            },
            chaosCore: {
                id: 'chaosCore',
                publicName: 'Loi dung hop',
                inventoryKey: 'bossCore'
            }
        },
        itemLevelRates: [
            { minLevel: 0, maxLevel: 5, materialId: 'blessingStone', materialQty: 1, goldCost: 25, successRate: 1, fail: 'none' },
            { minLevel: 6, maxLevel: 8, materialId: 'soulStone', materialQty: 1, goldCost: 60, successRate: 0.82, fail: 'none' },
            { minLevel: 9, maxLevel: 11, materialId: 'soulStone', materialQty: 2, goldCost: 140, successRate: 0.68, fail: 'downgrade_one' },
            { minLevel: 12, maxLevel: 14, materialId: 'chaosCore', materialQty: 1, secondaryMaterials: { longAn: 1, daCuongHoa: 3 }, goldCost: 320, successRate: 0.42, fail: 'downgrade_one' }
        ],
        lifeOptionRates: [
            { minLevel: 0, maxLevel: 2, materialId: 'lifeStone', materialQty: 1, goldCost: 80, successRate: 0.78, fail: 'none' },
            { minLevel: 3, maxLevel: 5, materialId: 'lifeStone', materialQty: 2, goldCost: 160, successRate: 0.58, fail: 'downgrade_one' },
            { minLevel: 6, maxLevel: 6, materialId: 'chaosCore', materialQty: 1, secondaryMaterials: { longAn: 2 }, goldCost: 260, successRate: 0.36, fail: 'downgrade_one' }
        ],
        chaosRecipes: {
            wing_core: {
                recipeId: 'wing_core',
                name: 'Loi canh chibi',
                cost: { bossCore: 1, longAn: 2, daCuongHoa: 6, goldDust: 500 },
                successRate: 0.35,
                output: { itemTemplateId: 'wing_core_fragment', itemType: 'material', quantity: 1 }
            }
        },
        skinUpgrade: {
            maxLevel: 10,
            baseStoneCost: 2,
            vipExtraStoneCost: 2,
            shardLevelDivisor: 2
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Upgrade;
    }
})(typeof window !== 'undefined' ? window : globalThis);
