import request from '@/api/request'

export default {
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)

    return request({
      url: '/file/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
