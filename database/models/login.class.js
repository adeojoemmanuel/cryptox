

module.exports = class loginModelClass{

  static pass({email, headers, ip}){
    ip = Array.from(new Set(ip.split(','))).map(address => ({ip : address}))
    return this.create({email, headers, challenge : null, success : true, ip})
  }

  static fail({email, headers, challenge, ip}){
    ip = Array.from(new Set(ip.split(','))).map(address => ({ip : address}))
    return this.create({email, headers, challenge, success : false, ip})
  }

  static pushRequest({login, ip}){
    return this.findOneAndUpdate({
      _id : login
    },{
      $push : {}
    },{new : true})
  }

  static valid(id){
    return new Promise((resolve, reject) => {
      this.findOne({_id : id})
      .then(login => login ? resolve(login) : reject(login), reject)
      .catch(reject)
    })
  }
}
