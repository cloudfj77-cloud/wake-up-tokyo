function createComicAbilityFX(T, scene, { height = .935, reducedMotion = false, quality = 'standard' } = {}) {
  const H = Math.max(.2, height), TAU = Math.PI * 2, INK = '#292332', AIR_DROP_HEIGHT = 18, AIR_DROP_FLIGHT = .65;
  const palette = [INK, '#fff4d7', '#b58aff', '#d7ff59', '#ff727d', '#ffd065', '#7ee6b7', '#80d7eb', '#9476d1', '#eeaa63'];
  const colors = palette.map(c => new T.Color(c));
  const LIMIT = quality === 'low' ? 26 : 48, SPARKS = quality === 'low' ? 6 : 10;
  const root = new T.Group(); root.name = 'Comic ability effects'; scene.add(root);
  const geometry = {}, materials = new Map(), ownedGeometry = [], ownedMaterial = [];
  const active = [], pools = new Map(), auras = new Set(), auraPool = [], pendingImpacts = [];
  const stats = { emitted: 0, recycled: 0, poolHits: 0, createdGroups: 0, peak: 0, disposed: false };
  let elapsed = 0, pooledCount = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = v => 1 - Math.pow(1 - clamp(v, 0, 1), 3);
  const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const finite = v => Number.isFinite(v) ? v : 0;
  function poly(points) {
    const shape = new T.Shape(); shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
    shape.closePath(); const g = new T.ShapeGeometry(shape); ownedGeometry.push(g); return g;
  }
  function strip(start, sweep, count, inner, outer, spiral = false, gaps = false) {
    const v = [];
    for (let i = 0; i < count; i++) {
      const a = start + sweep * i / count, b = start + sweep * (i + (gaps ? .72 : 1)) / count;
      const ri = spiral ? inner + .36 * i / count : inner;
      const rj = spiral ? inner + .36 * (i + 1) / count : inner;
      const ro = spiral ? ri + outer : outer, rp = spiral ? rj + outer : outer;
      v.push(Math.cos(a) * ri, Math.sin(a) * ri, 0, Math.cos(a) * ro, Math.sin(a) * ro, 0, Math.cos(b) * rp, Math.sin(b) * rp, 0,
        Math.cos(a) * ri, Math.sin(a) * ri, 0, Math.cos(b) * rp, Math.sin(b) * rp, 0, Math.cos(b) * rj, Math.sin(b) * rj, 0);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); ownedGeometry.push(g); return g;
  }
  function branches(paths) {
    const v = [];
    for (const path of paths) for (let i = 1; i < path.length; i++) {
      const a=path[i-1], b=path[i], dx=b[0]-a[0], dy=b[1]-a[1], length=Math.hypot(dx,dy)||1;
      const width=.038*(1-.4*i/path.length), nx=-dy/length*width, ny=dx/length*width;
      v.push(a[0]-nx,a[1]-ny,0,a[0]+nx,a[1]+ny,0,b[0]+nx,b[1]+ny,0,
        a[0]-nx,a[1]-ny,0,b[0]+nx,b[1]+ny,0,b[0]-nx,b[1]-ny,0);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();ownedGeometry.push(g);return g;
  }
  function helix() {
    const v=[];
    for(let i=0;i<36;i++){
      const a=i/36*TAU*1.6,b=(i+1)/36*TAU*1.6,y=i/36,yb=(i+1)/36;
      const ax=Math.cos(a),az=Math.sin(a),bx=Math.cos(b),bz=Math.sin(b),r=.25,w=.028;
      v.push(ax*(r-w),y,az*(r-w),ax*(r+w),y,az*(r+w),bx*(r+w),yb,bz*(r+w),
        ax*(r-w),y,az*(r-w),bx*(r+w),yb,bz*(r+w),bx*(r-w),yb,bz*(r-w));
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();ownedGeometry.push(g);return g;
  }
  function clawStroke() {
    const left=[],right=[],count=24;
    for(let i=0;i<=count;i++){
      const t=i/count,s=1-t;
      const x=s*s*s*-.2+3*s*s*t*-.27+3*s*t*t*.38+t*t*t*.16;
      const y=s*s*s*.62+3*s*s*t*.23+3*s*t*t*-.28+t*t*t*-.63;
      const dx=3*s*s*(-.27+.2)+6*s*t*(.38+.27)+3*t*t*(.16-.38);
      const dy=3*s*s*(.23-.62)+6*s*t*(-.28-.23)+3*t*t*(-.63+.28),length=Math.hypot(dx,dy)||1;
      const width=.047*Math.pow(Math.sin(Math.PI*t),.8)*(1-.35*t),nx=-dy/length*width,ny=dx/length*width;
      left.push([x+nx,y+ny]);right.push([x-nx,y-ny]);
    }
    return poly([...left,...right.reverse()]);
  }
  geometry.shard = poly([[0,.56],[-.18,-.38],[.26,-.2]]);
  geometry.diamond = poly([[0,.52],[-.25,0],[0,-.52],[.25,0]]);
  geometry.chevron = poly([[-.48,.22],[0,-.27],[.48,.22],[.32,.4],[0,.08],[-.32,.4]]);
  geometry.streak = poly([[-.04,-.5],[.065,.28],[0,.55],[-.065,.28]]);
  geometry.bolt = poly([[.06,.57],[-.26,.06],[-.045,.06],[-.12,-.5],[.3,.11],[.09,.11]]);
  geometry.cross = poly([[-.11,.43],[.11,.43],[.11,.11],[.43,.11],[.43,-.11],[.11,-.11],[.11,-.43],[-.11,-.43],[-.11,-.11],[-.43,-.11],[-.43,.11],[-.11,.11]]);
  geometry.shield = poly([[-.37,.39],[.37,.39],[.31,-.1],[0,-.49],[-.31,-.1]]);
  geometry.star = poly([[0,.58],[.115,.14],[.55,0],[.115,-.14],[0,-.58],[-.115,-.14],[-.55,0],[-.115,.14]]);
  geometry.roots = branches([
    [[0,0],[-.18,.11],[-.3,.06],[-.48,.22]], [[-.3,.06],[-.37,-.09],[-.52,-.12]],
    [[0,0],[.16,-.09],[.32,-.02],[.49,-.2]], [[.32,-.02],[.39,.14],[.52,.19]],
    [[0,0],[.04,.21],[-.06,.35],[.04,.52]], [[.04,.21],[.2,.28],[.27,.43]],
    [[0,0],[-.05,-.2],[.06,-.32],[-.05,-.5]], [[-.05,-.2],[-.23,-.29],[-.3,-.43]]
  ]);
  geometry.tendril = poly([[-.16,-.5],[-.045,-.17],[-.19,.04],[-.025,.29],[.05,.56],[.105,.25],[-.065,.015],[.075,-.19],[-.065,-.5]]);
  geometry.hex = poly([[0,.5],[-.433,.25],[-.433,-.25],[0,-.5],[.433,-.25],[.433,.25]]);
  geometry.capsule = poly([[-.19,.33],[0,.58],[.19,.33],[.19,-.32],[0,-.55],[-.19,-.32]]);
  geometry.flag = poly([[-.33,.5],[.33,.5],[.33,-.3],[.03,-.15],[-.33,-.42]]);
  geometry.butterfly = poly([[0,.12],[-.25,.4],[-.52,.22],[-.32,-.24],[0,-.08],[.32,-.24],[.52,.22],[.25,.4]]);
  geometry.crystal = poly([[0,.65],[-.22,.23],[-.15,-.5],[.15,-.5],[.22,.23]]);
  geometry.eruption = poly([[-.5,-.5],[-.37,.19],[-.21,.04],[-.13,.61],[.025,.27],[.2,.82],[.27,.12],[.49,.3],[.34,-.5]]);
  geometry.helix = helix();
  geometry.ring = strip(0, TAU, 12, .455, .5, false, true);
  geometry.arc = strip(-.95, 1.9, 7, .38, .5);
  geometry.slash = strip(-1.28, 2.56, 9, .32, .54);
  geometry.claw = clawStroke();
  geometry.spiral = strip(-1.2, TAU * 1.16, 18, .12, .06, true);
  geometry.octahedron = new T.OctahedronGeometry(.105 * H, 0); ownedGeometry.push(geometry.octahedron);
  geometry.projectileCore = new T.IcosahedronGeometry(.26*H,1); ownedGeometry.push(geometry.projectileCore);
  geometry.projectileShell = new T.IcosahedronGeometry(.35*H,0); ownedGeometry.push(geometry.projectileShell);
  geometry.spore = new T.IcosahedronGeometry(.5,0); ownedGeometry.push(geometry.spore);
  geometry.rangeNet = new T.SphereGeometry(1,20,14); ownedGeometry.push(geometry.rangeNet);
  geometry.cometTail = new T.ConeGeometry(.22*H,1.3*H,5,1,true); geometry.cometTail.rotateX(-Math.PI/2); ownedGeometry.push(geometry.cometTail);
  const tempColor = new T.Color();
  function colorIndex(value) {
    if (value == null) return 2;
    try { tempColor.set(value); } catch { return 2; }
    let best = 2, distance = Infinity;
    for (let i = 1; i < colors.length; i++) {
      const c = colors[i], d = (c.r - tempColor.r) ** 2 + (c.g - tempColor.g) ** 2 + (c.b - tempColor.b) ** 2;
      if (d < distance) { distance = d; best = i; }
    }
    return best;
  }
  function mat(index, band = 0) {
    const key = index * 3 + band;
    if (!materials.has(key)) {
      const m = new T.MeshBasicMaterial({ color: colors[index], side: T.DoubleSide, transparent: true,
        opacity: [1,.62,.28][band], depthTest: true, depthWrite: false, blending: T.NormalBlending, toneMapped: false });
      materials.set(key, m); ownedMaterial.push(m);
    }
    return materials.get(key);
  }
  function wireMat(index,band=0){
    const key='range-net:'+index+':'+band;
    if(!materials.has(key)){
      const m=new T.MeshBasicMaterial({color:colors[index],wireframe:true,transparent:true,
        opacity:[.36,.22,.08][band],depthTest:true,depthWrite:false,blending:T.NormalBlending,toneMapped:false});
      materials.set(key,m);ownedMaterial.push(m);
    }
    return materials.get(key);
  }
  function dropHighlightMat(index){
    const key='falling-drop:'+index;
    if(!materials.has(key)){
      const m=new T.MeshBasicMaterial({color:colors[index],side:T.DoubleSide,transparent:true,
        opacity:1,depthTest:true,depthWrite:false,fog:false,blending:T.NormalBlending,toneMapped:false});
      materials.set(key,m);ownedMaterial.push(m);
    }
    return materials.get(key);
  }
  function glyph(shape, index = 2, outline = true) {
    const g = new T.Group(); g.userData.colorIndex = index; g.userData.band = -1;
    if (outline) {
      const ink = new T.Mesh(geometry[shape], mat(0)); ink.scale.set(1.15,1.15,1); ink.position.z = -.003 * H; ink.renderOrder = 21;
      g.add(ink); g.userData.ink = ink;
    }
    const fill = new T.Mesh(geometry[shape], mat(index)); fill.renderOrder = 22; g.add(fill); g.userData.fill = fill;
    return g;
  }
  function paint(g, index, band = 0) {
    if (g.userData.colorIndex === index && g.userData.band === band) return;
    g.userData.colorIndex = index; g.userData.band = band; g.userData.fill.material = mat(index, band);
    if (g.userData.ink) g.userData.ink.material = mat(0, band);
  }
  function node(e, shape, outline = true) { const g = glyph(shape, 2, outline); e.g.add(g); e.nodes.push(g); return g; }
  function make(kind) {
    const e = { kind, g: new T.Group(), nodes: [], age: 0, life: 1, color: 2, seed: 0, power: 1, radius: 1, count: 0, yaw: 0, force: 1 };
    e.g.name = 'Comic FX · ' + kind; stats.createdGroups++;
    if (kind === 'burst') { node(e, 'star'); for (let i = 0; i < SPARKS; i++) node(e, i % 3 ? 'shard' : 'streak', i < 4); }
    else if (kind === 'wave') { node(e, 'ring'); node(e, 'ring', false); for (let i = 0; i < 4; i++) node(e, 'shard', i < 2); }
    else if (kind === 'melee') { for(let i=0;i<3;i++)node(e,'claw');for(let i=0;i<3;i++)node(e,'claw',false); }
    else if (kind === 'shot') { node(e, 'star'); node(e, 'bolt'); for (let i = 0; i < 3; i++) node(e, 'chevron', i === 0); node(e, 'streak', false); }
    else if(kind==='airDrop') {node(e,'spore',false);node(e,'streak',false);node(e,'streak',false);node(e,'streak',false);node(e,'star');node(e,'ring',false);for(let i=0;i<6;i++)node(e,'spore',false);node(e,'ring',false);node(e,'spore',false);}
    else if(kind==='powerImpact') {node(e,'rangeNet',false);node(e,'rangeNet',false);node(e,'ring',false);node(e,'star',false);for(let i=0;i<4;i++)node(e,'shard',false);}
    else if(kind==='haste') {for(let i=0;i<5;i++)node(e,'chevron',i<2);for(let i=0;i<3;i++)node(e,'streak',false);}
    else if(kind==='tough') {for(let i=0;i<5;i++)node(e,'hex',i<3);}
    else if(kind==='command') {for(let i=0;i<3;i++)node(e,'flag');for(let i=0;i<3;i++)node(e,'chevron',false);for(let i=0;i<3;i++)node(e,'streak',false);}
    else if(kind==='evolve') {node(e,'crystal');node(e,'helix',false);node(e,'helix',false);for(let i=0;i<3;i++)node(e,'crystal',i===0);for(let i=0;i<3;i++)node(e,'diamond',false);}
    else if(kind==='heal') {for(let i=0;i<4;i++)node(e,'cross',i<2);}
    else if(kind==='frenzy') {node(e,'star');node(e,'slash');node(e,'slash');for(let i=0;i<4;i++)node(e,'bolt',i<2);}
    else if(kind==='dot') {node(e,'roots');for(let i=0;i<3;i++)node(e,'tendril',i===0);for(let i=0;i<3;i++)node(e,'shard',i===0);}
    else if(kind==='convert') {for(let i=0;i<4;i++)node(e,'butterfly',i<2);for(let i=0;i<3;i++)node(e,'hex',false);}
    else if(kind==='upgrade') {for(let i=0;i<3;i++)node(e,'chevron',i<2);node(e,'star');for(let i=0;i<2;i++)node(e,'streak',false);}
    else if(kind==='charge') {for(let i=0;i<3;i++)node(e,'chevron',i===0);node(e,'bolt');node(e,'arc',false);}
    else if(kind==='air') {for(let i=0;i<6;i++)node(e,'spore',false);for(let i=0;i<3;i++)node(e,'streak',i===0);}
    return e;
  }
  function release(e, cancel = false) {
    const i = active.indexOf(e); if (i >= 0) active.splice(i, 1);
    if(!cancel&&e.kind==='airDrop'&&!e.impacted&&e.onImpact)pendingImpacts.push({at:elapsed+Math.max(0,e.impactAt-e.age),callback:e.onImpact,x:e.g.position.x,y:e.g.position.y,z:e.g.position.z});
    e.g.removeFromParent(); e.g.visible = false; e.onImpact = null;
    if (!pools.has(e.kind)) pools.set(e.kind, []);
    pools.get(e.kind).push(e); pooledCount++;
    // Bound pooled scene nodes too; dropping a group never disposes its shared resources.
    if (pooledCount > LIMIT * 2) {
      for (const p of pools.values()) if (p.length) { p.shift(); pooledCount--; break; }
    }
  }
  function acquire(kind, x, y, z, color, life) {
    if (stats.disposed) return null;
    if (active.length >= LIMIT) { release(active[0]); stats.recycled++; }
    let pool = pools.get(kind), e = pool && pool.pop();
    if (e) { stats.poolHits++; pooledCount--; } else e = make(kind);
    e.age = 0; e.life = life; e.color = colorIndex(color); e.seed = stats.emitted++ * 2.39996323;
    e.power = 1; e.radius = H; e.count = SPARKS; e.yaw = 0; e.force = 1;
    e.onImpact=null; e.impacted=false;
    e.g.position.set(finite(x),finite(y),finite(z)); e.g.rotation.set(0,0,0); e.g.scale.setScalar(1); e.g.visible = true;
    for (const n of e.nodes) { n.visible = true; n.position.set(0,0,0); n.rotation.set(0,0,0); n.scale.setScalar(1); paint(n,e.color); }
    root.add(e.g); active.push(e); stats.peak = Math.max(stats.peak,active.length); return e;
  }
  function ground(n, y = 0) { n.rotation.set(-Math.PI / 2,0,0); n.position.y = y; }
  function scale(n, x, y = x) { n.scale.set(Math.max(.0001,x),Math.max(.0001,y),1); }
  function bandAt(t) { return t < .66 ? 0 : t < .84 ? 1 : 2; }
  function animate(e) {
    const t = clamp(e.age / e.life,0,1), pop = ease(t / .24), fade = 1 - smooth((t - .52) / .48), motion = reducedMotion ? .24 : 1;
    const band = bandAt(t), n = e.nodes, h = H;
    for (const g of n) paint(g,e.color,band);
    if (e.kind === 'burst') {
      const core = n[0]; core.rotation.set(-.5,0,e.seed); core.position.y = h * .04;
      scale(core,h * (.08 + .28 * pop) * fade); paint(core,1,band); core.visible = t < .34;
      for (let i = 1; i < n.length; i++) {
        const g = n[i]; g.visible = i <= e.count;
        const a = e.seed + (i - 1) * 2.39996323, speed = (.62 + (i % 4) * .15) * e.force;
        const travel = h * (.08 + ease(t) * .27 * speed * motion);
        g.position.set(Math.cos(a) * travel, h * (.08 + Math.sin(t * Math.PI) * (.14 + i % 3 * .06)) * motion, Math.sin(a) * travel);
        g.rotation.set(-.7,0,a + t * (i % 2 ? 1.1 : -.9) * motion);
        scale(g,h * (.1 + i % 3 * .028) * fade,h * (.18 + i % 3 * .035) * fade);
        if (i % 3 === 0) paint(g,1,band);
      }
    } else if (e.kind === 'wave') {
      for (let i = 0; i < 2; i++) {
        const g = n[i]; ground(g,h * (.025 + i * .015));
        scale(g,e.radius * 2 * (.16 + ease(clamp(t - i * .13,0,1)) * (.84 - i * .12)));
        g.rotation.z = (i ? -.13 : .13) + e.seed; g.visible = i === 0 || t > .12;
        if (i === 1) paint(g,1,band);
      }
      for (let i = 2; i < 6; i++) {
        const a = e.seed + (i - 2) * Math.PI / 2, r = e.radius * ease(t) * .8;
        n[i].position.set(Math.cos(a)*r,h*(.04+Math.sin(t*Math.PI)*.18),Math.sin(a)*r); n[i].rotation.set(-.6,0,-a);
        scale(n[i],h*.12*fade,h*.23*fade);
      }
    } else if (e.kind === 'melee') {
      // Three tapered claw cuts follow the hand across the chest, in local +Z.
      e.g.rotation.y=e.yaw;
      for(let i=0;i<3;i++){
        const p=clamp((t-.07-i*.035)/.72,0,1),cut=ease(p/.48),tail=1-smooth((p-.46)/.54),g=n[i];
        const x=h*((i-1)*.23+(.24-.48*cut)*motion),y=h*(1.5-.22*cut+(i-1)*.025),z=h*(.95+.38*cut*motion);
        g.visible=t>.07+i*.035&&p<1;g.position.set(x,y,z);g.rotation.set(-.28,0,.4+cut*.18*motion);
        scale(g,h*(.8+.12*e.power)*tail,h*(.82+.12*e.power)*(.42+.58*cut)*tail);paint(g,1,p<.62?0:1);
        const trail=n[i+3];trail.visible=g.visible&&p>.13&&p<.83;
        trail.position.set(x+h*.1*motion,y+h*.05,z-h*.055);trail.rotation.copy(g.rotation);
        scale(trail,g.scale.x*.75,g.scale.y*.94);paint(trail,e.color,2);
      }
    } else if (e.kind === 'shot') {
      e.g.rotation.y=e.yaw; e.g.position.x=e.x+e.dx*h*.55*ease(t)*motion; e.g.position.z=e.z+e.dz*h*.55*ease(t)*motion;
      n[0].rotation.set(-.6,0,Math.PI/4); scale(n[0],h*.33*fade); n[0].visible=t<.38; paint(n[0],1,band);
      n[1].rotation.set(-Math.PI/2,0,Math.PI); n[1].position.z=-h*.18; scale(n[1],h*.14*fade,h*.35*fade);
      for(let i=2;i<5;i++) {
        const a=(i-2)*TAU/3+t*2*motion; n[i].visible=e.power>1; n[i].position.set(Math.cos(a)*h*.17,Math.sin(a)*h*.17,-h*(.17+.1*t));
        n[i].rotation.set(0,0,a+Math.PI/2); scale(n[i],h*.13*fade);
      }
      ground(n[5],0); n[5].position.z=h*.1; scale(n[5],h*.06*fade,h*.44*fade); paint(n[5],1,band);
    } else animateAbility(e,t,pop,fade,band,motion);
  }
  function animateAbility(e,t,pop,fade,band,motion) {
    const n=e.nodes,h=H,r=e.radius;
    if(e.kind==='airDrop') {
      const fall=clamp(e.age/e.impactAt,0,1),hit=e.age>=e.impactAt,after=Math.max(0,e.age-e.impactAt),s=clamp(after/3,0,1),impact=ease(after/.12);
      const altitude=AIR_DROP_HEIGHT*(1-fall*fall), wobble=Math.sin(fall*Math.PI)*.16*motion;
      for(let i=0;i<4;i++)n[i].visible=!hit;
      // A solid bright seed and crossed streamers stay visible from every camera heading.
      n[0].position.set(wobble,altitude+h*.3,0);n[0].rotation.set(fall*.8,fall*2,0);n[0].scale.set(h*.92,h*1.32,h*.92);paint(n[0],1,0);
      for(let i=1;i<4;i++) {const g=n[i];g.position.set(wobble,altitude+h*(1.8+(i%2)*.15),0);g.rotation.set(0,(i-1)*Math.PI/3,0);scale(g,h*(i===2?2.1:3.4),h*(3.3+(i%2)*.5));paint(g,i===2?1:2,0);}
      n[4].visible=hit&&after<.26;ground(n[4],h*.035);n[4].rotation.z=.25;scale(n[4],h*(.25+impact*1.75)*(1-clamp(after/.34,0,1)*.5));paint(n[4],after<.055?1:2,bandAt(clamp(after/.26,0,1)));
      n[5].visible=hit&&after<.48;ground(n[5],h*.045);scale(n[5],r*2*(.05+ease(after/.45)*.95));paint(n[5],2,bandAt(clamp(after/.48,0,1)));
      for(let i=6;i<12;i++){const j=i-6,g=n[i],a=e.seed+j*TAU/6,rr=r*(.22+(j%2)*.25)*ease(after/.3);g.visible=hit;g.rotation.set(0,a+s*.15*motion,0);g.position.set(Math.cos(a)*rr,h*(.1+(j%3)*.045),Math.sin(a)*rr);g.scale.set(r*(.6+(j%2)*.2)*(1-s*.25),h*(.26+(j%3)*.045),r*(.5+(j%2)*.18)*(1-s*.25));paint(g,2,after<.23?1:2);}
      n[12].visible=!hit;ground(n[12],h*.035);scale(n[12],r*2*(.94+.06*Math.sin(fall*Math.PI*3)));paint(n[12],2,2);
      n[13].visible=!hit;n[13].position.copy(n[0].position);n[13].rotation.copy(n[0].rotation);n[13].scale.set(h*1.2,h*1.58,h*1.2);paint(n[13],2,0);n[13].userData.fill.renderOrder=20;
      if(!hit){n[0].userData.fill.material=dropHighlightMat(1);n[13].userData.fill.material=dropHighlightMat(2);for(let i=1;i<4;i++)n[i].userData.fill.material=dropHighlightMat(i===2?1:2);}
    } else if(e.kind==='powerImpact') {
      // Restore the original spherical range mesh, with a readable damage-radius boundary.
      for(let i=0;i<2;i++){
        const g=n[i],phase=clamp((e.age-i*.075)/.3,0,1),extent=r*(i===0?1:.68)*ease(phase);
        g.position.y=h*.16;g.rotation.set(0,e.seed+(i===0?1:-1)*t*.22*motion,i*.12);
        g.scale.setScalar(Math.max(.0001,extent));g.visible=i===0||e.age>.075;
        g.userData.fill.material=wireMat(i===0?2:1,t<.43?0:t<.72?1:2);
      }
      ground(n[2],h*.035);scale(n[2],r*2*ease(e.age/.3));paint(n[2],2,t<.5?1:2);
      ground(n[3],h*.055);scale(n[3],h*(.2+ease(t/.15)*.7)*(1-t));paint(n[3],1,band);n[3].visible=e.age<.24;
      for(let i=4;i<8;i++){const j=i-4,g=n[i],a=e.seed+j*TAU/4,d=Math.min(r,H*1.4)*ease(t);g.position.set(Math.cos(a)*d,h*(.08+Math.sin(t*Math.PI)*.3),Math.sin(a)*d);g.rotation.set(-.6,0,a+t*motion);scale(g,h*.075*fade,h*.2*fade);paint(g,2,band);}
    } else if(e.kind==='haste') {
      for(let i=0;i<5;i++){const g=n[i],p=clamp((t-i*.055)/.75,0,1);g.position.set((i%2?-.25:.25)*h,h*(.12+i*.12),h*(-.65+1.3*ease(p))*motion);g.rotation.set(-Math.PI/2,0,Math.PI);scale(g,h*(.44-i*.025)*fade,h*.5*fade);paint(g,i%2?7:1,band);g.visible=t>i*.045;}
      for(let i=5;i<8;i++){const g=n[i];ground(g,h*(.13+(i-5)*.19));g.position.x=(i-6)*h*.25;g.position.z=-h*.3;scale(g,h*.28*fade,h*(.9+pop*.5)*fade);paint(g,7,band);}
    } else if(e.kind==='tough') {
      const lock=ease(t/.22),breakup=smooth((t-.65)/.35);
      for(let i=0;i<5;i++){const g=n[i],a=(i-2)*.8,rr=h*(.65-.2*lock+.25*breakup);g.position.set(Math.sin(a)*rr,h*(.43+(i%2)*.13),Math.cos(a)*rr);g.rotation.set(0,a,0);scale(g,h*(i===2?.62:.4)*(1-breakup*.3),h*(i===2?.7:.5)*(1-breakup*.3));paint(g,i===2?7:1,band);}
    } else if(e.kind==='command') {
      const spread=Math.min(r,H*2)*(.15+.75*ease(t));
      for(let i=0;i<3;i++){const a=e.seed+i*TAU/3,g=n[i];g.position.set(Math.sin(a)*spread,h*(.45+.1*pop),Math.cos(a)*spread);g.rotation.set(0,a,Math.sin(t*9+i)*.055*motion);scale(g,h*.42*pop,h*.66*pop);paint(g,2,band);
        const arrow=n[i+3];ground(arrow,h*.06);arrow.position.set(Math.sin(a)*(spread+h*.23),h*.06,Math.cos(a)*(spread+h*.23));arrow.rotation.z=a+Math.PI;scale(arrow,h*.32*fade);paint(arrow,1,band);
        const link=n[i+6];ground(link,h*.045);link.position.set(Math.sin(a)*spread*.5,h*.045,Math.cos(a)*spread*.5);link.rotation.z=a;scale(link,h*.045,spread);paint(link,2,band);}
    } else if(e.kind==='evolve') {
      const growth=ease(t/.6),sink=1-smooth((t-.75)/.25);
      n[0].position.y=h*.62*growth;scale(n[0],h*.5*growth*sink,h*1.2*growth*sink);n[0].rotation.set(-.05,0,0);paint(n[0],5,band);
      for(let i=1;i<3;i++){n[i].position.y=h*.03;n[i].rotation.set(0,t*2*motion+(i-1)*Math.PI,0);n[i].scale.set(h*.95,h*1.35*growth,h*.95);paint(n[i],i===1?5:1,band);}
      for(let i=3;i<6;i++){const a=(i-3)*TAU/3,g=n[i],delayed=ease((t-.1)/.55);g.position.set(Math.cos(a)*h*.28,h*.32*delayed,Math.sin(a)*h*.28);g.rotation.set(-.1,0,-Math.cos(a)*.25);scale(g,h*.26*delayed*sink,h*.64*delayed*sink);paint(g,5,band);}
      for(let i=6;i<9;i++){const a=e.seed+(i-6)*TAU/3+t*2*motion,g=n[i];g.position.set(Math.cos(a)*h*.35,h*(.3+t*1.2),Math.sin(a)*h*.35);g.rotation.set(-.5,0,a);scale(g,h*.1*fade);paint(g,1,band);}
    } else if(e.kind==='heal') {
      for(let i=0;i<4;i++){const p=clamp((t-i*.12)/.64,0,1),g=n[i];g.visible=t>=i*.12;g.position.set((i%2?-.19:.19)*h,h*(.16+ease(p)*(1+i*.08)),(i-1.5)*h*.09);g.rotation.set(-.4,0,0);scale(g,h*(i===0?.43:.27)*Math.sin(p*Math.PI));paint(g,i===2?1:6,bandAt(p));}
    } else if(e.kind==='frenzy') {
      ground(n[0],h*.025);n[0].rotation.z=e.seed;scale(n[0],h*(.35+pop*.9)*fade);paint(n[0],4,band);
      for(let i=1;i<3;i++){const g=n[i];g.position.set((i===1?-.12:.12)*h,h*.5,0);g.rotation.set(-.45,i===1?.6:-.6,(i===1?1:-1)*(.6+ease(t)*2.8));scale(g,h*(.9+.15*i)*pop);paint(g,i===1?4:1,band);}
      for(let i=3;i<7;i++){const g=n[i],a=(i-3)*TAU/4;e.g.rotation.y=0;g.position.set(Math.cos(a)*h*.29,h*(.2+Math.sin(t*Math.PI)*.35),Math.sin(a)*h*.29);g.rotation.set(-.2,0,-Math.cos(a)*.55);scale(g,h*.22*fade,h*(.55+.2*(i%2))*pop*fade);paint(g,4,band);}
    } else if(e.kind==='dot') {
      ground(n[0],h*.03);n[0].rotation.z=e.seed;scale(n[0],h*(.25+.95*pop));paint(n[0],3,band);
      for(let i=1;i<4;i++){const a=e.seed+(i-1)*TAU/3,g=n[i];g.position.set(Math.cos(a)*h*.22,h*.2*pop,Math.sin(a)*h*.22);g.rotation.set(-.1,a,Math.sin(t*4+i)*.16*motion);scale(g,h*.3*pop*fade,h*.58*pop*fade);paint(g,3,band);}
      for(let i=4;i<7;i++){const a=e.seed+(i-4)*TAU/3,g=n[i];g.position.set(Math.cos(a)*h*(.22+.25*t),h*(.13+.25*ease(t)),Math.sin(a)*h*(.22+.25*t));g.rotation.set(-.5,0,a);scale(g,h*.12*fade,h*.22*fade);paint(g,i===5?1:3,band);}
    } else if(e.kind==='convert') {
      for(let i=0;i<4;i++){const g=n[i],a=e.seed+i*2.39996,p=clamp((t-i*.055)/.8,0,1),d=h*(.12+.9*ease(p))*motion;g.position.set(Math.cos(a)*d,h*(.16+p*(.9+i*.1)),Math.sin(a)*d);g.rotation.set(-.4,a*.2,Math.sin(t*8+i)*.18*motion);scale(g,h*(.33+i*.025)*(1-p*.45)*(reducedMotion?1:.65+.35*Math.abs(Math.sin(t*12+i))),h*.33*(1-p*.45));paint(g,i%2?1:2,bandAt(p));}
      for(let i=4;i<7;i++){const a=e.seed+(i-4)*TAU/3,g=n[i];ground(g,h*(.06+(i-4)*.035));g.position.x=Math.cos(a)*h*.22;g.position.z=Math.sin(a)*h*.22;scale(g,h*(.45+.35*pop));paint(g,2,2);g.visible=t<.65;}
    } else if(e.kind==='upgrade') {
      for(let i=0;i<3;i++){const g=n[i],p=clamp((t-i*.1)/.6,0,1);g.position.y=h*(.22+i*.22+ease(p)*.4);g.rotation.set(-.25,0,Math.PI);scale(g,h*.45*Math.sin(p*Math.PI));paint(g,5,bandAt(p));g.visible=t>i*.1;}
      n[3].position.y=h*(.9+.3*pop);n[3].rotation.set(-.25,0,t*.4*motion);scale(n[3],h*.42*pop*fade);paint(n[3],1,band);
      for(let i=4;i<6;i++){n[i].position.set((i===4?-.35:.35)*h,h*.6,0);n[i].rotation.set(-.2,0,0);scale(n[i],h*.025*fade,h*1.15*pop*fade);paint(n[i],5,band);}
    } else if(e.kind==='charge') {
      const inward=1-ease(t/.7);
      for(let i=0;i<3;i++){const a=e.seed+i*TAU/3+t*.5*motion,g=n[i],d=h*(.16+.48*inward);g.position.set(Math.cos(a)*d,h*.46+Math.sin(a)*h*.18,Math.sin(a)*d);g.rotation.set(-.4,0,a+Math.PI/2);scale(g,h*.25*(.4+.6*fade));paint(g,3,band);}
      n[3].position.y=h*.46;n[3].rotation.set(-.3,0,0);scale(n[3],h*(.1+.24*pop)*fade,h*(.12+.42*pop)*fade);paint(n[3],1,band);
      n[4].position.y=h*.46;n[4].rotation.set(-.3,0,t*4*motion);scale(n[4],h*(.9-.4*ease(t)));paint(n[4],3,band);
    } else if(e.kind==='air') {
      for(let i=0;i<6;i++){const a=e.seed+i*TAU/6,g=n[i],d=r*(.16+(i%2)*.34)*pop;g.position.set(Math.cos(a)*d,h*(.1+(i%3)*.045),Math.sin(a)*d);g.rotation.set(0,a,0);g.scale.set(r*(.55+(i%2)*.2)*(1-t*.2),h*(.27+(i%3)*.04),r*(.5+(i%2)*.15)*(1-t*.2));paint(g,2,t>.2?2:1);}
      for(let i=6;i<9;i++){const a=e.seed+(i-6)*TAU/3,g=n[i];g.position.set(Math.cos(a)*Math.min(r,h)*.45,h*(.25+.6*ease(t)),Math.sin(a)*Math.min(r,h)*.45);g.rotation.set(-.2,0,Math.sin(a)*.2);scale(g,h*.045*fade,h*.65*fade);paint(g,i===7?1:2,band);}
    }
  }
  function burst(x,y,z,color,count=8,force=4) {
    const e=acquire('burst',x,y,z,color,reducedMotion?.3:.38); if(!e)return null;
    e.count=clamp(Math.round(count),1,SPARKS); e.force=clamp(force*.25,.25,2); animate(e); return e;
  }
  function wave(x,y,z,radius,color) {
    const e=acquire('wave',x,y,z,color,.46); if(!e)return null; e.radius=clamp(radius,.12,8.5); animate(e); return e;
  }
  function melee(x,y,z,yaw,heavy=false) {
    const e=acquire('melee',x,y,z,heavy?'#d7ff59':'#b58aff',heavy?.26:.19); if(!e)return null;
    e.yaw=finite(yaw); e.power=heavy?1.15:1; e.g.scale.setScalar(heavy?.68:.52);animate(e); return e;
  }
  function shot(x,y,z,dx,dz,color,empowered=false) {
    const e=acquire('shot',x,y,z,color,empowered?.16:.1); if(!e)return null;
    const length=Math.hypot(dx,dz)||1; e.x=finite(x); e.z=finite(z); e.dx=finite(dx)/length; e.dz=finite(dz)/length;
    e.yaw=Math.atan2(-e.dx,-e.dz); e.power=empowered?2:1;e.g.scale.setScalar(empowered?.75:.4); animate(e); return e;
  }
  const kindColor={air:2,dot:3,frenzy:4,haste:7,tough:7,evolve:5,command:2,convert:2,upgrade:5,charge:3,heal:6};
  function pulse(x,y,z,kind,level=1,radius=1) {
    kind=Object.prototype.hasOwnProperty.call(kindColor,kind)?kind:'evolve';
    const lives={air:1.1,dot:.66,frenzy:.54,haste:.46,tough:.76,evolve:1.05,command:.72,convert:.9,upgrade:.85,charge:.68,heal:1.0};
    const e=acquire(kind,x,y,z,palette[kindColor[kind]],lives[kind]); if(!e)return null;
    e.power=clamp(level,1,5); e.radius=clamp(radius,.25,kind==='air'||kind==='frenzy'?8:H*4); animate(e); return e;
  }
  function airDrop(x,groundY,z,radius,{onImpact}={}) {
    const e=acquire('airDrop',x,groundY,z,palette[2],AIR_DROP_FLIGHT+3);if(!e)return null;
    e.radius=clamp(radius,.3,10);e.impactAt=AIR_DROP_FLIGHT;e.onImpact=typeof onImpact==='function'?onImpact:null;e.impacted=false;animate(e);return e;
  }
  function powerImpact(x,groundY,z,radius) {
    const e=acquire('powerImpact',x,groundY,z,palette[2],.85);if(!e)return null;
    e.radius=clamp(radius,.3,8.5);animate(e);return e;
  }
  function aura(holder,kind,{life=0,size=1}={}) {
    if(stats.disposed)return {g:new T.Group(),time:0,life,removed:true};
    let a=auraPool.pop();
    if(!a) {
      const g=new T.Group(); g.name='Comic status aura'; a={g,time:0,life:0,nodes:[glyph('ring',2,true),glyph('chevron',2,false),glyph('chevron',2,false)],removed:false};
      for(const n of a.nodes)g.add(n);
    }
    a.time=0; a.life=life; a.kind=kind; a.size=clamp(size,.25,2.5); a.removed=false; a.g.visible=true;
    const idx=kind==='guards'||kind==='guard'?4:kind==='level'||kind==='upgrade'||kind==='evolve'?5:kind==='pickup'||kind==='heal'?6:kind==='dot'||kind==='parasitic'||kind==='charge'?3:kind==='tough'||kind==='haste'?7:kind==='frenzy'?4:2;
    a.color=idx; a.g.rotation.set(0,0,0); a.g.position.set(0,0,0); a.g.scale.setScalar(1);
    const groundShape=kind==='parasitic'?'roots':'ring';
    a.nodes[0].userData.fill.geometry=geometry[groundShape];
    a.nodes[0].userData.ink.geometry=geometry[groundShape];
    a.nodes[1].userData.fill.geometry=geometry[kind==='parasitic'?'tendril':kind==='heal'?'cross':kind==='tough'?'shield':kind==='pickup'||kind==='dot'?'diamond':kind==='evolve'||kind==='level'?'star':'chevron'];
    a.nodes[2].userData.fill.geometry=geometry[kind==='parasitic'?'tendril':'chevron'];
    for(const n of a.nodes){n.visible=true;paint(n,idx,0);}
    holder.add(a.g); auras.add(a); updateAura(a,0); return a;
  }
  function updateAura(a,dt) {
    if(!a||a.removed||stats.disposed)return;
    a.time+=clamp(finite(dt),0,.1); const h=H*a.size, n=a.nodes, t=a.time, motion=reducedMotion?0:1;
    const pickup=a.kind==='pickup', charged=a.kind==='charge', hostile=a.kind==='guard'||a.kind==='guards', parasitic=a.kind==='parasitic';
    ground(n[0],h*.028); scale(n[0],h*(pickup?.5:charged?.8:.68)); n[0].rotation.z=t*(hostile?-.18:.16)*motion;
    for(let i=1;i<3;i++) {
      const phase=t*(charged?1.8:.85)*motion+(i-1)*Math.PI, r=h*(pickup?.11:.27);
      n[i].position.set(Math.cos(phase)*r,h*(pickup?.45:hostile?.13:.2)+Math.sin(t*2+phase)*h*.025*motion,Math.sin(phase)*r);
      n[i].rotation.set(-.65,0,pickup?phase*.4:phase+Math.PI/2); scale(n[i],h*(pickup?.18:.13),h*(charged?.21:.16));
      if(parasitic){n[i].position.y=h*.14;n[i].rotation.set(-.35,phase,Math.sin(t*1.5+phase)*.18*motion);scale(n[i],h*.23,h*.37);}
    }
    // Crowd auras use four draw calls and stay below the knee; special status symbols rise slightly.
    if(a.kind==='heal'||a.kind==='level'||a.kind==='evolve'||a.kind==='tough')n[1].position.y=h*.65;
  }
  function removeAura(a) {
    if(!a||a.removed)return; a.removed=true; a.g.removeFromParent(); a.g.visible=false; auras.delete(a);
    if(auraPool.length<96)auraPool.push(a);
  }
  function projectile(x,y,z,color=0xb85cff) {
    const idx=colorIndex(color), m=new T.Mesh(geometry.projectileCore.clone(),mat(1).clone());
    m.name='Comic plasma comet'; m.position.set(finite(x),finite(y),finite(z)); m.renderOrder=25;
    const shell=new T.Mesh(geometry.projectileShell,mat(idx,1));shell.renderOrder=23;m.add(shell);
    const rim=new T.Mesh(geometry.projectileShell,mat(2,2));rim.scale.setScalar(1.17);rim.renderOrder=22;m.add(rim);
    const tail=new T.Mesh(geometry.cometTail,mat(2,1));tail.position.z=-H*.82;tail.renderOrder=20;m.add(tail);
    const tailCore=new T.Mesh(geometry.cometTail,mat(1,1));tailCore.scale.set(.3,.3,.62);tailCore.position.z=-H*.52;tailCore.renderOrder=21;m.add(tailCore);
    const chevrons=[];
    for(let i=0;i<3;i++){const g=glyph('chevron',3,false);g.scale.setScalar(H*.15);m.add(g);chevrons.push(g);}
    m.userData.comicProjectile={time:0,chevrons,shell,rim,tail,tailCore}; updateProjectile(m,0,0,1,0); return m;
  }
  const projectileForward=new T.Vector3(0,0,1),projectileVelocity=new T.Vector3();
  function updateProjectile(m,dt,dx=0,dz=1,dy=0) {
    const data=m&&m.userData.comicProjectile; if(!data)return;
    data.time+=clamp(finite(dt),0,.1); const a=data.time*(reducedMotion?0:4.5);
    projectileVelocity.set(finite(dx),finite(dy),finite(dz));
    if(projectileVelocity.lengthSq()>1e-10)m.quaternion.setFromUnitVectors(projectileForward,projectileVelocity.normalize());
    data.shell.rotation.z=a*.35;data.rim.rotation.z=-a*.2;data.tail.scale.set(1+Math.sin(a*1.7)*.08,1+Math.sin(a*1.7)*.08,1);
    for(let i=0;i<3;i++){
      const g=data.chevrons[i], phase=a+i*TAU/3, r=H*.33;
      g.position.set(Math.cos(phase)*r,Math.sin(phase)*r,-H*.19);g.rotation.set(0,0,phase+Math.PI/2);
    }
  }
  function update(dt,{pauseAirDrops=false}={}) {
    if(stats.disposed)return; dt=clamp(finite(dt),0,.1); elapsed+=dt;
    if(pauseAirDrops)for(const p of pendingImpacts)p.at+=dt;
    for(let i=active.length-1;i>=0;i--){const e=active[i];if(!e||pauseAirDrops&&e.kind==='airDrop')continue;e.age+=dt;
      if(e.kind==='airDrop'&&!e.impacted&&e.age>=e.impactAt){e.impacted=true;const onImpact=e.onImpact;e.onImpact=null;if(onImpact)onImpact(e.g.position.x,e.g.position.y,e.g.position.z);}
      if(e.age>=e.life)release(e);else animate(e);}
    if(!pauseAirDrops)for(let i=pendingImpacts.length-1;i>=0;i--){const p=pendingImpacts[i];if(p&&p.at<=elapsed){pendingImpacts.splice(i,1);p.callback(p.x,p.y,p.z);}}
  }
  function clear(dispose=false) {
    for(let i=active.length-1;i>=0;i--)release(active[i],true);
    pendingImpacts.length=0;
    for(const a of Array.from(auras))removeAura(a);
    if(dispose&&!stats.disposed){for(const g of ownedGeometry)g.dispose();for(const m of ownedMaterial)m.dispose();pools.clear();pooledCount=0;auraPool.length=0;root.removeFromParent();stats.disposed=true;}
  }
  function diagnostics() {
    let pooled=0;for(const p of pools.values())pooled+=p.length;
    return {style:'pastel ink / segmented polygons',active:active.length,limit:LIMIT,pooled,auras:auras.size,auraPool:auraPool.length,
      geometries:ownedGeometry.length,materials:ownedMaterial.length,time:elapsed,airDropHeight:AIR_DROP_HEIGHT,airDropFlight:AIR_DROP_FLIGHT,pendingImpactCallbacks:pendingImpacts.length,projectileForward:'+Z',...stats};
  }
  return {burst,wave,melee,shot,pulse,airDrop,powerImpact,aura,removeAura,updateAura,projectile,updateProjectile,update,clear,dispose:()=>clear(true),diagnostics};
}

/* Camera-ray aiming, straight infection needles and empowered ballistic movement. */
const __comicObstacleBounds=new WeakMap();
function comicProjectileBlocked(T,world,x,y,z,r=.18){
 if(typeof world.cameraBlocked==='function')return !!world.cameraBlocked(x,y,z,r);
 const obstacles=world.obstacles||world.destructibles||[];
 for(const o of obstacles){
  if(o.dead||!Number.isFinite(o.x)||!Number.isFinite(o.z))continue;
  if(Math.abs(x-o.x)>o.w/2+r||Math.abs(z-o.z)>o.d/2+r)continue;
  let b=__comicObstacleBounds.get(o);
  if(!b){
   if(o.g?.isObject3D){o.g.updateWorldMatrix(true,true);b=new T.Box3().setFromObject(o.g);}
   else {const h=world.heightAt(o.x,o.z);const base=Number.isFinite(h)&&h>-2?h:0;b={min:{y:base},max:{y:base+(o.h||3)}};}
   __comicObstacleBounds.set(o,b);
  }
  if(y+r>=b.min.y&&y-r<=b.max.y)return true;
 }
 return false;
}
function resolveComicAim(T,camera,muzzle,{world,units=[],boss=null,range=28,bodyHeight=.935,flyers=[]}={}){
 camera.updateMatrixWorld(true);
 const origin=camera.getWorldPosition(new T.Vector3()),direction=camera.getWorldDirection(new T.Vector3()).normalize();
 const ray=new T.Ray(origin,direction),point=new T.Vector3(),delta=new T.Vector3();
 const maxRange=Math.max(1,Math.min(60,range));
 const maxDistance=Math.min(120,origin.distanceTo(muzzle)+maxRange/Math.max(.2,Math.hypot(direction.x,direction.z)));
 let distance=maxDistance,kind='range';
 for(let t=.12;t<=maxDistance;t+=.16){
  ray.at(t,point);delta.copy(point).sub(muzzle);
  if(delta.dot(direction)<.15||delta.x*direction.x+delta.z*direction.z<=1e-6)continue;
  if(Math.hypot(delta.x,delta.z)>=maxRange){distance=t;break;}
  const ground=world.heightAt(point.x,point.z);
  if(Number.isFinite(ground)&&ground>-2&&point.y<=ground+.2){distance=t;kind='ground';break;}
  if(comicProjectileBlocked(T,world,point.x,point.y,point.z,.06)){distance=t;kind='obstacle';break;}
 }
 function consider(center,radius,hitKind){
  const hit=ray.intersectSphere(new T.Sphere(center,radius),new T.Vector3());if(!hit)return;
  delta.copy(hit).sub(muzzle);const t=hit.distanceTo(origin);
  if(delta.dot(direction)>.15&&delta.x*direction.x+delta.z*direction.z>1e-6&&Math.hypot(delta.x,delta.z)<=maxRange+.2&&t<distance){distance=t;kind=hitKind;}
 }
 for(const u of units){
  if(u.dead||u.converted||u.kind==='corpse')continue;
  consider(new T.Vector3(u.x,world.heightAt(u.x,u.z)+bodyHeight*.62,u.z),bodyHeight*.36,'unit');
 }
 if(boss?.active&&!boss.dead)consider(new T.Vector3(boss.x,(boss.root?.position.y||0)+3.4,boss.z),3.4,'boss');
 for(const flyer of flyers)if(flyer)consider(new T.Vector3(flyer.x,flyer.y,flyer.z),flyer.radius||2.6,'flyer');
 const target=ray.at(distance,new T.Vector3());
 // A near-camera obstruction behind the muzzle must never launch a shot backwards.
 delta.copy(target).sub(muzzle);
 if(delta.dot(direction)<.12||delta.x*direction.x+delta.z*direction.z<=1e-6)target.copy(muzzle).addScaledVector(direction,Math.max(1,maxRange*.5));
 return {target,direction,kind};
}
function launchComicBallistic(T,origin,target,speed=14,gravity=8.5){
 const d=new T.Vector3().subVectors(target,origin),horizontal=Math.hypot(d.x,d.z);
 const flightTime=Math.max(.075,horizontal/Math.max(1,Number.isFinite(speed)?speed:14));
 return {vx:d.x/flightTime,vz:d.z/flightTime,vy:d.y/flightTime+.5*gravity*flightTime,flightTime};
}
function stepComicBallistic(T,b,dt,world,onImpact){
 if(b.comicImpacted)return true;
 dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
 const count=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy,b.vz)*dt/.13)),h=dt/count;
 for(let i=0;i<count;i++){
  const x=b.x+b.vx*h,z=b.z+b.vz*h,y=b.y+b.vy*h-4.25*h*h,nextVy=b.vy-8.5*h;
  const ground=world.heightAt(x,z),groundHit=Number.isFinite(ground)&&ground>-2&&y<=ground+.24;
  const wallHit=comicProjectileBlocked(T,world,x,y,z,.2);
  if(groundHit||wallHit){
   if(!wallHit){b.x=x;b.z=z;b.y=ground+.24;}
   b.vy=nextVy;b.comicImpacted=true;b.life=0;b.m?.position.set(b.x,b.y,b.z);onImpact?.(b);return true;
  }
  b.x=x;b.y=y;b.z=z;b.vy=nextVy;
 }
 b.m?.position.set(b.x,b.y,b.z);return false;
}
function stepComicNeedle(T,b,dt,world,{units=[],boss=null,bodyHeight=.935,onUnit,onBoss,onTerrain}={}){
 if(b.life<=0)return;
 dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
 const velocity=new T.Vector3(b.vx,b.vy||0,b.vz),speed=velocity.length();if(!speed||!dt)return;
 const direction=velocity.clone().normalize(),count=Math.max(1,Math.ceil(speed*dt/.13)),step=dt/count;
 const start=new T.Vector3(),end=new T.Vector3(),hit=new T.Vector3(),terrainPoint=new T.Vector3(),box=new T.Box3(),ray=new T.Ray(),radius=bodyHeight*.28;
 b.hitIds||=new Set();
 for(let i=0;i<count&&b.life>0;i++){
  start.set(b.x,b.y,b.z);end.copy(start).addScaledVector(velocity,step);ray.set(start,direction);const length=start.distanceTo(end),contacts=[];
  let terrainDistance=Infinity;
  for(let sample=1;sample<=4;sample++){
   terrainPoint.copy(start).lerp(end,sample/4);const floor=world.heightAt(terrainPoint.x,terrainPoint.z);
   if(comicProjectileBlocked(T,world,terrainPoint.x,terrainPoint.y,terrainPoint.z,.035)||Number.isFinite(floor)&&floor>-2&&terrainPoint.y<=floor+.035){terrainDistance=start.distanceTo(terrainPoint);break;}
  }
  for(const u of units){
   if(u.dead||u.converted||u.kind==='corpse'||b.hitIds.has(u.id))continue;
   if(u.x<Math.min(start.x,end.x)-radius||u.x>Math.max(start.x,end.x)+radius||u.z<Math.min(start.z,end.z)-radius||u.z>Math.max(start.z,end.z)+radius)continue;
   const floor=world.heightAt(u.x,u.z);box.min.set(u.x-radius,floor-.05,u.z-radius);box.max.set(u.x+radius,floor+bodyHeight*1.15,u.z+radius);
   if(ray.intersectBox(box,hit)){const distance=start.distanceTo(hit);if(distance<=length+1e-8)contacts.push({u,distance,point:hit.clone()});}
  }
  if(boss?.active&&!boss.dead&&!b.hitIds.has('boss')){
   const floor=boss.root?.position.y||0;box.min.set(boss.x-3.4,floor-.2,boss.z-3.4);box.max.set(boss.x+3.4,floor+10.5,boss.z+3.4);
   if(ray.intersectBox(box,hit)){const distance=start.distanceTo(hit);if(distance<=length+1e-8)contacts.push({boss:true,distance,point:hit.clone()});}
  }
  contacts.sort((a,c)=>a.distance-c.distance);
  for(const contact of contacts){
   if(contact.distance>=terrainDistance)break;
   b.x=contact.point.x;b.y=contact.point.y;b.z=contact.point.z;b.hitIds.add(contact.boss?'boss':contact.u.id);
   if(contact.boss)onBoss?.(boss,b);else onUnit?.(contact.u,b);
   if((b.pierce||0)>0)b.pierce--;else{b.life=0;break;}
  }
  if(b.life<=0)break;
  if(terrainDistance<Infinity){b.x=terrainPoint.x;b.y=terrainPoint.y;b.z=terrainPoint.z;b.life=0;onTerrain?.(b);break;}
  b.x=end.x;b.y=end.y;b.z=end.z;
 }
 b.m?.position.set(b.x,b.y,b.z);
}

