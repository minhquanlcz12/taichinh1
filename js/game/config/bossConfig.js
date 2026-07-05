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
            },
            cache_tyrant: {
                bossId: 'cache_tyrant',
                mapId: 'cache_tower',
                name: 'Cache Tyrant',
                level: 38,
                hp: 12800,
                attack: 760,
                defense: 390,
                basePower: 15000,
                challengeCostMultiplier: 2.2,
                rewardProfileId: 'boss_elite'
            },
            ticket_pharaoh: {
                bossId: 'ticket_pharaoh',
                mapId: 'ticket_desert',
                name: 'Ticket Pharaoh',
                level: 58,
                hp: 21000,
                attack: 1180,
                defense: 650,
                basePower: 30000,
                challengeCostMultiplier: 2.3,
                rewardProfileId: 'boss_elite'
            },
            build_archon: {
                bossId: 'build_archon',
                mapId: 'night_build_forge',
                name: 'Build Archon',
                level: 84,
                hp: 36000,
                attack: 1900,
                defense: 1050,
                basePower: 56000,
                challengeCostMultiplier: 2.45,
                rewardProfileId: 'boss_elite'
            },
            sprint_regent: {
                bossId: 'sprint_regent',
                mapId: 'sprint_citadel',
                name: 'Sprint Regent',
                level: 114,
                hp: 62000,
                attack: 3100,
                defense: 1800,
                basePower: 98000,
                challengeCostMultiplier: 2.65,
                rewardProfileId: 'boss_ancient'
            },
            core_monarch: {
                bossId: 'core_monarch',
                mapId: 'core_kpi_sector',
                name: 'Core KPI Monarch',
                level: 140,
                hp: 95000,
                attack: 4800,
                defense: 2900,
                basePower: 160000,
                challengeCostMultiplier: 2.85,
                rewardProfileId: 'boss_ancient'
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Bosses;
    }
})(typeof window !== 'undefined' ? window : globalThis);
