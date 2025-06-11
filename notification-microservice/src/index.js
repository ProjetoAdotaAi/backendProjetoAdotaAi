import app from "./app.js";
import { startConsumer } from "./consumers/rabbitConsumer.js";

const PORT = process.env.PORT || 6060;
const RABBIT_URL = process.env.RABBIT_URL;

app.listen(PORT, () => {
  console.log(`Notification microservice running on port ${PORT}`);
  startConsumer(RABBIT_URL);
});