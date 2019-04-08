
const $u = require('../requesters/database.user');
const joi = require('joi');
const jwt = require('jsonwebtoken')
const Pub = require('../publishers/auth.publisher');
var request = require('request');


module.exports = class passwordController{

  static get resetKey(){
    return "TG@@rktfbermgs(@@)@@";
  }

  static generateCode(user){
    return new Promise((resolve, reject)=>{
      $u.User.getOneOrFail({
        email : user
      })
      .then(user => {
        resolve({user, token : jwt.sign({user : user._id},passwordController.resetKey, {expiresIn : 60 * 20})})
      }, reject)
      .catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  static get requestTokenSchema(){
    return joi.object().keys({
      email : joi.string().email().required()
    })
  }

  static requestToken(req, res){
    passwordController.generateCode(req.body.email)
    .then((code) => {
      $u.User.findOne({
        email: req.body.email
      })
      .then((usr) => {
        console.log(code.token);
        request.get("https://market.tailorgang.io/resetmailer/?"+"email="+usr.email+"&id="+usr._id+"&fullname="+usr.fullname+"&token="+code.token, function(error_, response_, body_){
          if(body_ == 1 || body_ == "1"){
            res.json("We've sent an email to "+usr.email+". Kindly follow the instructions to reset your password")
          }else{
            res.status(500).json(err.toString())
          }
        })
      })

      //let d = Pub.resetcode(code)
      //console.log(d)

    }, (err) => res.status(400).json(false))
    .catch(err => res.status(500).json(err.toString()))
  }

  static checkToken(code){
    //time added shouldnt be above 20 minutes and user exist
    return new Promise((resolve, reject)=> {
      jwt.verify(code, passwordController.resetKey, function(err, decoded){
        if(err) return reject(err)
        $u.User.findOneOrFail({
          _id : decoded.user
        })
        .then(user => {
          resolve({user, token : decoded})
        }, reject)
        .catch(err => {
          reject(err)
        })
      })
    })
  }

  static verifyToken(req, res){
    passwordController.checkToken(req.params.token)
    .then(data => res.json(data), err => res.status(400).json(err.toString() || err))
    .catch(err => res.status(500).json(err.toString()))
  }

  static get resetPasswordSchema(){
    return joi.object().keys({
      email : joi.string().email().required(),
      password : joi.string().min(6).max(32).required()
    })
  }

  static resetPassword(req, res){
    passwordController.checkToken(req.params.token)
    .then( ({user, token}) => {
      return $u.User.resetPassword({email : user.email}, req.body.password)
    }, err => res.status(400).json(err.toString() || err))
    .then(user => res.json(user),  err => res.status(400).json(err.toString()))
    .catch(err => res.status(500).json(err.toString()))
  }
}
