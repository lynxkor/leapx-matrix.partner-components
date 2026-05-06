<template>
  <div :class="['tag-input', disabled ? 'disabled' : '', isFocused ? 'focused' : '']">
    <!-- 输入框区域 - 支持单条输入 -->
    <div :class="['tag-list', isFocused ? 'focused' : '']" @click="handleTagListClick">
      <tag
        v-for="(item, index) in tagList.slice(0, 1)"
        :key="index"
        closable
        :disable-transitions="false"
        @close="handleClose(item)"
      >
        <span>
          <el-tooltip
            class="item"
            effect="dark"
            :content="item"
            placement="top-start"
          >
            <span>{{ item }}</span>
          </el-tooltip>
        </span>
      </tag>

      <tag
        v-if="tagList.length > 1"
        :closable="false"
      >
        <span>
          + {{ tagList.length - 1 }}
        </span>
      </tag>

      <!-- 单条输入框 -->
      <div class="single-input-wrapper" v-if="tagList.length === 0">
        <input
          ref="singleInput"
          v-model="singleInputValue"
          class="single-input"
          :placeholder="placeholder"
          @focus="handleSingleInputFocus"
          @blur="handleSingleInputBlur"
          @keyup.enter="handleSingleInputEnter"
        />
      </div>

      <i
        v-if="tagList.length > 0"
        class="el-icon-circle-close clear-icon"
        @click.stop="handleClearSingleInput"
      />
    </div>

    <!-- 批量输入按钮 -->
    <el-popover
      ref="popoverRef"
      v-model="popoverVisible"
      placement="bottom"
      width="400"
      trigger="manual"
      @hide="handleHide"
      @show="handleShow"
    >
      <div>
        <el-input
          ref="popoverInputRef"
          v-model="inputValue"
          type="textarea"
          :clearable="true"
          :autosize="{ minRows: 2, maxRows: 8}"
          placeholder="请输入内容"
        />
        <div>
          <div class="footer-tips">
            已输入{{ inputSize }}条
          </div>
          <div class="footer-btns">
            <el-button
              size="mini"
              @click="handleClear"
            >
              清空
            </el-button>
            <el-button
              type="primary"
              size="mini"
              @click="handleConfirm"
            >
              确定
            </el-button>
          </div>
        </div>
      </div>
      <div class="action" slot="reference" :class="disabled?'disabled':''" @click="handleOpenPopover">
        <el-button :disabled="disabled">
          <i class="iconfont icon-lxppc-database-search"/>
        </el-button>
      </div>
    </el-popover>
  </div>
</template>

<script>
import Tag from './tag.vue';

export default {
  name: 'TagInput',
  components: { Tag },
  props: {
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    value: {
      // 输入的值
      type: Array,
      default: function () {
        return [];
      }
    }
  },
  data () {
    return {
      inputSize: 0,
      inputValue: null,
      tagList: [],
      singleInputValue: '',
      isFocused: false,
      popoverVisible: false
    };
  },
  watch: {
    tagList: {
      handler (newVal) {
        this.$emit('input', newVal);
      }
    },
    inputValue () {
      const array = this.inputValue2Array();
      this.inputSize = array.length;
    },
    value: function (newVal) {
      this.tagList = newVal;
    }
  },
  methods: {
    // 点击输入框区域
    handleTagListClick () {
      if (this.disabled) return;
      if (this.tagList.length > 0) {
        this.handleOpenPopover();
      } else {
        this.$refs.singleInput?.focus();
      }
    },
    handleOpenPopover () {
      this.popoverVisible = true;
      this.$nextTick(() => {
        this.$refs.popoverInputRef?.focus();
      });
    },
    // 单条输入 - 获得焦点
    handleSingleInputFocus () {
      this.isFocused = true;
    },
    // 单条输入 - 失去焦点时添加
    handleSingleInputBlur () {
      this.isFocused = false;
      this.addSingleInput();
    },
    // 单条输入 - 回车时添加
    handleSingleInputEnter () {
      this.addSingleInput();
    },
    // 添加单条输入内容
    addSingleInput () {
      const value = this.singleInputValue.trim();
      if (value && !this.tagList.includes(value)) {
        this.tagList = [...this.tagList, value];
      }
      this.singleInputValue = '';
    },
    handleClose (tag) {
      this.$emit('tagClose', tag);
      this.tagList.splice(this.tagList.indexOf(tag), 1);
    },
    handleInput () {
      if (!this.inputValue) {
        this.tagList = [];
        return;
      }
      this.tagList = this.inputValue2Array();
    },
    handleConfirm () {
      this.handleInput();
      this.popoverVisible = false;
    },
    handleClearSingleInput () {
      this.tagList = [];
      this.$refs.singleInput.focus();
    },
    inputValue2Array () {
      // console.log('inputValue2Array', this.inputValue);
      // const splitArray = this.inputValue.split(/[\s]/);
      const splitArray = this.inputValue.split(/\n/);
      const set = new Set();
      for (const splitArrayElement of splitArray) {
        if (splitArrayElement) {
          set.add(splitArrayElement);
        }
      }
      return Array.from(set);
    },
    handleClear () {
      this.inputValue = '';
    },
    handleHide () {
      this.handleClear();
      this.popoverVisible = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    handleShow () {
      this.inputValue = this.tagList.join('\n');
      document.addEventListener('click', this.handleClickOutside);
    },
    handleClickOutside (e) {
      const popoverEl = this.$refs.popoverRef?.$el;
      const tagListEl = this.$el.querySelector('.tag-list');
      if (popoverEl && !popoverEl.contains(e.target) && !tagListEl?.contains(e.target)) {
        this.popoverVisible = false;
      }
    }
  },
  beforeDestroy () {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style scoped lang="scss">
.tag-input {
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  max-height: 80px;
  position: relative;
  &:hover {
    border-color: #9D9F9D;
  }
  &>span {
    display: inline-block;
  }

  .tag-list {
    flex: 1;
    border: 1px solid #e6e6e5;
    border-radius: 4px;
    height: 32px;
    display: flex;
    align-items: center;
    cursor: text;
    padding: 0 8px;
    &:hover {
      border-color: #9D9F9D;
    }

    &.focused {
      border-color: var(--leap-color-primary);
    }
    .tag {
      height: 24px;
    }
    .single-input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      position: relative;
      .single-input {
        flex: 1;
        border: none;
        outline: none;
        height: 32px;
        line-height: 30px;
        font-size: 13px;
        background: transparent;
        &::placeholder {
          color: #9D9F9D;
        }
      }
    }

    .clear-icon {
      font-size: 14px;
      color: #c0c4cc;
      cursor: pointer;
      margin-left: 4px;
      display: none;
      position: absolute;
      right: 50px;
      &:hover {
        color: #909399;
      }
    }

    &:hover .clear-icon {
      display: block;
    }
  }

  .placeholder {
    color: #9D9F9D;
    font-size: 13px;
    margin-left: 8px;
  }
  .action {
    margin-left: 4px;
    cursor: pointer;
  }
  .el-button {
    padding: 6px 8px;
    font-size: 16px;
  }
}

.disabled {
  pointer-events: none;
  background-color: #F8F7F7;
  border-color: #E6E6E5;
  color: #CECFCE;
}
.disabled:hover {
  cursor: not-allowed;
}
.footer-tips{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 5px;
  color: var(--leap-color-default-light-1);
  font-size: 12px;
}
.footer-btns{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
  .el-button{
    font-weight: 400;
  }
}
</style>
