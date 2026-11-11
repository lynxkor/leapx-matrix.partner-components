<template>
  <div class="c-cr">
    <!-- 字段选择 -->
    <el-select
      v-model="localRow.field"
      placeholder="选择字段"
      size="small"
      filterable
      clearable
      :disabled="disabled"
      class="c-cr__field"
      :class="{ 'is-error': errors.field }"
      @change="onFieldChange"
    >
      <el-option
        v-for="f in fields"
        :key="f.key"
        :value="f.key"
        :label="f.label"
      />
    </el-select>

    <!-- 运算符选择 -->
    <el-select
      v-model="localRow.operator"
      placeholder="选择运算符"
      size="small"
      :disabled="disabled || !localRow.field"
      class="c-cr__op"
      :class="{ 'is-error': errors.operator }"
      @change="onOperatorChange"
    >
      <el-option
        v-for="op in availableOperators"
        :key="op.value"
        :value="op.value"
        :label="op.label"
      />
    </el-select>

    <!-- 值控件:多值(文本 TagInput) -->
    <value-tag-input
      v-if="valueKind === 'multi' && fieldMeta && fieldMeta.type === 'text' "
      v-model="localRow.value"
      :placeholder="valuePlaceholder"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:多值(数字 TagInput + 校验) -->
    <value-tag-input
      v-if="valueKind === 'multi' && fieldMeta && fieldMeta.type === 'number' "
      v-model="localRow.value"
      :placeholder="valuePlaceholder"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
      @input="onNumberTagInput"
    />

    <!-- 值控件:多值(枚举 FetchSelect) -->
    <fetch-select
      v-if="valueKind === 'multi' && fieldMeta && fieldMeta.type === 'enum' "
      :key="fieldMeta.enumCode"
      v-model="localRow.value"
      :request="fetchOptions"
      :enum-code="fieldMeta.enumCode"
      :multiple="true"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:单值文本(包含 / 不包含走这里) -->
    <el-input
      v-if="valueKind === 'single' && fieldMeta && fieldMeta.type === 'text' "
      v-model.trim="localRow.value"
      :placeholder="valuePlaceholder"
      size="small"
      clearable
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:单值数字 -->
    <el-input-number
      v-if="valueKind === 'single' && fieldMeta && fieldMeta.type === 'number' "
      v-model="localRow.value"
      :placeholder="valuePlaceholder"
      size="small"
      :controls="false"
      :disabled="disabled"
      class="c-cr__value c-cr__value--number"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:日期 daterange -->
    <el-date-picker
      v-if="valueKind === 'daterange' "
      v-model="localRow.value"
      type="daterange"
      :default-time="['00:00:00', '23:59:59']"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="yyyy-MM-dd HH:mm:ss"
      size="small"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:日期单天(date 类型的等于/早于/晚于) -->
    <el-date-picker
      v-if="valueKind === 'date' "
      v-model="localRow.value"
      type="date"
      value-format="yyyy-MM-dd"
      placeholder="选择日期"
      size="small"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:日期单值 -->
    <el-date-picker
      v-if="valueKind === 'single' && fieldMeta && fieldMeta.type === 'date' "
      v-model="localRow.value"
      type="datetime"
      value-format="yyyy-MM-dd HH:mm:ss"
      placeholder="选择日期"
      size="small"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:占位框(field/operator 未选全时,保持 3 框布局) -->
    <el-input
      v-if="valueSlotMode === 'placeholder'"
      :value="''"
      placeholder="请输入值"
      size="small"
      disabled
      class="c-cr__value"
    />

    <!-- 存量多值条件降级提示:该条件原本是多个值,回填时只保留了第一个 -->
    <span
      v-if="legacyMultiDropped"
      class="c-cr__tip"
      title="该条件原本包含多个值，现只允许单值，已保留第一个"
    >原含多值，已取第一个</span>

    <!-- 删除按钮 -->
    <el-button
      v-if="!disabled"
      type="text"
      icon="el-icon-close"
      class="c-cr__remove"
      @click="$emit('remove')"
    />
  </div>
</template>

<script>
import {
  getField,
  getOperatorsForField,
  getOperator
} from './fieldMeta';
import ValueTagInput from './ValueTagInput.vue';
import FetchSelect from '@/libs/components/FetchSelect';
import { getEnum } from '../../../api/common';

/**
 * 把「存量多值」的单值运算符条件归一化为单值。
 *
 * 背景:包含 / 不包含 已改为单值运算符,但历史数据里存在多值数组。若把数组直接绑到
 * el-input,编辑后会被拼成 "A,B" 这样一个字符串,查询变成 LIKE '%A,B%',比原状更错。
 * 这里取首值,并把「丢弃了其余值」这一事实返回给调用方用于提示用户。
 *
 * @param {Object} row 条件行
 * @returns {{row: Object, dropped: boolean}} 归一化后的行 + 是否丢弃了多余值
 */
