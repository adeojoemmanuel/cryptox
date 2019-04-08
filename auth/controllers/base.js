

const $u = require('../requesters/database.user');
const joi = require('joi');
const hashSecret = 'T@!10R5@N5$@17';
const jwt = require('jsonwebtoken');
const Pub = require('../publishers/auth.publisher');
const Verify = require('./verification');


module.exports = class baseController{


  static prepToken(id){
    return jwt.sign({login : id}, hashSecret);
  }

  static get loginSchema(){
    return joi.object().keys({
      email : joi.string().email().required(),
      password : joi.string().min(6).max(32).required(),
      token : joi.string().optional(),
      deviceId : joi.string().optional(),
      location : joi.string().allow('', null)
    })
  }

	static doLogin(req, res){

      let allowed = ['tailor', 'admin', 'seller'];
      return $u.User.login(Object.assign({
        headers : req.headers,
        as : req.query.as && allowed.includes(req.query.as) ? req.query.as : 'user',
        ip : req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }, req.body))

	}
	
	static available(req, res){
		$u.User.aggregate([
			{
				$match: {	
					$or: [{
						"email": req.params.item
					}, {
						"phone": req.params.item
					}]
				}
			},
			{
				$count: "result"
			}
		]).then((user) => { res.json(user[0]) }, err => res.status(400).json(err))
		.catch(err => res.status(500).json(err.toString()))
	}

  static login(req, res){
    //create a failed login
    //user login
    //hash them a token which is the login id
    //set login to success
    //publish auth:login
    //login as
    baseController.doLogin(req, res)
    .then(([login, user]) => {
      Pub.login({login, user});
      res.json(baseController.attachToken(user, login))
    }, err => res.status(400).json(err))
    .catch(err => res.status(500).json(err.toString()))
  }

  static attachToken(user, login){
    delete user.password;
    return Object.assign(user, {token : baseController.prepToken(login._id)})
  }


  static get signupSchema(){
    return joi.object().keys({
      fullname : joi.string().required(),
      email : joi.string().email().lowercase().required(),
      phone : joi.string().required(),
      pictureURL : joi.string().uri().optional(),
      address : joi.string().optional(),
      password : joi.string().min(6).max(32).required(),
      rcountry : joi.string().uppercase().required(),
      token : joi.string().optional(),
      deviceId : joi.string().optional()
    })
  }

  static signup(req, res){
    //create user record
    //do login with created info
    //publish auth:register
    $u.User.signup(Object.assign(req.body, {
      headers : req.headers,
      ip : req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      verification : { number : Verify.generateCode() }
    }))
    .then(([user, login]) => {
      if(!('mobile' in req.query)){
          Pub.signup(user);
      }else{
          Pub.verifyCode({user, meduim : 'email'});
      }
      Pub.login({user, login});
      res.json(baseController.attachToken(user, login))
    }, err => {
      res.status(400).json(err)
    })
    .catch(err => {
      res.status(500).json(err.toString())
    })
  }

  static getuser(req, res){
    $u.User.findOne({
      _id: req.params.id
    }).then((user) => {
      res.json(user)
    })
    .catch(err => {
      res.status(500).json(err.toString())
    })
  }

}
