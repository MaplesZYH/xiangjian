import request from '@/api/request'

export default {
  upload(file, timeout) {
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      url: '/file/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }

    if (timeout) {
      config.timeout = timeout
    }

    return request(config)
  },
}
