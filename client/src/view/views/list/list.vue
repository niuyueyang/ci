<template>
  <Card style="height: auto;overflow: hidden;">
      <i-table stripe :columns="columns" :data="datas" :loading="loading">
        <template slot-scope="{ row, index }"  slot="action">
          <Button type="primary" size="small" v-if="row.dirPath == '' || row.fail_reason != ''" @click="fnSub(row)">上线</Button>
          <Button type="warning" size="small" v-if="row.dirPath!='' && row.fail_reason == ''" @click="fnBack(row)">回滚</Button>
          <Button type="success" size="small" @click="fnDownload(row)">下载</Button>
          <Button type="error" size="small" @click="fnDelete(row)">删除</Button>
        </template>
      </i-table>
    <Page :total="total" @on-change="fnPageChange" style="float: right;margin-top: 10px;margin-bottom: 10px;" v-if="total > 0" />

    <!-- S 删除 -->
    <Modal
      v-model="modalDelShow"
      title="删除提交记录"
      @on-ok="fnDelSub"
      @on-cancel="fnDelCancel">
      <p>确认删除：{{commit_id}} 吗？</p>
    </Modal>
    <!-- E 删除 -->
  </Card>
</template>

<script>
import { list, upload, beforeSearch, back, deletes, createdir } from '@/api/list'
import { Decrypt } from '@/Tool/Tool'
export default {
  name: 'list',
  data () {
    return {
      columns: [
        {
          title: 'id',
          key: 'commit_id',
          width: 300
        },
        {
          title: 'git地址',
          key: 'git_ssh_url',
          width: 300
        },
        {
          title: '路径',
          key: 'dirPath',
          width: 300
        },
        {
          title: '提交人',
          key: 'user_username',
          width: 300
        },
        {
          title: '事件',
          key: 'event_name',
          width: 100
        },
        {
          title: '提交时间',
          key: 'commit_timestamp',
          width: 200
        },
        {
          title: '目标服务器',
          key: 'target_ip',
          width: 200
        },
        {
          title: '操作',
          slot: 'action',
          width: 200
        }
      ],
      datas: [],
      page: 1, //  分页
      total: 0, //  总数
      websock: null, //  websocket初始化
      beforeId: 0, //  上一次上线id，初始值为0
      loading: true, // table loading状态
      modalDelShow: false, // 删除框显示隐藏
      commit_id: '', // 删除commit_id
      ip: '', // 目标服务器ip
      row: {} // 每一行数据
    }
  },
  async mounted () {
    this.initWebSocket()
  },
  methods: {
    /*
    * @desc websocket连接
    * @private
    * */
    initWebSocket () {
      const wsuri = 'ws://39.106.10.163:8188'
      this.websock = new WebSocket(wsuri)
      this.websock.onmessage = this.websocketonmessage
      this.websock.onopen = this.websocketonopen
      this.websock.onerror = this.websocketonerror
      this.websock.onclose = this.websocketclose
    },

    /*
    * @desc websocket开启
    * @private
    * */
    websocketonopen () { // 连接建立之后执行send方法发送数据
      let actions = { 'test': '12345' }
      this.websocketsend(JSON.stringify(actions))
      this.ininList()
    },

    /*
    * @desc 连接建立失败重连
    * @private
    * */
    websocketonerror () {
      this.initWebSocket()
    },

    /*
    * @desc 数据接收
    * @private
    * */
    websocketonmessage (e) {
      const redata = JSON.parse(e.data)
      console.log(redata)
      if (redata.code == 0) {
        this.$Message.success(redata.msg)
        this.ininList()
      } else {
        this.$Message.error(redata.msg)
      }
    },

    /*
    * @desc 数据发送
    * @private
    * */
    websocketsend (Data) {
      this.websock.send(Data)
    },

    /*
    * @desc websocket关闭
    * @private
    * */
    websocketclose (e) {
      this.$Message.error('断开连接，正在尝试重新连接')
    },

    /*
    * @desc 获取提交历史数据
    * @private
    * */
    async ininList () {
      this.loading = true
      var ip = Decrypt(unescape(this.$route.query.ip))
      var server_ssh_url = Decrypt(unescape(this.$route.query.server_ssh_url))
      var server_type_str = Decrypt(unescape(this.$route.query.server_type_str))
      var server_type = this.$route.query.server_type
      var server_user = Decrypt(unescape(this.$route.query.server_user))
      var server_from_ip = this.$route.query.server_from_ip
      if (typeof server_ssh_url === 'undefined' || server_ssh_url === null) {
        this.$Message.error('server_ssh_url不能为空')
        this.$router.go(-1)
      }
      if (typeof ip === 'undefined' || ip === null) {
        this.$Message.error('ip不能为空')
        this.$router.go(-1)
      }
      if (typeof server_type_str === 'undefined' || server_type_str === null) {
        this.$Message.error('server_type_str不能为空')
        this.$router.go(-1)
      }
      if (typeof server_user === 'undefined' || server_user === null) {
        this.$Message.error('server_user不能为空')
        this.$router.go(-1)
      }
      if (typeof server_type === 'undefined' || server_type === null) {
        this.$Message.error('server_type不能为空')
        this.$router.go(-1)
      }
      if (typeof server_from_ip === 'undefined' || server_from_ip === null) {
        this.$Message.error('server_from_ip不能为空')
        this.$router.go(-1)
      }
      this.ip = ip
      let res = await list(this.page, 10, server_ssh_url, ip)
      this.datas = res.data.data.list
      this.total = res.data.data.count
      this.loading = false
    },

    /*
     * @desc 查询当前上线版本
     * @params {Object} 每一列数据
     * @private
    * */
    async fnSearchBefore () {
      let res = await beforeSearch()
      if (res.data.code == 0) {
        this.beforeId = res.data.data.commit_id
      } else if (res.data.code == 1) {
        this.beforeId = -1
      }
    },

    /*
     * @desc 上线
     * @params {Object} 每一列数据
     * @private
    * */
    async fnSub (row) {
      await this.fnSearchBefore()
      var beforeId = this.beforeId
      var server_type_str = Decrypt(unescape(this.$route.query.server_type_str))
      var server_type = this.$route.query.server_type
      var server_user = Decrypt(unescape(this.$route.query.server_user))
      var server_from_ip = this.$route.query.server_from_ip
      let res = await upload(row.commit_id, beforeId)
      this.websock.send(JSON.stringify({
        type: 'start',
        id: row.commit_id,
        git_ssh_url: row.git_ssh_url,
        project_name: row.project_name,
        typestr: '上线',
        usernames: server_user,
        servertype: server_type,
        servertypestr: server_type_str,
        server_from_ip: server_from_ip,
        target_ip: this.ip
      }))
      if (res.data.code == 0) {
        this.$Message.success('开始打包')
      } else if (res.data.code == 1) {
        this.$Message.error(res.data.msg)
      }
    },

    /*
     * @desc 回滚
     * @params {Object} 每一列数据
     * @private
   * */
    async fnBack (row) {
      var target_ip = Decrypt(unescape(this.$route.query.ip))
      var server_type_str = Decrypt(unescape(this.$route.query.server_type_str))
      var server_type = this.$route.query.server_type
      var git_ssh_url = Decrypt(unescape(this.$route.query.server_ssh_url))
      var server_from_ip = this.$route.query.server_from_ip
      if (typeof target_ip === 'undefined' || target_ip === null) {
        this.$Message.error('目标服务器IP不能为空')
        this.$router.go(-1)
      }
      await this.fnSearchBefore()
      var beforeId = this.beforeId
      let res = await back(row.commit_id, beforeId, row.dirPath, target_ip, row.project_name, 'admin', server_type, server_type_str, git_ssh_url, server_from_ip)
      if (res.data.code == 0) {
        this.$Message.success(res.data.msg)
        this.ininList()
      } else if (res.data.code == 1) {
        this.$Message.error(res.data.msg)
      }
    },

    /*
   * @desc 下载
   * @params {Object} 每一列数据
   * @private
   * */
    fnDownload (row) {
      window.location.href = row.homepage + '/-/archive/' + row.commit_id + '/' + row.project_name + '-' + row.commit_id + '.zip'
    },

    /*
    * @desc 删除
    * @params {Object} row 当前对应对象
    * @private
    * */
    async fnDelete (row) {
      this.commit_id = row.commit_id
      this.modalDelShow = true
      this.row = row
    },

    /*
    * @desc 删除提交
    * @private
    * */
    async fnDelSub () {
      var row = this.row
      var target_ip = Decrypt(unescape(this.$route.query.ip))
      var server_type_str = Decrypt(unescape(this.$route.query.server_type_str))
      var server_type = Decrypt(unescape(this.$route.query.server_type))
      var git_ssh_url = Decrypt(unescape(this.$route.query.server_ssh_url))
      var server_from_ip = this.$route.query.server_from_ip
      if (typeof target_ip === 'undefined' || target_ip === null) {
        this.$Message.error('目标服务器IP不能为空')
        this.$router.go(-1)
      }
      let res = await deletes(row.commit_id, row.parentPath, target_ip, row.project_name, 'admin', server_type, server_type_str, git_ssh_url,server_from_ip)
      if (res.data.code == 0) {
        this.$Message.success('删除成功')
        this.ininList()
      } else {
        this.$Message.success('删除失败')
      }
    },

    /*
    * @desc 删除取消
    * @private
    * */
    fnDelCancel () {
      this.modalDelShow = false
    },

    /*
    * @desc 分页
    * @params {Number} page 当前页数
    * @private
    * */
    fnPageChange (page) {
      this.page = page
      this.ininList()
    }
  }
}
</script>

<style scoped>

</style>
