import axios from '@/libs/api.request'

export const list = (page, pageSize, server_ssh_url, ip) => {
  const data = {
    page,
    pageSize,
    server_ssh_url,
    ip
  }
  return axios.request({
    url: '/list',
    data,
    method: 'post'
  })
}

export const upload = (id, beforeId) => {
  const data = {
    id,
    beforeId
  }
  return axios.request({
    url: '/upload',
    data,
    method: 'post'
  })
}

export const deletes = (commit_id, parentPath, target_ip, project_name, usernames, servertype, servertypestr, git_ssh_url, server_from_ip) => {
  const data = {
    commit_id,
    parentPath,
    target_ip,
    project_name,
    usernames,
    servertype,
    servertypestr,
    git_ssh_url,
    server_from_ip
  }
  return axios.request({
    url: '/delete',
    data,
    method: 'post'
  })
}

export const beforeSearch = () => {
  const data = {}
  return axios.request({
    url: '/now',
    data,
    method: 'post'
  })
}

export const back = (id, beforeId, dirPath, target_ip, project_name, usernames, servertype, servertypestr, git_ssh_url, server_from_ip) => {
  const data = { id, beforeId, dirPath, target_ip, project_name, usernames, servertype, servertypestr, git_ssh_url, server_from_ip }
  return axios.request({
    url: '/back',
    data,
    method: 'post'
  })
}

export const createdir = () => {
  const data = { }
  return axios.request({
    url: '/createdir',
    data,
    method: 'post'
  })
}
