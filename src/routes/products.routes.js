import { Router } from "express";
import { getProducts, createProduct,modifyProduct, deleteProduct, upload} from "../controllers/products.controller.js";

const router = Router();

router.get("/", getProducts);
router.post("/", upload.single("imageUrl"), createProduct);
router.put("/:id",upload.single("imageUrl"), modifyProduct);
router.delete("/:id",deleteProduct);
export default router;