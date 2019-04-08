
const mongoose =  require('mongoose');
let connections = [];


module.exports = class Database{

  static get mode(){
    return 'production'
  }

  static get env(){
    return {
      production : {
        port : 26101,
        host : "191.96.51.43"
      },
      development : {
        port : 26101,
        host : "45.79.213.121"
      },
    }
  }

  static composeObject({username, password, authDB}){
    return `mongodb://${username}:${encodeURIComponent(password)}@${Database.env[Database.mode].host}:${Database.env[Database.mode].port}/${authDB}`
  }

  static init({name, password, username, authDB}){

    let connection = mongoose.createConnection(Database.composeObject({username, password, authDB}));

    connection.on('connected', function () {
        console.log(`${name} Database is Online`);
    });
    connection.on('error',function (err) {
        console.log(`${name} Database failed to connect because: ` + err);
    });
    connection.on('disconnected', function () {
        console.log(`${name} Database has been disconnected`);
    });

    process.on('SIGINT', function() {
        connection.close(function () {
            console.log(`${name} Database disconnected through app termination`);
        });
    });

    connections.push({[name] : connection});
    return connection;
  }

  static find(name){
    return connections.find(c => Object.keys(c)[0] == name)[name];
  }

  static get configs(){
    return [
      {name : 'users', username : 'v2_tailor-gang-adminTECH-user', password : 'v2_data_GOD_creates@wayG))Dfash-tailors_2017-18-06--nugi0buildf0ee30-cbaA_monGoliav2', authDB : 'v2_tailorgang'}
    ]
  }

  static connectAll(){
      Database.configs.forEach(config => {
        Database.init(config);
      })
  }
}