// 隐私接口巡检专项（v2.29）
// 防"未声明隐私接口混入"（真机拦截 + 拒审主因），同时守住"纯本地、无网络"的产品承诺：
//   ① 声明表全覆盖：代码中出现的每个隐私接口必须在声明表内（对照 release-checklist 阶段 4）
//   ② 高危/网络接口零容忍：wx.request/上传下载/定位/相册选择等一律 FAIL
//   ③ 未知 wx.* 接口守门：不在白名单且不在声明表的新接口 → FAIL（逼出隐私评估）
//   ④ 声明表不腐化：声明了但代码已不用的接口 → FAIL（提示同步删除声明）
//   ⑤ 隐私说明页存在且已注册 app.json；release-checklist 声明清单与代码一致
// 用法: node scripts/verify-privacy-decls.js（项目根目录）
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function check(cond, name, extra) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name + (extra ? '（' + extra + '）' : '')); }
}

// 白名单：非隐私、无需声明的 wx.* 接口（本地存储/导航/UI/本地文件/震动等）
const ALLOWED = [
  'getStorageSync', 'setStorageSync', 'removeStorageSync', 'getStorageInfoSync',
  'navigateTo', 'navigateBack', 'redirectTo', 'switchTab', 'nextTick',
  'showToast', 'hideToast', 'showModal', 'showLoading', 'hideLoading',
  'setNavigationBarTitle', 'vibrateShort', 'vibrateLong',
  'createSelectorQuery', 'canvasToTempFilePath', 'getFileSystemManager',
  'openDocument', 'openSetting', 'shareFileMessage', 'hideKeyboard'
];

