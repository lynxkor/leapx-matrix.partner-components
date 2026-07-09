<script>
/**
 * AisAttachment 组件 - 通用附件上传组件
 * @property {string|number} businessId - 业务ID，详情页或者编辑页的id
 * @property {String} configCode - 实体名称 https://cepsit.leapmotor.com -> 附件管理 -> 附件类型配置
 * @property {String} attachType - 附件类型 https://cepsit.leapmotor.com -> 附件管理 -> 附件类型配置
 * @property {boolean} readonly - 是否只读模式，默认为 false
 *                        true: 仅展示附件，不允许上传和删除
 *                        false: 允许上传和管理附件
 * @property {Object} uploadConfig - 自定义上传配置，当 configCode 为空时生效
 * @property {string} uploadConfig.acceptSuffix - 允许上传的文件后缀，多个用逗号分隔
 * @property {number} uploadConfig.maxSize - 单个文件最大大小，单位：MB
 * @property {number} uploadConfig.maxNum - 最大上传数量，0 表示无限制
 * @property {number} uploadConfig.minNum - 最少上传数量，0 或不传表示不限制
 * @property {string} uploadConfig.required - 是否必填，'0': 非必填，'1': 必填
 * @property {boolean} noEcho - 是否不回显附件，默认为 false
 * @property {string} hint - 非card模式下，附件区域下方的自定义提示文案
 *                      true: 每次打开都是新的，不显示历史附件
 *                      false: 显示历史上传的附件
 * @event upload-loading-change - 监听上传文件loading变化
 * @method validate - 校验附件是否满足必填/最小数量/最大数量规则，返回 Promise<boolean>
 *        readonly 模式不校验,直接返回 true
 *        若 configCode 已传但 internalUploadConfig 尚未回写(异步加载),内部会先 await 一次配置
 *        options.silent: true 时不弹错误提示,仅返回校验结果
 * @example
 * <!-- 基本用法 - 后端校验规则-->
    <AisAttachment
      :businessId="_id"
      configCode="xxxxxx"
      attachType="其他"
    />

    // 仅展示模式
    <AisAttachment
      :businessId="_id"
      configCode="xxxxxx"
      attachType="其他"
      :readonly="true"
    />

    // 使用前端默认校验规则
    <AisAttachment
      :businessId="_id"
      ref="attachment"
    />

    // 自定义校验规则
    <AisAttachment
      :businessId="_id"
      :uploadConfig={
        acceptSuffix: ".png,.jpg,.jpeg,.gif,.pdf,.ppt,.pptx,.xlsx,.xls,.docx,.doc,.rar,.zip,.mp4",
        maxSize: 50, // 50M
        maxNum: 0,
        required: '0',
      }
    />

    // 不回显模式
    <AisAttachment
      :businessId="_id"
      :noEcho="true"
      ref="attachment"
    />

    // 9宫格样式
    <AisAttachment
      :businessId="_id"
      configCode="mcs_spmusedprtdestory_apply"
      attachType="其他"
      ref="attachment"
      type="card"
      title="车辆信息"
      @ocr-success="ocrSuccess"
      :businessData="businessData"
    />

    * @example
    * // 获取所有附件
    * const allFiles = this.$refs.attachment.getFileList();
    * console.log('总附件数:', allFiles.length);
    *
    * // 获取新增的附件
    * const newAttachments = this.$refs.attachment.getAttachment();
    * await submitForm({ attachments: newAttachments });
    *
    * // 手动更新附件内容
    * this.$refs.attachment.update();
 */
</script>
<template>
  <div v-if="readonly && !fileList.length && emptyText" class="ais-attachment-empty">
    {{ emptyText }}
  </div>
  <ais-upload
    v-else
    v-model="fileList"
    :business-id="businessId"
    :attach-type="attachType"
    :isAttached="effectiveIsAttached"
    :configCode="configCode"
    :show-upload="true"
    :readonly="readonly"
    :uploadConfig="internalUploadConfig"
    :hint="hint"
    @update="update"
    @addParam="addParam"
    @removeParam="removeParam"
    v-bind="$attrs"
    v-on="$listeners"
    />
