"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

const sendMsg = require('./twilioAPI/twilio.js');
const sendMsgAdmin = require('./twilioAPI/twilio_admin.js');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

//creates route to admin
app.get("/admin", (req, res) => {
  knex.select('pizza_name', 'size', 'qty', 'total_price').from('data').then(data =>res.render('admin',
    {data:data}))
});

// creates route to status page
app.get("/status", (req, res) => {
  res.render("status");
});

// creates route to checkout page
app.get("/checkout", (req, res) => {
  res.render("checkout");
});

// post req. to checkout. when user clicks place order button.
app.post("/checkout", (req, res) => {
  let templateVars = {
    pizza: req.body.id,
    size: req.body.size,
    qty: req.body.qty,
    total_price: req.body.total
  }

  //loop
  knex('data').del().asCallback( (err) => {console.log(err)});
  for (let i =0; i < req.body.id.length; i++) {

    knex('data').insert({pizza_name: req.body.id[i], size: req.body.size[i], qty: Number(req.body.qty[i]), total_price: Number(req.body.total[i])}).asCallback( (err, result) => {
      console.log(err);

    })
  }
  res.render("checkout", templateVars);
});

// post req. to status. when user confirms his/her order.
app.post("/status", (req, res) => {
  // let templateVars = {
  //   pizza: req.body.id,
  //   size: req.body.size,
  //   qty: req.body.qty,
  //   total_price: req.body.total
  // }
  // console.log(req.body);
  // console.log(templateVars);
  // send text msg to the customer that the order is placed.
  // sendMsg();
  // send text msg to restaurant owner that the order is placed.
  // sendMsgAdmin();
  res.render("status");
});


// Home page
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
