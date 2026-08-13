App({
  onLaunch: function () {
    // 初始化数据层
    var store = require('./utils/store');
    store.ensureInit();

    // 自动登录检查
    this.checkAutoLogin(store);
  },

  // 检查自动登录
  checkAutoLogin: function (store) {
    var loginStatus = store.getLoginStatus();

    if (loginStatus.isLoggedIn && loginStatus.isValid) {
      // 已登录且有效，静默刷新 code
      this.silentLogin(store);
    } else if (loginStatus.isLoggedIn && !loginStatus.isValid) {
      // 登录已过期，清除用户信息
      store.clearWxUser();
    }
    // 未登录不做任何操作，等用户主动登录
  },

  // 静默登录（不弹窗，只刷新 code）
  silentLogin: function (store) {
    wx.login({
      success: function (res) {
        if (res.code) {
          // 更新存储中的 code
          var wxUser = store.getWxUser();
          if (wxUser) {
            wxUser.code = res.code;
            store.setWxUser(wxUser);
          }
        }
      }
    });
  }
});
