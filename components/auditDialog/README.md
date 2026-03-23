# AuditDialog

审批弹窗组件。

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| auditTitle | 审批标题 | String | '审批' |
| auditDataList | 审批数据列表 | Array | [] |
| field | 显示字段名 | String | 'id' |

## Events

| 事件名 | 说明 |
|--------|------|
| audit | 审批提交时触发 |

## 示例

```vue
<AuditDialog
  ref="auditDialog"
  :auditDataList="selectedRows"
  field="name"
  @audit="handleAudit"
/>

// 打开
this.$refs.auditDialog.show();
```
