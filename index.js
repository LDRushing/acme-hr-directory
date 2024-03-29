const express = require('express')
const app = express()
const pg = require('pg')
const client = new pg.Client(
  process.env.DATABASE_URL || 'postgres://localhost/employees'
)
const port = process.env.PORT || 3000

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/employees', async (req, res, next) => {
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

app.get('/api/departments', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from departments ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})

app.post('/api/employees', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO employees(name, department_id)
      VALUES($1, $2)
      RETURNING *
    `
    const response = await client.query(SQL, [req.body.name, req.body.department_id])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
})

app.delete('/api/employees/:id', async (req, res, next) => {
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

app.put('/api/employees/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE employees
      SET name=$1, department_id=$2, updated_at= now()
      WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
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
    CREATE TABLE departments(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      names VARCHAR(255) NOT NULL,
      department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `
  await client.query(SQL)
  console.log('tables created') //keep this table below as is.
  SQL = ` 
    INSERT INTO departments(name) VALUES('Stow');
    INSERT INTO departments(name) VALUES('Pick');
    INSERT INTO departments(name) VALUES('Ship Dock');
    INSERT INTO employees(names, department_id) VALUES('Jenni Smith', (SELECT id FROM departments WHERE name='Pick'));
    INSERT INTO employees(names, department_id) VALUES('Pepper Thompson', (SELECT id FROM departments WHERE name='Pick'));
    INSERT INTO employees(names, department_id) VALUES('Jimmy Arthur', (SELECT id FROM departments WHERE name='Stow'));
    INSERT INTO employees(names, department_id) VALUES('Beth Caspian', (SELECT id FROM departments WHERE name='Stow'));
    INSERT INTO employees(names, department_id) VALUES('Lauri Underwood', (SELECT id FROM departments WHERE name='Ship Dock'));
  `
  await client.query(SQL) //Cascade drops any foreign key that's reference that specific table's ID. 
  console.log('data seeded')
  app.listen(port, () => console.log(`listening on port ${port}`))
}

init()