// 声明表：隐私接口 → 用途（必须与小程序后台「用户隐私保护指引」逐条一致）
const DECLARED = [
  { id: 'wx.getClipboardData', re: /wx\.getClipboardData\s*\(/g, purpose: '导入备份读取剪贴板' },
  { id: 'wx.setClipboardData', re: /wx\.setClipboardData\s*\(/g, purpose: '导出备份写入剪贴板' },
  { id: 'wx.saveImageToPhotosAlbum', re: /wx\.saveImageToPhotosAlbum\s*\(/g, purpose: '分享卡片保存相册' },
  { id: 'wx.requestSubscribeMessage', re: /wx\.requestSubscribeMessage\s*\(/g, purpose: '训练日提醒订阅消息（可选）' },
  { id: 'wx.getSystemInfoSync', re: /wx\.getSystemInfoSync\s*\(/g, purpose: '设备信息（canvas 高清绘图 dpr）' }
];

// WXML 隐私能力（头像/昵称组件）
const WXML_DECLARED = [
  { id: 'open-type="chooseAvatar"', re: /open-type=["']chooseAvatar["']/g, purpose: '头像选择（本机展示）' },
  { id: 'type="nickname"', re: /type=["']nickname["']/g, purpose: '昵称输入（本机展示）' }
];

// 高危/网络接口：本项目为纯本地工具，出现即 FAIL（且均需额外隐私声明）
const FORBIDDEN = [
  ['wx.request', /wx\.request\s*\(/g, '网络请求——纯本地工具禁止联网'],
  ['wx.uploadFile', /wx\.uploadFile\s*\(/g, '文件上传'],
  ['wx.downloadFile', /wx\.downloadFile\s*\(/g, '文件下载'],
  ['wx.connectSocket', /wx\.connectSocket\s*\(/g, 'WebSocket 连接'],
  ['wx.getLocation', /wx\.getLocation\s*\(/g, '地理位置'],
  ['wx.chooseLocation', /wx\.chooseLocation\s*\(/g, '位置选择'],
  ['wx.chooseAddress', /wx\.chooseAddress\s*\(/g, '收货地址'],
  ['wx.chooseImage', /wx\.chooseImage\s*\(/g, '相册/相机选择'],
  ['wx.chooseMedia', /wx\.chooseMedia\s*\(/g, '媒体选择'],
  ['wx.startRecord', /wx\.startRecord\s*\(/g, '录音'],
  ['wx.getUserProfile', /wx\.getUserProfile\s*\(/g, '用户资料（已废弃接口）'],
  ['wx.getUserInfo', /wx\.getUserInfo\s*\(/g, '用户信息（已废弃接口）'],
  ['wx.getPhoneNumber', /wx\.getPhoneNumber\s*\(/g, '手机号'],
  ['wx.navigateToMiniProgram', /wx\.navigateToMiniProgram\s*\(/g, '跳转其他小程序'],
  ['wx.openBluetoothAdapter', /wx\.openBluetoothAdapter\s*\(/g, '蓝牙']
];

// ---------- 扫描 ----------
function walk(dir, exts, out) {
  fs.readdirSync(dir).forEach(function (f) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { walk(p, exts, out); return; }
    if (exts.some(function (e) { return f.endsWith(e); })) out.push(p);
  });
  return out;
}
const jsFiles = ['app.js'].filter(fs.existsSync);
['utils', 'pages', 'components', 'custom-tab-bar'].forEach(function (d) {
  if (fs.existsSync(d)) walk(d, ['.js'], jsFiles);
});
const wxmlFiles = walk('.', ['.wxml'], []);

function countMatches(files, re) {
  let total = 0; const hits = [];
  files.forEach(function (f) {
    let src;
    try { src = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
    const m = src.match(re);
    if (m) { total += m.length; hits.push(f + '×' + m.length); }
  });
  return { total: total, hits: hits };
}

console.log('1. 声明表全覆盖（代码中的隐私接口均已登记）');
DECLARED.forEach(function (d) {
  const r = countMatches(jsFiles, d.re);
  check(r.total > 0, d.id + ' 在用且已声明（' + r.total + ' 处：' + d.purpose + '）', r.total === 0 ? '声明表登记了但代码未使用——请同步删除声明或恢复使用' : '');
});
WXML_DECLARED.forEach(function (d) {
  const r = countMatches(wxmlFiles, d.re);
  check(r.total > 0, d.id + ' 在用且已声明（' + r.total + ' 处：' + d.purpose + '）', r.total === 0 ? '声明表登记了但代码未使用' : '');
});

console.log('2. 高危/网络接口零容忍');
FORBIDDEN.forEach(function (f) {
  const r = countMatches(jsFiles, f[1]);
  check(r.total === 0, f[0] + ' 未使用（' + f[2] + '）', r.total > 0 ? '发现 ' + r.total + ' 处: ' + r.hits.join(', ') : '');
});

console.log('3. 未知 wx.* 接口守门（新接口必须先做隐私评估）');
const known = {};
ALLOWED.forEach(function (a) { known[a] = true; });
DECLARED.forEach(function (d) { known[d.id.replace(/^wx\./, '')] = true; });
let unknown = [];
jsFiles.forEach(function (f) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
  const reAll = /wx\.([a-zA-Z]+)\s*\(/g;
  let m;
  while ((m = reAll.exec(src))) {
    const name = m[1];
    if (!Object.prototype.hasOwnProperty.call(known, name)) {
      unknown.push(f + ': wx.' + name);
    }
  }
});
check(unknown.length === 0, '全部 wx.* 调用均在白名单/声明表内（' + jsFiles.length + ' 个 js 文件）', unknown.length ? unknown.join('; ') : '');

console.log('4. 隐私说明页与发布文档一致性');
check(fs.existsSync('pages/privacy/privacy.wxml'), 'pages/privacy 隐私说明页存在');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
check(appJson.pages.indexOf('pages/privacy/privacy') >= 0, '隐私说明页已注册 app.json');
const releaseDoc = fs.readFileSync('doc/release-checklist.md', 'utf8');
let docMiss = [];
DECLARED.forEach(function (d) {
  if (releaseDoc.indexOf(d.id) < 0) docMiss.push(d.id);
});
if (releaseDoc.indexOf('chooseAvatar') < 0) docMiss.push('chooseAvatar');
check(docMiss.length === 0, 'release-checklist 声明清单覆盖全部在用隐私接口', docMiss.length ? '文档缺: ' + docMiss.join(', ') : '');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
