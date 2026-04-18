import request from '@/api/request'

const loginApi = {
  employeeLogin(account, password) {
    return request({
      url: '/emp/management/login',
      method: 'post',
      data: {
        account,
        password,
      },
    })
  },

  adminLogin(phoneNumber, password) {
    return this.employeeLogin(phoneNumber, password)
  },

  sendUserCode(phoneNumber) {
    return request({
      url: '/user/send-code',
      method: 'post',
      data: {
        phoneNumber,
      },
    })
  },

  sendSmsCode(phoneNumber) {
    return request({
      url: '/sms/send-code',
      method: 'post',
      data: {
        phoneNumber,
      },
    })
  },

  userLogin(phoneNumber, code) {
    return request({
      url: '/user/login',
      method: 'post',
      data: {
        phoneNumber,
        code,
      },
    })
  },

  serviceLogin(username, password) {
    return request({
      url: '/vendor/login',
      method: 'post',
      data: {
        username,
        password,
      },
    })
  },

  updateVendorPassword(data) {
    return request({
      url: '/vendor/password/update',
      method: 'post',
      data,
    })
  },

  updateEmpPassword(data) {
    return request({
      url: '/emp/management/password/update',
      method: 'post',
      data,
    })
  },
}

export default loginApi
