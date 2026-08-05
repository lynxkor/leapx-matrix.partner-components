// 性能测试状态枚举 — 与后端 perfStatus 字符串值一致
export const PERF_STATUS = {
  PENDING: 'pending',   // 待测试(新保存视图的默认状态)
  PASSED: 'passed',     // 已通过
  FAILED: 'failed'      // 未通过
};
