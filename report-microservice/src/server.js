import './utils/index.js';
import app from "./app.js";

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Report microservice running on port ${PORT}`);
});