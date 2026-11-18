# 原生工程处置记录

当前交付目标为 v0.3.76 的独立天工游戏；不再局限于早期咖啡店样板。

保留官方 Engine / Frontend 根插件装配、World / ECS、资源 GUID 导入、WebGPU 渲染、Rapier 物理及官方真实浏览器验收。模板展台、花瓶编辑器、模板角色和模板 HUD 已由游戏内容替换。

两张完整地图、原角色和动作、武器、规则与媒体均从验收版本复制转换。原文件不变。Three.js 只留在离线转换工具和历史 reference 对照中，不参与正式运行。具体转换记录见 source-provenance.json 与 tools/migrate-assets。

目录名 wake-up-tiangong-sample 沿用早期位置，当前活跃资源仅由 forge.json 的 assets/game、assets/ui、assets/imported/full 以及两个 roots 决定。旧 M1 源码不在活跃 roots 中，历史记录在 docs/history/m1。
