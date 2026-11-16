<template>
  <div class="c-cr">
    <!--
      字段选择。
      value 用「field_name + field_relation」组合键:同一个字段名可配多个关联对象
      (如 dealer_code 配了省/市/区/大区/经营状态五个),只用 field_name 会让这 5 个
      option 的 value 相同,选中一个时 el-select 把它们全部标成选中态。
    -->
    <el-select
      v-model="localRow.fieldKey"
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
        :key="f.uniqueKey || f.key"
        :value="f.uniqueKey || f.key"
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

    <!-- 值控件:关联对象的维度候选值(多选下拉) -->
    <relation-value-select
      v-if="relationInfo && valueKind === 'multi'"
      v-model="localRow.value"
      :column="relationInfo.column"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:多值(文本 TagInput) -->
    <value-tag-input
      v-if="valueKind === 'multi' && fieldMeta && fieldMeta.type === 'text' && !relationInfo"
      v-model="localRow.value"
      :placeholder="valuePlaceholder"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
    />

    <!-- 值控件:多值(数字 TagInput + 校验) -->
    <value-tag-input
      v-if="valueKind === 'multi' && fieldMeta && fieldMeta.type === 'number' && !relationInfo"
      v-model="localRow.value"
      :placeholder="valuePlaceholder"
      :disabled="disabled"
      class="c-cr__value"
      :class="{ 'is-error': errors.value }"
      @input="onNumberTagInput"
    />

    <!-- 值控件:多值(枚举 FetchSelect) -->
    <fetch-select
      v-if="valueKind === 'multi' && fieldMeta && fieldMeta.type === 'enum' && !relationInfo"
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
  getOperatorsForFieldDef,
  getOperatorsByType,
  getOperator,
  parseRelationJson,
  RELATION_OPERATOR,
  fieldUniqueKey
} from './fieldMeta';
import ValueTagInput from './ValueTagInput.vue';
import RelationValueSelect from './RelationValueSelect.vue';
import FetchSelect from '@/libs/components/FetchSelect';
import { getEnum } from '../../../api/common';

/**
 * 字段元数据缺失的告警去重集合。
 *
 * 场景:视图里引用了一个当前字段列表里没有的字段(字段被删/改名)。
 * 这时运算符下拉没有候选项可选,界面表现是「无数据」,用户完全无从下手,
 * 所以在控制台留一条线索。同一个字段只告警一次,避免渲染时刷屏。
 */
const warnedMissingFields = new Set();

/**
 * 判断条件行是不是「关联对象」条件。
 *
 * 关联对象的条件值是一组维度编码(省/市/区/大区/经营状态),允许同时选多个,
 * 与普通字段「包含 = 模糊匹配单值」的语义完全不同,不能被单值化处理。
 *
 * 两种携带方式都要认:
 *   1. row.fieldRelation 单独存关联对象 JSON;
 *   2. row.field 是组合键 `字段名|关联对象JSON`(老数据 / 手工构造)。
 */
function isRelationRow (row) {
  if (!row) return false;
  if (row.fieldRelation) return true;
  return String(row.field || '').indexOf('|') !== -1;
}

/**
 * 把「存量多值」的单值运算符条件归一化为单值。
 *
 * 背景:包含 / 不包含 已改为单值运算符,但历史数据里存在多值数组。若把数组直接绑到
 * el-input,编辑后会被拼成 "A,B" 这样一个字符串,查询变成 LIKE '%A,B%',比原状更错。
 * 这里取首值,并把「丢弃了其余值」这一事实返回给调用方用于提示用户。
 *
 * <p><b>关联对象例外</b>:关联对象的「包含」虽同名为 contains,值却是多选维度编码,
 * 必须保持数组,否则会丢掉用户已选的其它维度,关联查询直接失真。</p>
 *
 * @param {Object} row 条件行
 * @returns {{row: Object, dropped: boolean}} 归一化后的行 + 是否丢弃了多余值
 */
