const express = require('express')
const app = express()
const pg = require('pg')
const client = new pg.Client(
  process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory'
)
const port = process.env.PORT || 3000

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/acme_hr_directory', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from employees
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})

app.get('/api/acme_hr_directory', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from employees ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})

app.get('/api/acme_hr_directory/:id', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from employees ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})

app.post('/api/acme_hr_directory', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO employees(name, category_id)
      VALUES($1, $2)
      RETURNING *
    `
    const response = await client.query(SQL, [req.body.txt, req.body.category_id])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
})

app.delete('/api/acme_hr_directory/:id', async (req, res, next) => {
    try {
      const SQL = `
        DELETE from employees
        WHERE id = $1
      `
      const response = await client.query(SQL, [req.params.id])
      res.sendStatus(204)
    } catch (ex) {
      next(ex)
    }
  })

app.put('/api/acme_hr_directory/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE employees
      SET txt=$1, ranking=$2, category_id=$3, updated_at= now()
      WHERE id=$4 RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.body.category_id,
      req.params.id
    ])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
})

const init = async () => {
  await client.connect()
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
    CREATE TABLE notes(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      ranking INTEGER DEFAULT 3 NOT NULL,
      employees VARCHAR(255) NOT NULL,
      category_id INTEGER REFERENCES categories(id) NOT NULL
    );
  `
  await client.query(SQL)
  console.log('tables created')
  SQL = `
    INSERT INTO departments(name) VALUES('Stow');
    INSERT INTO departments(name) VALUES('Pick');
    INSERT INTO departments(name) VALUES('Ship Dock');
    INSERT INTO employees(employees, ranking, category_id) VALUES('Jenni Smith', Manager, (SELECT id FROM categories WHERE name='Pick'));
    INSERT INTO employees(employees, ranking, category_id) VALUES('Pepper Thompson', Manager, (SELECT id FROM categories WHERE name='Pick'));
    INSERT INTO employees(employees, ranking, category_id) VALUES('Jimmy Arthur', Manager, (SELECT id FROM categories WHERE name='Stow'));
    INSERT INTO employees(employees, ranking, category_id) VALUES('Beth Caspian', Process Assistant, (SELECT id FROM categories WHERE name='Stow'));
    INSERT INTO employees(employees, ranking, category_id) VALUES('Lauri Underwood', Manager, (SELECT id FROM categories WHERE name='Ship Dock'));
  `
  await client.query(SQL)
  console.log('data seeded')
  app.listen(port, () => console.log(`listening on port ${port}`))
}

init()