import express from "express";
import { createCertificate, getAllCertificates, getCertificate, getMyCertificates, updateCertificate, deleteCertificate, } from "../Controllers/certificateController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
const router = express.Router();
router
    .route("/")
    .get(getAllCertificates)
    .post(protect, restrictTo(["admin", "instructor"]), createCertificate);
router.use(protect);
// Auth'd user's own certificates with course populated — must precede /:id
router.get("/me", getMyCertificates);
router
    .route("/:id")
    .get(getCertificate)
    .patch(restrictTo(["admin"]), updateCertificate)
    .delete(restrictTo(["admin"]), deleteCertificate);
export default router;
//# sourceMappingURL=certificateRoutes.js.map