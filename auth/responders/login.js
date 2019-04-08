

/*
  decrypt token
  lookup in login table
  compare device
  send complete use details
*/
const {socket} = require('axon');
const res = socket('rep');
const $u = require('../requesters/database.user');
const {encrypt, decrypt} = require('../utils/secrets');
//testing port, change later

class loginResponder{

  static complete(email){
    return $u.User.getOne({email})
  }

  static decrypt(token){
    return decrypt(token, 'hash')
  }

  static lookup(login){
    return $u.Login.valid(login)
  }

  static compare(headers, login){
    return new Promise((resolve, reject) => {
      if('user-agent' in login.headers && headers['user-agent'] != login.headers['user-agent']){
        return reject(null)
      }
      resolve(login);
    })
  }

  static check(token, headers){
    return new Promise((resolve, reject) =>{
      this.decrypt(token)
      .then(({login}) => this.lookup(login), reject)
      .then(login => this.compare(headers, login) , reject)
      .then(({email}) => this.complete(email), reject)
      .then(resolve,reject)
      .catch(reject)
    })
  }

  static isSelf(){

  }
}

module.exports = (port) => {

  res.bind(port);

  res.on('message', function(method, args, reply){
    if(loginResponder[method]){
      loginResponder[method].apply(loginResponder, args)
      .then(data => reply({resolve : data}), err => reply({reject : err}))
      .catch(err => reply({reject : err}))
    }else{
      reply({reject : `${method} is not a defined method`})
    }
  })
}
