import axios from '@/libs/api.request'

export const getList = (page, pageSize) => {
  const data = {
    page,
    pageSize
  }
  return axios.request({
    url: '/server/list',
    data,
    method: 'post'
  })
}

export const getRow = (server_id) => {
  const data = {
    server_id
  }
  return axios.request({
    url: '/server/getData',
    data,
    method: 'post'
  })
}

export const fnDel = (server_id) => {
  const data = {
    server_id
  }
  return axios.request({
    url: '/server/delete',
    data,
    method: 'post'
  })
}

export const fnUpdate = (server_id, obj) => {
  const data = {
    server_id,
    server_name: obj.server_name,
    server_type: Number(obj.server_type),
    server_ip: obj.server_ip,
    server_ssh_url: obj.server_ssh_url,
    server_user: obj.server_user,
    server_from_ip: obj.server_from_ip
  }
  return axios.request({
    url: '/server/update',
    data,
    method: 'post'
  })
}

export const createServer = (obj) => {
  const data = {
    server_name: obj.server_name,
    server_type: Number(obj.server_type),
    server_ip: obj.server_ip,
    server_ssh_url: obj.server_ssh_url,
    server_user: obj.server_user
  }
  return axios.request({
    url: '/server/create',
    data,
    method: 'post'
  })
}