function normalizeLegacySingleRow (row) {
  if (!row) return { row: {}, dropped: false };
  if (isRelationRow(row)) return { row: { ...row }, dropped: false };
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
  components: { ValueTagInput, RelationValueSelect, FetchSelect },
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
    // buildLocalRow 负责对齐组合键(fieldKey);normalizeLegacySingleRow 负责把
    // 存量多值条件降级成单值,两者都要过,顺序不能反(先对齐字段,再判运算符)。
    const normalized = normalizeLegacySingleRow(this.buildLocalRow(this.row));
    return {
      localRow: normalized.row,
      // 仅回填时置真:提示「原条件含多个值,已保留第一个」,用户一改动值即消失
      legacyMultiDropped: normalized.dropped
    };
  },
  computed: {
    /**
     * 当前行选中的字段定义。
     *
     * 取自 props.fields(本组件渲染用的字段列表)而不是 fieldMeta 模块里的
     * 全局列表 —— 全局列表会被同页其它弹窗的字段加载覆盖,两者一旦不一致,
     * 运算符下拉就会空掉(表现为「无数据」),且极难定位。
     *
     * <p><b>按「唯一定位键」查找</b>:同一个字段名可配多个关联对象
     * (如 dealer_code 配了省/市/区/大区/经营状态五个),只按字段名查会拿到
     * 其中任意一个(实际是最后一个),运算符/值控件就跟着错位。</p>
     */
    fieldDef () {
      const key = this.localRow.fieldKey;
      // 空 key = 用户点了 clearable 清空字段。此时不能再按旧的 field 回落，
      // 否则「清空」会被立刻还原成上一个字段。
      if (!key) return null;
      const hit = this.fields.find(f => f && (f.uniqueKey || f.key) === key);
      if (hit) return hit;
      // 历史数据兼容:老的条件树只存了纯 field,若该字段名现在全部声明了关联对象,
      // 组合键对不上,这时按纯字段名找第一个,至少不让整行渲染成空。
      if (!this.localRow.field) return null;
      return this.fields.find(f => f && f.key === this.localRow.field) || null;
    },
    fieldMeta () {
      return this.fieldDef;
    },
    // 字段声明了关联对象时:{ table, column }；否则 null
    relationInfo () {
      return this.fieldDef ? parseRelationJson(this.fieldDef.fieldRelation) : null;
    },
    availableOperators () {
      if (!this.localRow.field) return [];
      if (this.fieldDef) return getOperatorsForFieldDef(this.fieldDef);
      // 字段元数据里没有这个字段(视图引用了已删除/改名的字段):
      // 退回文本运算符,至少让用户还能继续编辑,而不是卡在空下拉上。
      if (!warnedMissingFields.has(this.localRow.field)) {
        warnedMissingFields.add(this.localRow.field);
        console.warn(
          '[CustomView] 条件字段在当前字段元数据中不存在,运算符已退回文本集合:',
          this.localRow.field
        );
      }
      return getOperatorsByType('text');
    },
    valueKind () {
      const op = this.localRow.operator ? getOperator(this.localRow.operator) : null;
      if (!op) return null;
      // 关联对象的「包含」与普通字段同名但语义不同:
      //   普通字段 = 模糊匹配单值(develop 侧已把 contains 改成 single);
      //   关联对象 = 一组维度编码的多选,值必须是数组。
      // 这里按场景分流,否则关联对象的多选下拉会被判成单值而整个不渲染。
      if (this.relationInfo && this.localRow.operator === RELATION_OPERATOR) {
        return 'multi';
      }
      return op.valueKind;
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
        // 归一化后再比较:props.row 回流时不带 fieldKey(下面 toRowPayload 剥掉了),
        // 直接比 JSON 会永远不等,导致 emit → splice → prop → 重置 的死循环。
        const normalized = normalizeLegacySingleRow(this.buildLocalRow(val));
        // 内容一致时直接返回,存量多值提示(legacyMultiDropped)保持不变。
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
        this.$emit('change', this.toRowPayload(val));
      },
      deep: true
    }
  },
  created () {
    // 归一化把数组换成了首元素,必须回传父级,否则父级仍持有旧的多值数组并原样落库
    if (this.legacyMultiDropped) {
      // 走 toRowPayload:fieldKey 只是 el-select 的选中态,不能落进条件树
      this.$emit('change', this.toRowPayload(this.localRow));
    }
  },
  methods: {
    /**
     * 由条件树节点还原成组件内部行。
     *
     * <p>条件树里存的是纯字段名 field + 关联对象 fieldRelation,
     * 下拉的选中态用的是组合键 fieldKey,这里负责把两者对齐 —— 尤其是
     * 视图详情回显时(后端返回的条件树没有 fieldKey)。</p>
     */
    buildLocalRow (row) {
      const next = { ...(row || {}) };
      // field 必须是纯字段名:后端要拿它拼 SQL、查关联模板。
      // 万一上游传进来的是组合键(老数据/手工构造),这里拆开兜底。
      const rawField = String(next.field || '');
      const pipe = rawField.indexOf('|');
      if (pipe !== -1) {
        next.field = rawField.slice(0, pipe);
        next.fieldRelation = next.fieldRelation || rawField.slice(pipe + 1) || null;
      }
      next.fieldKey = next.fieldKey || fieldUniqueKey(next.field, next.fieldRelation) || null;
      return next;
    },
    /**
     * 回传给父组件 / 存进条件树的载荷。
     * fieldKey 只是 el-select 的选中态,不是业务数据,不能落库。
     */
    toRowPayload (row) {
      const payload = { ...(row || {}) };
      delete payload.fieldKey;
      return payload;
    },
    // 枚举下拉数据源。字段元数据由后端下发,只带 enumCode 不带 options,
    // 需要显式传 request 给 FetchSelect,否则其 loadOptions 会直接 return 导致下拉空白。
    async fetchOptions (code) {
      if (!code) return [];
      return getEnum(code);
    },
    onFieldChange () {
      const field = this.fieldDef;
      const relation = field ? parseRelationJson(field.fieldRelation) : null;
      // clearable 清空时 el-select 给的是 '' / undefined,统一成 null
      if (!this.localRow.fieldKey) this.localRow.fieldKey = null;
      // 条件树里的 field 保持纯字段名,关联对象单独放 fieldRelation
      this.localRow.field = field ? field.key : null;
      this.localRow.fieldRelation = relation ? field.fieldRelation : null;
      // 关联字段的运算符只有「包含」一个,直接选中,省得用户再点一次
      this.localRow.operator = relation ? RELATION_OPERATOR : null;
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
