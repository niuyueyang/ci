const redis = require("./../redis")
const exec = require('child_process').exec;
var Redis = require("ioredis");
var pub = new Redis();

/*
* @desc 执行linux命令
* @public
* */
function doShellCmd(cmd){
    let str=cmd;
    return new Promise(function(resolve,reject){
        exec(str,function(err,stdout,stderr){
            if(err){
                resolve({
                    code:1,
                    msg:stderr
                });
            }else{
                resolve({
                    code:0,
                    msg:stdout
                });
            }
        })
    })
}

/*
* @desc 执行linux shell命令
* @public
* */
function doShellCmd(cmd){
    let str=cmd;
    return new Promise(function(resolve,reject){
        exec(str,function(err,stdout,stderr){
            if(err){
                resolve({
                    code:1,
                    msg:stderr
                });
            }else{
                resolve({
                    code:0,
                    msg:stdout
                });
            }
        })
    })
}

/*
* @desc 执行linux命令
* @public
* */
async function fnCmd(id, cmd, ws) {
    return new Promise(async (resolve, reject) => {
        var res = await doShellCmd(cmd);
        if(res.code == 0){
            redis.set(id,0)
            resolve(res)
            // pub.publish(id, '打包成功');
        }
        else{
            redis.set(id,0);
            resolve(res)
            // redis.publish(id, '打包失败');
        }
    })

}

module.exports = {
    doShellCmd,
    fnCmd,
}
