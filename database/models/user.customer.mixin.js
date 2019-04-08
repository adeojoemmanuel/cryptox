
const {Mixin} = require('mixwith')
const {Types} = require('mongoose')
const minSelect = require('../plugins/minSelect');
const Invoice = require('./invoice')

module.exports = Mixin(superClass => class extends superClass{
  static customerCount({tailor}){
    return this.findOne({_id : tailor, tailor : {$ne : null}, 'tailor.customers' : {$exists : true}})
    .then(user => user.tailor && user.tailor.customers && user.tailor.customers.length || 0)
  }

  static createCustomer({tailor, data}){
    console.log({data}, (typeof data == "string"))
      return (typeof data == "string") ? this.userCustomer({tailor, user : data}) : this.guestCustomer({tailor, customer: data})
  }

  static customerStats({tailor, month, year}){
    return this.aggregate([
      {$match : {tailor : {$ne : null}, ...(tailor ? {_id : Types.ObjectId(tailor)} : {})}},
      {$unwind : '$tailor.customers'},
      {$replaceRoot : {newRoot : '$tailor.customers'}}
    ])
  }

  static guestCustomer({tailor, customer}){
      return this.createGuest({tailor, guest : customer})
      .then(({_id}) => this.userCustomer({tailor, user : _id}))
  }

  static userCustomer({tailor, user}){
    return this.getOneAndEdit({
      _id : Types.ObjectId(tailor),
      tailor : {$ne : null}
    },{
      _id : Types.ObjectId(tailor),
      tailor : {$ne : null},
      'tailor.customers.user': {$ne : Types.ObjectId(user)}
    },{$push : {'tailor.customers' : {user}}})
  }

  static customers({tailor, skip, limit, all}){
    return this.aggregate([
      {$match : {_id : Types.ObjectId(tailor), tailor : {$ne : null}} },
      {$replaceRoot : {newRoot : '$tailor'}},
      {$unwind : "$customers"},
      {$sort : {"customers.date": -1}},
      ...(!all ? [
        {$skip: parseInt(skip) || 0},
        {$limit : parseInt(limit) || 30},
      ] : []),
      {$replaceRoot : {newRoot : '$customers'}}
    ]).then(customers => this.populate(customers, {path : 'user', model : this, select : minSelect}))
    .then(customers => Promise.all([Promise.resolve(customers), Invoice.debt({tailor, customers : customers.map(({user : {email}}) => email)})]))
    .then(([customers, info]) => Promise.resolve(customers.map(customer => {
       let found = info.find(({payeremail: e}) => e == customer.user.email);
       return {debt : found || {debt : 0}, ...customer};
     })))
  }

  static deleteCustomer({customer, tailor, login}){
    return this.update({_id : tailor, tailor : {$ne : null}},{ $pull : {'tailor.customers' : {user : customer} } })
    .then(({nModified}) => Promise.resolve(Boolean(nModified).valueOf()))
  }
})
