/* 常量文件 */
/* **************枚举项**************** */
export const YES_NO_ENUM = [
  {
    message: '是',
    code: '1'
  },
  {
    message: '否',
    code: '0'
  }
];
export const YES_NO_ENUM_MAP = {
  1: '是',
  0: '否'
};

export const TRUE_FALSE_ENUM_MAP = {
  true: '是',
  false: '否'
};

export const TRUE_FALSE_ENUM = [
  { code: true, message: TRUE_FALSE_ENUM_MAP.true }, // label 是布尔值 true
  { code: false, message: TRUE_FALSE_ENUM_MAP.false } // label 是布尔值 false
];
