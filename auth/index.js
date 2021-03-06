const app = require('express')();
const bp = require('body-parser');
var async = require("async");
const port = 1000;
const cors = require('cors');
const multipart = require('multer')({ dest: 'uploads/' }).none();

var request = require('request');

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({extended : true}));

app.use(multipart);

const baseRoutes = require('./routes/base');
const passwordRoutes = require('./routes/password')
const verificationRoutes = require('./routes/verification');
const $u = require('./requesters/database.user');

app.use(baseRoutes);

app.use('/password', passwordRoutes);
app.use('/verification', verificationRoutes);
require('./responders/login')(1004);
require('./publishers/auth.publisher');

app.listen(port, () => {
  console.log("Authentication App is online at port "+port);
});