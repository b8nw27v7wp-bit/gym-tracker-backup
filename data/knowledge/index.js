// 知识库索引：合并全部文章 + 分类定义
var principles = require('./principles');
var plans = require('./plans');
var lifestyle = require('./lifestyle');
var advanced = require('./advanced');
var nsca = require('./nsca');

var ALL = principles.concat(plans, lifestyle, advanced, nsca);

var CATEGORIES = [
  { key: 'principles', name: '训练原理', icon: '🧠', desc: '渐进超负荷、容量强度、RM/RIR' },
  { key: 'plans', name: '分化计划', icon: '📋', desc: '全身 / 上下肢 / 推拉腿模板' },
  { key: 'nutrition', name: '营养饮食', icon: '🥗', desc: '蛋白质、热量、减脂' },
  { key: 'recovery', name: '恢复睡眠', icon: '😴', desc: '睡眠、频率、减量周' },
  { key: 'performance', name: '运动表现', icon: '🚀', desc: '能量系统、增强式、周期化、体能测试' },
  { key: 'glossary', name: '术语表', icon: '📖', desc: '健身黑话速查' }
];

function categoryName(key) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) return CATEGORIES[i].name;
  }
  return key;
}

function categoryIcon(key) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) return CATEGORIES[i].icon;
  }
  return '📄';
}

function getArticle(id) {
  for (var i = 0; i < ALL.length; i++) {
    if (ALL[i].id === id) return ALL[i];
  }
  return null;
}

module.exports = {
  ALL: ALL,
  CATEGORIES: CATEGORIES,
  categoryName: categoryName,
  categoryIcon: categoryIcon,
  getArticle: getArticle
};
