<template>
  <!--
    批量排序字段编辑器(需求 LP262002 7.1.2.2 自定义排序)。

    交互(按 PRD):
      - 一个「＋ 添加排序字段」按钮,点击后下拉列出所有可参与排序的字段;
      - 每行 = [拖拽手柄][字段名] .......... [升序|降序][删除];
      - 行与行的先后即排序优先级,靠前的字段先排(可拖动手柄调整次序);
      - 按钮上显示当前已参与的排序字段个数。

    数据源:
      - fields —— 候选字段(后端字段元数据 customViewField/list),
        不受「表格设置」的列显隐影响;
      - value  —— 排序项列表 [{field, order}],order 为 asc / desc。

    候选字段会剔除三类:
      ① 已经参与排序的字段(PRD:添加排序字段时过滤掉已参与的字段);
      ② 虚拟字段【序号】(前端虚拟列,没有对应的业务字段);
      ③ field_relation 有值的关联对象字段(省/市/区/大区/经营状态(服务)等),
         它们作用的是关联表维度,结果集里没有真实列可供 ORDER BY。
  -->
  <div class="c-sfe">
    <div class="c-sfe__list">
      <draggable
        :list="innerList"
        handle=".c-sfe__handle"
        animation="150"
        ghost-class="c-sfe__ghost"
        @end="onDragEnd"
      >
        <div
          v-for="(item, idx) in innerList"
          :key="idx"
          class="c-sfe__row"
        >
          <!-- 拖拽手柄:按住它可调整排序字段的先后次序 -->
          <i class="el-icon-rank c-sfe__handle" title="拖动调整次序" />
          <!-- 字段名:撑开中间空间,把升降序与删除按钮推到右侧 -->
          <span class="c-sfe__name" :title="fieldLabel(item.field)">{{ fieldLabel(item.field) }}</span>
          <el-radio-group v-model="item.order" size="mini" @change="onOrderChange">
            <el-radio-button label="asc">升序</el-radio-button>
            <el-radio-button label="desc">降序</el-radio-button>
          </el-radio-group>
          <el-button
            type="text"
            icon="el-icon-remove-outline"
            class="c-sfe__remove"
            title="删除该排序字段"
            @click="removeItem(idx)"
          />
        </div>
      </draggable>
    </div>

    <!--
      添加排序字段:下拉里的候选项取自后端字段元数据(不受表格设置影响),
      已剔除「已参与排序」「虚拟字段【序号】」「关联对象字段」;字段多时可滚动。
    -->
    <el-dropdown
      trigger="click"
      placement="bottom-start"
      class="c-sfe__add"
      @command="addField"
    >
      <el-button size="mini" icon="el-icon-plus" :disabled="!candidateFields.length">
        添加排序字段<template v-if="innerList.length">（{{ innerList.length }}）</template>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <div class="c-sfe__candidates">
          <el-dropdown-item
            v-for="f in candidateFields"
            :key="f.uniqueKey || f.key"
            :command="f.key"
          >{{ f.label }}</el-dropdown-item>
        </div>
      </el-dropdown-menu>
    </el-dropdown>

    <div class="c-sfe__tip">次序靠前的字段优先排序;不选字段则按后端默认排序</div>
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import { isVirtualSortField } from './sortJson';

