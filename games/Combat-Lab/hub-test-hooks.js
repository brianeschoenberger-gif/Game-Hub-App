(function () {
    var actionCounts = {
        light: 0,
        heavy: 0,
        block: 0,
        jump: 0,
        kick: 0
    };

    function trackActions(app) {
        app.on('cc:action:light', function () { actionCounts.light += 1; });
        app.on('cc:action:heavy', function () { actionCounts.heavy += 1; });
        app.on('cc:action:block', function () { actionCounts.block += 1; });
        app.on('cc:jump', function () { actionCounts.jump += 1; });
        app.on('cc:action:kick', function () { actionCounts.kick += 1; });
    }

    function collectByName(entity, name, matches) {
        if (entity.name === name) {
            matches.push(entity);
        }

        for (var i = 0; i < entity.children.length; i += 1) {
            collectByName(entity.children[i], name, matches);
        }
    }

    function round(value) {
        return Math.round(value * 1000) / 1000;
    }

    function describeEntity(entity) {
        var position = entity.getPosition();
        var health = null;

        if (entity.script && entity.script.combatantHealth) {
            var healthScript = entity.script.combatantHealth;
            health = healthScript.currentHealth == null ? null : round(healthScript.currentHealth);
        }

        return {
            name: entity.name,
            enabled: entity.enabled,
            position: {
                x: round(position.x),
                y: round(position.y),
                z: round(position.z)
            },
            health: health
        };
    }

    var app = window.combatLabApp;
    if (app) {
        trackActions(app);
    }

    window.render_game_to_text = function () {
        var liveApp = window.combatLabApp;
        if (!liveApp || !liveApp.root) {
            return JSON.stringify({ mode: 'loading' });
        }

        var players = [];
        var enemies = [];
        collectByName(liveApp.root, 'Character Controller', players);
        collectByName(liveApp.root, 'Enemy Knight', enemies);

        return JSON.stringify({
            mode: players.length ? 'playing' : 'loading',
            coordinateSystem: 'right-handed; +Y is up',
            pointerLocked: document.pointerLockElement === liveApp.graphicsDevice.canvas,
            player: players.length ? describeEntity(players[0]) : null,
            enemies: enemies.map(describeEntity),
            actions: actionCounts
        });
    };
})();
