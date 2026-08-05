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
  const start_date = req.body.start_date;
  const end_date = req.body.end_date;
  knex("tasks")
    .insert({user_id: userId, content: todo, start_date: start_date, event_date: end_date, checked: 0})
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

router.get('/events.json', function (req, res) {
  if (!req.isAuthenticated()) return res.json([]);
  const userId = req.user.id;
  knex("tasks")
    .select("*")
    .where({user_id: userId})
    .then(function (results) {
      const events = results.map(function(todo) {
        return {
          id: todo.id,
          title: todo.content,
          start: todo.start_date,
          end: todo.event_date,
          allDay: true,
          color: todo.checked ? '#6c757d' : '#0d6efd'
        };
      });
      res.json(events);
    })
    .catch(function (err) {
      res.status(500).json([]);
    });
});

router.post('/delete/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  const userId = req.user.id;
  const id = req.params.id;

  try {
    await knex('tasks')
      .where({ id: id, user_id: userId }) // user_idも条件に入れて他人のタスクを消せないようにする
      .del();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

router.use('/signup', require('./signup'));
router.use('/signin', require('./signin'));
router.use('/logout', require('./logout'));

module.exports = router;