export default {
  name: 'SortFieldEditor',
  components: { draggable },
  props: {
    /**
     * 排序项列表 [{field, order}]。
     *
     * <p>受控用法:v-model 双向绑定。拖拽调整次序由 vuedraggable 就地改数组
     * (与 libs 内 CustomView 的视图拖拽同一套写法),数组内容变化会被 Vue 感知。</p>
     */
    value: {
      type: Array,
      default: () => []
    },
    /**
     * 候选字段元数据 [{key, label}] —— 取自后端字段元数据接口。
     */
    fields: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      /**
       * 内部排序列表副本。
       *
       * <p>不直接用 props 的数组:拖拽(vuedraggable 的 list 模式)会就地 splice 数组,
       * 若直接用 props 引用就等于「子组件改父级的 props 数组」。
       * 这里持一份副本,改动后通过 input 事件把新数组回传给父级。</p>
       */
      localList: this.copyList(this.value)
    };
  },
  computed: {
    /**
     * 内部排序列表 —— 供渲染与拖拽使用。
     */
    innerList () {
      return this.localList;
    },
    /**
     * 可参与排序的候选字段:剔除「已参与排序」「虚拟字段【序号】」「关联对象字段」。
     *
     * <p><b>关联对象字段必须整条过滤</b>:custom_view_field 里同一个 field_name
     * 会声明多个关联对象(dealer_code 的省/市/区/大区/经营状态(服务)),它们
     * 在结果集里没有对应的真实列 —— 条件是改写关联表后 IN 进主表 WHERE 的,
     * ORDER BY 却无法照做。展示出来只会让用户选到「经验状态（服务）」这类
     * 排了也没意义(甚至 SQL 报错)的项,故 field_relation 有值即排除。</p>
     *
     * <p>剩下的字段仍按 key 去重,避免同名字段的重复声明撑出多个等价选项。</p>
     */
    candidateFields () {
      const used = this.innerList.map(item => item && item.field);
      const seen = new Set();
      return this.fields.filter(f => {
        if (!f || !f.key || used.indexOf(f.key) !== -1 || isVirtualSortField(f)) return false;
        // 后端对无关联对象的字段返回 null / '' ;非空即为关联对象声明
        if (f.fieldRelation && String(f.fieldRelation).trim()) return false;
        if (seen.has(f.key)) return false;
        seen.add(f.key);
        return true;
      });
    }
  },
  watch: {
    /**
     * 父级换了排序列表(加载视图详情 / 外部重置)→ 同步到内部副本。
     *
     * <p>只监听引用变化:拖拽后回传的是同一个引用,不会重复重置。</p>
     */
    value (val) {
      this.localList = this.copyList(val);
    }
  },
  methods: {
    /**
     * 复制排序列表(浅拷贝元素即可 —— 元素是 {field, order} 这种扁平对象)。
     * @param {Array} list
     * @returns {Array}
     */
    copyList (list) {
      return (Array.isArray(list) ? list : []).map(item => ({ ...item }));
    },
    /**
     * 排序字段的中文名(取不到时退回字段名本身)。
     *
     * <p>同名字段有多条声明时优先用「无关联对象」那条的 label ——
     * 「门店编码」比「省」「大区」这类维度名更适合描述一个排序列。</p>
     * @param {String} fieldKey
     * @returns {String}
     */
    fieldLabel (fieldKey) {
      const hits = this.fields.filter(f => f && f.key === fieldKey);
      if (hits.length === 0) return fieldKey;
      const plain = hits.find(f => !f.fieldRelation);
      return (plain || hits[0]).label || fieldKey;
    },
    /**
     * 把内部列表回传给父级。
     */
    syncOut () {
      this.$emit('input', this.localList);
      this.$emit('change', this.localList);
    },
    /**
     * 添加排序字段(PRD:默认升序)。
     * @param {String} fieldKey
     */
    addField (fieldKey) {
      if (!fieldKey) return;
      // 兜一层重复校验,防止同一个字段被加入两次
      if (this.localList.some(item => item && item.field === fieldKey)) return;
      this.localList.push({ field: fieldKey, order: 'asc' });
      this.syncOut();
    },
    /**
     * 删除某个排序字段。
     * @param {Number} idx
     */
    removeItem (idx) {
      this.localList.splice(idx, 1);
      this.syncOut();
    },
    /**
     * 拖拽结束:次序已由 vuedraggable 就地改好,回传给父级。
     *
     * <p>行与行的先后即排序优先级(靠前的字段先排)。</p>
     */
    onDragEnd () {
      this.syncOut();
    },
    /**
     * 升降序切换:回传给父级。
     *
     * <p>el-radio-group 的 v-model 改的是内部副本里的元素,父级拿不到,
     * 这里补一次同步(父级替换整个数组)。</p>
     */
    onOrderChange () {
      this.syncOut();
    }
  }
};
</script>

<style lang="scss" scoped>
.c-sfe {
  &__list {
    margin-bottom: 4px;
  }
  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  &__handle {
    cursor: move;
    color: #909399;
    flex: none;
  }
  // 字段名:撑开中间空间,把升降序与删除按钮推到右侧(与 PRD 原型一致)
  &__name {
    flex: 1;
    min-width: 0;
    color: #606266;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__remove {
    color: #909399;
    font-size: 16px;
    padding: 0;
    &:hover {
      color: var(--leap-color-danger);
    }
  }
  // 候选字段下拉:字段多时需要滚动条(PRD)
  // el-dropdown-menu 自身没有 max-height,滚动由这层包裹 div 承担
  &__candidates {
    max-height: 200px;
    overflow-y: auto;
    min-width: 160px;
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
  }
  &__tip {
    color: var(--leap-color-default-light-2);
    font-size: 12px;
    margin-top: 6px;
  }
}
</style>
