import { Router } from "express";
import{
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  upload,
} from "../controllers/supplier.controller.js";
const router = Router();


router.post("/", upload.single("image"), createSupplier);

router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", upload.none(), updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
