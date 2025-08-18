const mysql = require("mysql2");
const express = require('express')
const app = express()
const port = 3003;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "new_schema",
    password: "qweQWE123;",
});
connection.connect(function (err) {
    if (err) {
        return console.error("Ошибка: " + err.message);
    } else {
        console.log("Подключение к серверу MySQL успешно установлено");
    }
});

app.post('/register', (req, res) => {
    const user_id = req.body.login;
    const user_psw = req.body.password;
    console.log(user_id);
    console.log(user_psw);
    const query = `SELECT * FROM users WHERE login = (?)`;

    connection.query(query, user_id, (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.send("login is used")
        } else {
            users = [user_id, user_psw];
            const sql = `INSERT INTO users(login, pasw) VALUES  (?, ?)`;
            connection.query(sql, users, function (err, results) {
                if (err) console.log(err);
            });
            connection.query("SELECT * FROM users", function (err, results, fields) {
                console.log(err);
                console.log(results);
            });
            res.send("pass");
        }
    });

});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})