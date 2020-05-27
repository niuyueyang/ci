const router = require('koa-router')()
const config = require('./../config/default')
const mysql = require('./../mysql')
const redis = require("./../redis")
const {doShellCmd} = require('./../middles/index')


/*
* @desc 项目提交历史
* @private
* */
router.post('/history/list', async (ctx, next) => {
    let page = ctx.request.body.page || 1;
    let pageSize = ctx.request.body.pageSize || 10;
    let server_ssh_url = ctx.request.body.server_ssh_url || '';
    let start = (page-1)*pageSize;
    let data = await mysql.query(`select id,commit_id,dates,usernames,servertypestr,typestr,project_name,IFNULL(up_type,1) as up_type,IFNULL(from_ip,'') as from_ip,IFNULL(target_ip,'') as target_ip,fail_reason from commit_history where id <=(select id from commit_history order by id desc limit ${start}, 1) and git_ssh_url = '${server_ssh_url}' order by id desc limit ${pageSize};`);
    let count = await mysql.query(`select count(*) as n from commit_history where git_ssh_url = '${server_ssh_url}';`);
    ctx.body = {
        "code": 0,
        "data": {
            list: data,
            page: page,
            count:count[0].n
        },
        "msg": '请求成功'
    }
})

/*
* @desc 失败原因查看
* @private
* */
router.post('/history/failGet', async (ctx, next) => {
    let id = ctx.request.body.id || 1;
    if(typeof id == 'undefined' || id === null){
        ctx.body = {
            "code": 1,
            "data": {},
            "msg": 'id不能为空'
        }
    }
    else{
        let data = await mysql.query(`select id,fail_reason from commit_history where id = ${Number(id)};`);
        if(data.length > 0){
            ctx.body = {
                "code": 0,
                "data": data[0],
                "msg": '请求成功'
            }
        }
         else{
            ctx.body = {
                "code": 0,
                "data": {},
                "msg": '请求成功'
            }
        }
    }

})

module.exports = router
