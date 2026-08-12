// 动作卡片组件：动作库列表展示（名称/类型/难度/目标肌群/器械/休息/部位）
// 点击事件通过 tap 转发给页面
Component({
  properties: {
    name: { type: String, value: '' },
    typeText: { type: String, value: '' },
    diffText: { type: String, value: '' },
    target: { type: Array, value: [] },
    equipText: { type: String, value: '' },
    rest: { type: String, value: '' },
    muscleName: { type: String, value: '' }
  },
  methods: {
    onTap: function () {
      this.triggerEvent('tap');
    }
  }
});