</template>

<script>
import AisUpload from './AisUpload';
import { getByCode, getFileList } from '../../api/attachment';
import { isFileType } from '../../utils/file.js';
// 根据 configCode 进行缓存
const attachmentConfigCache = new Map();
// 请求防抖缓存 - 防止同时发起多个相同请求
const pendingRequests = new Map();

export default {
  name: 'AisAttachment',
  components: {
    AisUpload
  },
  props: {
    businessId: {
      type: [String, Number],
      default: '',
    },
    /**
     * 不传configCode时
     *  1.启用uploadConfig配置项
     *  2.不会调用getByCode接口
     *  3.不会关联单据，上传后需要手动调用getAttachment接口获取附件列表，进行后续操作
     */
    configCode: {
      type: String,
    },
    /**
     * 是否在上传时自动关联到单据 businessId
     * 不传（默认 null）：取 Boolean(configCode)，即传了 configCode 就自动绑定（向后兼容）
     * 传 false：即使传了 configCode（使用后端校验配置），上传后也不自动绑定，
     *           由业务调用 getAttachment() 收集附件自行提交
     */
    isAttached: {
      type: Boolean,
      default: null,
    },
    attachType: {
      type: String,
    },
    readonly: {
      type: Boolean,
      default: false
    },
    uploadConfig: {
      type: Object,
      default: () => null,
    },
    // 是否为不回显
    noEcho: {
      type: Boolean,
      default: false
    },
    // 业务数据json, 根据业务数据、附加条件，动态判断附件是否必传
    businessData: {
      type: String,
      default: '',
    },
    // readonly 且无附件时显示的空状态提示文案
    emptyText: {
      type: String,
      default: '',
    },
    // 非card模式下，附件区域下方的自定义提示文案
    hint: {
      type: String,
      default: '',
    },
  },
  data () {
    /**
     * 组件数据
     * @property {Object} internalUploadConfig - 内部使用的上传配置
     * @property {string} internalUploadConfig.acceptSuffix - 默认支持的文件后缀
     * @property {number} internalUploadConfig.maxSize - 默认最大文件大小（50MB）
     * @property {number} internalUploadConfig.maxNum - 默认最大上传数量（0表示无限制）
     * @property {string} internalUploadConfig.required - 默认是否必填（'0'表示非必填）
     * @property {Array} fileList - 附件列表数据
     * @property {boolean} loading - 加载状态
     * @property {Array} attachFileList - 手动提交使用的附件列表
     */
    return {
      internalUploadConfig: {
        acceptSuffix: ".png,.jpg,.jpeg,.gif,.pdf,.ppt,.pptx,.xlsx,.xls,.docx,.doc,.rar,.zip,.mp4",
        maxSize: 50, // 50M
        maxNum: 0,
        required: '0', // '0', '1'
        needOcr: '0', // '0', '1'
      },
      fileList: [],
      loading: false,
      attachFileList: [],
    };
  },
  watch: {
    /**
     * 监听器
     * @listens businessId - 监听业务ID变化，重新初始化附件数据
     * @listens uploadConfig - 监听上传配置变化，更新内部配置（当configCode为空时）
     */
    businessId: {
      handler (newVal) {
        if (newVal) {
          this.init();
        }
      },
      immediate: true
    },
    uploadConfig: {
      handler (newVal) {
        if (newVal) {
          this.internalUploadConfig = newVal;
        }
      },
      deep: true,
      immediate: true,
    },
    businessData: {
      handler (newVal) {
        this.loadAttachmentConfig(this.configCode, this.attachType, true);
      },
      deep: true,
    }
  },
  computed: {
    effectiveIsAttached () {
      return this.isAttached === null ? Boolean(this.configCode) : this.isAttached;
    },
  },
  methods: {
    /**
     * 初始化附件数据 - 通用方法
     * @param {string} configCode - 配置代码
     * @param {Array<String>} attachType - 附件类型数组
     * @param {string|number} businessId - 业务ID
     * @param {Function} onSuccess - 成功回调函数 (可选)
     * @param {Function} onError - 错误回调函数 (可选)
     */
    async initAttachmentData (configCode, attachType, businessId, onSuccess = null, onError = null) {
      try {
        this.loading = true;
        // 第一步：获取配置
        await this.loadAttachmentConfig(configCode, attachType);
        // 第二步：获取文件列表
        await this.loadAttachmentFiles(businessId, attachType, this.noEcho);

        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (error) {
        this.$message?.error('初始化附件数据失败');

        if (onError && typeof onError === 'function') {
          onError(error);
        }
      } finally {
        this.loading = false;
      }
    },

    /**
     * 加载附件配置
     * @param {string} configCode - 配置代码
     * @param {String} attachType
     * @param {String} isRefresh 是否需要获取最新数据
     */
    async loadAttachmentConfig (configCode, attachType, isRefresh) {
      try {
        // 走后端的校验配置
        if (configCode && !this.uploadConfig) {
          let data = null;

          // 检查缓存
          if (attachmentConfigCache.has(configCode) && !isRefresh) {
            data = attachmentConfigCache.get(configCode);
          } else {
            // 检查是否有正在进行的相同请求
            if (pendingRequests.has(configCode)) {
              // 等待正在进行的请求完成
              data = await pendingRequests.get(configCode);
            } else {
              // 创建新的请求 Promise
              const requestPromise = getByCode({
                configCode,
                businessData: this.businessData,
              }).then(response => {
                const result = response;
                // 缓存结果
                if (result) {
                  attachmentConfigCache.set(configCode, result);
                }
                // 请求完成后清除 pending
                pendingRequests.delete(configCode);
                return result;
              }).catch(error => {
                // 请求失败也要清除 pending
                pendingRequests.delete(configCode);
                throw error;
              });

              // 将请求加入 pending
              pendingRequests.set(configCode, requestPromise);
              data = await requestPromise;
            }
          }

          if (data && data.detailList) {
            this.internalUploadConfig = data.detailList.find(config => config.attachType === attachType);
          } else {
            throw new Error('获取配置数据失败');
          }
        }
      } catch (error) {
        console.error('获取附件配置失败:', error);
        throw error;
      }
    },

    /**
     * 加载附件文件列表
     * @param {string|number} businessId - 业务ID
     */
    async loadAttachmentFiles (businessId, attachType, noEcho) {
      if (!businessId) {
        return;
      }
      // 首次加载不回显
      if (noEcho) {
        return;
      }

      try {
        const response = await getFileList({
          businessId: businessId,
          attachType: attachType
        });
        this.fileList = (response || []).map(file => {
          // fileName 可能为 null（如 HEIC 文件），从 fileUrl 末段提取兜底名
          const fallbackName = file.fileUrl ? file.fileUrl.split('/').pop()?.split('?')[0] : '';
          return {
            id: file.id,
            name: file.fileName || fallbackName || (file.fileType ? `未命名文件.${file.fileType.toLowerCase()}` : '未命名文件'),
            url: file.fileUrl,
            size: file.fileSize,
            fileType: file.fileType,
            isImage: isFileType(file, 'image'),
            isVideo: isFileType(file, 'video'),
            isPdf: isFileType(file, 'pdf'),
            isExcel: isFileType(file, 'excel'),
            isWord: isFileType(file, 'word'),
            isPPT: isFileType(file, 'ppt'),
            isText: isFileType(file, 'text'),
            isZip: isFileType(file, 'zip'),
            isRar: isFileType(file, 'rar'),
            response: file,
          };
        });
      } catch (error) {
        console.log(error);
      }
    },
    // 初始化附件数据
    init () {
      this.initAttachmentData(
        this.configCode,
        this.attachType,
        this.businessId,
        () => {
        },
        (error) => {
        }
      );
    },
    // 更新
    update () {
      this.loadAttachmentFiles(this.businessId, this.attachType, false);
      if (this.internalUploadConfig?.needOcr === '1') {
        this.$emit('ocr-success');
      }
      this.$emit('update', {
        fileList: this.fileList,
        attachFileList: this.attachFileList,
        configCode: this.configCode,
        attachType: this.attachType,
      });
    },
    addParam (param) {
      this.attachFileList.push(param);
    },
    removeParam (param) {
      const index = this.attachFileList.findIndex(item => item?.file?.name === param.name);
      this.attachFileList.splice(index, 1);
    },
    // 获取新增附件
    getAttachment () {
      return this.attachFileList.map(item => item.addOrUpdateParams);
    },
    // 获取所有附件
    getFileList () {
      return this.fileList;
    },
    /**
     * 校验附件是否满足必填/最小数量/最大数量规则
     * 只有 required='1'(必填)时,才会进行 必填 / 最小数量 / 最大数量 的校验
     * required='0' 或未配置时,直接返回 true,跳过所有校验(不校验 minNum / maxNum)
     * readonly 模式也不校验
     * 业务页可配合 Promise.all 批量调用,首个失败即可阻断提交
     * @param {Object} [options] - 校验选项
     * @param {boolean} [options.silent=false] - 为 true 时不弹错误提示,仅返回 boolean
     * @returns {Promise<boolean>} 校验通过返回 true,失败返回 false
     */
    async validate (options = {}) {
      const { silent = false } = options;
      // 只读模式不校验
      if (this.readonly) {
        return true;
      }
      // 配置异步加载时,先确保 internalUploadConfig 已回写
      // 判断条件:有 configCode 且 internalUploadConfig 没有 attachType 字段(回写后会带)
      if (this.configCode && !this.internalUploadConfig?.attachType) {
        try {
          await this.loadAttachmentConfig(this.configCode, this.attachType, true);
        } catch (e) {
          // 配置加载失败,按不阻塞提交处理(由业务页决定)
          if (!silent) {
            this.$message?.warning('附件配置加载失败,已跳过附件校验');
          }
          return true;
        }
      }
      const config = this.internalUploadConfig || {};
      // 非必填时直接放行,不做 minNum / maxNum 校验
      if (String(config.required) !== '1') {
        return true;
      }
      const count = (this.fileList || []).length;
      const attachTypeLabel = this.attachType || '附件';
      // 必填
      if (count < 1) {
        if (!silent) {
          this.$message?.error(`请上传【${attachTypeLabel}】附件`);
        }
        return false;
      }
      // 最小数量
      const minNum = Number(config.minNum);
      if (minNum > 0 && count < minNum) {
        if (!silent) {
          this.$message?.error(`【${attachTypeLabel}】至少上传 ${minNum} 个附件`);
        }
        return false;
      }
      // 最大数量(0 表示不限制)
      const maxNum = Number(config.maxNum);
      if (maxNum > 0 && count > maxNum) {
        if (!silent) {
          this.$message?.error(`【${attachTypeLabel}】最多上传 ${maxNum} 个附件`);
        }
        return false;
      }
      return true;
    },
    // 刷新附件列表
    async refresh () {
      await this.loadAttachmentConfig(this.configCode, this.attachType, true);
      await this.loadAttachmentFiles(this.businessId, this.attachType, false);
    }
  },
};
</script>

<style lang="scss" scoped>
.ais-attachment-empty {
  color: var(--leap-color-default-light-1);
  font-size: 14px;
  line-height: 32px;
  font-weight: normal;
}
.ais-attachment-form {
  .attachment-form {
    display: flex;
    flex-direction: column;

    .el-form-item {
      width: 100%;
    }
  }
}
</style>
