// 自定义 tabBar：可控字号与布局，Apple 字体
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/train/train', text: '训练' },
      { pagePath: '/pages/exercises/exercises', text: '动作库' },
      { pagePath: '/pages/knowledge/knowledge', text: '知识' },
      { pagePath: '/pages/stats/stats', text: '统计' }
    ]
  },
  methods: {
    switchTab: function (e) {
      var path = e.currentTarget.dataset.path;
      var index = Number(e.currentTarget.dataset.index);
      wx.switchTab({ url: path });
      this.setData({ selected: index });
    }
  }
});
