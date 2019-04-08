
const joi = require('joi');
const $u = require('../requesters/database.user');
const Pub = require('../publishers/auth.publisher');

module.exports = class tailorsControllers{

	static getTailors(req, res)
	{
		let user = $u.User.get({isTailor: true});
		user.then(data => {
			res.json(data);
		});
		//res.send("Hello world to this application.");
	}
	
	static getDetails(req, res)
	{
		//5ab9104671c21021af48b878
		let userid = req.params.id;
		$u.User.get({_id: userid, isTailor: true}).then(data => {
			res.json(data);
		})
	}
	
	
}
