const Redis = require('ioredis')
const redis = require("./../redis")
var receiver = new Redis();
const {fnCmd} = require('./../middles/index')
const WebSocketServer = require('ws').Server
const {date,spawnProcess,wsSend} = require('./../middles/Tool')
const mysql = require('./../mysql')

const server = function() {
    var wss = new WebSocketServer({port: 8188});//服务端口8188
    wss.on('connection', function (ws) {
        ws.on('message', async function (message) {
            var datas = JSON.parse(message);
            var dates = date(new Date().getTime());
            var typestr = datas.typestr == '' || typeof datas.typestr == 'undefined' ? '暂无上线类型' : datas.typestr;
            var usernames = datas.usernames == '' || typeof datas.usernames == 'undefined' ? '暂无用户名' : datas.usernames;
            var servertype = datas.servertype == '' || typeof datas.servertype == 'undefined' ? 1 : Number(datas.servertype);
            var servertypestr = datas.servertypestr == '' || typeof datas.servertypestr == 'undefined' ? '暂无服务器类型' : datas.servertypestr;
            var git_ssh_url = datas.git_ssh_url == '' || typeof datas.git_ssh_url == 'undefined' ? '暂无ssh' : datas.git_ssh_url;
            var target_ip = datas.target_ip == '' || typeof datas.target_ip == 'undefined' ? '暂无目标服务器ip' : datas.target_ip;
            var dir = '/gitlab/'+dates+'/'+datas.id+'/'+Math.floor(Math.random()*100000000000)+'';
            var parentPath = '/gitlab/'+dates+'/'+datas.id+'';
            var server_from_ip = datas.server_from_ip == '' || typeof datas.server_from_ip == 'undefined' ? '暂无源服务器IP' : datas.server_from_ip;

            if(datas.type == 'start'){
                // 源服务器打包
                var cmdResult = await fnCmd(datas.id, 'sudo mkdir -p '+dir+' && cd '+dir+' && sudo git clone '+datas.git_ssh_url+' && cd '+dir+'/'+datas.project_name+' && chmod -R 777 /gitlab/* && cnpm install && cnpm run build && rm -rf /web/gitlab && ln -s '+dir+'/'+datas.project_name+'/dist  /web/gitlab',ws);
                if(cmdResult.code == 0){
                    await ws.send(JSON.stringify({code: 0, msg:"打包成功"}));
                    // 目标服务器打包
                    var cmd = 'sudo mkdir -p '+dir+'/'+datas.project_name+' && cd '+dir+'/'+datas.project_name+' && sudo chmod -R 777 /gitlab/* && scp -r root@'+server_from_ip+':'+dir+'/'+datas.project_name+'/dist  '+dir+'/'+datas.project_name+' && rm -rf /web/gitlab && ln -s '+dir+'/'+datas.project_name+'/dist /web/gitlab';
                    await spawnProcess('ssh',['-p 22','root@'+target_ip+'',cmd], true, ()=>{}, ws, message,dir,parentPath);
                }
                else{
                    redis.set(datas.id,0);
                    await mysql.query(`insert into commit_history (project_name,dates,commit_id,typestr,usernames,servertype,servertypestr,git_ssh_url,up_type) values ('${datas.project_name}',${new Date().getTime()},'${datas.id}','${typestr}','${usernames}',${servertype},'${servertypestr}','${git_ssh_url}',2);`);
                    ws.send(JSON.stringify({code: 1, msg: "打包失败"}));
                }
            }
        });
    });
}


module.exports = server;
