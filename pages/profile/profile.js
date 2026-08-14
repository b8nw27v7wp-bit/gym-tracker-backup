// 个人中心页：用户信息展示 + 头像昵称设置 + 身体资料 + 功能入口
// 注意：wx.getUserProfile 已废弃（2021年4月），现使用 open-type="chooseAvatar" + type="nickname"
var store = require('../../utils/store');

Page({
  data: {
    wxUser: null,           // 用户信息 { nickName, avatarUrl, loginTime }
    profile: null,          // 身体资料 { gender, age, heightCm, weightKg, activity }
    isLoggedIn: false,
    isEditing: false,       // 是否正在编辑用户信息
    editNickName: '',       // 编辑中的昵称
    editAvatarUrl: ''       // 编辑中的头像
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

  // ---------- 头像选择 ----------
  // 使用 open-type="chooseAvatar" 触发，返回临时头像路径
  onChooseAvatar: function (e) {
    var avatarUrl = e.detail.avatarUrl;
    if (!avatarUrl) return;

    // 如果已登录，直接更新头像
    if (this.data.isLoggedIn) {
      var wxUser = store.getWxUser();
      wxUser.avatarUrl = avatarUrl;
      store.setWxUser(wxUser);
      this.setData({
        'wxUser.avatarUrl': avatarUrl
      });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    } else {
      // 未登录，暂存头像，等待昵称输入后一起保存
      this.setData({
        editAvatarUrl: avatarUrl,
        isEditing: true
      });
    }
  },

  // ---------- 昵称输入 ----------
  // 使用 type="nickname" 触发，微信会提供昵称建议
  onNicknameInput: function (e) {
    this.setData({ editNickName: e.detail.value });
  },

  // 昵称输入完成（失去焦点）
  onNicknameBlur: function (e) {
    var nickName = e.detail.value;
    if (!nickName || nickName.trim().length === 0) return;

    // 如果已登录，直接更新昵称
    if (this.data.isLoggedIn) {
      var wxUser = store.getWxUser();
      wxUser.nickName = nickName.trim();
      store.setWxUser(wxUser);
      this.setData({
        'wxUser.nickName': nickName.trim()
      });
      wx.showToast({ title: '昵称已更新', icon: 'success' });
    }
  },

  // ---------- 登录/注册 ----------
  // 点击"保存"按钮，完成登录
  onSaveUser: function () {
    var nickName = this.data.editNickName || '';
    var avatarUrl = this.data.editAvatarUrl || this.data.defaultAvatar;

    // 验证昵称
    nickName = nickName.trim();
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (nickName.length > 20) {
      wx.showToast({ title: '昵称不能超过20个字', icon: 'none' });
      return;
    }

    // 保存用户信息
    var success = store.setWxUser({
      nickName: nickName,
      avatarUrl: avatarUrl,
      loginTime: Date.now()
    });

    if (success) {
      this.setData({
        wxUser: store.getWxUser(),
        isLoggedIn: true,
        isEditing: false,
        editNickName: '',
        editAvatarUrl: ''
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
    } else {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  // 取消编辑
  onCancelEdit: function () {
    this.setData({
      isEditing: false,
      editNickName: '',
      editAvatarUrl: ''
    });
  },

  // ---------- 退出登录 ----------
  onLogout: function () {
    var self = this;
    wx.showModal({
      title: '确认退出',
      content: '退出后用户信息将被清除',
      confirmText: '退出',
      confirmColor: '#ef4444',
      success: function (res) {
        if (res.confirm) {
          store.clearWxUser();
          self.setData({
            wxUser: null,
            isLoggedIn: false,
            isEditing: false
          });
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  },

  // ---------- 页面跳转 ----------
  // 跳转到身体资料编辑
  onEditProfile: function () {
    wx.navigateTo({ url: '/pages/calculator/calculator' });
  },

  // 跳转到数据管理
  onDataManage: function () {
    wx.navigateTo({ url: '/pages/data/data' });
  },

  // 跳转到数据导出
  onExport: function () {
    wx.navigateTo({ url: '/pages/export/export' });
  },

  // 跳转到隐私说明
  onPrivacy: function () {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 我的健身档案',
      path: '/pages/profile/profile'
    };
  }
});
