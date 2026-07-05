(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    GameConfig.Monsters = {
        version: '2026.07.03_phase4_monsters_farm',
        templates: {
            deadline_imp: {
                monsterId: 'deadline_imp',
                name: 'Quai Deadline',
                level: 1,
                hp: 120,
                attack: 18,
                defense: 5,
                expReward: 80,
                rewardPoints: 1,
                dropProfileId: 'drop_training_forest'
            },
            bug_wraith: {
                monsterId: 'bug_wraith',
                name: 'Bug Ma',
                level: 3,
                hp: 175,
                attack: 30,
                defense: 12,
                expReward: 160,
                rewardPoints: 2,
                dropProfileId: 'drop_ghost_cave'
            },
            kpi_drake: {
                monsterId: 'kpi_drake',
                name: 'Boss KPI Nho',
                level: 6,
                hp: 250,
                attack: 48,
                defense: 22,
                expReward: 240,
                rewardPoints: 3,
                dropProfileId: 'drop_secret_realm'
            },
            molten_fiend: {
                monsterId: 'molten_fiend',
                name: 'Hoa Ma',
                level: 10,
                hp: 370,
                attack: 72,
                defense: 38,
                expReward: 400,
                rewardPoints: 5,
                dropProfileId: 'drop_molten_keep'
            },
            frost_wraith: {
                monsterId: 'frost_wraith',
                name: 'Bang Yeu',
                level: 15,
                hp: 520,
                attack: 105,
                defense: 58,
                expReward: 560,
                rewardPoints: 7,
                dropProfileId: 'drop_frost_peak'
            },
            abyss_lordling: {
                monsterId: 'abyss_lordling',
                name: 'Ma Vuong Vuc Sau',
                level: 22,
                hp: 760,
                attack: 155,
                defense: 88,
                expReward: 800,
                rewardPoints: 10,
                dropProfileId: 'drop_abyss_gate'
            },
            cache_golem: {
                monsterId: 'cache_golem',
                name: 'Golem Cache Vo',
                level: 35,
                hp: 1250,
                attack: 260,
                defense: 150,
                expReward: 1280,
                rewardPoints: 16,
                dropProfileId: 'drop_cache_tower'
            },
            ticket_scarab: {
                monsterId: 'ticket_scarab',
                name: 'Bo Cap Ticket Chay',
                level: 55,
                hp: 2100,
                attack: 430,
                defense: 260,
                expReward: 1920,
                rewardPoints: 24,
                dropProfileId: 'drop_ticket_desert'
            },
            build_warlock: {
                monsterId: 'build_warlock',
                name: 'Phap Su Build Dem',
                level: 80,
                hp: 3600,
                attack: 720,
                defense: 430,
                expReward: 2880,
                rewardPoints: 36,
                dropProfileId: 'drop_night_build_forge'
            },
            sprint_seraph: {
                monsterId: 'sprint_seraph',
                name: 'Thien Su Sprint',
                level: 110,
                hp: 5900,
                attack: 1180,
                defense: 710,
                expReward: 4160,
                rewardPoints: 52,
                dropProfileId: 'drop_sprint_citadel'
            },
            core_behemoth: {
                monsterId: 'core_behemoth',
                name: 'Behemoth Sieu KPI',
                level: 135,
                hp: 8800,
                attack: 1750,
                defense: 1080,
                expReward: 5600,
                rewardPoints: 70,
                dropProfileId: 'drop_core_kpi_sector'
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Monsters;
    }
})(typeof window !== 'undefined' ? window : globalThis);
