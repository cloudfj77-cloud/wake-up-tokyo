import * as T from 'three';

function box(parent, w, h, d, color, x, y, z, glow = false) {
  const mat = new T.MeshStandardMaterial({
    color, roughness: glow ? .35 : .62, metalness: glow ? 0 : .45,
    emissive: glow ? color : 0, emissiveIntensity: glow ? .55 : 0, flatShading: true
  });
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function buildPistol() {
  const g = new T.Group();
  box(g, .09, .11, .28, 0x2a3038, 0, 0, .1);
  box(g, .07, .18, .09, 0x1b1e24, 0, -.12, -.02);
  box(g, .04, .04, .16, 0x4a515c, 0, .02, .28);
  box(g, .05, .05, .04, 0xb478f1, 0, .04, .04, true);
  return g;
}

function buildShotgun() {
  const g = new T.Group();
  box(g, .1, .1, .55, 0x3a2f28, 0, 0, .18);
  box(g, .12, .12, .12, 0x2a2420, 0, 0, -.12);
  box(g, .07, .2, .1, 0x241c18, 0, -.12, -.08);
  box(g, .04, .04, .22, 0x6a5a48, 0, .03, .42);
  return g;
}

function buildRifle() {
  const g = new T.Group();
  box(g, .08, .09, .62, 0x2d343c, 0, 0, .18);
  box(g, .07, .16, .18, 0x1c2228, 0, -.1, -.08);
  box(g, .11, .05, .2, 0x3e4650, 0, .06, -.02);
  box(g, .03, .03, .18, 0x8d6ad6, 0, .04, .48, true);
  return g;
}

function buildSniper() {
  const g = new T.Group();
  box(g, .07, .07, .82, 0x262b32, 0, 0, .22);
  box(g, .06, .18, .14, 0x171b20, 0, -.12, -.1);
  box(g, .05, .05, .22, 0x4b5560, 0, .08, .12);
  box(g, .04, .04, .08, 0xc9a46a, 0, .08, .22);
  return g;
}

function buildRpg() {
  const g = new T.Group();
  box(g, .16, .16, .7, 0x4a4036, 0, 0, .15);
  box(g, .2, .2, .12, 0x2f2a26, 0, 0, -.28);
  box(g, .1, .22, .12, 0x241f1c, 0, -.14, -.12);
  box(g, .08, .08, .16, 0xd07a3c, 0, 0, .52, true);
  return g;
}

const BUILDERS = {pistol: buildPistol, shotgun: buildShotgun, rifle: buildRifle, sniper: buildSniper, rpg: buildRpg};

export function createFirearms() {
  const root = new T.Group();
  const map = {};
  for (const [key, build] of Object.entries(BUILDERS)) {
    const g = build();
    g.visible = false;
    root.add(g);
    map[key] = g;
  }
  return {root, map};
}
