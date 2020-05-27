const router = require('koa-router')()
const config = require('./../config/default')
const mysql = require('./../mysql')
const redis = require("./../redis")
const {doShellCmd} = require('./../middles/index')
const {deletePath, spawnProcess} = require('./../middles/Tool')


router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/clone', async (ctx, next) => {
    var clonePath = ctx.query.path || ''
    var cmdStr = `git clone ${clonePath}`;
    var res = await doShellCmd(cmdStr);
    ctx.body = res;
})

/*
* @desc webhook回调
* @private
* */
router.post('/hook', async (ctx, next) => {
    let obj = ctx.request.body;
    let data = await mysql.query(`INSERT INTO commit (user_username,user_email,user_avatar,checkout_sha,project_id,project_name,project_description,web_url,avatar_url,git_ssh_url,git_http_url,namespace,path_with_namespace,default_branch,ci_config_path,homepage,project_url,ssh_url,http_url,commit_id,commit_message,commit_timestamp,commit_url,commit_author,commit_modified,commit_added,commit_removed,total_commits_count,repository_name,repository_url,repository_description,respository_homepage,respository_git_http_url,respository_git_ssh_url,respository_visibility_level,object_kind,event_name,befores,afters) VALUES ('${obj.user_username}', '${obj.user_email}', '${obj.user_avatar}', '${obj.checkout_sha}', '${obj.project_id}','${obj.project.name}','${obj.project.description}','${obj.project.web_url}','${obj.project.avatar_url}','${obj.project.git_ssh_url}','${obj.project.git_http_url}','${obj.project.namespace}','${obj.project.path_with_namespace}','${obj.project.default_branch}','${obj.project.ci_config_path}','${obj.project.homepage}','${obj.project.url}','${obj.project.ssh_url}','${obj.project.http_url}','${obj.commits[0].id}','${obj.commits[0].message}','${obj.commits[0].timestamp}','${obj.commits[0].url}','${JSON.stringify(obj.commits[0].author)}','${JSON.stringify(obj.commits[0].modified)}','${JSON.stringify(obj.commits[0].added)}','${JSON.stringify(obj.commits[0].removed)}','${obj.total_commits_count}','${obj.repository.name}','${obj.repository.url}','${obj.repository.description}','${obj.repository.homepage}','${obj.repository.git_http_url}','${obj.repository.git_ssh_url}','${obj.repository.visibility_level}','${obj.object_kind}','${obj.event_name}','${obj.before}','${obj.after}');`);
    ctx.body = {
        "code": 200,
        "data": data,
        "msg": 'ok'
    }
})

/*
* @desc 上线版本
* @private
* */
router.post('/now', async(ctx, next) => {
    let data = await mysql.query(`select commit_id from commit where isup = 1 order by id desc;`);
    if(data !== null){
        if(data.length == 0){
            ctx.body = {
                "code": 0,
                "data": {
                    commit_id: -1
                },
                "msg": '项目第一次上线'
            }
        }
        else{
            ctx.body = {
                "code": 0,
                "data": data[0],
                "msg": '请求成功'
            }
        }
    }
    else{
        ctx.body = {
            "code": 1,
            "data": {},
            "msg": '请求失败'
        }
    }
})

/*
* @desc 上线删除语句
* @private
* */
router.post('/delete', async (ctx, next) => {
    let commit_id = ctx.request.body.commit_id || '';
    let parentPath = ctx.request.body.parentPath || '';
    let target_ip = ctx.request.body.target_ip || '';

    var project_name = ctx.request.body.project_name || ''
    var usernames = ctx.request.body.usernames || ''
    var servertype = Number(ctx.request.body.servertype) || 1
    var servertypestr = ctx.request.body.servertypestr || ''
    var git_ssh_url = ctx.request.body.git_ssh_url || ''
    var server_from_ip = ctx.request.body.server_from_ip || ''
    if(commit_id == '' || typeof commit_id == 'undefined'){
        ctx.body = {
            code: 1,
            msg: 'commit_id不能为空',
            data:{}
        }
    }
    else if(parentPath == '' || typeof parentPath == 'undefined'){
        ctx.body = {
            code: 1,
            msg: 'parentPath不能为空',
            data:{}
        }
    }
    else if(target_ip == '' || typeof target_ip == 'undefined'){
        ctx.body = {
            code: 1,
            msg: '目标服务器IP不能为空',
            data:{}
        }
    }
    else{
        await doShellCmd('rm -rf '+parentPath+'');
        await spawnProcess('ssh',['-p 22','root@'+target_ip+'','rm -rf '+parentPath+''], false, ()=>{}, null,'delete');
        let data = await mysql.query(`delete from commit where commit_id = '${commit_id}';`);
        if(data.affectedRows == 1){
            await mysql.query(`insert into commit_history (project_name,dates,commit_id,typestr,usernames,servertype,servertypestr,git_ssh_url,up_type,fail_reason,from_ip,target_ip) values ('${project_name}',${new Date().getTime()},'${commit_id}','删除','${usernames}',${servertype},'${servertypestr}','${git_ssh_url}',1,'','${server_from_ip}','${target_ip}');`);
            ctx.body = {
                "code": 0,
                "data":{},
                "msg": '删除成功'
            }
        }
        else{
            await mysql.query(`insert into commit_history (project_name,dates,commit_id,typestr,usernames,servertype,servertypestr,git_ssh_url,up_type,fail_reason,from_ip,target_ip) values ('${project_name}',${new Date().getTime()},'${commit_id}','删除','${usernames}',${servertype},'${servertypestr}','${git_ssh_url}',2,'','${server_from_ip}','${target_ip}');`);
            ctx.body = {
                "code": 1,
                "data":{},
                "msg": '删除失败'
            }
        }
    }
})

