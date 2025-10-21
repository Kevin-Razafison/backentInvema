import Router from "express";

import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
} from "../controllers/request.controller.js";
import router from "./products.routes.js";

router = Router();

router.post("/", createRequest);
router.get("/", getRequests);
router.get("/:id", getRequestById);
router.put("/:id/status", updateRequestStatus); // Mettre à jour uniquement le statut
router.delete("/:id", deleteRequest);

export default router;
