import express from "express";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.APP_PORT) || 9090;

let db;

async function connect() {
  try {
    db = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
    });

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        age INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert demo users only if table is empty
    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM users"
    );

    if (countRows[0].total === 0) {
      await db.query(
        `
        INSERT INTO users
        (first_name,last_name,email,password,age)
        VALUES
        ('Ahmed','Saber','ahmed@example.com','123456',24),
        ('Mohamed','Ali','mohamed@example.com','123456',27),
        ('Sara','Hassan','sara@example.com','123456',22),
        ('Mona','Ibrahim','mona@example.com','123456',31),
        ('Youssef','Mahmoud','youssef@example.com','123456',29),
        ('Omar','Khaled','omar@example.com','123456',20),
        ('Nour','Samir','nour@example.com','123456',25),
        ('Laila','Fathy','laila@example.com','123456',28),
        ('Kareem','Adel','kareem@example.com','123456',30),
        ('Fatma','Mostafa','fatma@example.com','123456',26)
      `
      );

      console.log("✅ 10 demo users inserted");
    }

    console.log("✅ MySQL Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

await connect();

//
// Health
//

app.get("/mine", (req, res) => res.json({ message: "MINE IS ARTOIRAS" }) )

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      success: true,
      database: "Connected",
      uptime: process.uptime(),
      timestamp: new Date(),
    });
  } catch {
    res.status(500).json({
      success: false,
      database: "Disconnected",
    });
  }
});

//
// Get all users
// Supports:
// /users
// /users?search=ahmed
// /users?minAge=20&maxAge=30
// /users?sort=age
// /users?order=desc
//
app.get("/users", async (req, res) => {
  try {
    const {
      search = "",
      minAge,
      maxAge,
      sort = "id",
      order = "asc",
    } = req.query;

    const allowedSort = [
      "id",
      "first_name",
      "last_name",
      "email",
      "age",
      "created_at",
    ];

    const sortBy = allowedSort.includes(sort) ? sort : "id";
    const sortOrder =
      order.toLowerCase() === "desc" ? "DESC" : "ASC";

    let sql = `
      SELECT
        id,
        first_name,
        last_name,
        email,
        age,
        created_at,
        updated_at
      FROM users
      WHERE
      (
        first_name LIKE ?
        OR last_name LIKE ?
        OR email LIKE ?
      )
    `;

    const values = [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];

    if (minAge) {
      sql += " AND age >= ?";
      values.push(minAge);
    }

    if (maxAge) {
      sql += " AND age <= ?";
      values.push(maxAge);
    }

    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    const [users] = await db.query(sql, values);

    res.json({
      success: true,
      total: users.length,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

//
// Get single user
//
app.get("/users/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
      id,
      first_name,
      last_name,
      email,
      age,
      created_at,
      updated_at
      FROM users
      WHERE id=?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

//
// Create
//
app.post("/users", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      age,
    } = req.body;

    if (
      !first_name ||
      !last_name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO users
      (first_name,last_name,email,password,age)
      VALUES(?,?,?,?,?)
      `,
      [
        first_name,
        last_name,
        email,
        password,
        age ?? null,
      ]
    );

    const [user] = await db.query(
      `
      SELECT
      id,
      first_name,
      last_name,
      email,
      age,
      created_at,
      updated_at
      FROM users
      WHERE id=?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "User created",
      data: user[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

//
// Update
//
app.put("/users/:id", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      age,
    } = req.body;

    const [result] = await db.query(
      `
      UPDATE users
      SET
      first_name=?,
      last_name=?,
      email=?,
      password=?,
      age=?
      WHERE id=?
      `,
      [
        first_name,
        last_name,
        email,
        password,
        age,
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [user] = await db.query(
      `
      SELECT
      id,
      first_name,
      last_name,
      email,
      age,
      created_at,
      updated_at
      FROM users
      WHERE id=?
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      message: "User updated",
      data: user[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

//
// Delete
//
app.delete("/users/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM users WHERE id=?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

//
// 404
//
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
