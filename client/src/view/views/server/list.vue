<template>
  <Card style="height: auto;overflow: hidden;">
    <!-- S table -->
    <i-table stripe :columns="columns" :data="datas" :loading="loading">
      <template slot-scope="{ row, index }"  slot="dates">
        <span>{{getDates(row.server_date)}}</span>
      </template>
      <template slot-scope="{ row, index }"  slot="action">
        <Button type="primary" size="small" @click="fnIn(row)">进入</Button>
        <Button type="success" size="small" @click="fnHistoryIn(row)">上线历史</Button>
        <Button type="error" size="small" @click="fnUpdate(row)">修改</Button>
        <Button type="warning" size="small" @click="fnDelete(row)">删除</Button>
      </template>
    </i-table>
    <!-- E table -->

    <!-- S 分页 -->
    <Page :total="total" @on-change="fnPageChange" style="float: right;margin-top: 10px;margin-bottom: 10px;" v-if="total > 0" />
    <!-- E 分页 -->

    <!-- S 修改-->
    <Drawer title="服务器修改" :closable="false" v-model="updateShow" :width="600">
      <Form ref="formValidate" :model="formValidate" :rules="ruleValidate" :label-width="120" style="width: 80%;">
        <FormItem label="服务器名称" prop="server_name">
          <Input v-model="formValidate.server_name" placeholder="请输入服务器名称"></Input>
        </FormItem>
        <FormItem label="服务器类型" prop="server_type">
          <Select v-model="formValidate.server_type" placeholder="请选择你的服务器类型">
            <Option :value="1">测试服务器</Option>
            <Option :value="2">线上服务器</Option>
            <Option :value="3">预发服务器</Option>
          </Select>
        </FormItem>
        <FormItem label="源服务器IP" prop="server_from_ip">
          <Input v-model="formValidate.server_from_ip" placeholder="请输入你的源服务器IP"></Input>
        </FormItem>
        <FormItem label="目标服务器IP" prop="server_ip">
          <Input v-model="formValidate.server_ip" placeholder="请输入你的目标服务器ip"></Input>
        </FormItem>
        <FormItem label="项目git地址" prop="server_ssh_url">
          <Input v-model="formValidate.server_ssh_url" placeholder="git@网址"></Input>
        </FormItem>
        <FormItem>
          <Button type="primary" @click="handleSubmit('formValidate')">提交</Button>
          <Button @click="handleReset('formValidate')" style="margin-left: 8px">取消</Button>
        </FormItem>
      </Form>
    </Drawer>
    <!-- E 修改 -->

    <!-- S 删除 -->
    <Modal
      v-model="modalDelShow"
      title="删除服务器"
      @on-ok="fnDelSub"
      @on-cancel="fnDelCancel">
      <p>确认删除服务器：{{row.server_name}} 吗？</p>
    </Modal>
    <!-- E 删除 -->
  </Card>
</template>

<script>
import Tool, { Encrypt } from '@/Tool/Tool'
import { getList, fnDel, fnUpdate, getRow } from '@/api/server'

