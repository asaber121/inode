import express from "express";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.APP_PORT) || 9090;

const app = express();

app.get("/", (req, res) => res.json({ message: "Hello world" }) );

app.listen(port, () => console.log(`http://localhost:${port}`))
