<!--
  加密组件
  受控组件，显示和change事件由父组件控制

  详情页使用
  <LPEncrypted
    :value.sync="info.ownerPhone"
    :decryptMethod="() => getDetailDecryptField(info.id, 'ownerPhone')"
  />

  通过slot注入内容
  <LPEncrypted
    :value.sync="form.vin"
    :decryptMethod="() => getDetailDecryptField(form.id, 'vin')"
  >
    <el-input
      placeholder="请输入"
      v-model="form.vin"
      :disabled="$route.query.id!=null"
      clearable
    />
  </LPEncrypted>
-->

<template>
    <div class="lp-encrypted-container">
      <slot>{{ value }}</slot>
      <i class="iconfont icon-lxppc-eye-off" v-if="!isEncryptedView" @click="switchView()"></i>
      <i class="iconfont icon-lxppc-eye" v-if="isEncryptedView" @click="switchView()"></i>
    </div>
</template>

<script>
export default {
  name: 'LPEncrypted',
  props: {
    // 初始化的加密值
    value: {
      type: [String, Number, Object, Array],
      required: true
    },
    // 解密方法，返回Promise<string>，如() => Promise.resolve(decryptedValue)
    decryptMethod: {
      type: Function,
      required: true
    },
  },
  watch: {
    value (val) {
      // 命中已缓存的密文或明文，视为组件自身切换 emit 引起的变化，跳过
      if (val === this.encryptedData || val === this.decryptedData) {
        return;
      }
      // 外部传入新值（如详情重新加载传入新的脱敏值），重置为初始加密态并刷新缓存
      this.isEncryptedView = true;
      this.encryptedData = val;
      this.decryptedData = null;
    }
  },
  data () {
    return {
      isEncryptedView: true, // 默认加密状态
      encryptedData: null,
      decryptedData: null
    };
  },
  methods: {
    // 加解密数据
    async switchView () {
      if (this.isEncryptedView) {
        this.encryptedData = this.value;
        // 如果已经解密过，直接切换视图
        if (this.decryptedData !== null) {
          this.isEncryptedView = false;
          this.$emit('update:value', this.decryptedData);
          return;
        }
        try {
          // 执行解密
          this.decryptedData = await this.decryptMethod(this.value);
          this.isEncryptedView = false;
          this.$emit('update:value', this.decryptedData);
        } catch (error) {
          this.$emit('error', error);
          console.error('解密失败:', error);
        }
      } else {
        this.isEncryptedView = true;
        this.$emit('update:value', this.encryptedData);
      }
    }
  }
};
</script>

  <style scoped>
  .lp-encrypted-container {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    .iconfont {
      cursor: pointer;
      color: var(--themColor);
      font-size: 14px;
      margin-left: 4px;
    }
  }
  </style>
