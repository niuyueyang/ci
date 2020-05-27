import axios from '@/libs/api.request'

export const historyGet = (page, pageSize, server_ssh_url) => {
  const data = {
    page,
    pageSize,
    server_ssh_url
  }
  return axios.request({
    url: '/history/list',
    data,
    method: 'post'
  })
}

export const failGet = (id) => {
  const data = {
    id,
  }
  return axios.request({
    url: '/history/failGet',
    data,
    method: 'post'
  })
}
