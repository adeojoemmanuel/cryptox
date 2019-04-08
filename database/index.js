

//connect to database
const Database = require('./connections');
Database.connectAll();


require('./responders/user')(3232);
//require all responders