/* Compact HUD for the existing ten-completion blood-tide rule. */
function getComicFleshProgress(state){
 const level=Math.max(0,state?.abilities?.frenzy||0),unlocked=level>=3;
 const total=Math.max(0,Math.floor(Number(state?.personalFrenzy)||0)),goal=10;
 const current=unlocked?(state?.tideReady>0?goal:total%goal):0;
 return{visible:level>0,unlocked,level,current,goal,remaining:goal-current,total,bonusHp:Math.max(0,Number(state?.frenzyHp)||0)};
}
function createFleshProgressHUD(doc,getState){
 let element=null,bar=null,count=null,hint=null,segments=[],lastKey='',burstState=null,burstUntil=-1;
 function ensure(){
  if(element)return true;
  const host=doc?.querySelector?.('.xpPanel > div:last-child');
  if(!host)return false;
  element=doc.createElement('section');element.id='fleshProgress';element.hidden=true;
  element.innerHTML='<div class="fleshHeading"><strong>血肉畸变</strong><span data-flesh-count></span></div><div class="fleshTrack" data-flesh-track role="progressbar" aria-label="血潮积累进度" aria-valuemin="0" aria-valuemax="10">'+Array(10).fill('<i aria-hidden="true"></i>').join('')+'</div><small data-flesh-hint></small>';
  count=element.querySelector('[data-flesh-count]');hint=element.querySelector('[data-flesh-hint]');bar=element.querySelector('[data-flesh-track]');segments=[...bar.children];host.append(element);
  if(!doc.getElementById('fleshProgressStyle')){
   const style=doc.createElement('style');style.id='fleshProgressStyle';style.textContent=FLESH_PROGRESS_CSS;doc.head.append(style);
  }
  return true;
 }
 function noteBurst(state){burstState=state;burstUntil=(state.time||0)+1.1;lastKey='';}
 function update(){
  const state=getState(),model=getComicFleshProgress(state);
  if(!ensure())return model;
  const bursting=state===burstState&&(state.time||0)<burstUntil;
  const key=[model.visible,model.unlocked,model.level,model.current,model.bonusHp,bursting].join(':');
  if(key===lastKey)return model;lastKey=key;element.hidden=!model.visible;
  element.classList.toggle('fleshLocked',!model.unlocked);element.classList.toggle('fleshReleased',bursting);
  count.textContent=model.unlocked?'血潮 '+model.current+' / '+model.goal:'Lv.3 解锁';
  bar.setAttribute('aria-valuenow',String(model.current));
  const text=!model.unlocked?'生命成长 +'+model.bonusHp+' · 狂杀 Lv.3 解锁血潮':bursting?'血潮已释放 · 继续积累':model.current===model.goal?'血潮已就绪':'再击杀或同化 '+model.remaining+' 个单位';
  hint.textContent=text;bar.setAttribute('aria-valuetext',text);
  for(let i=0;i<segments.length;i++)segments[i].classList.toggle('filled',i<model.current);
  return model;
 }
 return{update,noteBurst,snapshot:()=>getComicFleshProgress(getState())};
}
const FLESH_PROGRESS_CSS=`
#fleshProgress{margin-top:9px;padding-top:8px;border-top:1px solid #fff2;min-width:0;color:#fff4d7;pointer-events:none}
#fleshProgress[hidden]{display:none}
#fleshProgress .fleshHeading{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:10px;line-height:15px;letter-spacing:.3px}
#fleshProgress .fleshHeading strong{font-size:10px;color:#e3c2ff;white-space:nowrap}
#fleshProgress [data-flesh-count]{font-size:10px;font-weight:800;white-space:nowrap;color:#d7ff59;font-variant-numeric:tabular-nums}
#fleshProgress .fleshTrack{display:flex;gap:3px;margin:6px 0 5px;height:6px}
#fleshProgress .fleshTrack i{flex:1;min-width:0;height:100%;border-radius:2px;background:#fff2}
#fleshProgress .fleshTrack i.filled{background:#c48aff;box-shadow:0 0 0 1px #e8d0ff33}
#fleshProgress [data-flesh-hint]{display:block;color:#d0bfdc;font-size:9px;line-height:13px;letter-spacing:0;white-space:normal}
#fleshProgress.fleshLocked [data-flesh-count]{color:#bcadca}
#fleshProgress.fleshReleased [data-flesh-hint]{color:#d7ff59}
@media(max-width:760px){#fleshProgress{margin-top:7px;padding-top:6px}#fleshProgress .fleshHeading{font-size:9px}#fleshProgress .fleshTrack{gap:2px}}
@media(prefers-reduced-motion:reduce){#fleshProgress *{animation:none;transition:none}}
`;


export {createComicAbilityFX,resolveComicAim,launchComicBallistic,stepComicBallistic,stepComicNeedle,getComicFleshProgress,createFleshProgressHUD};