function normalizeLegacySingleRow (row) {
  if (!row) return { row: {}, dropped: false };
  const op = row.operator ? getOperator(row.operator) : null;
  if (!op || op.valueKind !== 'single' || !Array.isArray(row.value)) {
    return { row: { ...row }, dropped: false };
  }
  return {
    row: { ...row, value: row.value.length ? row.value[0] : null },
    dropped: row.value.length > 1
  };
}

export default {
  name: 'CustomConditionRow',
  components: { ValueTagInput, FetchSelect },
  props: {
    row: {
      type: Object,
      required: true
    },
    fields: {
      type: Array,
      required: true
    },
    errors: {
      type: Object,
      default: () => ({})
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    const normalized = normalizeLegacySingleRow(this.row);
    return {
      localRow: normalized.row,
      // 仅回填时置真:提示「原条件含多个值,已保留第一个」,用户一改动值即消失
      legacyMultiDropped: normalized.dropped
    };
  },
  computed: {
    fieldMeta () {
      return this.localRow.field ? getField(this.localRow.field) : null;
    },
    availableOperators () {
      return this.localRow.field ? getOperatorsForField(this.localRow.field) : [];
    },
    valueKind () {
      const op = this.localRow.operator ? getOperator(this.localRow.operator) : null;
      return op ? op.valueKind : null;
    },
    hideValue () {
      return this.valueKind === 'empty';
    },
    // 值位置渲染策略:
    //   'hidden'      -> 不渲染(选了 isEmpty/isNotEmpty)
    //   'placeholder' -> 渲染 disabled 占位框(field/operator 还没选全)
    //   'real'        -> 由下面 8 个真实值控件按 valueKind+fieldMeta.type 渲染
    valueSlotMode () {
      if (this.hideValue) return 'hidden';
      if (!this.localRow.field || !this.localRow.operator) return 'placeholder';
      return 'real';
    },
    valuePlaceholder () {
      return '请输入值';
    }
  },
  watch: {
    row: {
      handler (val) {
        const normalized = normalizeLegacySingleRow(val);
        // Guard against re-emit loop: parent splices the row in after our
        // emit, so row prop comes back as a new reference with same content.
        // Skip if content already matches localRow.
        if (JSON.stringify(normalized.row) === JSON.stringify(this.localRow)) return;
        this.localRow = normalized.row;
        this.legacyMultiDropped = normalized.dropped;
      },
      deep: true
    },
    localRow: {
      handler (val) {
        // 用户改动值后不再是数组,存量提示随之消失
        if (this.legacyMultiDropped && !Array.isArray(val.value)) {
          this.legacyMultiDropped = false;
        }
        this.$emit('change', { ...val });
      },
      deep: true
    }
  },
  created () {
    // 归一化把数组换成了首元素,必须回传父级,否则父级仍持有旧的多值数组并原样落库
    if (this.legacyMultiDropped) {
      this.$emit('change', { ...this.localRow });
    }
  },
  methods: {
    // 枚举下拉数据源。字段元数据由后端下发,只带 enumCode 不带 options,
    // 需要显式传 request 给 FetchSelect,否则其 loadOptions 会直接 return 导致下拉空白。
    async fetchOptions (code) {
      if (!code) return [];
      return getEnum(code);
    },
    onFieldChange () {
      this.localRow.operator = null;
      this.localRow.value = null;
    },
    onOperatorChange () {
      this.localRow.value = null;
    },
    onNumberTagInput (val) {
      if (!Array.isArray(val)) return;
      const cleaned = val
        .map(v => (typeof v === 'string' ? v.trim() : v))
        .filter(v => v !== '' && v !== null && v !== undefined && !isNaN(Number(v)))
        .map(v => Number(v));
      if (cleaned.length !== val.length || cleaned.some((n, i) => n !== val[i])) {
        this.localRow.value = cleaned;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.c-cr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  &__field { width: 180px; }
  &__op { width: 130px; height: 32px; }
  &__value { flex: 1; width: 300px; }
  &__tip {
    flex-shrink: 0;
    padding: 0 6px;
    font-size: 12px;
    line-height: 20px;
    white-space: nowrap;
    color: #E6A23C;
    background: rgba(230, 162, 60, 0.1);
    border-radius: 2px;
  }
  &__remove { padding: 4px; color: var(--leap-color-default-light-2); }
  ::v-deep .is-error .el-input__inner,
  ::v-deep .is-error .el-input__wrapper,
  ::v-deep .is-error .el-select .el-input__inner {
    border-color: var(--leap-color-danger);
  }
  ::v-deep .el-input--small .el-input__inner {
    height: 32px!important;
  }
}
</style>
