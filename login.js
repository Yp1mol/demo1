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
  const userId = req.body.user;
  const user_psw = req.body.pass;
  let errors = {};

  if (userId.length < 3) {
    errors.username = "Username has to be at least 3 characters long";
  }

  if (Object.keys(errors).length > 0) {
    return res.json({ errors });
  }

  connection.query('SELECT * FROM accounts WHERE username = ?', [userId], function (err, results) {
    if (err) throw err;

    if (results.length > 0) {
      res.json({ errors: { username: ['User is taken'] } });
    } else {
      connection.query(
        'INSERT INTO accounts(username, password) VALUES (?, ?)',
        [userId, user_psw],
        function (err) { if (err) throw err; }
      );
      res.json({ success: true });
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
  const userId = req.session.username;

  connection.query('SELECT * FROM tasks WHERE user_id = ?', [userId], function (err, results) {
    res.json(results);
  });
});

function validateTaskInput(mainTitle, title) {
  let errors = {};

  if (mainTitle.trim().length < 3) {
    errors.mainTitle = "Main title must be at least 3 characters";
  } else if (mainTitle.trim().length > 100) {
    errors.mainTitle = "Main title must be at most 100 characters";
  } else if (!/[a-zA-Zа-яА-Я0-9]/.test(mainTitle.trim())) {
    errors.mainTitle = "Main title must contain letters or numbers";
  }

  return errors;
}
app.post('/todos', function (req, res) {
  const userId = req.session.username;
  const title = req.body.title;
  const completed = Boolean(req.body.completed);
  const mainTitle = req.body.mainTitle;
  let id;
  let errors = validateTaskInput(mainTitle, title, userId);

  if (Object.keys(errors).length > 0) {
    return res.json({ errors });
  }

  connection.query('SELECT * FROM tasks WHERE mainTitle = ? AND user_id = ?', [mainTitle, userId], function (err, results) {
    if (results.length > 0) {
      return res.json({ errors: { mainTitle: "You already have a task with this main title" } });
    }

    connection.query('INSERT INTO tasks(mainTitle, user_id, title, completed) VALUES (?, ?, ?, ?)', [mainTitle, userId, title, completed], function (err, results) {
      id = results.insertId;

      connection.query('SELECT * FROM tasks WHERE id = ?', [id], function (err, results) {
        if (err) {
          throw err;
        }

        res.json(results[0]);
      });
    });
  });
});




app.put('/todos/:id', function (req, res) {
  const id = parseInt(req.params.id);
  const text = req.body.title;
  const userId = req.session.username;
  const completed = req.body.completed;
  const mainTitle = req.body.mainTitle;
  let errors = validateTaskInput(mainTitle, text);

  if (Object.keys(errors).length > 0) {
    return res.json({ errors });
  }

  connection.query('SELECT * FROM tasks WHERE mainTitle = ? AND user_id = ? AND id != ?', [mainTitle, userId, id], function (err, results) {
    if (results.length > 0) {
      return res.json({ errors: { mainTitle: "You already have a task with this main title" } });
    }
    connection.query('UPDATE tasks SET completed = ?, title = ?, mainTitle = ? WHERE id = ?', [completed, text, mainTitle, id], function (err) {
      if (err) {
        throw err;
      }

      connection.query('SELECT * FROM tasks WHERE id = ?', [id], function (err, results) {
        if (err) {
          throw err
        };

        res.json(results[0]).status(200);
      });
    });
  });
});



app.delete('/todos/:id', function (req, res) {
  const id = parseInt(req.params.id);
  connection.query('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    res.send().status(200);
  });
});

app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

