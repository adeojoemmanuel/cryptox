

const {Schema} = require('mongoose');


module.exports = new Schema({
  user : { type : Schema.Types.ObjectId, ref : 'User'},
  date : {type: Date, 'default' : Date.now}
},{
  _id : false
})
