<template>
  <div :class="disabled?'tag-input disabled':'tag-input'">
    <div class="tag-list">
      <!-- 最大渲染100条，避免数据量过大页面卡死情况 -->
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
          +{{ tagList.length - 1 }}
        </span>
      </tag>

      <div
        v-if="tagList.length===0"
        class="placeholder"
      >
        {{ placeholder }}
      </div>
    </div>
    <div
      class="action"
      :class="disabled?'disabled':''"
    >
      <el-popover
        placement="bottom"
        width="400"
        trigger="click"
        @hide="handleHide"
        @show="handleShow"
      >
        <div>
          <el-input
            v-model="inputValue"
            type="textarea"
            :clearable="true"
            :autosize="{ minRows: 2, maxRows: 8}"
            placeholder="请输入内容"
          />
          <div>
            <div style="display: inline">
              <el-button
                type="primary"
                size="mini"
                style="margin-top: 10px"
                @click="handleInput"
              >
                确定
              </el-button>
              <el-button
                type="warning"
                size="mini"
                style="margin-top: 10px"
                @click="handleClear"
              >
                清空
              </el-button>
            </div>
            <div style="float: right;margin-top: 5px">
              已输入{{ inputSize }}条
            </div>
          </div>
        </div>
        <i
          slot="reference"
          class="el-icon-document-copy"
          style="color: #909399"
        />
      </el-popover>
    </div>
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
      tagList: []
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
    inputValue2Array () {
      const splitArray = this.inputValue.split(/[\s]/);
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
    },
    handleShow () {
      this.inputValue = this.tagList.join('\n');
    }
  }
};
</script>

<style scoped lang="scss">
.tag-input {
  height: 32px;
  width: 100%;
  min-height: 12px;
  border: 1px solid #e6e6e5;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: flex-start;
  justify-content: space-between;
  max-height: 80px;
  &:hover {
    border-color: #9D9F9D;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    max-height: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    .tag {
      height: 24px;
    }
  }

  .placeholder {
    color: #9D9F9D;
    font-size: 13px;
    margin-left: 8px;
  }
  .action {
    margin-right: 4px;
    cursor: pointer;
  }
}

.disabled {
  pointer-events: none;
  background-color: #F5F7FA;
  border-color: #E4E7ED;
}
.disabled:hover {
  cursor: not-allowed;
}
</style>
