

const {Schema} = require('mongoose');
const bcrypt = require("bcrypt-nodejs")
const DB = require('../connections').find('users');
const ModelClass = require('./user.class');
const rating = require('../plugins/rating');
const mongoosastic  = require("mongoosastic");

const placeTime = new Schema({
  place : String,
  time : {type: Date, 'default' : Date.now}
}, {_id : false})

const userSchema = new Schema({
    email : { type : String, lowercase : true},
    password : { type : String, select : false },
    phone : { type : String , required: true},
    fullname : { type : String, es_indexed : true},
    gender : { type : String, lowercase : true},
    address: { type : String, es_indexed: true },
    dob : { type : String},
    backgroundPicture : String,
    logo : String,
    verification : {
      status : {type: Boolean, 'default' : false},
      number : {type: Number},
      date : {type: Date}
    },
    rcountry : {type: String, uppercase : true},
    ocountry : {type: String, uppercase : true},
    facebook : {type: String, select: false},
    google: {type: String, select: false},
    alternate_phone : String,
    account : {
      name : String,
      number : Number,
      bank : String,
      country : String//must align with those countries in DB
    },
	accountname: String,
	accountnumber: Number,
	bankname: String,
	bankcountry: String,
    pictureURL : {type : String, 'default' : 'default_avatar__2__S1bznMELX.png'},
    sizes : [{
        date : { type: Date, 'default' : Date.now},
        name : {type: String},
        description: String,
        measurement : Object,
        unit : String,
        owner : {type: Schema.Types.ObjectId, default: null},
        shared : [gangSchema]//for sharing
    }],
	bio : String,
	location : [placeTime],
	created : {type : Date, 'default': Date.now},
	creator : {type : Schema.Types.ObjectId, 'default' : null, select : false},
	vendorID : {type: String, 'default' : ''},
	office_address : {type: String, es_indexed : true},
	brandname: {type : String, es_indexed : true}
})

//encrypting the password
userSchema.pre('save',function(next){
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


//module to compare encrypted passward
userSchema.methods.comparepass = function(password){
  console.log(password, this.password)
  return bcrypt.compareSync(password, this.password)
}


module.exports = DB.model("User", userSchema);
