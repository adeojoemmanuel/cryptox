
const {Mixin} = require('mixwith')
const {Types} = require('mongoose')


module.exports = Mixin(superClass => class extends superClass{
  static createGuest({tailor, guest}){
    console.log({guest})
    return this.findOneAndUpdate({
        creator : tailor,
        email : guest.email,
        phone : guest.phone
     },Object.assign({creator : tailor}, guest),{
      new  : true,
      upsert : true
    })
  }


  static updateGuest({tailor, customer, id}){
    return this.edit({
      _id : Types.ObjectId(id),
      creator : Types.ObjectId(tailor)
    },{$set : customer})
  }

  static getGuest({limit, skip,...query}){
    return this.find({...query, creator : {$ne : nul}})
            .skip(parseInt(skip) || 0)
            .limit(parseInt(limit) || 30)
  }


  static morphToUser({email, phone, _id}){
    //
  }
})
