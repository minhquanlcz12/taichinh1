(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    GameConfig.Bosses = {
        version: '2026.07.03_phase5_boss_arena',
        defaultCooldownMs: 45 * 1000,
        templates: {
            deadline_captain: {
                bossId: 'deadline_captain',
                mapId: 'training_forest',
                name: 'Captain Deadline',
                level: 2,
                hp: 900,
                attack: 60,
                defense: 26,
                basePower: 720,
                challengeCostMultiplier: 1.8,
                rewardProfileId: 'boss_common'
            },
            bug_lord: {
                bossId: 'bug_lord',
                mapId: 'ghost_cave',
                name: 'Bug Lord',
                level: 5,
                hp: 1450,
                attack: 95,
                defense: 44,
                basePower: 1180,
                challengeCostMultiplier: 1.85,
                rewardProfileId: 'boss_common'
            },
            kpi_overlord: {
                bossId: 'kpi_overlord',
                mapId: 'secret_realm',
                name: 'KPI Overlord',
                level: 8,
                hp: 2200,
                attack: 145,
                defense: 72,
                basePower: 1850,
                challengeCostMultiplier: 1.95,
                rewardProfileId: 'boss_common'
            },
            molten_director: {
                bossId: 'molten_director',
                mapId: 'molten_keep',
                name: 'Molten Director',
                level: 12,
                hp: 3400,
                attack: 220,
                defense: 108,
                basePower: 3100,
                challengeCostMultiplier: 2,
                rewardProfileId: 'boss_high'
            },
            frost_reviewer: {
                bossId: 'frost_reviewer',
                mapId: 'frost_peak',
                name: 'Frost Reviewer',
                level: 17,
                hp: 5200,
                attack: 315,
                defense: 158,
                basePower: 5200,
                challengeCostMultiplier: 2.05,
                rewardProfileId: 'boss_high'
            },
            abyss_executor: {
                bossId: 'abyss_executor',
                mapId: 'abyss_gate',
                name: 'Abyss Executor',
                level: 24,
                hp: 7900,
                attack: 470,
                defense: 235,
                basePower: 8600,
                challengeCostMultiplier: 2.15,
                rewardProfileId: 'boss_high'
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Bosses;
    }
})(typeof window !== 'undefined' ? window : globalThis);
