var fs = require('fs'); // 引入fs模块
const mysql = require('./../mysql')

/*
* @desc 删除服务器文件
* @params path {String} 要删除的文件路径
* @public
* */
function deletePath(path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deletePath(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}


/*
* @desc 时间戳转换为日期格式 YYYY-MM-DD
* @params timestamp {time} 时间戳
* @return 日期
* @example 2020-04-16
* @public
* */
function date(timestamp) {
    var date = (new Date(timestamp).getFullYear()) + "-" +
        (new Date(timestamp).getMonth() + 1) + "-" +
        (new Date(timestamp).getDate());
    return date
}

/*
* @desc 转换为随机字符串
* @params len {Number} 随机字符串长度
* @return 固定长度的随机字符串
* @example uwqeyuyuqweyuyqweqwieoijaDH
* @public
* */
function randomString(len) {
    len = len || 32;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = $chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

/*
* @desc ssh登录
* @params
* command {String} linux命令
* options {Array} 相关配置
* callback {Function} 回调
* flag {Boolean} true：websocket发送成功消息 false：不发送
* ws {Websocket} websocket
* data {String} 数据
* @public
* */
function spawnProcess(command, options, flag = true, callback, ws, data = '',dir, parentPath) {
    if(data.length >= 20){
        var finishFlag = false;
        var cp = require('child_process');
        var child = null;
        var datas = JSON.parse(data);
        var dates = date(new Date().getTime());
        var typestr = datas.typestr == '' || typeof datas.typestr == 'undefined' ? '暂无上线类型' : datas.typestr;
        var usernames = datas.usernames == '' || typeof datas.usernames == 'undefined' ? '暂无用户名' : datas.usernames;
        var servertype = datas.servertype == '' || typeof datas.servertype == 'undefined' ? 1 : Number(datas.servertype);
        var servertypestr = datas.servertypestr == '' || typeof datas.servertypestr == 'undefined' ? '暂无服务器类型' : datas.servertypestr;
        var git_ssh_url = datas.git_ssh_url == '' || typeof datas.git_ssh_url == 'undefined' ? '暂无ssh' : datas.git_ssh_url;
        var target_ip = datas.target_ip == '' || typeof datas.target_ip == 'undefined' ? '暂无目标服务器ip' : datas.target_ip;
        var server_from_ip = datas.server_from_ip == '' || typeof datas.server_from_ip == 'undefined' ? '暂无源服务器IP' : datas.server_from_ip;
        if (!!options[0]) {
            child = cp.spawn(command, options);
        } else {
            child = cp.exec(command, options);
        }

        var prefix = command === 'ssh' ? '[' + options[0] + '] ' : '';

        child.stderr.on('data', async function (chunk) {
            //打包成功更新数据库
            await mysql.query(`update commit set dirPath = '',parentPath = '',isup = 0,from_ip = '${server_from_ip}',target_ip = '${target_ip}', fail_reason = '${addBeauty(chunk)}' where commit_id = '${datas.id}';`);
            await mysql.query(`insert into commit_history (project_name,dates,commit_id,typestr,usernames,servertype,servertypestr,git_ssh_url,up_type,fail_reason,from_ip,target_ip) values ('${datas.project_name}',${new Date().getTime()},'${datas.id}','${typestr}','${usernames}',${servertype},'${servertypestr}','${git_ssh_url}',2,'${addBeauty(chunk)}','${server_from_ip}','${target_ip}');`);
            if(flag){
                ws.send(JSON.stringify({code: 1, msg:"同步失败"}));
            }
        });

        var res = [];
        child.stdout.on('data', function (chunk) {
            finishFlag = true;
            res.push(chunk.toString());
            console.log(addBeauty(chunk))
            console.log('原因2：'+addBeauty(chunk));
        });

        function addBeauty(buf) {
            return prefix + buf
                .toString()
                .replace(/\s+$/, '')
                .replace(/\n/g, '\n' + prefix);
        }

        child.on('exit', async function (code) {
            if(code == 0){
                await mysql.query(`update commit set dirPath = '${dir}/${datas.project_name}/dist',parentPath = '${parentPath}',isup = 1,from_ip = '${server_from_ip}',target_ip = '${target_ip}', fail_reason = '' where commit_id = '${datas.id}';`);
                await mysql.query(`insert into commit_history (project_name,dates,commit_id,typestr,usernames,servertype,servertypestr,git_ssh_url,up_type,fail_reason,from_ip,target_ip) values ('${datas.project_name}',${new Date().getTime()},'${datas.id}','${typestr}','${usernames}',${servertype},'${servertypestr}','${git_ssh_url}',1,'','${server_from_ip}','${target_ip}');`);
                ws.send(JSON.stringify({code: 0, msg:"同步成功"}));
            }
            if (callback) {
                callback(code === 0 ? null : code, res && res.join('\n'));
            }
        });
    }
    if(data == 'update' || data == 'delete'){
        var cp = require('child_process');
        if (!!options[0]) {
            child = cp.spawn(command, options);
        } else {
            child = cp.exec(command, options);
        }

        var prefix = command === 'ssh' ? '[' + options[0] + '] ' : '';

        child.stderr.on('data', async function (chunk) {
            console.log(chunk)
        });

        var res = [];
        child.stdout.on('data', function (chunk) {
            res.push(chunk.toString());
        });

        function addBeauty(buf) {
            return prefix + buf
                .toString()
                .replace(/\s+$/, '')
                .replace(/\n/g, '\n' + prefix);
        }

        child.on('exit', async function (code) {
            console.log(code)
            if (callback) {
                callback(code === 0 ? null : code, res && res.join('\n'));
            }
        });
    }
}
module.exports = {
    date,
    randomString,
    spawnProcess,
    deletePath
    // ssh
}