export default {
  name: 'list',
  data () {
    return {
      datas: [], // tbody
      columns: [
        {
          title: '服务器id',
          key: 'server_id',
          width: 170
        },
        {
          title: '类型',
          key: 'server_type_str',
          width: 200
        },
        {
          title: '名称',
          key: 'server_name',
          width: 300
        },
        {
          title: '源服务器IP',
          key: 'server_from_ip',
          width: 200
        },
        {
          title: '目标服务器IP',
          key: 'server_ip',
          width: 200
        },
        {
          title: '创建人',
          key: 'server_user',
          width: 100
        },
        {
          title: '创建时间',
          key: 'server_date',
          width: 130,
          slot: 'dates'
        },
        {
          title: '操作',
          slot: 'action'
        }
      ], // thead
      total: 0, // 列表总数
      page: 1, // 当前页数
      loading: true, // table loading
      updateShow: false, // 服务器修改框显示隐藏
      formValidate: {
        server_name: '', // 服务器名称
        server_type: '', // 服务器类型
        server_from_ip: '', // 源服务器IP
        server_ip: '', // 服务器ip
        server_ssh_url: '' // 服务器对应的项目git地址（必须是git@形式）
      },
      ruleValidate: {
        server_name: [
          { required: true, message: '请填写服务器名称', trigger: 'blur' }
        ],
        server_from_ip: [
          { required: true, message: '请填写ip', trigger: 'blur' }
        ],
        server_ip: [
          { required: true, message: '请填写ip', trigger: 'blur' }
        ],
        server_ssh_url: [
          { required: true, message: '请填写ssh', trigger: 'blur' }
        ]
      }, // 服务器校验规则
      server_id: '', // server id
      modalDelShow: false, // 删除框显示隐藏
      row: {} // 当前行数内容
    }
  },
  mounted () {
    this.initServer()
  },
  methods: {
    /*
    * @desc 时间戳转化为YYYY-MM-DD格式
    * @params {time} timestamp 时间戳
    * @private
    * */
    getDates (timestamp) {
      return Tool.dateToStr(timestamp)
    },

    /*
    * @desc 服务器列表
    * @private
    * */
    async initServer () {
      this.loading = true
      let res = await getList(this.page, 10)
      this.datas = res.data.data.list
      this.total = res.data.data.count
      this.loading = false
    },

    /*
    * @desc 进入服务器对应的上传列表
    * @params {Object} row 当前对应对象
    * @private
    * */
    async fnIn (row) {
      this.$router.push({ path: '/list/list',
        query: {
          server_ssh_url: Encrypt(row.server_ssh_url),
          ip: Encrypt(row.server_ip),
          server_type_str: Encrypt(row.server_type_str),
          server_type: row.server_type,
          server_user: Encrypt(row.server_user),
          server_from_ip: row.server_from_ip
        } })
    },

    /*
    * @desc 进入服务器对应的上传历史
    * @params {Object} row 当前对应对象
    * @private
    * */
    fnHistoryIn (row) {
      this.$router.push({ path: '/list/history',
        query: {
          server_ssh_url: Encrypt(row.server_ssh_url)
        } })
    },

    /*
    * @desc 修改
    * @params {Object} row 当前对应对象
    * @private
    * */
    async fnUpdate (row) {
      this.updateShow = true
      this.server_id = row.server_id
      let res = await getRow(row.server_id)
      if (res.data.code == 0) {
        this.formValidate = res.data.data
      } else {
        this.$Message.error('请求错误')
      }
    },

    /*
    * @desc 删除
    * @params {Object} row 当前对应对象
    * @private
    * */
    async fnDelete (row) {
      this.row = row
      this.server_id = row.server_id
      this.modalDelShow = true
    },

    /*
    * @desc 分页查询
    * @params {Number} val 当前页数
    * @private
    * */
    fnPageChange (val) {
      this.page = val
      this.initServer()
    },

    /*
    * @desc 修改提交
    * @params {String} name form名称
    * @private
    * */
    async handleSubmit (name) {
      this.$refs[name].validate(async (valid) => {
        if (valid) {
          let res = await fnUpdate(this.server_id, this.formValidate)
          if (res.data.code == 0) {
            this.$Message.success('修改成功')
            this.updateShow = false
            this.initServer()
          } else {
            this.$Message.error('修改失败')
            this.updateShow = true
          }
        } else {
          this.$Message.error('请填写字段!')
        }
      })
    },

    /*
    * @desc 修改取消
    * @params {String} name form名称
    * @private
    * */
    handleReset (name) {
      this.$refs[name].resetFields()
      this.updateShow = false
    },

    /*
    * @desc 删除提交
    * @private
    * */
    async fnDelSub () {
      let res = await fnDel(this.server_id)
      if (res.data.code == 0) {
        this.$Message.success('删除成功')
        this.initServer()
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
    }
  }
}
</script>

<style scoped>

</style>
