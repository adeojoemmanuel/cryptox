//An eye opener

const { socket } = require('axon')
let responder = socket('rep');

const Model = {
  User : require('../models/user'),
  Login : require('../models/login'),
  Discover : require('../models/discover'),
  Payment : require('../models/payment'),
  Request : require('../models/request'),
  Country : require('../models/countries'),
  Class : require('../models/classes'),
  Contents : require('../models/contents'),
  Subscription : require('../models/subscription'),
  Video : require('../models/video'),
  Expenses : require('../models/expenses'),
  Earnings : require('../models/earnings'),
  Invoice : require('../models/invoice'),
  Paymentlog : require('../models/paymentlog'),
  Cart : require('../models/cart'),
  Applog : require('../models/applog'),
  Style : require('../models/style'),
  Todos: require('../models/todo')
}

module.exports = (port) => {
    responder.bind(port);
    responder.on('message', function(object, args, reply){
      let [model, method] = object.split(':');
      if(!Model[model] || !Model[model][method]){
        return reply({reject :  `Undefined Method '${method}'`});
      }
        Model[model][method].apply(Model[model],args)
        .then(data => {
          reply({resolve : data})
        }, err => {
          console.warn({err})
          reply({reject : err})
        })
        .catch(err => {
          console.error({err})
          reply({reject : err})
        })
    })
}
