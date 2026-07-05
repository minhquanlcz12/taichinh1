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
            },
            cache_tower: {
                mapId: 'cache_tower',
                name: 'Thap Cache Vo',
                levelRequired: 35,
                recommendedPower: 14000,
                dropProfileId: 'drop_cache_tower',
                monsterSpawns: [{ monsterId: 'cache_golem', weight: 100 }],
                bossSpawns: [{ bossId: 'cache_tyrant', weight: 10 }],
                legacy: { rewardPoints: 16, gold: 320, material: 'daCuongHoa' }
            },
            ticket_desert: {
                mapId: 'ticket_desert',
                name: 'Sa Mac Ticket Chay',
                levelRequired: 55,
                recommendedPower: 28000,
                dropProfileId: 'drop_ticket_desert',
                monsterSpawns: [{ monsterId: 'ticket_scarab', weight: 100 }],
                bossSpawns: [{ bossId: 'ticket_pharaoh', weight: 10 }],
                legacy: { rewardPoints: 24, gold: 520, material: 'longAn' }
            },
            night_build_forge: {
                mapId: 'night_build_forge',
                name: 'Ham Build Dem',
                levelRequired: 80,
                recommendedPower: 52000,
                dropProfileId: 'drop_night_build_forge',
                monsterSpawns: [{ monsterId: 'build_warlock', weight: 100 }],
                bossSpawns: [{ bossId: 'build_archon', weight: 10 }],
                legacy: { rewardPoints: 36, gold: 820, material: 'longAn' }
            },
            sprint_citadel: {
                mapId: 'sprint_citadel',
                name: 'Thien Thanh Sprint',
                levelRequired: 110,
                recommendedPower: 92000,
                dropProfileId: 'drop_sprint_citadel',
                monsterSpawns: [{ monsterId: 'sprint_seraph', weight: 100 }],
                bossSpawns: [{ bossId: 'sprint_regent', weight: 10 }],
                legacy: { rewardPoints: 52, gold: 1250, material: 'bossCore' }
            },
            core_kpi_sector: {
                mapId: 'core_kpi_sector',
                name: 'Vung Loi Sieu KPI',
                levelRequired: 135,
                recommendedPower: 150000,
                dropProfileId: 'drop_core_kpi_sector',
                monsterSpawns: [{ monsterId: 'core_behemoth', weight: 100 }],
                bossSpawns: [{ bossId: 'core_monarch', weight: 10 }],
                legacy: { rewardPoints: 70, gold: 1800, material: 'bossCore' }
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Maps;
    }
})(typeof window !== 'undefined' ? window : globalThis);
