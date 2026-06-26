import express from "express"; import cors from "cors"; import { config } from "./config/index.js"; import { router } from "./routes/index.js"; import { errorHandler } from "./middleware/errorHandler.js"; import { requestLogger } from "./middleware/requestLogger.js"; import { responseHandler } from "./middleware/responseHandler.js";
const app = express(); app.use(cors()); app.use(express.json()); app.use(requestLogger); app.use("/api", router); app.use(responseHandler); app.use(errorHandler);
app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));
