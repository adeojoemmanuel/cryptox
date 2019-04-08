


const {Schema} = require('mongoose');
const DB = require('../connections').find('users');
const modelClass = require('./login.class');

const loginSchema = new Schema({
  email : {type: String, required: true},
  as : {type: String, enum : ['user', 'tailor', 'seller', 'admin'], default : 'user'},
  challenge : {type: String, enum : ['auth', 'email', 'password', null]},
  success : {type: Boolean, 'default' : false},
  headers : {type: Schema.Types.Mixed, required: true},
  deviceId : {type: String},
  ip : {type: String},//for now
  // ips : [{
  //     ip : {type: String},
  //     time : {type: Date, 'default' : Date.now}
  // }],
  // requests : [{
  //   endpoint : {type: String},
  //   time : {type: Date, 'default' : Date.now}
  // }],
  // location: {type: String},
  token : {type: Schema.Types.Mixed},
  time : {type: Date, 'default' : Date.now}
})


loginSchema.loadClass(modelClass);


module.exports = DB.model('Login', loginSchema);
