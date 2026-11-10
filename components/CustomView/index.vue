<template>
  <div class="m-custom-view">
    <el-dropdown
      ref="dropdown"
      trigger="click"
      placement="bottom-start"
      class="m-custom-view__dropdown"
      :append-to-body="false"
      @command="onDropdownCommand"
      @visible-change="onDropdownVisibleChange"
    >
      <template v-if="$scopedSlots.trigger">
        <div @click.stop>
          <slot
            name="trigger"
            :label="activePresetName || triggerText"
            :clearable="!!activePresetId"
            :onClear="handleClearPreset"
          />
        </div>
      </template>
      <template v-else>
        <el-button size="small" class="m-custom-view__trigger">
          <span class="m-custom-view__trigger_text">
            <TextEllipsis>{{ activePresetName || triggerText }}</TextEllipsis>
          </span>
          <i class="el-icon-arrow-down el-icon--right" />
          <i
            v-if="activePresetId"
            class="el-icon-close m-custom-view__clear"
            @click.stop="handleClearPreset"
          />
        </el-button>
      </template>

      <el-dropdown-menu slot="dropdown">
        <div class="m-custom-view__search" @click.stop>
          <el-input
            v-model="presetFilterKeyword"
            size="mini"
            placeholder="搜索视图名称"
            clearable
            prefix-icon="el-icon-search"
          />
        </div>
        <!--
          下拉行按固定列排布,各行严格对齐:
          [首列(拖拽手柄 / 系统标识)][名称(弹性)][默认标记位][操作区]
        -->
        <el-dropdown-item
          v-if="defaultViewVisible"
          command="__default__"
          :class="['m-custom-view__item', 'm-custom-view__item--outside', { 'is-active': !activePresetId }, ...itemColumnClasses]"
        >
          <!-- 首列:系统视图行放「系」标识,与用户视图行的拖拽手柄同宽,保证后面对齐 -->
          <span class="m-custom-view__lead">
            <span v-if="enableDefaultView" class="m-custom-view__badge" title="系统视图">系</span>
          </span>
          <span class="m-custom-view__cnt m-custom-view__cnt--name">
            <span class="m-custom-view__label">{{ defaultLabel }}</span>
          </span>
          <!-- 性能测试状态:系统视图是虚拟项无状态,留空占位以保持与用户视图行的列对齐 -->
          <span v-if="showPerfStatus" class="m-custom-view__perf-slot" />
          <!--
            默认标记位:「默」徽标与「设为默认」文字占同一位置(左对齐),
            切换默认视图时徽标原地替换文字,布局不跳动
          -->
          <span v-if="enableDefaultView" class="m-custom-view__default-slot">
            <span v-if="!defaultPresetId" class="m-custom-view__badge" title="默认视图">默</span>
            <span
              v-else
              class="m-custom-view__text-action"
              title="设为默认"
              @click.stop="onSetDefault(null)"
            >设为默认</span>
          </span>
          <span v-if="enableDefaultView" class="m-custom-view__cnt m-custom-view__cnt--action">
            <span class="m-custom-view__actions" @click.stop>
              <span class="m-custom-view__text-action" title="复制" @click.stop="onCopyView(null)">复制</span>
            </span>
          </span>
        </el-dropdown-item>
        <!--
          列表数据源必须是 filteredPresets(而不是 presets):
          presets 是全量视图,直接渲染它会让「搜索视图名称」输入框完全失效
          (输入关键字后列表纹丝不动,只有「未找到匹配的视图」的提示会跟着变)。
          空关键字时 filteredPresets === presets(同一份引用),拖拽排序写回的仍是 presets;
          有关键字时 dragDisabled 为 true,拖拽本就被禁用,不影响整表排序语义。
        -->
        <draggable
          class="m-custom-view__list"
          :list="filteredPresets"
          :disabled="dragDisabled"
          handle=".m-custom-view__handle"
          animation="150"
          @end="onDragEnd"
        >
          <div
            v-for="p in filteredPresets"
            :key="p.id"
            class="m-custom-view__row"
          >
            <el-dropdown-item
              :command="p.id"
              :class="['m-custom-view__item', { 'is-active': activePresetId === p.id }, ...itemColumnClasses]"
            >
              <!-- 首列:拖拽手柄(搜索态下不显示,用占位保持列宽) -->
              <span class="m-custom-view__lead">
                <i
                  v-if="!presetFilterKeyword"
                  class="el-icon-rank m-custom-view__handle"
                  title="拖动排序"
                />
              </span>
              <span class="m-custom-view__cnt m-custom-view__cnt--name">
                <span class="m-custom-view__label">
                  <TextEllipsis>{{ p.name }}</TextEllipsis>
                </span>
              </span>
              <!-- 性能测试状态:固定列,各行标签位置对齐 -->
              <span v-if="showPerfStatus" class="m-custom-view__perf-slot">
                <el-tag :type="perfStatusTagType(p)" size="mini" class="m-custom-view__perf">
                  {{ perfStatusLabel(p) }}
                </el-tag>
              </span>
              <!--
                默认标记位:「默」徽标与「设为默认」文字占同一位置(左对齐),
                切换默认视图时徽标原地替换文字,布局不跳动
              -->
              <span v-if="enableDefaultView" class="m-custom-view__default-slot">
                <span v-if="isPresetDefault(p)" class="m-custom-view__badge" title="默认视图">默</span>
                <span
                  v-else
                  class="m-custom-view__text-action"
                  title="设为默认"
                  @click.stop="onSetDefault(p)"
                >设为默认</span>
              </span>
              <span class="m-custom-view__cnt m-custom-view__cnt--action">
                <span class="m-custom-view__actions" @click.stop>
                  <i class="el-icon-top m-custom-view__action" title="置顶" @click.stop="onMoveToTop(p)" />
                  <i class="el-icon-edit m-custom-view__action" title="编辑" @click.stop="onEditView(p)" />
                  <i class="el-icon-delete m-custom-view__action m-custom-view__action--danger" title="删除" @click.stop="onDeleteView(p)" />
                  <!-- 复制:复制出的视图名为「原名-复制」 -->
                  <span v-if="enableDefaultView" class="m-custom-view__text-action" title="复制" @click.stop="onCopyView(p)">复制</span>
                </span>
              </span>
            </el-dropdown-item>
          </div>
        </draggable>
        <el-dropdown-item divided command="__new__" class="m-custom-view__divided">
          <i class="el-icon-plus" />
          <span class="m-custom-view__label">新增视图</span>
        </el-dropdown-item>
        <div
          v-if="presetFilterKeyword && !defaultViewVisible && filteredPresets.length === 0"
          class="m-custom-view__empty"
        >未找到匹配的视图</div>
      </el-dropdown-menu>
    </el-dropdown>

    <component
      :is="resolvedDialogComponent"
      v-bind="dialogProps"
      :visible.sync="dialogVisible"
      :active-preset-id="editingPresetId"
      :biz-key="bizKey"
      @update:active-preset-id="onDialogUpdatePresetId"
      @save="onDialogSave"
    />
  </div>
