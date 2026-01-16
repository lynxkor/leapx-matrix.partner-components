import { getByCode, getFileList } from '@/api/attachment';

export const attachmentMixin = {
  data () {
    return {
      uploadConfigs: [],
      fileLists: {},
      loading: false,
      // 表单相关数据
      form: {},
      formRules: {}
    };
  },

  methods: {
    /**
     * 初始化附件数据 - 通用方法
     * @param {string} configCode - 配置代码
     * @param {string|number} businessId - 业务ID
     * @param {Function} onSuccess - 成功回调函数 (可选)
     * @param {Function} onError - 错误回调函数 (可选)
     */
    async initAttachmentData (configCode, businessId, onSuccess = null, onError = null) {
      try {
        this.loading = true;
        // 第一步：获取配置
        await this.loadAttachmentConfig(configCode);
        // 第二步：获取文件列表
        await this.loadAttachmentFiles(businessId);

        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (error) {
        console.error('初始化附件数据失败:', error);
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
     */
    async loadAttachmentConfig (configCode) {
      try {
        const response = await getByCode(configCode);
        if (response && response.data && response.data.detailList) {
          this.uploadConfigs = response.data.detailList;
          // 初始化每个attachType的文件列表
          this.uploadConfigs.forEach(config => {
            this.$set(this.fileLists, config.attachType, []);
          });
        } else {
          throw new Error('获取配置数据失败');
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
    async loadAttachmentFiles (businessId) {
      if (!this.uploadConfigs.length || !businessId) {
        return;
      }

      try {
        // 一次性调用getFileList，传入businessId
        const response = await getFileList({
          businessId: businessId
        });

        if (response && response.data) {
          // 创建一个映射，按attachType分组文件
          const filesByAttachType = {};

          // 初始化所有attachType的空数组
          this.uploadConfigs.forEach(config => {
            filesByAttachType[config.attachType] = [];
          });

          // 遍历所有文件，按attachType分组
          const allFiles = Array.isArray(response.data) ? response.data : [];
          allFiles.forEach(file => {
            const attachType = file.attachType;
            if (Object.prototype.hasOwnProperty.call(filesByAttachType, attachType)) {
              // 格式化文件数据以匹配AisUpload组件期望的格式
              const formattedFile = {
                attachmentId: file.id || file.attachmentId,
                name: file.fileName || file.name,
                url: file.fileUrl || file.url,
                size: file.fileSize || file.size,
                fileType: file.fileType || this.getFileTypeFromName(file.fileName || file.name),
                response: file
              };
              filesByAttachType[attachType].push(formattedFile);
            }
          });

          // 更新所有attachType的文件列表
          Object.keys(filesByAttachType).forEach(attachType => {
            this.$set(this.fileLists, attachType, filesByAttachType[attachType]);
          });
        }
      } catch (error) {
        console.error('加载附件文件列表失败:', error);
        this.$message?.error('加载附件文件列表失败');
        // 即使加载失败，也确保所有attachType都有空数组
        this.uploadConfigs.forEach(config => {
          this.$set(this.fileLists, config.attachType, []);
        });
        throw error;
      }
    },

    /**
     * 初始化表单数据和验证规则（用于Element UI表单验证）
     * @param {Object} formRef - 表单引用对象（可选，用于自动触发表单验证）
     */
    initFormAndRules (formRef = null) {
      const form = {};
      const rules = {};

      this.uploadConfigs.forEach(configItem => {
        const fieldName = `files_${configItem.attachType}`;
        // 初始化表单数据
        form[fieldName] = this.fileLists[configItem.attachType] || [];

        // 构建验证规则
        const rule = {
          validator: (rule, value, callback) => {
            this.validateAttachment(rule, value, callback, configItem);
          },
          trigger: 'change'
        };

        rules[fieldName] = [rule];
      });

      this.form = form;
      this.formRules = rules;

      // 如果提供了表单引用，可以在这里进行初始验证
      if (formRef) {
        this.$nextTick(() => {
          // 可选：初始时验证所有字段
          // formRef.validate();
        });
      }
    },

    /**
     * 处理文件列表变化（用于Element UI表单验证）
     * @param {Array} newFileList - 新的文件列表
     * @param {Object} configItem - 配置项
     * @param {Object} formRef - 表单引用对象（可选）
     */
    handleFileListChange (newFileList, configItem, formRef = null) {
      // 更新fileLists
      this.$set(this.fileLists, configItem.attachType, newFileList);

      // 更新表单数据
      const fieldName = `files_${configItem.attachType}`;
      this.$set(this.form, fieldName, newFileList);

      // 手动触发表单验证
      if (formRef) {
        this.$nextTick(() => {
          formRef.validateField(fieldName);
        });
      }
    },

    /**
     * 自定义验证函数（用于Element UI表单验证）
     * @param {Object} rule - 验证规则
     * @param {Array} value - 字段值
     * @param {Function} callback - 回调函数
     * @param {Object} configItem - 配置项
     */
    validateAttachment (rule, value, callback, configItem) {
      const files = Array.isArray(value) ? value : [];
      const fileCount = files.length;

      // 检查是否必填
      if (configItem.required === '1') {
        if (fileCount === 0) {
          callback(new Error(`${configItem.attachType}是必填项`));
          return;
        }
      }

      // 检查最小数量
      const minNum = parseInt(configItem.minNum) || 0;
      if (fileCount > 0 && fileCount < minNum) {
        callback(new Error(`${configItem.attachType}至少需要上传${minNum}个文件`));
        return;
      }

      // 检查最大数量
      const maxNum = parseInt(configItem.maxNum) || Infinity;
      if (fileCount > maxNum) {
        callback(new Error(`${configItem.attachType}最多只能上传${maxNum}个文件`));
        return;
      }

      callback(); // 验证通过
    },

    /**
     * 提交表单（用于Element UI表单验证）
     * @param {Object} formRef - 表单引用对象
     * @param {Function} onSubmit - 提交成功回调函数
     * @returns {Promise<boolean>} - 是否验证通过
     */
    submitAttachmentForm (formRef, onSubmit = null) {
      return new Promise((resolve, reject) => {
        if (!formRef) {
          reject(new Error('表单引用不能为空'));
          return;
        }

        formRef.validate((valid) => {
          if (valid) {
            // 表单验证通过
            if (onSubmit && typeof onSubmit === 'function') {
              onSubmit(this.fileLists);
            }
            this.$message?.success('提交成功！');
            resolve(true);
          } else {
            console.log('表单验证失败');
            this.$message?.error('请检查必填项和文件数量要求');
            resolve(false);
          }
        });
      });
    },

    /**
     * 重置表单（用于Element UI表单验证）
     * @param {Object} formRef - 表单引用对象
     */
    resetAttachmentForm (formRef) {
      if (formRef) {
        formRef.resetFields();
      }
    },
    /**
     * 从文件名获取文件类型
     * @param {string} fileName - 文件名
     * @returns {string} 文件类型
     */
    getFileTypeFromName (fileName) {
      if (!fileName) return 'file';
      const lowerName = fileName.toLowerCase();
      // 图片类型
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      // 视频类型
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'];
      for (const ext of imageExtensions) {
        if (lowerName.endsWith(ext)) return 'image';
      }
      for (const ext of videoExtensions) {
        if (lowerName.endsWith(ext)) return 'video';
      }
      return 'file';
    },

    /**
     * 获取上传配置
     * @param {Object} configItem - 配置项
     * @returns {Object} 上传配置
     */
    getUploadConfig (configItem) {
      return {
        multiple: true,
        maxNum: configItem.maxNum || 9,
        minNum: configItem.minNum || 1,
        required: configItem.required === '1',
        accept: configItem.acceptSuffix || '.jpg,.jpeg,.png,.pdf,.doc,.docx',
        buttonText: '上传附件',
        buttonType: 'success',
        buttonIcon: 'el-icon-upload2',
        beforeUpload: (file) => {
          // 文件大小限制（单位：MB）
          const maxSize = configItem.maxSize || 10;
          const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
          if (!isLtMaxSize) {
            this.$message?.error(`上传文件大小不能超过 ${maxSize}MB!`);
            return false;
          }

          // 文件类型校验
          const acceptTypes = configItem.acceptSuffix ? configItem.acceptSuffix.split(',') : [];
          if (acceptTypes.length > 0) {
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const isValidType = acceptTypes.some(type =>
              type.trim().toLowerCase() === fileExtension
            );
            if (!isValidType) {
              this.$message?.error(`文件类型不支持，请上传以下类型: ${configItem.acceptSuffix}`);
              return false;
            }
          }
          return true;
        }
      };
    }
  }
};
