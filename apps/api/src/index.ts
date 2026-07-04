import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

app.listen(port, () => {
  console.log(`Concordia API listening on http://localhost:${port}`);
});
