<template>
    <Card>
      <div class="wrap">
        <!-- S form表单 -->
        <Form ref="formValidate" :model="formValidate" :rules="ruleValidate" :label-width="120">
          <FormItem label="服务器名称" prop="server_name">
            <Input v-model="formValidate.server_name" placeholder="请输入服务器名称"></Input>
          </FormItem>
          <FormItem label="服务器类型" prop="server_type">
            <Select v-model="formValidate.server_type" placeholder="请选择你的服务器类型">
              <Option value="1">测试服务器</Option>
              <Option value="2">线上服务器</Option>
              <Option value="3">预发服务器</Option>
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
        <!-- E form表单 -->
      </div>
    </Card>
</template>

<script>
import { createServer } from '@/api/server'
export default {
  name: 'create',
  data () {
    return {
      formValidate: {
        server_name: '', // 服务器名称
        server_type: '', // 服务器类型
        server_ip: '', // 服务器ip
        server_from_ip: '', // 源服务器ip
        server_ssh_url: '' // 服务器对应的项目git地址（必须是git@形式）
      },
      ruleValidate: {
        server_name: [
          { required: true, message: '请填写服务器名称', trigger: 'blur' }
        ],
        server_from_ip: [
          { required: true, message: '请填写源服务器IP', trigger: 'blur' }
        ],
        server_ip: [
          { required: true, message: '请填写目标服务器IP', trigger: 'blur' }
        ],
        server_type: [
          { required: true, message: '请选择服务器类型', trigger: 'change' }
        ],
        server_ssh_url: [
          { required: true, message: '请填写ssh', trigger: 'blur' }
        ]
      } // 服务器校验规则
    }
  },
  methods: {
    /*
    * @desc 提交
    * @params {String} name form名称
    * @private
    * */
    async handleSubmit (name) {
      this.$refs[name].validate(async (valid) => {
        if (valid) {
          let user = ''
          if (localStorage.getItem('user') !== null) {
            user = JSON.parse(localStorage.getItem('user'))
          } else {
            user = { user_name: 'admin' }
          }
          let res = await createServer(Object.assign({}, this.formValidate, { server_user: user.user_name }))
          if (res.data.code == 0) {
            this.$Message.success('创建成功')
            this.$router.push({ path: '/server/list' })
          } else {
            this.$Message.error('创建失败')
          }
        } else {
          this.$Message.error('请填写字段!')
        }
      })
    },

    /*
    * @desc 取消
    * @params {String} name form名称
    * @private
    * */
    handleReset (name) {
      this.$refs[name].resetFields()
    }
  }
}
</script>

<style scoped>
  .wrap{
    width: 40%;
    height: auto;
    overflow: hidden;
  }
</style>
