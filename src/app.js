import express from "express";
import morgan from "morgan";
import cors from "cors";
import productRoutes from "./routes/products.routes.js";
import categoryRoutes from "./routes/category.route.js";
import orderRoutes from "./routes/order.route.js";
import userRoutes from "./routes/user.route.js";
import supplierRoutes from "./routes/supplier.route.js"
import requestRoutes  from "./routes/request.route.js";
import authRoute from "./routes/auth.route.js";
import errorHandler from "./middleware/errorHandler.js";
import auth from "./middleware/auth.js";
const app = express();

app.use(cors({
    origin: ["http://localhost:5500"],
    methods: ["GET","POST","PUT","DELETE"],
}));
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self' https://backentinvema.onrender.com");
  next();
});

app.use(morgan("dev"));
app.use(express.json());
app.use(errorHandler);
app.use("/api/auth", authRoute);
app.use("/productImages", express.static("productImages"));
app.use("/fournisseursImages", express.static("fournisseursImages"));


app.use(auth)
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/products", productRoutes);


app.use(errorHandler);
//Route test

app.get("/api/health", (_, res)=> {
    res.json({status: "ok"});
});

export default app;