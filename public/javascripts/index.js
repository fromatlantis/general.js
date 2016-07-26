'use strict';
/**
require('../stylesheets/index.css');
console.log('run');
**/
var template = require("../../views/index.jade");//返回一个函数
var html=template({'title':'love minghui2!'});
console.log('jade='+html);
$('body').html(html);