import * as T from 'three';

// Keep editable/exportable source meshes; render the same transforms in native Three batches.
//
// 这座城市有 882 个材质（811 个带贴图），按材质合批会生成约 900 个批次；渲染管线每帧要过
// 主画面 + 法线（描边）两趟，实测每帧 2600+ draw call、800 万+ 三角面 —— 卡顿的真因是
// draw call 和重复渲染，不是模型面数（模型本身 8.7 万个实例、约 210 万面，其中大多是
// 12 面的小块，简化几何没有意义）。
//
// 所以按距离和渲染趟分级：
//   主画面  近处 → 原批次完整几何；中景 → 无贴图包围盒代理（1 个 draw call）；雾吞掉后不画
//   法线趟  只渲染近距离 —— 远处描边本来就被雾吃掉，法线趟把远处的城市整片跳过，
//           省下整整一趟的几何与 draw call，还顺带实现了「远处没有描边」
// 菜单里雾被临时关掉（4000/5000），所有阈值随之失效、城市完整渲染，背景不会缺一块。
// 882 个材质里绝大多数渲染结果完全相同（同一张贴图、同一个颜色），按材质 uuid 分桶会白白多出
// 几百个批次 —— 每趟渲染都要为它们各发一次 draw call。改成按「渲染特征」分桶：
// 只要贴图、UV 变换、颜色、金属/粗糙度这些一致，就装进同一个批次，画出来没有区别。
function materialSignature(material) {
  const round = (v) => Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;
  const tex = (t) => t ? [t.uuid, t.repeat.x, t.repeat.y, t.offset.x, t.offset.y, t.wrapS, t.wrapT, t.flipY, t.rotation ?? 0].join(',') : '';
  return [
    tex(material.map), tex(material.normalMap), tex(material.emissiveMap), tex(material.alphaMap), tex(material.aoMap), tex(material.roughnessMap), tex(material.metalnessMap),
    material.color ? material.color.getHexString() : '',
    material.emissive ? material.emissive.getHexString() : '',
    round(material.metalness), round(material.roughness), round(material.opacity), round(material.alphaTest),
    material.side ?? 0, material.vertexColors ? 1 : 0, material.flatShading ? 1 : 0, material.transparent ? 1 : 0,
  ].join('|');
}

