const router = require('koa-router')();
const config = require('./../config/default');
const mysql = require('./../mysql');
const redis = require("./../redis");
const {doShellCmd} = require('./../middles/index');
const {randomString} = require('./../middles/Tool');


/*
* @desc 创建服务器
* @private
* */
router.post('/server/create', async(ctx, next) => {
    var server_ssh_url = ctx.request.body.server_ssh_url || '';
    var server_ip = ctx.request.body.server_ip || '';
    var server_from_ip = ctx.request.body.server_from_ip || '';
    var server_id = randomString(16);
    var server_type = Number(ctx.request.body.server_type) || '';
    var server_type_str = '';
    if(server_type == 1){
        server_type_str = '测试服务器';
    }
    if(server_type == 2){
        server_type_str = '线上服务器';
    }
    if(server_type == 3){
        server_type_str = '预发服务器';
    }
    var server_name = ctx.request.body.server_name || '';
    var server_user = ctx.request.body.server_user || '';
    var server_user_id = ctx.request.body.server_user_id || 1;
    var server_project_id = ctx.request.body.server_project_id || 2;
    let res = await mysql.query(`insert into server_list (server_ssh_url,server_ip,server_from_ip,server_id,server_type_str,server_type,server_name,server_user,server_date,server_user_id,server_project_id) values ('${server_ssh_url}','${server_ip}','${server_from_ip}','${server_id}','${server_type_str}',${server_type},'${server_name}','${server_user}',${new Date().getTime()},'${server_user_id}','${server_project_id}');`);
    if(res.affectedRows == 1){
        ctx.body = {
            code: 0,
            data: {},
            msg: '创建成功'
        }
    }
    else{
        ctx.body = {
            code: 1,
            data: {},
            msg: '创建失败'
        }
    }

})

/*
* @desc 服务器列表
* @private
* */
router.post('/server/list', async (ctx, next) => {
    let page = ctx.request.body.page || 1;
    let pageSize = ctx.request.body.pageSize || 10;
    let start = (page-1)*page;
    let data = await mysql.query(`select server_id,server_ip,server_ssh_url,server_type_str,server_name,server_user,server_date,server_type,IFNULL(server_from_ip,'') as server_from_ip from server_list where id >=(select id from server_list limit ${start}, 1) order by id desc limit ${pageSize};`);
    let count = await mysql.query(`select count(*) as n from server_list;`);
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
* @desc 服务器查询语句
* @private
* */
router.post('/server/getData', async (ctx, next) => {
    let server_id = ctx.request.body.server_id || '';
    if(server_id == '' || typeof server_id == 'undefined'){
        ctx.body = {
            code: 1,
            msg: 'server_id不能为空',
            data:{}
        }
    }
    else{
        let data = await mysql.query(`select server_id,server_ip,server_ssh_url,server_type,server_name,server_from_ip from server_list where server_id = '${server_id}';`);
        if(data.length > 0){
            ctx.body = {
                "code": 0,
                "data":data[0],
                "msg": '请求成功'
            }
        }
        else{
            ctx.body = {
                "code": 0,
                "data":{},
                "msg": '请求成功'
            }
        }
    }
})

/*
* @desc 服务器修改语句
* @private
* */
router.post('/server/update', async (ctx, next) => {
    let server_id = ctx.request.body.server_id || '';
    let server_ip = ctx.request.body.server_ip || '';
    let server_from_ip = ctx.request.body.server_from_ip || '';
    let server_name = ctx.request.body.server_name || '';
    let server_type = Number(ctx.request.body.server_type) || '';
    let server_ssh_url = ctx.request.body.server_ssh_url || '';
    let server_type_str = ''
    let str = ``;
    if(typeof server_ip != 'undefined' || server_ip == ''){
        str+=`server_ip = '${server_ip}',`
    }
    if(typeof server_from_ip != 'undefined' || server_from_ip == ''){
        str+=`server_from_ip = '${server_from_ip}',`
    }
    if(typeof server_name != 'undefined' || server_name == ''){
        str+=`server_name = '${server_name}',`
    }
    if(typeof server_ssh_url != 'undefined' || server_ssh_url == ''){
        str+=`server_ssh_url = '${server_ssh_url}',`
    }
    if(typeof server_type != 'undefined' || server_type == ''){
        str+=`server_type = ${Number(server_type)},`
        if(server_type == 1){
            server_type_str = '测试服务器';
        }
        if(server_type == 2){
            server_type_str = '线上服务器';
        }
        if(server_type == 3){
            server_type_str = '预发服务器';
        }
        str+=`server_type_str = '${server_type_str}',`
    }
    str = str.slice(0, -1);
    if(server_id == '' || typeof server_id == 'undefined'){
        ctx.body = {
            code: 1,
            msg: 'server_id不能为空',
            data:{}
        }
    }
    else{
        let data = await mysql.query(`update server_list set ${str} where server_id = '${server_id}';`);
        if(data.affectedRows == 1){
            ctx.body = {
                "code": 0,
                "data":{},
                "msg": '修改成功'
            }
        }
        else{
            ctx.body = {
                "code": 1,
                "data":{},
                "msg": '修改失败'
            }
        }
    }
})

/*
* @desc 服务器删除语句
* @private
* */
router.post('/server/delete', async (ctx, next) => {
    let server_id = ctx.request.body.server_id || '';
    if(server_id == '' || typeof server_id == 'undefined'){
        ctx.body = {
            code: 1,
            msg: 'server_id不能为空',
            data:{}
        }
    }
    else{
        let data = await mysql.query(`delete from server_list where server_id = '${server_id}';`);
        if(data.affectedRows == 1){
            ctx.body = {
                "code": 0,
                "data":{},
                "msg": '删除成功'
            }
        }
        else{
            ctx.body = {
                "code": 1,
                "data":{},
                "msg": '删除失败'
            }
        }
    }
})

module.exports = router
