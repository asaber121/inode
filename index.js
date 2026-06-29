import express from "express";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.APP_PORT) || 9090;

const app = express();

app.get("/", (req, res) => res.json({ message: "Hello world" }) );
app.get("/api/v1", (req, res) => res.json({ message: "api v1" }) );
app.get("/api/v2", (req, res) => res.json({ message: "api v2" }) );
app.get("/users", (req, res) => res.json({ message: "users list.", data: ["ahmed", "saber"] }) );

app.listen(port, () => console.log(`http://localhost:${port}`))
