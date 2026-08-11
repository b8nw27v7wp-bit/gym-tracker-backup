App({
  onLaunch() {
    // 初始化数据层
    const store = require('./utils/store');
    store.ensureInit();
  }
});
