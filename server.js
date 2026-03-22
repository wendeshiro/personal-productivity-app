import app from "./app.js";
import { query } from "./db/client.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await query("SELECT 1");
    console.log("Database connected.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });
  } catch (error) {
    console.error("Failed to connect to database.", error);
    process.exit(1);
  }
};

startServer();
