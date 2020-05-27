const mysql = require('./mysql');
function dateToStr (datetime) {
    var datetimes = new Date(datetime)
    var year = datetimes.getFullYear()
    var month = datetimes.getMonth() + 1// js从0开始取
    var date = datetimes.getDate()
    month = month < 10 ? '0' + month : month
    date = date < 10 ? '0' + date : date
    return year + '-' + month + '-' + date
}
var start = new Date().getTime();
console.log('开始')
for(let j = 0; j < 20; j++){
    var str = '';
    for(let i = 10000 * j; i < 10000 * (j+1); i++){
        str += `('user_${i}','pwd_${i}','${dateToStr(new Date().getTime())}','test1_${i}','test2_${i}','test3_${i}','test4_${i}','test5_${i}','test6_${i}','test7_${i}','test8_${i}','test9_${i}','test10_${i}','test11_${i}','test12_${i}'),`
    }
    str = str.slice(0, -1);
    mysql.query(`insert into test1 (username,pwd,date,test1,test2,test3,test4,test5,test6,test7,test8,test9,test10,test11,test12) values ${str};`);
}
var end = new Date().getTime();
console.log('耗时：'+(end-start)/1000)
