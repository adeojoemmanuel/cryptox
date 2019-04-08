
const {Types, Schema} = require('mongoose');
const DB = require('../connections').find('users');


const countriesSchema = new Schema({
	country:String,
	currency:String,
	fullCurrency:String,
  name : String
})

module.exports = DB.model('countries', countriesSchema);
