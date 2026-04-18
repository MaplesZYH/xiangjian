/**
 * 图片压缩工具类
 * @param {File} file 原文件对象
 * @param {Object} options 配置项 (maxWidth, maxHeight, quality, mimeType)
 * @returns {Promise<File>} 压缩后的File对象
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    } = options;

    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 对超出最大长宽的图片按等比例缩放
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 如果想要透明png转为jpeg时背景为白色，做一层白色填充
        if (mimeType === 'image/jpeg') {
           ctx.fillStyle = '#fff';
           ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            // 将 Blob 转为 File 以兼容上传接口
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            });
            // 额外保障：如果压缩后反而变大，回退使用原文件对象
            if (compressedFile.size > file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          } else {
            resolve(file); // 兜底返回原文件
          }
        }, mimeType, quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
