
const Login = require('./login');
const {Types} = require('mongoose');
const  {Model} = require('moloquent')
const {mix} = require('mixwith')
const Tailor = require('./user.tailor.mixin')
const Size = require('./user.size.mixin')
const Guest = require('./user.guests.mixin')
const Customer = require('./user.customer.mixin')
const userThere = require('../plugins/userThere');
const Country = require('./countries');
const minSelect = require('../plugins/minSelect')
const objectId = require('../plugins/objectid');



const bioString =  (val) => {
    let bios = [
      {$concat : [`The beauty of your outfit depends on your designer's passion. `, "$fullname", `'s passion breathes art and life into every created piece.`]},
      {$concat : [`A good designer defines the future of fashion. `, "$fullname", ` will help you develop a unique style`]},
      {$concat : ["$fullname" , ` brings tailoring to a different level with skills that allow you express your passion in every outfit`]},
      {$concat : ["$fullname" , `'s work goes beyond assembling fabric. Be sure to step out in style with outfits borne from profound passion for good design`]}
      //add others
    ]
    return bios[val]
}

module.exports = class userModelClass extends mix(Model).with(Tailor, Size, Guest, Customer){

  static login({email, password, location,headers, as, deviceId, token, ip}){
    return new Promise((resolve, reject) => {
      this.findOne({email, creator : null}).select('+password')
      .then(user => {
        if(!user){
          return Promise.all([
            Login.fail({email, headers, challenge : 'email', ip}),
            Promise.reject({'email' : 'incorrect email'})
          ])
        }else if(user && !user.verification.status){
            return Promise.all([
                Login.fail({email, headers, challenge : 'auth', ip}),
                Promise.reject({email : 'Account with this email has not been verified'})
            ])
        }else if(user && (as != 'user' && user[as])){
          return Promise.all([
              Login.fail({email, headers, challenge : 'auth', ip}),
              Promise.reject({email : `Account with this email is not an active ${as}`})
          ])
        }else if (user && !user.comparepass(password)) {
          return Promise.all([
            Login.fail({email, headers, challenge : 'password', ip}),
            Promise.reject({'password' : 'incorrect password'})
          ])
        }else{
          if(location) user.location.push({place : location});
          return Promise.all([
            Login.pass(Object.assign({email, headers, ip}, deviceId && {deviceId}, token && {token})),
            user.save()
          ])
        }
      })
      .then(resolve, reject)
      .catch(reject)
    })
  }

  static countries(){
    return new Promise((resolve, reject)=>{
      Country.find()
      .then(countries => {
        resolve(countries)
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  static signup({email, headers, ip, phone, rcountry, ...body}){
    return new Promise((resolve, reject) => {
      Promise.all([
          this.find({$or : [{email},{phone}]}),
          Country.findOne({country : rcountry})
      ])
      .then(([users, country]) => {
        if(users.length) return reject(Object.assign({},
          users.find(user => user.email == email && user.creator == null)  && {email : 'user already exist'},
          users.find(user => user.phone == phone && user.creator == null) && {phone : 'user already exist'}
        ));
        if(!country) return reject({country : 'country doesnt exist'});
        return Promise.all([
          this.create(Object.assign({email,rcountry, phone}, body)),
          Login.pass(Object.assign({email, headers, ip}, body.deviceId && {deviceId :  body.deviceId}, body.token && {token : body.token}))
        ])
      }, reject)
      .then(resolve, reject)
      .catch(reject)
    })
  }

  static exist(prop){
    return new Promise((resolve, reject)=>{
      this.findOne(prop)
      .then(user => {
        if(!user) return reject(user)
        resolve(user)
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  static resetPassword(query, password){
    return new Promise((resolve, reject) =>{
      this.exist(query)
          .then(user=>{
              user.set({password});
              return user.save();
          },reject)
          .then(resolve, reject)
          .catch(reject)
    })
  }

  static verification(user, body){
    //return this.findOneAndUpdate(user,{
    return this.findOneAndUpdate(user,{
      $set : {
        verification : body
      }
    },{new : true})
  }

  static findOneOrFail(query){
    return this.findOne(query)
            .then(user => user ? Promise.resolve(user) : Promise.reject(user), Promise.reject)
            .catch(Promise.reject)
  }

  static async verify(user, number){
      let match = await this.findOne({_id : user});
      if(!match) return null;
      if(match && match.verification.number == number){
        match.set({verification : {number, status : true, date : Date.now()}})
        return match.save();
      }
       return Promise.reject({number : 'incorrect verification number entered'})
  }

  static gang(user, gang){
      return this.update({
          _id : Types.ObjectId(user),
          $expr : {$ne : [user, gang]},
          'gang.user' : {$ne : gang}
        },{
          $push : {gang : {user : gang}}
      })
      .then(({nModified}) => Boolean(nModified).valueOf())
  }

  static ungang(user, gang){
    return this.update({
        _id : Types.ObjectId(user),
      },{
        $pull : {gang : {user : gang}}
    })
    .then(({nModified}) => Boolean(nModified).valueOf())
  }

  static gangList({user, skip = null, limit = null, search = null, ganged = false}){
    let gang = ganged ? 'ganged' : 'gang'
    return  this.aggregate([
		  {$match : {[ganged ? 'gang.user' : '_id'] : Types.ObjectId(user)}},
		  ...(ganged ? [
        //user, when they ganged u
        {$addFields : {gangInfo : {$arrayElemAt : [{$filter : {
          input : '$gang',
          as: "u",
          cond: { $eq : ['$$u.user', Types.ObjectId(user)]}
        }},0]}}},
        {$project : {
          user : '$_id',
          _id : 0,
          date : '$gangInfo.date'
        }}
      ] : [
        {$unwind : `$gang`},
        {$replaceRoot : {newRoot : '$gang'}}
      ]),
			...(search ? [
					{
						$lookup : {
			        from: "users",
			        localField: `user`,
			        foreignField: "_id",
			        as: "gangInfo"
	      		}
					},
					{$unwind : "$gangInfo"},
					{
						$match : {
							'gangInfo.fullname' : {
								$regex: new RegExp(search),
								$options: "i"
							}
						}
					}
			] : []),
		  {$skip : parseInt(skip) || 0},
		  {$limit : parseInt(limit) || 50}
    ])
    .then(users => this.get({login: user,_id : {$in : users.map(({user}) => Types.ObjectId(user))}}))
  }


  static async get({
    user,
    size = null,
    sizes = false,
    verified = true,
    isTailor = false,
    guest = false,
    limit = 30,
    skip = 0,
    sort = null,
    login,
    search,
    userLocation,
    ...query
    //add login here
  }){
    if(search){
        console.log(search.split(' ').map(s => new RegExp(s)))
    }

  let $search = search ? {$regex : new RegExp(search), $options : 'i'} : search;
  let countries = await (search ? Country.find({name : {$in : search.split(' ').map(s => new RegExp(s,'ig'))} }) : Promise.resolve([]));
	let rand = Math.floor(Math.random() * 4);
    return this.aggregate([
      ...(verified ? [
        //{$match : {'verification.status' : true}}
      ] : []),
      ...(isTailor ? [
        {$match : Object.assign({tailor : {$ne : null}}, userLocation && !search && {rcountry : userLocation})}
      ] : []),
      {$match : query},{
        $lookup : {
         from: 'countries',
         localField: 'rcountry',
         foreignField: 'country',
         as: 'countryResidence'
       }
      },{
        $lookup : {
         from: 'countries',
         localField: 'ocountry',
         foreignField: 'country',
         as: 'countryOrigin'
       }
     },
      ...(search ? [//if [tailor, seller] check for brandname and keywords
        {$match : {
            $or : [
            {rcountry : {$in : countries.map(c => c.country)}},
            {address : {$in : search.split(' ').map(s => new RegExp(s,'ig'))}},
            {fullname : $search},
            {fullname : {$in : search.split(' ').map(s => new RegExp(s,'ig'))}},
            ...(isTailor ? [
              {$or : [
                    {'tailor.brandname' : $search},
                    {'tailor.brandname' : {$in : search.split(' ').map(s => new RegExp(s,'ig'))}},
              ]}
            ]:[]),
          ]}
        }
      ] : []),
      {$skip : parseInt(skip) || 0},
      {$limit : parseInt(limit) || 30},{
        $lookup : {
          from: 'users',
          localField: '_id',
          foreignField: 'gang.user',
          as: 'gangers'
        }
      },{
       $addFields : Object.assign({
         pictureURL : {$ifNull : ["$pictureURL", "default_avatar__2__S1bznMELX.png"]},
         payCurrency : {$cond : [{$eq : ['$rcountry','NG']}, 'NGN', 'USD']},
         bio : {$cond : [
                    {$and : [{$ne : ["$tailor", null]}, {$eq : [{$strLenBytes : {$ifNull:  ["$bio", ""]}}, 0]}]},
                    bioString(rand),
                    "$bio"
          ]},
          ganged : {$size : '$gangers'},
          ganging : userThere('gang', login),
          gang : {$size : '$gang'},
          country : {
            residence : {$arrayElemAt : ['$countryResidence', 0]},
            origin : {$arrayElemAt : ['$countryOrigin', 0]}
          },
          sizes : {$size : '$sizes'}
        })
      },{//after computing rating, add sorting thingy here
        $project : {
          gangers : 0,
          password : 0,
          countryResidence : 0,
          countryOrigin : 0,
        }
      }
    ])
  }

  static getOne(query){
      return this.get({...query, limit : 1}).then(([user]) => Promise.resolve(user || null))
  }

  static getById(id){
    return this.getOne({
      _id : Types.ObjectId(id)
    })
  }

  static updateToken({token, login}){
    return Login.findOneAndUpdate({_id : login}, {$set : {token}})
  }

  static updateUser(user, body){
    return this.edit({_id : Types.ObjectId(user)}, {$set : body})
  }

  static changePassword({password, newPassword, id}){
    return new Promise((resolve, reject) => {
        this.findOne({
         _id : id,
       })
       .select("+password")
       .then(user => {
          if(!user) return reject(user)
          if(user && !user.comparepass(password))  return reject({password : 'password incorrect'})
          user.set({password : newPassword});
          return user.save()
       }, reject)
       .then(({_doc : {password, ...user}}) => resolve(user), reject)
       .catch(reject)
    })
  }
}