export function batchStaticScene(root, options = {}) {
  root.updateMatrixWorld(true);
  let sourceCount = 0, batchCount = 0;
  const items = [];
  const batches = [];   // {batch, main:主画面可见数, out:法线趟可见数}
  const proxies = [];
  const box = new T.BoxGeometry(1, 1, 1);
  const inverse = new T.Matrix4(), world = new T.Matrix4(), local = new T.Matrix4(), inst = new T.Matrix4(), placed = new T.Matrix4();
  const worldBox = new T.Box3(), localBox = new T.Box3(), size = new T.Vector3(), center = new T.Vector3();
  const identity = new T.Quaternion();
  const color = new T.Color();
  const fog = options.fog || null;
  const useLod = options.lod !== false;
  // LOD 起效距离 = 雾区间 × lodFactor；彻底不画 = 雾 far + cullPad；法线趟只画雾区间前 30%。
  const lodFactor = Number.isFinite(options.lodFactor) ? options.lodFactor : .35;
  const cullPad = Number.isFinite(options.cullPad) ? options.cullPad : 10;
  const outlineFactor = Number.isFinite(options.outlineFactor) ? options.outlineFactor : .3;

  for (const section of [...root.children]) {
    if (!section.visible) continue;
    const buckets = new Map();
    inverse.copy(section.matrixWorld).invert();
    const sources = [];
    section.traverse(o => {
      if (!o.isMesh || o.isBatchedMesh || !o.visible || Array.isArray(o.material) || o.material.transparent) return;
      sources.push(o);
      const attributes = Object.entries(o.geometry.attributes).map(([name, a]) => name + ':' + a.itemSize).sort().join(',');
      const key = materialSignature(o.material) + '|' + attributes + '|' + Boolean(o.geometry.index) + '|' + o.castShadow;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    });
    if (!sources.length) continue;
    const group = new T.Group(); group.name = 'Render_Batches_Exclude_From_Export'; section.add(group);

    let proxy = null, proxyGeometryId = -1, proxyEntry = null;
    if (useLod) {
      const total = sources.reduce((n, o) => n + (o.isInstancedMesh ? o.count : 1), 0);
      proxy = new T.BatchedMesh(Math.max(total, 1), 24, 36, new T.MeshStandardMaterial({ color: 0xffffff, roughness: .95, metalness: 0 }));
      proxy.name = 'Static_LOD_Proxy';
      proxy.sortObjects = false;
      proxyGeometryId = proxy.addGeometry(box);
      proxy.visible = false;
      group.add(proxy);
      proxyEntry = { batch: proxy, vis: 0 };
      proxies.push(proxyEntry);
    }

    for (const bucket of buckets.values()) {
      const geometries = new Map(); let vertices = 0, indices = 0, count = 0;
      for (const o of bucket) {
        count += o.isInstancedMesh ? o.count : 1;
        if (!geometries.has(o.geometry.uuid)) { geometries.set(o.geometry.uuid, { geometry: o.geometry }); vertices += o.geometry.attributes.position.count; indices += o.geometry.index?.count || 0; }
      }
      const batch = new T.BatchedMesh(count, vertices, indices, bucket[0].material);
      batch.name = 'Static_Material_Batch'; batch.sortObjects = false;
      // 静态城市不进阴影贴图：8.7 万个实例再走一趟阴影 pass，等于把整座城多画一遍（几百万三角面）。
      // 人物和载具照常投影，街上该有的影子还在。介意的话 ?staticshadow=1 恢复（帧率会掉回去）。
      batch.castShadow = options.shadow === true; batch.receiveShadow = true;
      group.add(batch); batchCount++;
      const entry = { batch, vis: 0 };
      batches.push(entry);
      for (const g of geometries.values()) g.id = batch.addGeometry(g.geometry);
      for (const o of bucket) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const geometryId = geometries.get(o.geometry.uuid).id;
        for (let i = 0; i < (o.isInstancedMesh ? o.count : 1); i++) {
          world.copy(o.matrixWorld);
          if (o.isInstancedMesh) { o.getMatrixAt(i, inst); world.multiply(inst); }
          local.multiplyMatrices(inverse, world);
          const id = batch.addInstance(geometryId);
          batch.setMatrixAt(id, local);
          if (o.instanceColor) { o.getColorAt(i, color); batch.setColorAt(id, color); }
          worldBox.copy(o.geometry.boundingBox).applyMatrix4(world);
          worldBox.getCenter(center);
          const radius = worldBox.getSize(size).length() * .5;
          let proxyId = -1;
          // 只有大件才值得做代理体：绝大多数实例本来就是 12 面的方块，套代理体不省面。
          const triangles = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
          if (proxy && triangles > 60) {
            localBox.copy(o.geometry.boundingBox).applyMatrix4(local);
            localBox.getSize(size);
            localBox.getCenter(center);
            proxyId = proxy.addInstance(proxyGeometryId);
            proxy.setVisibleAt(proxyId, false);
            placed.compose(center, identity, size.max(new T.Vector3(.05, .05, .05)).multiplyScalar(1.02));
            proxy.setMatrixAt(proxyId, placed);
            proxy.setColorAt(proxyId, o.material.color || color.set(0xffffff));
          }
          const tiny = radius < .6;
          items.push({
            batch, entry, id, proxy, proxyEntry, proxyId,
            center: worldBox.getCenter(new T.Vector3()), radius, tiny,
            main: 2, out: 2, actual: 2, inView: true,
          });
          entry.vis++;
          sourceCount++;
        }
        o.visible = false;
      }
      batch.computeBoundingBox(); batch.computeBoundingSphere();
    }
    if (proxy) { proxy.computeBoundingBox(); proxy.computeBoundingSphere(); }
  }
  root.updateMatrixWorld(true);

  // 两趟共用同一次距离计算：主画面那趟把每实例的距离缓存下来，法线趟直接复用（免二次开方）。
  let distanceCache = new Float32Array(0);
  let cacheValid = false;
  // 批次的包围球罩住整座城，视锥剔除对它们永远无效 —— 盯着墙看也要把 8.7 万个实例全画一遍。
  // 所以逐个实例做视锥测试：相机转了就重算，转身/贴墙时能省掉一大半三角面。
  const frustum = new T.Frustum(), projScreen = new T.Matrix4(), sphere = new T.Sphere();
  const lastProjection = new T.Matrix4();
  const lastQuaternion = new T.Quaternion(0, 0, 0, 0);
  let frustumReady = false, cameraSeen = false;
  function syncFrustum(camera) {
    if (!camera || !camera.isCamera) { frustumReady = false; return; }
    projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreen);
    frustumReady = true;
  }
  function cameraChanged(camera) {
    return !!camera?.isCamera && (!cameraSeen ||
      1 - Math.abs(camera.quaternion.dot(lastQuaternion)) > 4e-5 ||
      !camera.projectionMatrix.equals(lastProjection));
  }
  const lastPosition = new T.Vector3(Infinity, Infinity, Infinity);
  let lastNear, lastFar;

  function ranges() {
    // 菜单和开场里雾会被临时关掉（4000/5000），那时不能跟着雾走 —— 否则整座城都按满细节画，
    // 菜单实测只有 26 帧。给个回退区间：中景换代理体、极远才不画，城市天际线还在。
    const disabled = !fog || !Number.isFinite(fog.near) || fog.near > 500;
    const near = disabled ? 24 : fog.near, far = disabled ? 130 : fog.far;
    const span = far - near;
    const lodRange = Number.isFinite(options.lodMeters) ? options.lodMeters : near + span * lodFactor;
    const cullRange = Number.isFinite(options.cullMeters) ? options.cullMeters : far + cullPad;
    return {
      lod2: lodRange * lodRange,
      cull2: cullRange * cullRange,
      tiny2: (near + span * .85) ** 2,
      out2: Math.min(Number.isFinite(options.outlineMeters) ? options.outlineMeters : near + span * outlineFactor, lodRange) ** 2,
    };
  }

  function settle(item, state) {
    if (item.actual === state) return;
    if (item.actual === 2) { item.batch.setVisibleAt(item.id, false); item.entry.vis--; }
    else if (state === 2) { item.batch.setVisibleAt(item.id, true); item.entry.vis++; }
    if (item.proxy && item.proxyId >= 0) {
      const wantProxy = state === 1, hadProxy = item.actual === 1;
      if (wantProxy !== hadProxy) {
        item.proxy.setVisibleAt(item.proxyId, wantProxy);
        item.proxyEntry.vis += wantProxy ? 1 : -1;
      }
    }
    item.actual = state;
  }

  function updateDetailVisibility(position, camera) {
    syncFrustum(camera);
    // 相机位置或朝向变了才重算；没动就只结清状态差。
    const moved = lastPosition.distanceToSquared(position) > 4 || cameraChanged(camera) || fog?.near !== lastNear || fog?.far !== lastFar;
    const r = ranges();
    if (!cacheValid || moved) {
      if (distanceCache.length < items.length) distanceCache = new Float32Array(items.length);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Cull by the nearest surface so a large floor or wall cannot vanish under the player.
        const d2 = Math.max(0, position.distanceTo(item.center) - item.radius) ** 2;
        distanceCache[i] = d2;
        let state = d2 < r.lod2 ? 2 : d2 < (item.tiny ? r.tiny2 : r.cull2) ? (item.proxyId >= 0 ? 1 : 2) : 0;
        // 已经超出剔除距离的实例必然不画，不必再做视锥测试 —— 八成实例走的就是这条路。
        item.inView = state !== 0 && (!frustumReady || (sphere.center.copy(item.center), sphere.radius = item.radius, frustum.intersectsSphere(sphere)));
        if (!item.inView) state = 0;
        item.main = state;
        settle(item, state);
      }
      lastPosition.copy(position);
      if (camera?.isCamera) { cameraSeen = true; lastQuaternion.copy(camera.quaternion); lastProjection.copy(camera.projectionMatrix); }
      lastNear = fog?.near; lastFar = fog?.far;
      cacheValid = true;
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const state = item.main;
        item.main = state;
        settle(item, state);
      }
    }
    for (const e of batches) e.batch.visible = e.vis > 0;
    for (const e of proxies) e.batch.visible = e.vis > 0;
  }

  function updateOutlineVisibility(position) {
    if (!cacheValid) updateDetailVisibility(position);
    const r = ranges();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      settle(item, item.inView && distanceCache[i] < r.out2 ? 2 : 0);
    }
    for (const e of batches) e.batch.visible = e.vis > 0;
    for (const e of proxies) e.batch.visible = e.vis > 0;
  }
  return { sourceCount, batchCount, proxyBatches: proxies.length, updateDetailVisibility, updateOutlineVisibility };
}
