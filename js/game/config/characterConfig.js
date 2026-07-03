(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    GameConfig.Character = {
        version: '2026.07.03_phase2_character_stats',
        statPointsPerLevel: 3,
        maxStamina: 100,
        baseStats: {
            strength: 1,
            agility: 1,
            vitality: 1,
            energy: 1,
            command: 1,
            luck: 1
        },
        legacyAliases: {
            str: 'strength',
            strength: 'strength',
            agi: 'agility',
            agility: 'agility',
            vit: 'vitality',
            vitality: 'vitality',
            int: 'energy',
            energy: 'energy',
            cmd: 'command',
            command: 'command',
            luck: 'luck'
        },
        canonicalToLegacy: {
            strength: 'str',
            agility: 'agi',
            vitality: 'vit',
            energy: 'int',
            command: 'command',
            luck: 'luck'
        },
        statMeta: {
            str: { canonical: 'strength', label: 'Luc', icon: 'STR', desc: 'Tang sat thuong vat ly va luc chien co ban.' },
            int: { canonical: 'energy', label: 'Phep', icon: 'ENE', desc: 'Tang sat thuong phep, MP va hieu qua ky nang.' },
            agi: { canonical: 'agility', label: 'Nhanh', icon: 'AGI', desc: 'Tang chi mang, ne tranh va toc do chien dau.' },
            vit: { canonical: 'vitality', label: 'The', icon: 'VIT', desc: 'Tang HP, phong thu va kha nang song sot.' },
            command: { canonical: 'command', label: 'Lenh', icon: 'CMD', desc: 'Tang tiem nang dieu khien pet, party va chi so dac biet.' },
            luck: { canonical: 'luck', label: 'May', icon: 'LUK', desc: 'Tang ti le roi do va chi mang phu.' }
        },
        allocationPlans: {
            kiem_tong: ['strength', 'vitality', 'agility', 'luck'],
            phap_tong: ['energy', 'luck', 'vitality', 'agility'],
            anh_sat: ['agility', 'luck', 'strength', 'vitality'],
            thien_y: ['vitality', 'energy', 'command', 'luck']
        },
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

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Character;
    }
})(typeof window !== 'undefined' ? window : globalThis);
