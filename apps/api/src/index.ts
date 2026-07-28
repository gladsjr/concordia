import { config } from "dotenv";
import { createApp } from "./app.js";

config({ path: new URL("../../../.env", import.meta.url) });

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

app.listen(port, () => {
  console.log(`Concordia API listening on http://localhost:${port}`);
});
