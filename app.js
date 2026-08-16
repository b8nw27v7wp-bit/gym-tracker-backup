App({
  onLaunch: function () {
    // 初始化数据层
    var store = require('./utils/store');
    store.ensureInit();
  }
});
