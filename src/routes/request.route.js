import Router from "express";

import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
} from "../controllers/request.controller.js";

let router = Router();

router.post("/", createRequest);
router.get("/", getRequests);
router.get("/:id", getRequestById);
router.put("/:id/status", updateRequestStatus); // Mettre à jour uniquement le statut
router.delete("/:id", deleteRequest);

export default router;
