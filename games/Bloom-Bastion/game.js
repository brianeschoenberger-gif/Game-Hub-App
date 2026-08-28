(() => {
  'use strict';

  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const W = 1180, H = 720, FIELD_W = 920;
  const TAU = Math.PI * 2;
  const path = [
    { x: -30, y: 145 }, { x: 170, y: 145 }, { x: 170, y: 320 },
    { x: 410, y: 320 }, { x: 410, y: 130 }, { x: 650, y: 130 },
    { x: 650, y: 515 }, { x: 855, y: 515 }, { x: 955, y: 515 },
  ];
  const towerTypes = {
    thorn: { name: 'Thorn Spitter', cost: 100, color: '#8bd450', range: 128, rate: .72, damage: 16, shot: '#d9ff87', key: '1', note: 'Fast, reliable darts' },
    bloom: { name: 'Sun Bloom', cost: 160, color: '#ffbd3d', range: 112, rate: 1.35, damage: 28, splash: 46, shot: '#fff1a6', key: '2', note: 'Burst damage in an area' },
    frost: { name: 'Dewdrop', cost: 140, color: '#68d9ee', range: 118, rate: 1.05, damage: 9, slow: .55, shot: '#baf6ff', key: '3', note: 'Slows the swarm' },
  };
  const state = {
    mode: 'title', money: 400, lives: 20, wave: 0, maxWaves: 10, waveActive: false,
    paused: false, speed: 1, selectedType: null, selectedTower: null, hover: { x: 0, y: 0 },
    towers: [], enemies: [], shots: [], particles: [], floaters: [], spawnQueue: [], spawnTimer: 0,
    message: '', messageTimer: 0, elapsed: 0, kills: 0, nextId: 1, shake: 0,
  };

  const waveSpecs = [
    [{ kind: 'mite', count: 8, gap: .72 }],
    [{ kind: 'mite', count: 12, gap: .58 }],
    [{ kind: 'mite', count: 8, gap: .5 }, { kind: 'runner', count: 5, gap: .72 }],
    [{ kind: 'shell', count: 6, gap: .92 }, { kind: 'mite', count: 8, gap: .42 }],
    [{ kind: 'runner', count: 14, gap: .42 }],
    [{ kind: 'shell', count: 10, gap: .72 }, { kind: 'runner', count: 7, gap: .5 }],
    [{ kind: 'mite', count: 18, gap: .3 }, { kind: 'shell', count: 7, gap: .62 }],
    [{ kind: 'runner', count: 18, gap: .32 }, { kind: 'shell', count: 9, gap: .55 }],
    [{ kind: 'shell', count: 14, gap: .48 }, { kind: 'runner', count: 16, gap: .3 }],
    [{ kind: 'queen', count: 1, gap: 1 }, { kind: 'runner', count: 12, gap: .34 }, { kind: 'shell', count: 12, gap: .42 }],
  ];
  const enemyTypes = {
    mite: { hp: 42, speed: 66, reward: 13, color: '#f06f65', radius: 13, lives: 1 },
    runner: { hp: 34, speed: 105, reward: 15, color: '#b985ff', radius: 11, lives: 1 },
    shell: { hp: 128, speed: 42, reward: 24, color: '#e78d45', radius: 17, lives: 2 },
    queen: { hp: 720, speed: 29, reward: 180, color: '#f2558f', radius: 28, lives: 5 },
  };

  function resetGame() {
    Object.assign(state, {
      mode: 'playing', money: 400, lives: 20, wave: 0, waveActive: false, paused: false,
      speed: 1, selectedType: null, selectedTower: null, towers: [], enemies: [], shots: [],
      particles: [], floaters: [], spawnQueue: [], spawnTimer: 0, message: 'Plant your defenses',
      messageTimer: 2.5, elapsed: 0, kills: 0, nextId: 1, shake: 0,
    });
  }

  function startWave() {
    if (state.mode !== 'playing' || state.paused || state.waveActive || state.wave >= state.maxWaves) return;
    const spec = waveSpecs[state.wave];
    const queue = [];
    spec.forEach((group, gi) => {
      for (let i = 0; i < group.count; i++) queue.push({ kind: group.kind, delay: i === 0 && gi === 0 ? .15 : group.gap });
    });
    state.wave++;
    state.spawnQueue = queue;
    state.spawnTimer = queue[0]?.delay || 0;
    state.waveActive = true;
    state.message = state.wave === 10 ? 'THE MATRIARCH APPROACHES' : `Wave ${state.wave} incoming`;
    state.messageTimer = 2;
  }

  function spawnEnemy(kind) {
    const t = enemyTypes[kind];
    const scale = 1 + (state.wave - 1) * .115;
    state.enemies.push({
      id: state.nextId++, kind, x: path[0].x, y: path[0].y, segment: 0, progress: 0,
      hp: Math.round(t.hp * scale), maxHp: Math.round(t.hp * scale), speed: t.speed,
      radius: t.radius, reward: t.reward, color: t.color, lives: t.lives, slowTimer: 0,
      hit: 0, wobble: Math.random() * TAU,
    });
  }

  function distanceToPath(x, y) {
    let best = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], vx = b.x - a.x, vy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
      best = Math.min(best, Math.hypot(x - (a.x + vx * t), y - (a.y + vy * t)));
    }
    return best;
  }

  function canPlace(x, y) {
    return x > 35 && x < FIELD_W - 35 && y > 55 && y < H - 35 && distanceToPath(x, y) > 58 &&
      state.towers.every(t => Math.hypot(x - t.x, y - t.y) > 62);
  }

  function placeTower(x, y) {
    const type = towerTypes[state.selectedType];
    if (!type || state.money < type.cost || !canPlace(x, y)) {
      state.message = !type ? '' : state.money < type.cost ? 'Not enough sunlight' : 'Roots need open soil';
      state.messageTimer = 1.3;
      return;
    }
    state.money -= type.cost;
    state.towers.push({ id: state.nextId++, type: state.selectedType, x, y, level: 1, cooldown: .15, angle: -Math.PI / 2, spent: type.cost });
    burst(x, y, type.color, 12);
    state.selectedType = null;
  }

  function upgradeTower(tower) {
    if (!tower || tower.level >= 3) return;
    const cost = upgradeCost(tower);
    if (state.money < cost) { state.message = 'Not enough sunlight'; state.messageTimer = 1.3; return; }
    state.money -= cost; tower.spent += cost; tower.level++;
    burst(tower.x, tower.y, '#fff4aa', 18);
  }
  function upgradeCost(t) { return Math.round(towerTypes[t.type].cost * (.7 + t.level * .35)); }
  function sellTower(tower) {
    if (!tower) return;
    state.money += Math.round(tower.spent * .7);
    burst(tower.x, tower.y, '#d7ff95', 14);
    state.towers = state.towers.filter(t => t !== tower); state.selectedTower = null;
  }

  function towerStats(tower) {
    const base = towerTypes[tower.type], boost = 1 + (tower.level - 1) * .42;
    return { ...base, damage: base.damage * boost, range: base.range + (tower.level - 1) * 13, rate: base.rate * Math.pow(.82, tower.level - 1), splash: base.splash ? base.splash + (tower.level - 1) * 9 : 0 };
  }

  function update(dt) {
    if (state.mode !== 'playing' || state.paused) return;
    state.elapsed += dt;
    state.messageTimer = Math.max(0, state.messageTimer - dt);
    state.shake = Math.max(0, state.shake - dt * 18);
    if (state.waveActive && state.spawnQueue.length) {
      state.spawnTimer -= dt;
      while (state.spawnTimer <= 0 && state.spawnQueue.length) {
        const next = state.spawnQueue.shift(); spawnEnemy(next.kind);
        state.spawnTimer += state.spawnQueue[0]?.delay || .1;
      }
    }
    for (const e of [...state.enemies]) {
      e.hit = Math.max(0, e.hit - dt * 5); e.slowTimer = Math.max(0, e.slowTimer - dt);
      let travel = e.speed * (e.slowTimer > 0 ? .56 : 1) * dt;
      while (travel > 0 && e.segment < path.length - 1) {
        const target = path[e.segment + 1], dx = target.x - e.x, dy = target.y - e.y, dist = Math.hypot(dx, dy);
        if (travel >= dist) { e.x = target.x; e.y = target.y; travel -= dist; e.segment++; }
        else { e.x += dx / dist * travel; e.y += dy / dist * travel; travel = 0; }
      }
      const a = path[e.segment], b = path[Math.min(path.length - 1, e.segment + 1)];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      e.progress = e.segment + Math.hypot(e.x - a.x, e.y - a.y) / segLen;
      if (e.segment >= path.length - 1) {
        state.lives -= e.lives; state.enemies = state.enemies.filter(n => n !== e);
        state.shake = 8; state.message = `The burrow took ${e.lives} damage`; state.messageTimer = 1.2;
        if (state.lives <= 0) { state.lives = 0; state.mode = 'gameover'; }
      }
    }
    for (const t of state.towers) {
      t.cooldown -= dt;
      const stats = towerStats(t);
      const target = state.enemies.filter(e => Math.hypot(e.x - t.x, e.y - t.y) <= stats.range).sort((a, b) => b.progress - a.progress)[0];
      if (target) {
        t.angle = Math.atan2(target.y - t.y, target.x - t.x);
        if (t.cooldown <= 0) {
          t.cooldown += stats.rate;
          state.shots.push({ x: t.x, y: t.y, target, targetId: target.id, speed: 490, damage: stats.damage, color: stats.shot, splash: stats.splash, slow: stats.slow || 0, type: t.type, trail: [] });
        }
      }
    }
    for (const s of [...state.shots]) {
      if (!state.enemies.includes(s.target)) { state.shots = state.shots.filter(n => n !== s); continue; }
      const dx = s.target.x - s.x, dy = s.target.y - s.y, d = Math.hypot(dx, dy), travel = s.speed * dt;
      s.trail.push({ x: s.x, y: s.y }); if (s.trail.length > 4) s.trail.shift();
      if (travel >= d) { hitEnemy(s.target, s); state.shots = state.shots.filter(n => n !== s); }
      else { s.x += dx / d * travel; s.y += dy / d * travel; }
    }
    for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 35 * dt; p.life -= dt; }
    state.particles = state.particles.filter(p => p.life > 0);
    for (const f of state.floaters) { f.y -= 28 * dt; f.life -= dt; }
    state.floaters = state.floaters.filter(f => f.life > 0);
    if (state.waveActive && !state.spawnQueue.length && !state.enemies.length) {
      state.waveActive = false;
      const bonus = 35 + state.wave * 5; state.money += bonus;
      if (state.wave >= state.maxWaves) state.mode = 'victory';
      else { state.message = `Garden clear! +${bonus} sunlight`; state.messageTimer = 2.4; }
    }
  }

  function hitEnemy(target, shot) {
    const victims = shot.splash ? state.enemies.filter(e => Math.hypot(e.x - target.x, e.y - target.y) <= shot.splash) : [target];
    victims.forEach(e => {
      e.hp -= shot.damage; e.hit = 1; if (shot.slow) e.slowTimer = 1.6;
      if (e.hp <= 0 && state.enemies.includes(e)) {
        state.money += e.reward; state.kills++;
        state.floaters.push({ x: e.x, y: e.y - 10, text: `+${e.reward}`, life: .8 });
        burst(e.x, e.y, e.color, e.kind === 'queen' ? 32 : 10);
        state.enemies = state.enemies.filter(n => n !== e);
      }
    });
    burst(target.x, target.y, shot.color, shot.splash ? 10 : 4);
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU, speed = 25 + Math.random() * 90;
      state.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .35 + Math.random() * .45, color, size: 2 + Math.random() * 4 });
    }
  }

  function roundedRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function text(str, x, y, size = 18, color = '#fff', align = 'left', weight = 600) {
    ctx.font = `${weight} ${size}px Inter, Segoe UI, sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y);
  }

  function draw() {
    ctx.save();
    if (state.shake) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fce72'); g.addColorStop(1, '#5d9b5d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, FIELD_W, H);
    drawGround(); drawPath();
    if (state.selectedTower) {
      const st = towerStats(state.selectedTower); ctx.beginPath(); ctx.arc(state.selectedTower.x, state.selectedTower.y, st.range, 0, TAU);
      ctx.fillStyle = 'rgba(220,255,220,.09)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([7, 7]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (state.selectedType && state.mode === 'playing') drawPlacementGhost();
    state.towers.forEach(drawTower); state.enemies.forEach(drawEnemy); drawShotsAndEffects(); drawBurrow();
    drawTopBar(); drawSidebar();
    if (state.messageTimer > 0 && state.mode === 'playing') {
      roundedRect(270, 58, 380, 42, 16, 'rgba(20,38,40,.84)', 'rgba(255,255,255,.12)');
      text(state.message, 460, 79, 17, '#f5ffdb', 'center', 700);
    }
    ctx.restore();
    if (state.mode === 'title') drawTitle();
    if (state.mode === 'gameover' || state.mode === 'victory') drawEnd();
    if (state.paused && state.mode === 'playing') drawPause();
  }

  function drawGround() {
    ctx.fillStyle = 'rgba(255,255,210,.08)';
    for (let y = 45; y < H; y += 70) for (let x = 25 + (y % 3) * 8; x < FIELD_W; x += 78) {
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.arc(x + 8, y + 5, 1.4, 0, TAU); ctx.fill();
    }
    const patches = [[70,570],[285,575],[535,625],[790,285],[295,95],[765,650]];
    patches.forEach(([x,y]) => { ctx.fillStyle='rgba(41,112,65,.25)'; ctx.beginPath(); ctx.ellipse(x,y,48,19,.2,0,TAU); ctx.fill(); for(let i=0;i<5;i++){ctx.strokeStyle='#397c4d';ctx.beginPath();ctx.moveTo(x-22+i*11,y);ctx.lineTo(x-18+i*11,y-13-(i%2)*4);ctx.stroke();}});
  }
  function drawPath() {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(38,73,53,.25)'; ctx.lineWidth = 88; ctx.beginPath(); ctx.moveTo(path[0].x + 4, path[0].y + 7); path.slice(1).forEach(p => ctx.lineTo(p.x + 4, p.y + 7)); ctx.stroke();
    ctx.strokeStyle = '#d2b779'; ctx.lineWidth = 78; ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y); path.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,244,189,.25)'; ctx.lineWidth = 3; ctx.setLineDash([2, 17]); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawBurrow() {
    ctx.fillStyle = '#315548'; ctx.beginPath(); ctx.ellipse(900, 515, 43, 57, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#172f2d'; ctx.beginPath(); ctx.ellipse(900, 515, 27, 40, 0, 0, TAU); ctx.fill();
    text('HOME', 875, 574, 11, '#e9ffd7', 'center', 800);
  }
  function drawTower(t) {
    const base = towerTypes[t.type], selected = state.selectedTower === t;
    ctx.save(); ctx.translate(t.x, t.y);
    ctx.fillStyle = 'rgba(18,48,37,.25)'; ctx.beginPath(); ctx.ellipse(3, 18, 29, 14, 0, 0, TAU); ctx.fill();
    if (selected) { ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#6a5034'; ctx.beginPath(); ctx.arc(0, 10, 20, 0, TAU); ctx.fill();
    ctx.rotate(t.angle);
    if (t.type === 'thorn') {
      ctx.fillStyle = base.color; for(let i=0;i<6;i++){ctx.rotate(TAU/6);ctx.beginPath();ctx.ellipse(17,0,16,8,0,0,TAU);ctx.fill();}
      ctx.fillStyle='#31592d';ctx.beginPath();ctx.arc(0,0,15,0,TAU);ctx.fill();ctx.fillStyle='#e6ff9b';ctx.fillRect(8,-4,25,8);
    } else if (t.type === 'bloom') {
      ctx.fillStyle=base.color;for(let i=0;i<8;i++){ctx.rotate(TAU/8);ctx.beginPath();ctx.ellipse(17,0,15,8,0,0,TAU);ctx.fill();}
      ctx.fillStyle='#815229';ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();
    } else {
      ctx.fillStyle=base.color;for(let i=0;i<5;i++){ctx.rotate(TAU/5);ctx.beginPath();ctx.ellipse(14,0,14,7,0,0,TAU);ctx.fill();}
      ctx.fillStyle='#e7feff';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();
    }
    ctx.restore();
    for(let i=0;i<t.level;i++){ctx.fillStyle='#fff4a5';ctx.beginPath();ctx.arc(t.x-9+i*9,t.y+30,2.5,0,TAU);ctx.fill();}
  }
  function drawEnemy(e) {
    ctx.save(); ctx.translate(e.x, e.y + Math.sin(state.elapsed * 7 + e.wobble) * 2);
    ctx.fillStyle='rgba(30,45,35,.25)';ctx.beginPath();ctx.ellipse(3,e.radius*.75,e.radius*1.05,e.radius*.5,0,0,TAU);ctx.fill();
    ctx.fillStyle=e.hit ? '#fff' : e.color;ctx.beginPath();ctx.ellipse(0,0,e.radius,e.radius*.82,0,0,TAU);ctx.fill();
    ctx.fillStyle='#29323b';ctx.beginPath();ctx.arc(-e.radius*.34,-2,2.4,0,TAU);ctx.arc(e.radius*.34,-2,2.4,0,TAU);ctx.fill();
    if(e.kind==='shell'||e.kind==='queen'){ctx.strokeStyle='#7d4b4a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,e.radius*.65,.2,Math.PI*1.8);ctx.stroke();}
    if(e.slowTimer>0){ctx.strokeStyle='#c9faff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,e.radius+4,0,TAU);ctx.stroke();}
    ctx.restore();
    const pct=Math.max(0,e.hp/e.maxHp);ctx.fillStyle='rgba(24,37,35,.7)';ctx.fillRect(e.x-e.radius,e.y-e.radius-10,e.radius*2,4);ctx.fillStyle=pct>.45?'#95e65e':'#ff7168';ctx.fillRect(e.x-e.radius,e.y-e.radius-10,e.radius*2*pct,4);
  }
  function drawShotsAndEffects() {
    state.shots.forEach(s=>{s.trail.forEach((p,i)=>{ctx.globalAlpha=(i+1)/s.trail.length*.3;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(p.x,p.y,2+i*.4,0,TAU);ctx.fill();});ctx.globalAlpha=1;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,s.y,s.type==='bloom'?7:4,0,TAU);ctx.fill();});
    state.particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,TAU);ctx.fill();});ctx.globalAlpha=1;
    state.floaters.forEach(f=>{ctx.globalAlpha=Math.min(1,f.life*2);text(f.text,f.x,f.y,14,'#fff6a1','center',800);});ctx.globalAlpha=1;
  }
  function drawPlacementGhost() {
    const {x,y}=state.hover, base=towerTypes[state.selectedType], valid=canPlace(x,y)&&state.money>=base.cost;
    if(x>=FIELD_W)return;ctx.fillStyle=valid?'rgba(225,255,205,.14)':'rgba(255,100,100,.14)';ctx.strokeStyle=valid?'rgba(240,255,220,.7)':'rgba(255,115,115,.8)';ctx.setLineDash([7,6]);ctx.beginPath();ctx.arc(x,y,base.range,0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=valid?base.color:'#e87373';ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(x,y,23,0,TAU);ctx.fill();ctx.globalAlpha=1;
  }
  function drawTopBar() {
    roundedRect(20,14,880,50,17,'rgba(22,50,49,.9)','rgba(255,255,255,.1)');
    text('BLOOM BASTION',42,39,19,'#efffdc','left',900); text(`☀  ${state.money}`,255,39,18,'#ffe27a'); text(`♥  ${state.lives}`,390,39,18,'#ff9b92');
    text(`WAVE  ${state.wave} / ${state.maxWaves}`,520,39,16,'#d5e8de');
    const status=state.waveActive?`${state.enemies.length+state.spawnQueue.length} pests remain`:'Garden quiet';text(status,875,39,14,'#c7ddcf','right',600);
  }
  function drawSidebar() {
    ctx.fillStyle='#172b32';ctx.fillRect(FIELD_W,0,W-FIELD_W,H);ctx.fillStyle='#203a3d';ctx.fillRect(FIELD_W,0,3,H);
    text('PLANT NURSERY',950,36,15,'#a9c7b7','left',800);
    const cards=[['thorn',72],['bloom',154],['frost',236]];
    cards.forEach(([key,y])=>{
      const d=towerTypes[key], active=state.selectedType===key, affordable=state.money>=d.cost;
      roundedRect(942,y,216,68,14,active?'#315b4d':'#203d40',active?'#bde98d':'rgba(255,255,255,.08)');
      ctx.globalAlpha=affordable?1:.45;ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(970,y+27,14,0,TAU);ctx.fill();text(`${d.key}`,970,y+52,10,'#9fbab0','center');
      text(d.name,995,y+20,15,'#efffe9');text(`${d.cost} ☀`,1139,y+20,14,affordable?'#ffe17a':'#b17e75','right',800);text(d.note,995,y+45,11,'#a9c1b7');ctx.globalAlpha=1;
    });
    if(state.selectedTower){
      const t=state.selectedTower,d=towerTypes[t.type],stats=towerStats(t);text('SELECTED',950,334,12,'#91aea1','left',800);text(d.name,950,359,18,d.color,'left',800);text(`Level ${t.level}  •  ${Math.round(stats.damage)} damage`,950,385,13,'#d1e5d9');text(`${Math.round(stats.range)} range  •  ${stats.rate.toFixed(2)}s rate`,950,407,12,'#9eb9ad');
      if(t.level<3){const c=upgradeCost(t);roundedRect(942,432,216,47,13,state.money>=c?'#416b42':'#38464a','rgba(255,255,255,.1)');text(`UPGRADE  ${c} ☀`,1050,456,14,'#f3ffda','center',800);}else{roundedRect(942,432,216,47,13,'#3c5050');text('MAX LEVEL',1050,456,13,'#b9d3c7','center',800);}
      roundedRect(942,488,216,39,12,'#503c3b','rgba(255,255,255,.08)');text(`UPROOT  +${Math.round(t.spent*.7)} ☀`,1050,508,12,'#f3c5ad','center',800);
    }else{
      text('HOW TO PLAY',950,344,12,'#91aea1','left',800);text('Choose a plant, then click',950,373,13,'#d1e5d9');text('open grass to place it.',950,394,13,'#d1e5d9');text('Click a plant to upgrade.',950,422,13,'#9eb9ad');
    }
    const ready=!state.waveActive&&state.wave<state.maxWaves;
    roundedRect(942,572,216,60,15,ready?'#d89035':'#34494a',ready?'#ffd586':'rgba(255,255,255,.08)');text(state.waveActive?'WAVE IN PROGRESS':state.wave>=state.maxWaves?'ALL WAVES SENT':`START WAVE ${state.wave+1}`,1050,603,15,ready?'#192f2e':'#9cb1aa','center',900);
    roundedRect(942,646,100,42,12,state.paused?'#7d6541':'#29464a');text(state.paused?'RESUME':'PAUSE',992,667,12,'#e8f5ee','center',800);
    roundedRect(1054,646,104,42,12,'#29464a');text(`${state.speed}× SPEED`,1106,667,12,'#e8f5ee','center',800);
    text('Space: wave  •  P: pause  •  F: fullscreen',1050,705,10,'#77958a','center',500);
  }
  function drawTitle() {
    ctx.fillStyle='rgba(13,29,33,.76)';ctx.fillRect(0,0,W,H);
    for(let i=0;i<14;i++){ctx.fillStyle=i%2?'#8bd450':'#ffbd3d';ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(110+i*78,100+Math.sin(i)*28,10+i%3*4,0,TAU);ctx.fill();}ctx.globalAlpha=1;
    text('BLOOM',W/2,192,72,'#f3ffdf','center',900);text('BASTION',W/2,263,72,'#a6e56d','center',900);text('ROOTS DOWN. PETALS UP.',W/2,320,16,'#ffe09a','center',800);
    text('The hungry swarm found your garden. Grow a defense before it reaches the burrow.',W/2,372,17,'#c7dbd0','center',500);
    roundedRect(410,418,360,76,20,'#d9953c','#ffdc8b');text('DEFEND THE GARDEN',W/2,456,20,'#18302e','center',900);
    text('Click to begin',W/2,522,14,'#a9c7ba','center');text('Place plants • Earn sunlight • Survive 10 waves',W/2,568,14,'#dbeade','center',600);text('Mouse + 1/2/3 • Space starts waves • F toggles fullscreen',W/2,605,12,'#809e93','center',500);
  }
  function drawEnd() {
    ctx.fillStyle='rgba(12,26,30,.82)';ctx.fillRect(0,0,W,H);const win=state.mode==='victory';
    text(win?'THE GARDEN HOLDS':'THE BURROW FELL',W/2,244,48,win?'#dfff99':'#ff9a8d','center',900);text(win?'The swarm retreats beyond the hedgerow.':'Regroup, replant, and try a new strategy.',W/2,304,18,'#d5e5dc','center',500);
    text(`${state.kills} pests cleared  •  ${state.towers.length} plants grown  •  Wave ${state.wave}`,W/2,354,15,'#a9c2b6','center');roundedRect(430,405,320,68,18,'#d9953c','#ffdc8b');text('PLAY AGAIN',W/2,439,18,'#18302e','center',900);text('Press Enter or click',W/2,508,13,'#8eaaa0','center');
  }
  function drawPause(){ctx.fillStyle='rgba(12,29,32,.52)';ctx.fillRect(0,0,FIELD_W,H);roundedRect(305,298,310,118,20,'rgba(18,43,43,.94)','rgba(255,255,255,.13)');text('GARDEN PAUSED',460,335,25,'#efffdc','center',900);text('Press P to resume',460,378,14,'#aac3b7','center');}

  function pointerPos(ev){const r=canvas.getBoundingClientRect();return{x:(ev.clientX-r.left)*W/r.width,y:(ev.clientY-r.top)*H/r.height};}
  canvas.addEventListener('pointermove',ev=>{state.hover=pointerPos(ev);});
  canvas.addEventListener('pointerdown',ev=>{
    const p=pointerPos(ev);state.hover=p;
    if(state.mode==='title'){resetGame();return;} if(state.mode==='victory'||state.mode==='gameover'){if(p.x>400&&p.x<780&&p.y>380&&p.y<500)resetGame();return;} if(state.paused&&!(p.x>942&&p.x<1042&&p.y>640)){return;}
    if(p.x>=FIELD_W){
      if(p.x>=942&&p.x<=1158){if(p.y>=72&&p.y<=140)state.selectedType='thorn';else if(p.y>=154&&p.y<=222)state.selectedType='bloom';else if(p.y>=236&&p.y<=304)state.selectedType='frost';else if(p.y>=432&&p.y<=479&&state.selectedTower)upgradeTower(state.selectedTower);else if(p.y>=488&&p.y<=527&&state.selectedTower)sellTower(state.selectedTower);else if(p.y>=572&&p.y<=632)startWave();else if(p.y>=646&&p.y<=688&&p.x<1048)state.paused=!state.paused;else if(p.y>=646&&p.y<=688){state.speed=state.speed===1?2:state.speed===2?3:1;}}
      return;
    }
    if(state.selectedType){placeTower(p.x,p.y);return;}
    state.selectedTower=state.towers.filter(t=>Math.hypot(p.x-t.x,p.y-t.y)<30).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0]||null;
  });
  window.addEventListener('keydown',ev=>{
    if(ev.key==='Enter'&&(state.mode==='title'||state.mode==='victory'||state.mode==='gameover'))resetGame();
    if(state.mode!=='playing')return;
    if(ev.key==='1')state.selectedType='thorn';if(ev.key==='2')state.selectedType='bloom';if(ev.key==='3')state.selectedType='frost';
    if(ev.key==='Escape'){state.selectedType=null;state.selectedTower=null;} if(ev.key===' ') {ev.preventDefault();startWave();} if(ev.key.toLowerCase()==='p')state.paused=!state.paused;
    if(ev.key==='+'||ev.key==='=')state.speed=Math.min(3,state.speed+1);if(ev.key==='-')state.speed=Math.max(1,state.speed-1);
    if(ev.key.toLowerCase()==='f'){if(document.fullscreenElement)document.exitFullscreen();else canvas.requestFullscreen?.();}
  });

  let last=performance.now(), accumulator=0;
  function frame(now){const realDt=Math.min(.05,(now-last)/1000);last=now;accumulator+=realDt*state.speed;while(accumulator>=1/60){update(1/60);accumulator-=1/60;}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.advanceTime=(ms)=>{const steps=Math.max(1,Math.round(ms/(1000/60)));for(let i=0;i<steps;i++)update(1/60*state.speed);draw();};
  window.render_game_to_text=()=>JSON.stringify({coordinateSystem:'canvas origin top-left; x right, y down; field x 0-920, sidebar x 920-1180',mode:state.mode,paused:state.paused,speed:state.speed,wave:{number:state.wave,max:state.maxWaves,active:state.waveActive,queued:state.spawnQueue.length},resources:{sunlight:state.money,lives:state.lives,kills:state.kills},selection:{placing:state.selectedType,selectedTowerId:state.selectedTower?.id||null},towers:state.towers.map(t=>({id:t.id,type:t.type,x:Math.round(t.x),y:Math.round(t.y),level:t.level})),enemies:state.enemies.slice(0,25).map(e=>({id:e.id,type:e.kind,x:Math.round(e.x),y:Math.round(e.y),hp:Math.max(0,Math.round(e.hp)),progress:+e.progress.toFixed(2),slowed:e.slowTimer>0})),controls:'Click title to begin. 1/2/3 or nursery cards select plants; click grass to place; click tower then Upgrade/Uproot; Space starts wave; P pauses; F fullscreen; +/- speed.'});
  draw();
})();
