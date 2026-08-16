// 个人中心页：用户信息展示 + 头像昵称设置 + 身体资料 + 功能入口 + 应用设置（v5/v6）
// 注意：wx.getUserProfile 已废弃（2021年4月），现使用 open-type="chooseAvatar" + type="nickname"
var store = require('../../utils/store');

// 起飞🦌计时器专属昵称（v2.27.2）：仅昵称为该值的用户显示"起飞记录"卡片
var TAKEOFF_OWNER = '李鑫';
// 识别到专属用户时的提醒文案（v2.27.3）
var TAKEOFF_GREETING = '撸撸撸🦌🦌🦌';

// 订阅消息模板 ID：在小程序后台（mp.weixin.qq.com → 订阅消息）申请"训练计划提醒"类目模板后填入
// 未配置时 requestSubscribeMessage 会失败 → 自动降级为仅应用内提醒，不影响功能
var TRAIN_REMINDER_TEMPLATE_ID = '';

Page({
  data: {
    wxUser: null,           // 用户信息 { nickName, avatarUrl, loginTime }
    profile: null,          // 身体资料 { gender, age, heightCm, weightKg, activity }
    isLoggedIn: false,
    isEditing: false,       // 是否正在编辑用户信息
    editNickName: '',       // 编辑中的昵称
    editAvatarUrl: '',      // 编辑中的头像
    settings: { unit: 'kg', autoRest: true }, // 应用设置
    measurementCount: 0,    // 围度记录数
    showTakeoff: false,     // 起飞🦌专属卡片是否可见（昵称=李鑫）
    takeoffBanner: '',      // 专属欢迎横幅文案（识别到李鑫时显示）
    takeoff: { totalCount: 0, totalSec: 0, activeStart: null, lastSec: 0, lastEnd: 0 }, // 起飞统计
    takeoffText: '0秒',     // 当前飞行已持续（未飞行时为空）
    takeoffTotalText: '0秒', // 累计飞行时长
    takeoffLastText: '--'    // 上次单次飞行时长
  },

  onLoad: function () {
    this.loadUserData(true); // 首次进入：识别到专属用户时跳出提醒
  },

  onShow: function () {
    this.loadUserData();
  },

  onHide: function () {
    this.stopTakeoffTick();
  },

  onUnload: function () {
    this.stopTakeoffTick();
  },

  // 加载用户数据
  // firstShow=true 表示页面首次加载（触发"撸撸撸🦌🦌🦌"跳出提醒）
  loadUserData: function (firstShow) {
    var wxUser = store.getWxUser();
    var profile = store.getProfile();
    var isOwner = !!(wxUser && wxUser.nickName === TAKEOFF_OWNER);
    this.setData({
      wxUser: wxUser,
      profile: profile,
      isLoggedIn: !!wxUser,
      settings: store.getSettings(),
      measurementCount: store.getMeasurements().length,
      showTakeoff: isOwner,
      takeoffBanner: isOwner ? TAKEOFF_GREETING : ''
    });
    // 专属卡片可见时刷新起飞状态（含跨会话飞行中的恢复）
    if (isOwner) {
      this.refreshTakeoff();
      // 首次进入跳出专属提醒
      if (firstShow) {
        wx.showToast({ title: TAKEOFF_GREETING, icon: 'none' });
      }
    } else {
      this.stopTakeoffTick();
    }
  },

  // ---------- 起飞🦌计时器（李鑫专属，v2.27.2） ----------
  // 刷新起飞统计展示；飞行中启动每秒刷新 tick
  refreshTakeoff: function () {
    var t = store.getTakeoffStats();
    var text = '';
    if (t.activeStart) {
      text = store.formatTakeoffSec((Date.now() - t.activeStart) / 1000);
      this.startTakeoffTick();
    } else {
      this.stopTakeoffTick();
    }
    this.setData({
      takeoff: t,
      takeoffText: text,
      takeoffTotalText: store.formatTakeoffSec(t.totalSec),
      takeoffLastText: t.lastSec > 0 ? store.formatTakeoffSec(t.lastSec) : '--'
    });
  },

  startTakeoffTick: function () {
    if (this._takeoffTimer) return;
    var self = this;
    this._takeoffTimer = setInterval(function () {
      var t = store.getTakeoffStats();
      if (!t.activeStart) { self.stopTakeoffTick(); return; }
      self.setData({ takeoffText: store.formatTakeoffSec((Date.now() - t.activeStart) / 1000) });
    }, 1000);
  },

  stopTakeoffTick: function () {
    if (this._takeoffTimer) {
      clearInterval(this._takeoffTimer);
      this._takeoffTimer = null;
    }
  },

  // 起飞/落地按钮
  onTakeoffTap: function () {
    var t = store.getTakeoffStats();
    if (t.activeStart) {
      var r = store.stopTakeoff();
      if (r.ok) {
        this.refreshTakeoff();
        wx.showToast({ title: '🛬 落地！本次飞行 ' + store.formatTakeoffSec(r.sec), icon: 'none' });
      }
    } else {
      var s = store.startTakeoff();
      if (s.ok) {
        this.refreshTakeoff();
        wx.showToast({ title: '🛫 起飞！开始计时', icon: 'none' });
      } else {
        wx.showToast({ title: '起飞失败，请重试', icon: 'none' });
      }
    }
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
      this.loadUserData(); // 刷新用户信息 + 起飞🦌专属卡片可见性
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

  // 快速设置：未登录时进入编辑表单（输入昵称 + 选择头像后保存登录）
  onQuickLogin: function () {
    this.setData({ isEditing: true, editNickName: '', editAvatarUrl: '' });
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
          self.loadUserData(); // 退出后隐藏起飞🦌专属卡片
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

  // ---------- 应用设置（v5） ----------
  // 重量单位切换 kg/lb
  onToggleUnit: function () {
    var s = store.getSettings();
    s.unit = s.unit === 'lb' ? 'kg' : 'lb';
    store.saveSettings(s);
    this.setData({ settings: store.getSettings() });
    wx.showToast({ title: '重量单位：' + (s.unit === 'lb' ? '磅 (lb)' : '公斤 (kg)'), icon: 'none' });
  },

  // 组间休息自动开始开关
  onToggleAutoRest: function () {
    var s = store.getSettings();
    s.autoRest = !s.autoRest;
    store.saveSettings(s);
    this.setData({ settings: store.getSettings() });
    wx.showToast({ title: s.autoRest ? '已开启自动休息' : '已关闭自动休息', icon: 'none' });
  },

  // 训练日提醒开关（v6）
  // 应用内：开启后训练页/统计页显示"今日待练训练日"提醒条
  // 订阅消息：开启时请求 wx.requestSubscribeMessage 授权（真正推送需后端；模板未配置/拒绝时仅应用内提醒）
  onToggleReminder: function () {
    var s = store.getSettings();
    s.trainReminder = !s.trainReminder;
    store.saveSettings(s);
    this.setData({ settings: store.getSettings() });
    if (s.trainReminder) this.requestReminderSubscription();
    wx.showToast({ title: s.trainReminder ? '已开启训练日提醒' : '已关闭训练日提醒', icon: 'none' });
  },

  // 请求订阅消息授权（微信订阅消息需模板，此处为授权状态；推送服务需后端）
  requestReminderSubscription: function () {
    if (!wx.requestSubscribeMessage) return;
    // 未配置订阅消息模板：跳过授权请求（避免真实设备报错），仅用应用内提醒
    if (!TRAIN_REMINDER_TEMPLATE_ID) return;
    var self = this;
    wx.requestSubscribeMessage({
      tmplIds: [TRAIN_REMINDER_TEMPLATE_ID],
      success: function (res) {
        var state = res && res[TRAIN_REMINDER_TEMPLATE_ID];
        if (state === 'accept') {
          var s = store.getSettings();
          s.reminderSubscribed = true;
          store.saveSettings(s);
          self.setData({ settings: store.getSettings() });
        } else {
          wx.showToast({ title: '已关闭订阅，将继续应用内提醒', icon: 'none' });
        }
      },
      fail: function () {
        wx.showToast({ title: '订阅消息未配置或不可用，应用内提醒仍生效', icon: 'none' });
      }
    });
  },

  // 身体围度入口
  onMeasurements: function () {
    wx.navigateTo({ url: '/pages/measurements/measurements' });
  },

  // 训练目标入口
  onGoals: function () {
    wx.navigateTo({ url: '/pages/goals/goals' });
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