</template>

<script>
import CustomQueryDialog from './CustomQueryDialog.vue';
import { PERF_STATUS } from './perfStatus';
import { resolveSortList, toSortColumns } from './sortJson';
import * as customQueryViewApi from '@/libs/api/customView/customQueryView';
import TextEllipsis from '@/libs/components/TextEllipsis';
import draggable from 'vuedraggable';

export default {
  name: 'CustomView',
  components: { CustomQueryDialog, TextEllipsis, draggable },
  props: {
    value: { type: [Object, null], default: null },
    sortColumns: { type: Array, default: () => [] },
    activePresetId: { type: String, default: null },
    triggerText: { type: String, default: '系统视图' },
    bizKey: { type: String, required: true },
    /**
     * 「新增/编辑视图」弹窗组件 —— 默认用内置的 CustomQueryDialog(仅自定义条件查询)。
     *
     * <p>需要换成别的弹窗时(如合并了「表格设置」的「个人视图设置」),
     * 传组件对象进来即可,其余逻辑(下拉、搜索、增删改、排序)完全复用本组件。</p>
     *
     * <p>默认 null = 保持原行为,不影响既有页面。</p>
     */
    dialogComponent: { type: [Object, Function], default: null },
    /**
     * 传给弹窗组件的额外 props(如表格列配置 config、skipPerfTest 等)。
     * 与 dialogComponent 配套使用;默认 {} = 不传任何额外 props。
     */
    dialogProps: { type: Object, default: () => ({}) },
    /**
     * 本地生效模式 —— 视图的筛选/排序由业务页面在本地处理,而非走后端 executeQuery。
     *
     * <p>该模式下:①选中视图不校验性能测试状态(明细表场景后端通用查询不可用,
     * 性能测试必然失败);②提示语不提及「表单已锁定」(本地模式不锁表单)。</p>
     *
     * <p>默认 false = 保持原行为,不影响既有页面。</p>
     */
    localApply: { type: Boolean, default: false },
    /**
     * 保存视图后是否自动应用该视图(即把它选中)。
     *
     * <p>true(默认) = 保存成功后立即应用,列表页行为:新存一个视图就直接用上;</p>
     * <p>false = 保存后保持当前选择不变 —— 单据详情页行为:
     * 正在用视图 A 时编辑了另一个视图 B,保存 B 不该把当前选择抢走,
     * 视图是否生效由用户自己在下拉里点选决定。</p>
     *
     * <p>注意:保存的正是当前选中的视图时,一律走 refresh 通道强制刷新列表
     * (条件可能变了),该行为不受本开关影响。</p>
     */
    autoApplyAfterSave: { type: Boolean, default: true },
    /**
     * 下拉里「默认视图」那一项的文案。默认空 = 与 triggerText 保持一致。
     */
    defaultViewText: { type: String, default: '' },
    /**
     * 是否启用「默认视图」相关能力(需求 LP262002 7.1.2.2)。
     *
     * <p>开启后:①下拉项显示「系 / 默」标识;②支持「复制」与「设为默认」操作;
     * ③打开页面时自动选中默认视图。</p>
     *
     * <p><b>默认 true</b>:全局只有一套样式 —— 无论挂在全局标题栏还是业务页内联,
     * 这个下拉的文案、角标、复制 / 设为默认能力都完全一致。</p>
     */
    enableDefaultView: { type: Boolean, default: true }
  },
  data () {
    return {
      presets: [],
      presetFilterKeyword: '',
      editingPresetId: null,
      dialogVisible: false,
      loading: false,
      // 已经自动套用过默认视图的业务键。
      // 同一个业务键只在「首次进入该页面」时套用一次默认视图,
      // 之后用户自己怎么选都以用户的选择为准(见 loadPresets)。
      defaultAppliedBizKeys: []
    };
  },
  computed: {
    /**
     * 实际渲染的弹窗组件。
     *
     * <p>模板里不能写 {@code :is="dialogComponent || CustomQueryDialog"}:
     * import 的组件注册在 components 选项里,并不是实例属性,运行时
     * {@code this.CustomQueryDialog} 恒为 undefined —— 未传 dialogComponent
     * 的页面(如保修申请单)弹窗根本渲染不出来,点「编辑/新增」无效。
     * 这里显式兜底,不依赖实例属性解析。</p>
     */
    resolvedDialogComponent () {
      return this.dialogComponent || CustomQueryDialog;
    },
    activePresetName () {
      if (!this.activePresetId) return '';
      const preset = this.presets.find(p => p.id === this.activePresetId);
      return preset ? preset.name : '';
    },
    filteredPresets () {
      const kw = (this.presetFilterKeyword || '').trim().toLowerCase();
      if (!kw) return this.presets;
      return this.presets.filter(p => (p.name || '').toLowerCase().includes(kw));
    },
    /**
     * 搜索态下禁用拖拽(需求 LP262042 7.1.2.2)。
     * 过滤后列表是 presets 的子集,拖拽子集会让「被过滤掉的视图」也参与重排,
     * 提交整表顺序时无法还原用户真实意图,所以搜索时直接禁用。
     */
    dragDisabled () {
      return !!(this.presetFilterKeyword || '').trim();
    },
    defaultViewVisible () {
      const kw = (this.presetFilterKeyword || '').trim().toLowerCase();
      return !kw || this.defaultLabel.toLowerCase().includes(kw);
    },
    /**
     * 下拉里「默认视图」项的文案。
     * 未显式指定时与触发器文案(triggerText)保持一致。
     */
    defaultLabel () {
      return this.defaultViewText || this.triggerText;
    },
    /**
     * 下拉行的列 class —— 决定 grid 用哪套列宽。
     * 状态列(性能测试)与默认标记列按需出现,不同页面组合不同,
     * 用 class 组合让 grid 显式对齐各列。
     */
    itemColumnClasses () {
      const classes = [];
      if (this.showPerfStatus) classes.push('m-custom-view__item--perf');
      if (this.enableDefaultView) classes.push('m-custom-view__item--default');
      return classes;
    },
    /**
     * 当前默认视图的 id。
     * null = 默认视图是「系统视图」(后端没有默认视图记录时的初始状态)。
     */
    defaultPresetId () {
      const hit = this.presets.find(p => p.defaultIs === true);
      return hit ? hit.id : null;
    },
    /**
     * 是否显示性能测试状态标签(「已通过 / 未通过 / 待测试」)。
     *
     * <p>本地生效模式下同样显示,但文案统一为「已通过」
     * (该模式下不走后端通用查询,真实性能测试必然失败,显示「待测试」是误导)。</p>
     */
    showPerfStatus () {
      return true;
    }
  },
  watch: {
    dialogVisible (val) {
      if (!val) this.editingPresetId = null;
    }
  },
  mounted () {
    this.loadPresets();
  },
  methods: {
    perfStatusLabel (preset) {
      // 本地生效模式:视图的筛选/排序由页面本地处理,不走后端通用查询,
      // 性能测试必然失败(恒为「待测试」),对用户是误导 —— 统一显示「已通过」
      if (this.localApply) return '已通过';
      const s = preset.perfStatus || PERF_STATUS.PENDING;
      if (s === PERF_STATUS.PASSED) return '已通过';
      if (s === PERF_STATUS.FAILED) return '未通过';
      return '待测试';
    },
    perfStatusTagType (preset) {
      if (this.localApply) return 'success';
      const s = preset.perfStatus || PERF_STATUS.PENDING;
      if (s === PERF_STATUS.PASSED) return 'success';
      if (s === PERF_STATUS.FAILED) return 'danger';
      return 'warning';
    },
    /**
     * 加载视图列表,并解析本次的「生效视图」。
     *
     * <p>加载结束后统一抛 {@code ready} 事件,携带解析出的生效视图 id:
     * <b>null = 系统视图</b>(没有默认个人视图),<b>非空 = 默认个人视图 id</b>。
     * 宿主据此决定取数方式(系统视图走业务列表接口,个人视图走 executeQuery),
     * 从而避免「先进页面就发一次业务列表请求,个人视图列表回来后又被视图刷新覆盖」。</p>
     *
     * <p>注意:{@code ready} 在每次加载视图列表后都会抛(打开下拉、复制/删除/设默认视图等),
     * 宿主一般只在首屏消费一次,后续需按新默认视图重新取数的场景自行判断。</p>
     */
    async loadPresets () {
      if (this.loading) return;
      this.loading = true;
      // 本次解析出的「生效视图 id」:null = 系统视图。
      // 用局部变量跟踪,不用 this.activePresetId —— 后者是 props,
      // 本轮 emit(update:activePresetId) 后要等下一个渲染周期才回写,读到的是旧值。
      let resolvedViewId = this.activePresetId || null;
      try {
        // 先取默认视图:进入页面要先用上默认视图,再展示列表
        // (page 传 defaultIs=1 + bizKey 即为查询默认视图)
        let defaultViewId = null;
        if (this.enableDefaultView) {
          const defRes = await customQueryViewApi.page({
            bizKey: this.bizKey,
            defaultIs: 1,
            pageNum: 1,
            pageSize: 10
          });
          const defRecords = (defRes && defRes.records) || [];
          if (defRecords.length) defaultViewId = defRecords[0].id;
        }

        const res = await customQueryViewApi.page({
          bizKey: this.bizKey,
          pageNum: 1,
          // 下拉一次性取全量,不支持分页:视图数量按人均个位数,
          // 取 100 足够覆盖,避免用户视图较多时被截断在后半段(排序也会跟着失真)
          pageSize: 100
        });
        const records = (res && res.records) || [];
        this.presets = records.map(p => ({
          id: p.id,
          name: p.viewName,
          creatorName: p.creatorName || '',
          perfStatus: p.perfStatus || PERF_STATUS.PENDING,
          perfDurationMs: p.perfDurationMs,
          perfTestedAt: p.perfTestedTime,
          // 是否默认视图(后端 0 否 / 1 是)
          defaultIs: p.defaultIs === 1
        }));
        if (resolvedViewId && !this.presets.some(p => p.id === resolvedViewId)) {
          // 选中的视图已不存在(被删除):清空选中态,回落系统视图
          this.handleClearPreset();
          resolvedViewId = null;
        }
        // 未指定视图时,自动选中默认视图(需求 LP262002:每次打开详情页显示默认的个人视图)
        //
        // <p><b>每个业务键只判定一次</b>:首次进入该页面(拿到视图列表)时判定要不要套用默认视图,
        // 之后无论刷新多少次视图列表(打开下拉、复制/删除/设默认视图),
        // 都以用户当前选择的视图为准 ——
        // 否则用户选了「系统视图」,一打开下拉就被默认视图顶回去,
        // 视图被换掉还会多发一次查询请求。</p>
        const firstEnter = !this.defaultAppliedBizKeys.includes(this.bizKey);
        if (firstEnter) this.defaultAppliedBizKeys.push(this.bizKey);
        if (this.enableDefaultView && firstEnter && !resolvedViewId && defaultViewId) {
          // 自动选中成功才算默认视图生效:
          // 未通过性能测试的视图不会被自动应用,此时仍按系统视图处理
          const applied = await this.applyPresetById(defaultViewId);
          resolvedViewId = applied ? defaultViewId : null;
        }
      } catch (e) {
        this.presets = [];
        this.$message.error('加载视图列表失败');
        // 视图列表加载失败:回落系统视图,宿主按业务列表接口取数,不至于白屏
        resolvedViewId = null;
      } finally {
        this.loading = false;
        // 视图列表与默认视图已就绪,通知宿主按「生效视图」决定取数方式
        this.$emit('ready', { activePresetId: resolvedViewId });
      }
    },
    onDropdownVisibleChange (visible) {
      if (visible) {
        this.loadPresets();
      } else {
        this.presetFilterKeyword = '';
      }
    },
    handleClearPreset () {
      this.$emit('update:activePresetId', null);
      this.$emit('input', null);
      this.$emit('update:sortColumns', []);
      this.$emit('change', { conditions: null, sortColumns: [], activePresetId: null });
    },
    /**
     * 拖拽结束:提交当前全部视图 id 的有序列表(需求 LP262042 7.1.2.2)。
     *
     * <p>整表覆盖语义,与后端 reorder 接口约定一致 —— 后端按数组下标重写 view_seq。
     * 权限判定统一交给后端:管理员与持有 DEALER_DATA_VIEW_ALL 的人由后端抛异常拒绝,
     * 前端不预判、不隐藏入口,统一按整表提交,失败时回滚为拖拽前的顺序。</p>
     *
     * <p>失败时回滚并交给 axios 拦截器弹错(拦截器已先弹错再 reject,
     * 这里不重复 $message.error)。</p>
     */
    async onDragEnd () {
      const ids = this.presets.map(p => p.id);
      // 拖动后 vuedraggable 就地改了 this.presets,提交前先快照一份用于回滚
      const snapshot = ids.slice();
      try {
        await customQueryViewApi.reorder(snapshot);
      } catch (e) {
        await this.loadPresets();
      }
    },
    /**
     * 置顶:等价于「把该项拖到最顶」,复用 reorder 接口提交整表新顺序。
     * 不再有独立的置顶接口与 is_top 字段,置顶就是排序的一种。
     */
    async onMoveToTop (preset) {
      const targetId = preset.id;
      const ids = this.presets.map(p => p.id).filter(id => id !== targetId);
      ids.unshift(targetId);
      try {
        await customQueryViewApi.reorder(ids);
        this.closeDropdown();
        await this.loadPresets();
        this.$message.success(`已将视图「${preset.name}」置顶`);
      } catch (e) {
        this.loadPresets();
      }
    },
    /**
     * 该视图是否为默认视图。
     * @param {Object} preset
     */
    isPresetDefault (preset) {
      if (!preset) return false;
      return preset.defaultIs === true;
    },
    /**
     * 关闭下拉菜单。
     *
     * <p>操作区(置顶 / 编辑 / 删除 / 复制 / 设为默认)的点击都带了 @click.stop,
     * 阻止了事件冒泡到 dropdown-item,于是 el-dropdown 的「点选项自动关闭」不会触发,
     * 菜单会一直盖在弹窗上 —— 这里显式关闭。</p>
     */
    closeDropdown () {
      const dd = this.$refs.dropdown;
      if (!dd) return;
      // ElementUI 的 Dropdown 暴露的是 hide(),不同版本可能叫 handleClose()
      if (typeof dd.hide === 'function') {
        dd.hide();
      } else if (typeof dd.handleClose === 'function') {
        dd.handleClose();
      }
    },
    /**
     * 复制视图(需求 LP262002 7.1.2.2)。
     *
     * <p>复制逻辑在后端:前端只把被复制的视图 id 传过去,条件树 / 排序 / 视图名
     * 全部由后端生成 —— 后端按「原名 + -复制」命名,重名就继续往后拼,
     * 不用前端自己拼名字(自己拼会撞唯一索引,也会出现名字越堆越长)。</p>
     *
     * <p>复制成功后抛 copy 事件,由宿主页面负责复制该视图的表格配置
     * (表格配置存在 userDefineTable,按视图 id 关联,不在本组件的职责内)。</p>
     *
     * <p><b>复制不关闭下拉菜单</b>:复制不会打开弹窗,菜单留着更顺手,
     * 只把列表刷新一遍即可看到新视图。其余操作(编辑 / 删除)会开弹窗,
     * 必须先关闭菜单,否则菜单会盖在弹窗上面。</p>
     *
     * @param {Object|null} preset 传 null 表示复制「系统视图」
     */
    async onCopyView (preset) {
      const isSystem = !preset;
      try {
        // 复制逻辑在后端:只传被复制的视图 id。
        // 复制「系统视图」时系统视图没有落库记录,后端新建一个空视图,
        // 名称以系统视图文案为基础(后端统一追加「-复制」,重名继续往后拼)。
        const res = await customQueryViewApi.copy({
          id: preset ? preset.id : null,
          viewName: isSystem ? this.defaultLabel : null,
          bizKey: this.bizKey
        });
        const newId = res && res.id;
        const newName = (res && res.viewName) || '';
        // 刷新下拉内容,不关闭下拉(复制不涉及弹窗,菜单可以一直开着)
        await this.loadPresets();
        this.$message.success(`已复制为视图「${newName}」`);
        this.$emit('copy', {
          sourceId: preset ? preset.id : null,
          newId: newId || null,
          sourceIsSystem: isSystem
        });
      } catch (e) {
        // axios 拦截器已提示,此处不重复弹错
      }
    },
    /**
     * 设为默认视图(需求 LP262002 7.1.2.2)。
     *
     * <p>调后端 setDefault 接口:{ id, defaultIs }。</p>
     * <p>「系统视图」是虚拟项(后端无记录),所以把它设为默认 =
     * 取消当前默认用户视图的默认标记,系统视图自然回落为默认。</p>
     *
     * <p><b>设为默认不关闭下拉菜单</b>:设置默认只是改一个标记,不会打开弹窗,
     * 菜单留着更顺手(可以接着点别的视图),只把列表刷新一遍即可看到「默」徽标的变化。</p>
     *
     * @param {Object|null} preset 传 null 表示把「系统视图」设为默认
     */
    async onSetDefault (preset) {
      try {
        if (preset) {
          await customQueryViewApi.setDefault({ id: preset.id, defaultIs: true });
        } else {
          const current = this.presets.find(p => p.defaultIs === true);
          if (!current) {
            this.$message.info('系统视图已是默认视图');
            return;
          }
          await customQueryViewApi.setDefault({ id: current.id, defaultIs: false });
        }
        // 刷新下拉内容,不关闭下拉(设为默认不涉及弹窗)
        await this.loadPresets();
        this.$message.success(preset
          ? `已将视图「${preset.name}」设为默认`
          : '已将系统视图设为默认');
      } catch (e) {
        // axios 拦截器已提示,此处不重复弹错
      }
    },
    /**
     * 按视图 id 应用视图(不经过下拉点击),用于自动选中默认视图。
     *
     * @param {String} id
     * @returns {Promise<Boolean>} 是否真的应用成功(视图不存在/未通过性能测试/详情加载失败 → false)
     */
    async applyPresetById (id) {
      const preset = this.presets.find(p => p.id === id);
      if (!preset) return false;
      if (!this.localApply && preset.perfStatus !== PERF_STATUS.PASSED) {
        // 未通过性能测试的视图不自动应用
        return false;
      }
      return await this.applyPreset(preset);
    },
    onEditView (preset) {
      this.editingPresetId = preset.id;
      this.closeDropdown();
      this.dialogVisible = true;
    },
    onDeleteView (preset) {
      this.closeDropdown();
      this.$confirm(`确认删除视图「${preset.name}」?删除后不可恢复。`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await customQueryViewApi.deleteItems([preset.id]);
          await this.loadPresets();
          if (this.activePresetId === preset.id) {
            this.handleClearPreset();
          }
          this.$message.success('已删除视图');
        } catch (e) {
          this.loadPresets();
        }
      }).catch(() => {});
    },
    async onDropdownCommand (cmd) {
      if (cmd === '__default__') {
        this.handleClearPreset();
        return;
      }
      if (cmd === '__new__') {
        this.$emit('update:activePresetId', null);
        this.$emit('input', null);
        this.editingPresetId = null;
        this.dialogVisible = true;
        return;
      }
      const preset = this.presets.find(p => p.id === cmd);
      if (!preset) return;
      // 本地生效模式:视图由业务页面在本地应用,不走后端查询,故不校验性能测试状态
      if (!this.localApply && preset.perfStatus !== PERF_STATUS.PASSED) {
        this.$message.warning(`视图「${preset.name}」未通过性能测试,不能用于查询,请先在管理视图中完成测试`);
        return;
      }
      // 重复选择当前已锁定视图:activePresetId 值不变,mixin watch 不触发,
      // 且锁定态下页面刷新按钮被禁用,故这里走 refresh 通道强制刷新一次
      if (cmd === this.activePresetId) {
        this.$emit('refresh');
        this.$message.success(`已刷新视图「${preset.name}」`);
        return;
      }
      await this.applyPreset(preset);
    },
    // 选中视图:同步条件/排序/选中态到外层,由 store 驱动业务页按视图查询
    // options.silent = true 时不弹「已应用视图」提示
    // (弹窗保存成功后会自动应用视图,那一步已有「保存成功/性能测试通过」提示,
    //  再弹一次会变成连续三条 toast)
    // 返回值:是否真的应用成功(详情加载失败 → false)
    async applyPreset (preset, options) {
      const silent = !!(options && options.silent);
      try {
        const data = await customQueryViewApi.getDetail(preset.id);
        if (!data) return false;
        const tree = data.conditionTree ? JSON.parse(data.conditionTree) : null;
        // 排序:优先 sortJson(多字段,需求 LP262002 7.1.2.2),
        // 历史数据(无 sortJson)回落到旧的 sortField / sortOrder 单字段。
        const sortColumns = toSortColumns(resolveSortList(data));
        this.$emit('update:activePresetId', preset.id);
        this.$emit('input', tree);
        this.$emit('update:sortColumns', sortColumns);
        this.$emit('change', {
          conditions: tree,
          sortColumns,
          activePresetId: preset.id
        });
        if (!silent) {
          this.$message.success(this.localApply
            ? `已应用视图「${preset.name}」`
            : `已使用视图「${preset.name}」,表单已锁定`);
        }
        return true;
      } catch (e) {
        this.$message.error('加载视图详情失败');
        return false;
      }
    },
    // 保存弹窗测试通过后应用视图:刷新列表并选中;编辑的是当前已选中视图时走 refresh 通道
    async onDialogUpdatePresetId (id) {
      if (!id) return;
      await this.loadPresets();
      if (id === this.activePresetId) {
        this.$emit('refresh');
        return;
      }
      // 保存后不自动切换视图:autoApplyAfterSave = false 时保持用户当前选择,
      // 刚保存的视图由用户自己在下拉里点选生效
      if (!this.autoApplyAfterSave) return;
      const preset = this.presets.find(p => p.id === id);
      // 弹窗保存成功后自动应用视图:静默(提示语由保存流程自己给)
      if (preset) this.applyPreset(preset, { silent: true });
    },
    /**
     * 弹窗保存成功时透传其 save 载荷(如表格列配置)。
     * 内置 CustomQueryDialog 不触发该事件,故仅自定义弹窗会有内容。
     */
    onDialogSave (payload) {
      this.$emit('save', payload);
    }
  }
};
</script>