/*
* @desc 项目提交列表
* @private
* */
router.post('/list', async (ctx, next) => {
    let page = ctx.request.body.page || 1;
    let pageSize = ctx.request.body.pageSize || 10;
    let server_ssh_url = ctx.request.body.server_ssh_url || '';
    let ip = ctx.request.body.ip || '';
    let start = (page-1)*page;
    if(ip == '' || typeof ip == 'undefined' || ip === null){
        ctx.body = {
            "code": 0,
            "data": {},
            "msg": 'ip不能为空'
        }
    }
    else{
        let data = await mysql.query(`select commit_id,git_http_url,user_username,event_name,commit_timestamp,homepage,project_name,git_ssh_url,isup,IFNULL(dirPath,'') as dirPath,IFNULL(parentPath,'') as parentPath,fail_reason,from_ip,target_ip from commit where id <=(select id from commit order by id desc limit ${start}, 1) and git_ssh_url = '${server_ssh_url}' and target_ip = '${ip}' or target_ip is null order by id desc limit ${pageSize};`);
        let count = await mysql.query(`select count(*) as n from commit where git_ssh_url = '${server_ssh_url}';`);

        ctx.body = {
            "code": 0,
            "data": {
                list: data,
                page: page,
                count:count[0].n
            },
            "msg": '请求成功'
        }
    }

})

router.get('/branch', async (ctx, next) => {
    var cmdStr = 'git branch';
    var res = await doShellCmd(cmdStr);
    ctx.body = res;
})

router.get('/log', async (ctx, next) => {
    var cmdStr = 'git log';
    var res = await doShellCmd(cmdStr);
    ctx.body = res;
})

/*
* @desc 上线
* @private
* */
router.post('/upload', async (ctx, next) => {
    var id = ctx.request.body.id;
    var beforeId = ctx.request.body.beforeId;
    if(beforeId == -1){
        var flag = await redis.get(id);
        if(flag == 1){
            ctx.body = {
                code:1,
                msg:'请勿重复打包',
                data:{}
            };
        }
        else{
            redis.set(id,1);
            ctx.body = {
                code: 0,
                msg: '开始打包',
                dara:{}
            }
        }
    }
    else{
        var updateMsg = await mysql.query(`update commit set isup = 0 where commit_id = '${beforeId}';`);
        if(updateMsg.changedRows >= 1){
            var flag = await redis.get(id);
            if(flag == 1){
                ctx.body = {
                    code:1,
                    msg:'请勿重复打包',
                    data:{}
                };
            }
            else{
                redis.set(id,1);
                ctx.body = {
                    code: 0,
                    msg: '开始打包',
                    dara:{}
                }
            }
        }
        else{
            ctx.body = {
                code: 1,
                msg: '更新失败',
                dara:updateMsg
            }
        }
    }
})

/*
* @desc 回滚
* @private
* */
router.post('/back', async(ctx, next) => {
    var id = ctx.request.body.id;
    var beforeId = ctx.request.body.beforeId;
    var dirPath = ctx.request.body.dirPath;
    var target_ip = ctx.request.body.target_ip || '';
    var project_name = ctx.request.body.project_name || ''
    var usernames = ctx.request.body.usernames || ''
    var servertype = Number(ctx.request.body.servertype) || 1
    var servertypestr = ctx.request.body.servertypestr || ''
    var git_ssh_url = ctx.request.body.git_ssh_url || ''
    var server_from_ip = ctx.request.body.server_from_ip;
    if(dirPath === null || dirPath == ''){
        ctx.body = {
            code: 1,
            msg: '项目路径为空，请重新上线',
            data:{}
        }
    }
    else if(target_ip == '' || typeof target_ip == 'undefined'){
        ctx.body = {
            code: 1,
            msg: '目标服务器IP不能为空',
            data:{}
        }
    }
    else{
        var res = await doShellCmd('rm -rf /web/gitlab && ln -s '+dirPath+'  /web/gitlab')
        var cmd = 'rm -rf /web/gitlab && ln -s '+dirPath+'  /web/gitlab';
        await spawnProcess('ssh',['-p 22','root@'+target_ip+'',cmd], false, ()=>{}, null,'update');
        await mysql.query(`update commit set isup = 1 where commit_id = '${id}';`);
        await mysql.query(`update commit set isup = 0 where commit_id = '${beforeId}';`);
        if(res.code == 0){
            await mysql.query(`insert into commit_history (project_name,dates,commit_id,typestr,usernames,servertype,servertypestr,git_ssh_url,up_type,fail_reason,from_ip,target_ip) values ('${project_name}',${new Date().getTime()},'${id}','回滚','${usernames}',${servertype},'${servertypestr}','${git_ssh_url}',1,'','${server_from_ip}','${target_ip}');`);
            ctx.body = {
                code:0,
                msg:'回滚成功',
                data:{}
            };
        }
        else{
            await mysql.query(`insert into commit_history (project_name,dates,commit_id,typestr,usernames,servertype,servertypestr,git_ssh_url,up_type,fail_reason,from_ip,target_ip) values ('${project_name}',${new Date().getTime()},'${id}','回滚','${usernames}',${servertype},'${servertypestr}','${git_ssh_url}',2,'','${server_from_ip}','${target_ip}');`);
            ctx.body = {
                code:1,
                msg:'回滚失败',
                data:{}
            };
        }
    }
})



module.exports = router
