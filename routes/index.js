const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

router.get('/', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  if (isAuth) {
    const userId = req.user.id;
    knex("tasks")
      .select("*")
      .where({user_id: userId})
      .then(function (results) {
        res.render('index', {
          title: 'ToDo App',
          todos: results,
          isAuth: isAuth,
        });
      })
      .catch(function (err) {
        console.error(err);
        res.render('index', {
          title: 'ToDo App',
          isAuth: isAuth,
          errorMessage: [err.sqlMessage],
        });
      });
  } else {
    res.render('index', {
      title: 'ToDo App',
      isAuth: isAuth,
    });
  }
});

router.post('/add', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const userId = req.user.id;
  const todo = req.body.add;
  const date = req.body.date;
  knex("tasks")
    .insert({user_id: userId, content: todo, event_date: date, checked: 0})
    .then(function () {
      res.redirect('/')
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
        isAuth: isAuth,
        errorMessage: [err.sqlMessage],
      });
    });
});

router.post('/check', async (req, res) => {
  const checked = req.body.checked || {};
  const checked_id = req.body.checked_id || {};

  for (const key in checked_id) {
    const id = checked_id[key];          // ← ここは数値になる
    const isChecked = checked[key] ? true : false;

    await knex('tasks')
      .where({ id:id })                     // ← id は数値なので AssertionError が消える
      .update({ checked: isChecked });   // ← update が空にならない
  }

  res.redirect('/');
});

router.use('/signup', require('./signup'));
router.use('/signin', require('./signin'));
router.use('/logout', require('./logout'));

module.exports = router;