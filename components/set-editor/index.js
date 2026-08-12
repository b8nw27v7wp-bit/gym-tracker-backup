// 组编辑器组件：训练页编辑某动作的组列表
// 数据在页面层维护（editing.sets），组件只渲染 + 转发事件
// 事件约定：togglewarmup/removeset {idx}；weightinput/repsinput/rpeinput {idx, value}；addset/done/close 无参
Component({
  properties: {
    exerciseName: { type: String, value: '' },
    muscleName: { type: String, value: '' },
    sets: { type: Array, value: [] }
  },
  methods: {
    onToggleWarmup: function (e) {
      this.triggerEvent('togglewarmup', { idx: e.currentTarget.dataset.idx });
    },
    onWeightInput: function (e) {
      this.triggerEvent('weightinput', { idx: e.currentTarget.dataset.idx, value: e.detail.value });
    },
    onRepsInput: function (e) {
      this.triggerEvent('repsinput', { idx: e.currentTarget.dataset.idx, value: e.detail.value });
    },
    onRpeInput: function (e) {
      this.triggerEvent('rpeinput', { idx: e.currentTarget.dataset.idx, value: e.detail.value });
    },
    onRemoveSet: function (e) {
      this.triggerEvent('removeset', { idx: e.currentTarget.dataset.idx });
    },
    onAddSet: function () {
      this.triggerEvent('addset');
    },
    onDone: function () {
      this.triggerEvent('done');
    },
    onClose: function () {
      this.triggerEvent('close');
    }
  }
});
