

const bcrypt = require("bcrypt-nodejs");
const {Schema} = require('mongoose');
const DB = require('../connections').find('users');
const gangSchema = require('./user_time.schema');

const signupSchema = new Schema({
    email : { type : String, lowercase : true},
    password : { type : String, select : false },
    phone : { type : String , required: true},
    fullname : { type : String},
    gender : { type : String, lowercase : true, enum : ['male', 'female']},
    address: { type : String },
    dob : { type : String},
    backgroundPicture : String,
    verification : {
      status : {type: Boolean, 'default' : false},
      number : {type: Number},
      date : {type: Date}
    },
    tailor : {type : String, 'default' : null},
    rcountry : {type: String, uppercase : true},
    ocountry : {type: String, uppercase : true},
    account : {
      name : String,
      number : Number,
      bank : String,
      country : String//must align with those countries in DB
    },
    pictureURL : {type : String, 'default' : null},
    sizes : [{
        date : { type: Date, 'default' : Date.now},
        name : {type: String, required: true},
        description: String,
        measurement : Object,
        shared : [gangSchema]//for sharing
    }],
	bio : String,
  created : {type : Date, 'default': Date.now, expires : 60*60*6},
})

signupSchema.pre('save',function(next){
var user = this;

if(user.isModified('password')){
    bcrypt.hash(user.password,null,null,function(err,hash){
        if(err) return next(err)
        user.password = hash;
        next()
    })
}else{
    next();
}
})

module.exports = DB.model('Signup', signupSchema);