<style lang="scss" scoped>
.m-custom-view {
  display: inline-block;
  &__trigger {
    ::v-deep &>span {
      display: flex;
      align-items: center;
    }
    &_text {
      max-width: 155px;
      display: inline-block;
    }
  }
  &__clear {
    margin-left: 6px;
    padding: 0 4px;
    font-size: 14px;
    border-radius: 50%;
    &:hover {
      color: var(--leap-color-primary);
    }
  }
  &__search {
    padding: 2px 10px 10px 10px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 6px;
  }
  &__list {
    max-height: 250px;
    overflow-y: auto;
    // 始终预留滚动条宽度:否则列表出现滚动条时,列表里的行会比
    // 列表外的「系统视图」行窄 6px,两者的「默」徽标/操作区就对不齐了
    scrollbar-gutter: stable;
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
  }
  // 拖拽行容器:vuedraggable 的 item 必须是真实元素,
  // 原来直接 v-for 在 el-dropdown-item 上,现在多包一层 div 承载拖拽
  &__row {
    position: relative;
  }
  // 拖拽手柄:只有按住它才能拖,避免与点击选择视图/下拉项冲突
  &__handle {
    cursor: move;
    color: #c0c4cc;
    margin-right: 6px;
    flex-shrink: 0;
    &:hover {
      color: var(--leap-color-primary);
    }
  }
  &__empty {
    padding: 12px;
    text-align: center;
    color: #909399;
    font-size: 12px;
  }
  &__label {
    // 名称不伸展,只在放不下时收缩(伸展会把后面的固定列挤到不同位置)
    flex: 0 1 auto;
    min-width: 0;
    // 与名称列宽一致,超长名称在此截断并显示省略号
    max-width: 155px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
  }
  // 性能测试状态标签:固定列,各行「已通过 / 待测试」位置对齐
  &__perf-slot {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    width: 56px;
    margin-left: 6px;
    flex: none;
  }
  &__perf {
    margin-left: 8px;
    height: 18px;
    line-height: 18px;
    padding: 0 6px;
  }
  &__actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    // 各功能键的视觉间隔统一由各自的 padding 控制(见 __action / __text-action),
    // 这里 gap 归零,避免图标与文字的间隔不一致
    gap: 0;
    // 宽度不写死:由所在 grid 列(见 __item 的 --m-cv-action-col)决定,
    // 内容在列内右对齐。
    // 之前写死 152px + margin-left 12px,而实际内容(3 个图标 + 「复制」文字)只有 ~95px,
    // 右对齐后左侧空出约 55px —— 表现为「设为默认」与操作区之间出现一个大洞。
    // 各行操作项数量不同(系统视图只有「复制」)不影响对齐:
    // 右对齐保证「复制」在所有行都贴同一个右边界。
    flex: none;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s;
  }
  &__action {
    padding: 4px;
    // ElementUI 全局样式有 `.el-dropdown-menu__item i { margin-right: 5px; }`,
    // 会给下拉项里的每个图标加 5px 右边距 —— 造成图标之间(8+5=13px)
    // 比图标到「复制」文字(8px)的间隔大一倍,且操作区总宽比预期多 15px。
    // 这里显式归零,让间隔完全由各自的 padding 决定,各操作项之间保持一致。
    margin-right: 0;
    border-radius: 3px;
    font-size: 13px;
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.08);
      color: var(--leap-color-primary);
    }
    &--danger:hover {
      color: var(--leap-color-danger);
    }
    &.el-icon-check{
      position: absolute;
      right: 0px;
    }
  }
  // 下拉行:用 grid 显式定义各列宽度,保证每一行的各元素严格对齐。
  // (flex 布局下名称区宽度会随名称长度变化,后面的固定列就会各行错位)
  &__item {
    // 右侧留 12px:操作区最后一项(「复制」)不贴下拉边缘
    padding: 0 12px 0 12px;
    display: grid;
    align-items: center;
    column-gap: 4px;
    // 操作区列宽:按该模式下操作项的实际宽度预留。
    // 纯图标(置顶/编辑/删除)每个 13px 字形 + 左右 4px padding = 21px,3 个 = 63px;
    // 带「复制」文字再加 24px 文字 + 8px padding = 32px,合计 95px。
    // 列宽必须固定,否则各行的弹性名称列宽度不同,后面的列就会错位;
    // 但也不能留富余,否则右对齐后左侧会空出一段死空间。
    --m-cv-action-col: 64px;
    // 默认列:首列(手柄/系统标识) + 名称 + 操作区
    //
    // 名称列固定 155px(与改动前 __label 的 max-width 一致):
    // 用 1fr 弹性列时,grid 容器按名称的 max-content 撑开,
    // 视图名一长整个下拉就被顶宽(各行宽度还不一致)。
    // 固定宽度后:下拉整体宽度恒定,超长名称在 155px 内省略号截断。
    grid-template-columns: 22px minmax(0, 155px) var(--m-cv-action-col);
    position: relative;
    // 性能测试状态列
    &--perf {
      grid-template-columns: 22px minmax(0, 155px) 56px var(--m-cv-action-col);
    }
    // 默认标记位列:宽度 = 「设为默认」文字盒宽度(48px 文字 + 4px 左 padding),
    // 「默」徽标(16px)左对齐后与文字从同一位置开始,切换时原地替换。
    &--default {
      --m-cv-action-col: 96px;
      grid-template-columns: 22px minmax(0, 155px) 52px var(--m-cv-action-col);
    }
    // 两列都有
    &--perf.m-custom-view__item--default {
      --m-cv-action-col: 96px;
      grid-template-columns: 22px minmax(0, 155px) 56px 52px var(--m-cv-action-col);
    }
    &.is-active {
      color: var(--leap-color-primary);
      // 不要再加 padding-right:原先是给行尾的 ✓ 图标留位,
      // ✓ 已移除;多出的 padding 会让该行可用宽度少一截,
      // 导致 grid 的弹性名称列变窄、后面各列整体左移,行与行之间就对不齐了
    }
    // 滚动列表之外的行(系统视图 / 新增视图):
    // 列表内因为有滚动条,行宽比菜单内容区少 6px;
    // 这些行要补上同样的 6px 右侧留白,右边界才与列表内的行对齐
    &--outside {
      padding-right: 18px;
    }
  }
  &__cnt {
    display: flex;
    align-items: center;
  }
  // 首列:拖拽手柄 / 系统标识,固定宽度,保证各行的后续列对齐
  &__lead {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    flex: none;
  }
  // 「系 / 默」标识:固定显示,用于区分系统视图与默认视图
  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: 4px;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-size: 10px;
    line-height: 1;
    color: #606266;
    flex: none;
  }
  // 默认标记位:「默」徽标与「设为默认」文字占同一位置,宽度固定,切换时布局不跳动
  &__default-slot {
    display: inline-flex;
    align-items: center;
    // 左对齐:「默」徽标与「设为默认」文字从同一位置开始,切换时原地替换
    justify-content: flex-start;
    // 宽度 =「设为默认」文字盒宽度(4 个汉字 @12px = 48px + 左 padding 4px),
    // 不留富余 —— 富余的宽度会变成「设为默认」右侧的一段空白,
    // 把这一列与操作区之间的间隔撑得比其它项大。
    width: 52px;
    // 不要加 margin-left:槽宽已经等于 grid 列宽,再加 margin 会让槽盒溢出列宽,
    // 把 grid 的 column-gap 顶掉(表现为「设为默认」紧贴操作区)。
    // 槽内元素自身的左缩进由徽标的 margin-left / 文字的左 padding 承担。
    flex: none;
    .m-custom-view__badge {
      // 与「设为默认」文字的左边缘对齐(文字左侧也有 4px padding)
      margin-left: 4px;
    }
    // 「设为默认」去掉右 padding:让它正好占满 52px 的槽,
    // 右边缘与槽右对齐,「设为默认」到首个操作项的间隔才等于操作项之间的间隔
    .m-custom-view__text-action {
      padding: 0 0 0 4px;
    }
  }
  // 文字操作链接(复制 / 设为默认)
  &__text-action {
    // 左右 padding 与图标操作保持一致,视觉间隔统一
    padding: 0 4px;
    font-size: 12px;
    line-height: 18px;
    color: var(--leap-color-primary);
    cursor: pointer;
    white-space: nowrap;
    &:hover {
      text-decoration: underline;
    }
  }
  // 视图名称区:占据除操作区外的全部剩余空间。
  // item 是 flex + space-between,若名称区按内容宽度自适应,
  // 短名称的行会把这部分富余空间分配到名称左侧,导致各行文字起始位置不一致
  // (表现为「视图名前面有空格」,实际数据里并没有空格)。
  // 名称区改为 flex:1 后富余空间被它吸收,文字始终紧贴拖拽手柄。
  &__cnt--name {
    // 名称列已按 minmax(0, 155px) 定宽,这里只需允许内部文本收缩并截断
    min-width: 0;
    overflow: hidden;
  }
  // 操作区:靠右贴边(grid 最后一列,宽度固定)
  &__cnt--action {
    justify-content: flex-end;
  }
  &__divided {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--leap-color-primary);
    transform: translateY(3px);
    &::before {
      margin: 0;
    }
    &:hover {
      background: #fff;
      color: var(--leap-color-primary);
    }
  }
  ::v-deep .el-dropdown-menu__item &__perf.el-tag {
    margin-left: 4px;
    height: 18px;
    line-height: 18px;
    padding: 0 6px;
  }
  ::v-deep .el-dropdown-menu__item:hover &__actions {
    opacity: 1;
  }
}
</style>
