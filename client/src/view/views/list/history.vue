<template>
    <Card style="height: auto;overflow: hidden;">
      <i-table stripe :columns="columns" :data="datas" :loading="loading">
        <template slot-scope="{ row, index }"  slot="dates">
          <span>{{getDates(row.dates)}}</span>
        </template>
        <template slot-scope="{ row, index }"  slot="up_type_str">
          <Tag color="success" v-if="row.up_type == 1">成功</Tag>
          <Tag color="error" v-else>失败</Tag>
        </template>
        <template slot-scope="{ row, index }"  slot="action">
          <Button type="success" size="small" @click="fnReasonShow" :disabled="row.fail_reason == ''">查看失败原因</Button>
        </template>
      </i-table>
      <Page :total="total" @on-change="fnPageChange" style="float: right;margin-top: 10px;margin-bottom: 10px;" v-if="total > 0" />
    </Card>
</template>

<script>
import { historyGet, failGet } from '@/api/history'
import Tool, { Decrypt } from '@/Tool/Tool'

export default {
  name: 'history',
  data () {
    return {
      columns: [
        {
          title: 'id',
          key: 'commit_id',
          width: 300
        },
        {
          title: '项目名称',
          key: 'project_name',
          width: 200
        },
        {
          title: '日期',
          width: 300,
          slot: 'dates'
        },
        {
          title: '提交人',
          key: 'usernames',
          width: 130
        },
        {
          title: '类型',
          key: 'typestr'
        },
        {
          title: '目标服务器',
          key: 'servertypestr'
        },
        {
          title: '状态',
          slot: 'up_type_str'
        },
        {
          title: '操作',
          slot: 'action'
        }
      ], // thaed
      datas: [], // tbody
      page: 1, // 当前分页
      pageSize: 10, // 每页数量
      total: 0, // 总数
      loading: true, // table loading状态
      modalValue: false // 失败原因弹出框显示隐藏
    }
  },
  mounted () {
    this.initTable()
  },
  methods: {
    /*
    * @desc 上传历史
    * @private
    * */
    async initTable () {
      var server_ssh_url = Decrypt(unescape(this.$route.query.server_ssh_url))
      this.loading = true
      if (typeof server_ssh_url === 'undefined' || server_ssh_url === null) {
        this.$Message.error('server_ssh_url不能为空')
        this.$router.go(-1)
      }
      let res = await historyGet(this.page, this.pageSize, server_ssh_url)
      this.datas = res.data.data.list
      this.total = res.data.data.count
      this.loading = false
    },

    /*
    * @desc 时间戳转化为YYYY-MM-DD格式
    * @params {time} timestamp 时间戳
    * @private
    * */
    getDates (timestamp) {
      return Tool.dateToStr(timestamp)
    },

    /*
    * @desc 分页
    * @params {Number} page 当前页数
    * @private
    * */
    fnPageChange (page) {
      this.page = page
      this.initTable()
    },

    /*
    * @desc 失败原因查看
    * */
    async fnReasonShow (row) {
      let res = await failGet(row.id)
      this.$Modal.confirm({
        title: '失败原因',
        content: '<div style="width: 100%;padding-left: 10px;padding-right: 10px;word-break:break-all;">' + res.data.data.fail_reason + '</div>',
        onOk: () => {},
        onCancel: () => {}
      })
    }
  }
}
</script>

<style scoped>

</style>
