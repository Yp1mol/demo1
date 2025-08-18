const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');
const bodyParser = require("body-parser");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "todo", 
    password: "qweQWE123;",
});
users = ["123", "123"];
 const sql1 = `INSERT INTO accounts(username, password) VALUES  (?, ?)`;
            connection.query(sql1, users, function (err, results) {
                if (err) console.log(err);
            });
const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) { 
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home'); 
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});
app.post('/createuser', (req, res) => {
    const user_id = req.body.user;
	const user_psw = req.body.pass;
    console.log(user_id);
    console.log(user_psw);
    const query = `SELECT * FROM accounts WHERE username = (?)`;
    connection.query(query, user_id, (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.send('User is taken');
        } else {
            users = [user_id, user_psw];
            const sql = `INSERT INTO accounts(username, password) VALUES  (?, ?)`;
            connection.query(sql, users, function (err, results) {
                if (err) console.log(err);
            });
            connection.query("SELECT * FROM accounts", function (err, results, fields) {
                console.log(err);
                console.log(results);
            });
            res.send("pass");
        }
    });

});

app.get('/home', function(request, response) { 
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
}); console.log("123123")

app.listen(3010);