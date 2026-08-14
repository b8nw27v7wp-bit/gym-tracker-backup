App({
  onLaunch: function () {
    // 初始化数据层
    var store = require('./utils/store');
    store.ensureInit();

    // 自动登录检查（本地用户信息 30 天过期后清除）
    this.checkAutoLogin(store);
  },

  // 检查自动登录状态
  // 本项目为纯本地工具，无后端消费 code，无需 wx.login
  checkAutoLogin: function (store) {
    var loginStatus = store.getLoginStatus();

    if (loginStatus.isLoggedIn && !loginStatus.isValid) {
      // 登录已过期（超 30 天），清除用户信息
      store.clearWxUser();
    }
    // 未登录或登录有效：不做操作，等用户主动设置
  }
});
