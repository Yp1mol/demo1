const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');

const connection = mysql.createConnection({
  host: "localhost",
  user: "root", 
  database: "todo",
  password: "qweQWE123;", 
});

const app = express();

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password) {
    connection.query(
      'SELECT * FROM accounts WHERE username = ? AND password = ?',
      [username, password],
      function (error, results) {
        if (error) throw error;
        if (results.length > 0) {
          req.session.loggedin = true;
          req.session.username = username;
          res.redirect('/home');
        } else {
          res.send('Incorrect Username and/or Password!');
        }
        res.end();
      }
    );
  } else {
    res.send('Please enter Username and Password!');
    res.end();
  }
});

app.post('/createuser', function (req, res) {
  const user_id = req.body.user;
  const user_psw = req.body.pass;
  connection.query('SELECT * FROM accounts WHERE username = ?', [user_id], function (err, results) {
    if (err) throw err;
    if (results.length > 0) {
      res.send('User is taken');
    } else {
      connection.query(
        'INSERT INTO accounts(username, password) VALUES (?, ?)',
        [user_id, user_psw],
        function (err) { if (err) console.log(err); }
      );
      res.send("pass");
    }
  });
});

app.get('/home', function (req, res) {
  if (req.session.loggedin) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.send('Please login to view this page!');
  }
});
app.get('/todos/:id', function (req, res) {
  const id = parseInt(req.params.id);
  connection.query('SELECT * FROM tasks WHERE id = ?', [id], function (err, results) {
    res.json(results[0]);
  });
});
app.get('/todos', function (req, res) {
  const user_id = req.session.username;
  connection.query('SELECT * FROM tasks WHERE user_id = ?', [user_id], function (err, results) {
    res.json(results);
  });
});

app.post('/todos', function (req, res) {
  const user_id = req.session.username;
  const title = req.body.title;
  const completed = Boolean(req.body.completed);
  const mainTitle = req.body.mainTitle;
  let id;
  
  connection.query('INSERT INTO tasks(mainTitle, user_id, title, completed) VALUES (?, ?, ?, ?)', [mainTitle, user_id, title, completed], function (err, results) {
    id = results.insertId;
    connection.query('SELECT * FROM tasks WHERE id = ?', [id], function (err, results) {

      if (err) throw err;
      res.json(results[0]);
    });

  });

});

app.put('/todos/:id', function (req, res) {
  const id = parseInt(req.params.id);//беру id задачи
  const text = req.body.title; //превращаю в бул отправленное значение
  const completed = req.body.completed; //превращаю в бул отправленное значение
  const mainTitle = req.body.mainTitle;

  connection.query('UPDATE tasks SET completed = ?, title = ?, mainTitle = ? WHERE id = ?', [completed, text, mainTitle, id], function (err) { // меняю таблицу

    if (err) throw err;// если есть ошибка то вывожу ее 
    res.status(200) // назад отправляю статус и бул что бы на фронте проверить все ли получилось
  });
  connection.query('SELECT * FROM tasks WHERE id = ?', [id], function (err, results) {

    if (err) throw err;
    res.json(results[0]);
  });
});




app.delete('/todos/:id', function (req, res) {
  const id = parseInt(req.params.id);
  connection.query('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    res.send().status(200);
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(3010);
