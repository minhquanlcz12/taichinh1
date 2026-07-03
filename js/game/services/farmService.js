(function (root) {
    const GameServices = root.GameServices = root.GameServices || {};

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function startFarm(context = {}) {
        const now = toNumber(context.now, Date.now());
        return {
            sessionId: context.sessionId || `farm_${now}_${Math.random().toString(36).slice(2, 8)}`,
            ownerId: context.ownerId || 'unknown',
            mapId: context.mapId || 'training_forest',
            status: 'running',
            startedAt: now,
            lastTickAt: now,
            kills: 0,
            expGained: 0,
            drops: []
        };
    }

    function stopFarm(session, context = {}) {
        if (!session) return null;
        session.status = 'stopped';
        session.stoppedAt = toNumber(context.now, Date.now());
        return session;
    }

    function findNearestMonster(monsters, position = { x: 0, y: 0 }, maxRange = Infinity) {
        let best = null;
        Object.values(monsters || {}).forEach((monster) => {
            if (!monster || monster.defeated) return;
            const dx = toNumber(monster.x, 0) - toNumber(position.x, 0);
            const dy = toNumber(monster.y, 0) - toNumber(position.y, 0);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= maxRange && (!best || dist < best.dist)) {
                best = { monster, dist };
            }
        });
        return best;
    }

    function resolveAttack(context = {}) {
        const monsters = context.monsters || {};
        const now = toNumber(context.now, Date.now());
        const target = monsters[context.targetId];
        if (!target || target.defeated) return { ok: false, reason: 'missing_target', hitTargets: [], defeatedTargets: [] };

        const skill = context.skill || {};
        const baseDamage = Math.max(1, toNumber(context.damage, 1));
        const aoeRadius = Math.max(0, toNumber(skill.aoeRadius, 0));
        const aoeDamageRatio = Math.max(0.1, Math.min(1, toNumber(skill.aoeDamageRatio, 0.65)));
        const hitTargets = [target];

        if (aoeRadius > 0) {
            Object.values(monsters).forEach((monster) => {
                if (!monster || monster.id === target.id || monster.defeated) return;
                const dx = toNumber(monster.x, 0) - toNumber(target.x, 0);
                const dy = toNumber(monster.y, 0) - toNumber(target.y, 0);
                if (Math.sqrt(dx * dx + dy * dy) <= aoeRadius) hitTargets.push(monster);
            });
        }

        const hits = [];
        const defeatedTargets = [];
        hitTargets.forEach((monster, index) => {
            const rawDamage = index === 0 ? baseDamage : Math.max(1, Math.round(baseDamage * aoeDamageRatio));
            const result = GameServices.MonsterService?.applyDamage
                ? GameServices.MonsterService.applyDamage(monster, rawDamage, { now })
                : fallbackApplyDamage(monster, rawDamage, now);
            hits.push(result);
            if (result.defeated && !monster.claimed) defeatedTargets.push(monster);
        });

        return {
            ok: true,
            target,
            skillId: skill.id || skill.skillId || 'basic',
            hitTargets,
            hits,
            defeatedTargets,
            now
        };
    }

    function fallbackApplyDamage(monster, damage, now) {
        monster.hp = Math.max(0, toNumber(monster.hp, 0) - Math.max(1, Math.round(damage)));
        monster.lastDamage = Math.max(1, Math.round(damage));
        monster.lastHitAt = now;
        const defeated = monster.hp <= 0;
        if (defeated) monster.defeated = true;
        return { ok: true, monster, damage: monster.lastDamage, defeated };
    }

    function buildKillReward(context = {}) {
        const monster = context.monster || {};
        const map = context.map || GameServices.MapService?.getMap?.(monster.mapId || monster.zoneId) || null;
        const legacyZone = context.legacyZone || {};
        const rewardPoints = Math.max(1, Math.round(toNumber(monster.rewardPoints, legacyZone.rewardPoints || map?.legacy?.rewardPoints || 1)));
        const expMultiplier = Math.max(1, toNumber(context.expMultiplier, 80));
        const exp = Math.max(1, Math.round(toNumber(monster.expReward, rewardPoints * expMultiplier)));
        const material = legacyZone.material || map?.legacy?.material || 'linhThach';
        const gold = Math.max(1, Math.round(toNumber(legacyZone.gold, map?.legacy?.gold || 10) * 0.42 + rewardPoints * 6));
        const items = {
            goldDust: gold,
            [material]: 1
        };
        const shardMap = {
            training_forest: 'thunderShard',
            ghost_cave: 'moonShard',
            secret_realm: 'fireShard',
            molten_keep: 'fireShard',
            frost_peak: 'thunderShard',
            abyss_gate: 'moonShard'
        };
        const mapId = monster.mapId || monster.zoneId || map?.mapId || legacyZone.id;
        if (Math.random() < Math.min(0.52, 0.12 + rewardPoints * 0.04)) {
            items[shardMap[mapId] || 'thunderShard'] = 1;
        }
        return {
            rewardPoints,
            exp,
            items,
            monsterId: monster.monsterId,
            monsterName: monster.name || legacyZone.monster || 'Monster',
            mapId,
            dropProfileId: monster.dropProfileId || map?.dropProfileId
        };
    }

    function tickFarm(session, context = {}) {
        if (!session || session.status !== 'running') return { ok: false, reason: 'not_running', session };
        session.lastTickAt = toNumber(context.now, Date.now());
        return { ok: true, session };
    }

    const service = {
        startFarm,
        stopFarm,
        tickFarm,
        findNearestMonster,
        resolveAttack,
        buildKillReward
    };

    GameServices.FarmService = service;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service;
    }
})(typeof window !== 'undefined' ? window : globalThis);
