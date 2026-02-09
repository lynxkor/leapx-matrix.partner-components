/**
 * 判断文件是否为指定类型
 * @param {Object} file - 文件对象，包含 fileName 和 fileType 字段
 * @param {string} type - 文件类型: 'image' | 'video' | 'pdf' | 'excel' | 'word' | 'ppt' | 'text' | 'zip'
 * @returns {boolean} 是否为指定类型
 */
export function isFileType (file, type) {
  if (!file) return false;

  const fileType = (file.fileType || '').toLowerCase();
  const fileName = (file.fileName || '').toLowerCase();

  const config = {
    image: {
      types: ['image', 'img', 'picture', 'photo', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'],
      extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
    },
    video: {
      types: ['video', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg'],
      extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.mpeg', '.mpg']
    },
    pdf: {
      types: ['pdf'],
      extensions: ['.pdf']
    },
    excel: {
      types: ['xls', 'xlsx', 'csv', 'text/csv'],
      extensions: ['.xls', '.xlsx', '.csv']
    },
    word: {
      types: ['doc', 'docx', 'word', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      extensions: ['.doc', '.docx']
    },
    ppt: {
      types: ['ppt', 'pptx', 'powerpoint', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      extensions: ['.ppt', '.pptx']
    },
    text: {
      types: ['txt', 'text', 'plain', 'text/plain'],
      extensions: ['.txt']
    },
    zip: {
      types: ['zip', 'application/zip', 'application/x-zip-compressed'],
      extensions: ['.zip']
    },
    rar: {
      types: ['application/vnd.rar', 'application/x-rar-compressed'],
      extensions: ['.rar']
    }
  };

  const rule = config[type];
  if (!rule) return false;

  // 先从 MIME 类型或自定义 fileType 字段判断
  if (rule.types.some(t => fileType.includes(t))) {
    return true;
  }

  // 再从文件扩展名判断
  return rule.extensions.some(ext => fileName.endsWith(ext));
}
