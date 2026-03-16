import express from "express";
import activitiesRouter from "./routes/activities.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use("/", activitiesRouter);

export default app;
