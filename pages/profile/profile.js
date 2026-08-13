// 个人中心页：微信登录 + 用户信息展示 + 授权处理
var store = require('../../utils/store');

Page({
  data: {
    wxUser: null,        // 微信用户信息 { nickName, avatarUrl }
    profile: null,       // 身体资料 { gender, age, heightCm, weightKg, activity }
    isLoggedIn: false,
    loginCode: '',       // wx.login 获取的 code
    authDenied: false,   // 用户是否拒绝过授权
    showAuthGuide: false // 是否显示授权引导
  },

  onLoad: function () {
    this.loadUserData();
    this.checkAuthStatus();
  },

  onShow: function () {
    this.loadUserData();
  },

  // 加载用户数据
  loadUserData: function () {
    var wxUser = store.getWxUser();
    var profile = store.getProfile();
    this.setData({
      wxUser: wxUser,
      profile: profile,
      isLoggedIn: !!wxUser
    });
  },

  // 检查授权状态
  checkAuthStatus: function () {
    var self = this;
    // 检查是否已经拒绝过授权
    var authDenied = wx.getStorageSync('gym_auth_denied') || false;
    self.setData({ authDenied: authDenied });

    // 如果已登录，尝试静默刷新登录状态
    if (self.data.isLoggedIn) {
      self.silentLogin();
    }
  },

  // 静默登录（不弹窗，只刷新 code）
  silentLogin: function () {
    var self = this;
    wx.login({
      success: function (res) {
        if (res.code) {
          self.setData({ loginCode: res.code });
          // 更新存储中的 code
          var wxUser = store.getWxUser();
          if (wxUser) {
            wxUser.code = res.code;
            store.setWxUser(wxUser);
          }
        }
      }
    });
  },

  // 微信登录
  onLogin: function () {
    var self = this;

    // 如果之前拒绝过授权，显示引导
    if (self.data.authDenied) {
      self.setData({ showAuthGuide: true });
      return;
    }

    wx.login({
      success: function (res) {
        if (res.code) {
          self.setData({ loginCode: res.code });
          self.getUserProfile();
        } else {
          wx.showToast({ title: '登录失败，请重试', icon: 'none' });
        }
      },
      fail: function () {
        wx.showToast({ title: '网络异常，请检查网络', icon: 'none' });
      }
    });
  },

  // 获取用户信息
  getUserProfile: function () {
    var self = this;
    wx.getUserProfile({
      desc: '用于展示用户头像和昵称',
      success: function (res) {
        var userInfo = res.userInfo;
        // 保存用户信息到本地
        store.setWxUser({
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          code: self.data.loginCode,
          loginTime: Date.now()
        });

        // 清除拒绝标记
        wx.removeStorageSync('gym_auth_denied');

        self.setData({
          wxUser: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          },
          isLoggedIn: true,
          authDenied: false,
          showAuthGuide: false
        });
        wx.showToast({ title: '登录成功', icon: 'success' });
      },
      fail: function (err) {
        // 用户拒绝授权
        if (err.errMsg && err.errMsg.indexOf('deny') >= 0 || err.errMsg.indexOf('cancel') >= 0) {
          wx.setStorageSync('gym_auth_denied', true);
          self.setData({ authDenied: true });
          wx.showToast({ title: '需要授权才能登录', icon: 'none' });
        } else {
          wx.showToast({ title: '获取用户信息失败', icon: 'none' });
        }
      }
    });
  },

  // 打开小程序设置页（引导用户手动开启授权）
  openSetting: function () {
    var self = this;
    wx.openSetting({
      success: function (res) {
        if (res.authSetting['scope.userInfo']) {
          // 用户在设置页开启了授权
          self.getUserProfile();
        }
      }
    });
    self.setData({ showAuthGuide: false });
  },

  // 关闭授权引导
  closeAuthGuide: function () {
    this.setData({ showAuthGuide: false });
  },

  // 退出登录
  onLogout: function () {
    var self = this;
    wx.showModal({
      title: '确认退出',
      content: '退出后用户信息将被清除',
      success: function (res) {
        if (res.confirm) {
          store.clearWxUser();
          self.setData({
            wxUser: null,
            isLoggedIn: false
          });
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  },

  // 跳转到身体资料编辑
  onEditProfile: function () {
    wx.navigateTo({ url: '/pages/calculator/calculator' });
  },

  // 跳转到数据管理
  onDataManage: function () {
    wx.navigateTo({ url: '/pages/data/data' });
  },

  // 跳转到隐私说明
  onPrivacy: function () {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  }
});
