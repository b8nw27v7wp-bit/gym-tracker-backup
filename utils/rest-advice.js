// 组间休息推荐（v3.1）：热身组推荐 60s，正式组推荐 90s
// 纯函数模块，无 wx 依赖 → node 可单测
// 规则：刚记录的一组是热身组（isWarmup === true）→ 60s（热身休息短）；正式组 → 90s

var REST_WARMUP = 60; // 热身组推荐休息（秒）
var REST_WORK = 90;   // 正式组推荐休息（秒）

// 按组类型返回推荐休息秒数；非热身（含 falsy/缺省）按正式组处理
function recommendedRestSecs(isWarmup) {
  return !!isWarmup ? REST_WARMUP : REST_WORK;
}

// 推荐信息（供休息快捷区高亮 + "推荐"标识）
// 返回 { secs, isWarmup, label, recommended }
function restAdvice(isWarmup) {
  var warmup = !!isWarmup;
  return {
    secs: warmup ? REST_WARMUP : REST_WORK,
    isWarmup: warmup,
    label: warmup ? '热身组' : '正式组',
    recommended: true
  };
}

module.exports = {
  REST_WARMUP: REST_WARMUP,
  REST_WORK: REST_WORK,
  recommendedRestSecs: recommendedRestSecs,
  restAdvice: restAdvice
};
