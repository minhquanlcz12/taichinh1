(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    GameConfig.Maps = {
        version: '2026.07.03_phase4_maps_farm',
        maps: {
            training_forest: {
                mapId: 'training_forest',
                name: 'Rung Deadline',
                levelRequired: 1,
                recommendedPower: 100,
                dropProfileId: 'drop_training_forest',
                monsterSpawns: [{ monsterId: 'deadline_imp', weight: 100 }],
                bossSpawns: [{ bossId: 'deadline_captain', weight: 10 }],
                legacy: { rewardPoints: 1, gold: 18, material: 'linhThach' }
            },
            ghost_cave: {
                mapId: 'ghost_cave',
                name: 'Hang Bug Ma',
                levelRequired: 3,
                recommendedPower: 520,
                dropProfileId: 'drop_ghost_cave',
                monsterSpawns: [{ monsterId: 'bug_wraith', weight: 100 }],
                bossSpawns: [{ bossId: 'bug_lord', weight: 10 }],
                legacy: { rewardPoints: 2, gold: 32, material: 'daCuongHoa' }
            },
            secret_realm: {
                mapId: 'secret_realm',
                name: 'Ai Boss KPI',
                levelRequired: 6,
                recommendedPower: 1250,
                dropProfileId: 'drop_secret_realm',
                monsterSpawns: [{ monsterId: 'kpi_drake', weight: 100 }],
                bossSpawns: [{ bossId: 'kpi_overlord', weight: 10 }],
                legacy: { rewardPoints: 3, gold: 56, material: 'longAn' }
            },
            molten_keep: {
                mapId: 'molten_keep',
                name: 'Lo Lua Deadline',
                levelRequired: 10,
                recommendedPower: 2350,
                dropProfileId: 'drop_molten_keep',
                monsterSpawns: [{ monsterId: 'molten_fiend', weight: 100 }],
                bossSpawns: [{ bossId: 'molten_director', weight: 10 }],
                legacy: { rewardPoints: 5, gold: 88, material: 'longAn' }
            },
            frost_peak: {
                mapId: 'frost_peak',
                name: 'Dinh Bang Bug',
                levelRequired: 15,
                recommendedPower: 4200,
                dropProfileId: 'drop_frost_peak',
                monsterSpawns: [{ monsterId: 'frost_wraith', weight: 100 }],
                bossSpawns: [{ bossId: 'frost_reviewer', weight: 10 }],
                legacy: { rewardPoints: 7, gold: 132, material: 'daCuongHoa' }
            },
            abyss_gate: {
                mapId: 'abyss_gate',
                name: 'Cong Vuc Sau',
                levelRequired: 22,
                recommendedPower: 7200,
                dropProfileId: 'drop_abyss_gate',
                monsterSpawns: [{ monsterId: 'abyss_lordling', weight: 100 }],
                bossSpawns: [{ bossId: 'abyss_executor', weight: 10 }],
                legacy: { rewardPoints: 10, gold: 190, material: 'longAn' }
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Maps;
    }
})(typeof window !== 'undefined' ? window : globalThis);
