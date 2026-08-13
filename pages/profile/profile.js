// 个人中心页：微信登录 + 用户信息展示
var store = require('../../utils/store');

Page({
  data: {
    wxUser: null,        // 微信用户信息 { nickName, avatarUrl }
    profile: null,       // 身体资料 { gender, age, heightCm, weightKg, activity }
    isLoggedIn: false,
    loginCode: ''        // wx.login 获取的 code
  },

  onLoad: function () {
    this.loadUserData();
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

  // 微信登录
  onLogin: function () {
    var self = this;
    wx.login({
      success: function (res) {
        if (res.code) {
          self.setData({ loginCode: res.code });
          // 获取用户信息需要用户授权
          // 使用 wx.getUserProfile 获取用户信息
          self.getUserProfile();
        } else {
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: function () {
        wx.showToast({ title: '登录失败', icon: 'none' });
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
          code: self.data.loginCode
        });
        self.setData({
          wxUser: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          },
          isLoggedIn: true
        });
        wx.showToast({ title: '登录成功', icon: 'success' });
      },
      fail: function () {
        wx.showToast({ title: '需要授权才能登录', icon: 'none' });
      }
    });
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
