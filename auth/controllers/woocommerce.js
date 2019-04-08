
const WooCommerceAPI = require('woocommerce-api');
const request = require('request');
const baseController = require('./base');
const WooCommerce = new WooCommerceAPI({
  url: 'https://market.tailorgang.io',
  consumerKey: 'ck_c163fd514c079ff28da56c70ed31bd0b8b461928',
  consumerSecret: 'cs_cde57b2d18bfa927dc88b1fadb34acac0033b3d5',
  wpAPI: false,
  version: 'v3'
});


module.exports = class WooCommerceController{
  static login(req, res){
      baseController.doLogin(req, res)
      .then()
  }
}
