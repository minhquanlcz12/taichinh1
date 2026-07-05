(function (root) {
    const GameConfig = root.GameConfig = root.GameConfig || {};

    GameConfig.Quests = {
        version: '2026.07.05_phase7_quests',
        questTemplates: {
            daily_training_forest_kills: {
                questId: 'daily_training_forest_kills',
                title: 'Rung Deadline',
                group: 'daily',
                repeat: 'daily',
                priority: 10,
                condition: { type: 'kill_monster', mapId: 'training_forest', count: 5 },
                reward: { items: { goldDust: 80, linhThach: 2 }, rewardPoints: 1 }
            },
            daily_ghost_cave_kills: {
                questId: 'daily_ghost_cave_kills',
                title: 'Hang Bug Ma',
                group: 'daily',
                repeat: 'daily',
                priority: 20,
                condition: { type: 'kill_monster', mapId: 'ghost_cave', count: 4 },
                reward: { items: { goldDust: 120, daCuongHoa: 1 }, rewardPoints: 2 }
            },
            weekly_boss_kpi: {
                questId: 'weekly_boss_kpi',
                title: 'Ai Boss KPI',
                group: 'weekly',
                repeat: 'weekly',
                priority: 30,
                condition: { type: 'boss_win', mapId: 'secret_realm', count: 1 },
                reward: { items: { goldDust: 260, longAn: 1, bossCore: 1 }, rewardPoints: 4 }
            },
            weekly_molten_upgrade: {
                questId: 'weekly_molten_upgrade',
                title: 'Lo Lua Deadline',
                group: 'weekly',
                repeat: 'weekly',
                priority: 40,
                condition: { type: 'upgrade_success', count: 3 },
                reward: { items: { goldDust: 220, daCuongHoa: 3 }, rewardPoints: 3 }
            },
            achievement_abyss_gate_clear: {
                questId: 'achievement_abyss_gate_clear',
                title: 'Cong Vuc Sau',
                group: 'milestone',
                repeat: 'once',
                priority: 50,
                condition: { type: 'boss_win', mapId: 'abyss_gate', count: 1 },
                reward: { items: { goldDust: 500, longAn: 2, bossCore: 1 }, statPoints: 2, rewardPoints: 6 }
            }
        },
        achievementTemplates: {
            first_wild_kill: {
                achievementId: 'first_wild_kill',
                title: 'First Farm',
                condition: { type: 'kill_monster', count: 1 }
            },
            first_boss_win: {
                achievementId: 'first_boss_win',
                title: 'Boss Breaker',
                condition: { type: 'boss_win', count: 1 }
            },
            first_green_drop: {
                achievementId: 'first_green_drop',
                title: 'Elite Collector',
                condition: { type: 'equipment_loot', rarityAtLeast: 'green', count: 1 }
            },
            first_plus_7: {
                achievementId: 'first_plus_7',
                title: 'Forge Adept',
                condition: { type: 'upgrade_success', minLevel: 7, count: 1 }
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GameConfig.Quests;
    }
})(typeof window !== 'undefined' ? window : globalThis);
