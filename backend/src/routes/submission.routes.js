import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getAllSubmission , getAllTheSubmissionsForProblem, getSubmissionsForProblem } from "../controllers/submission.controller";


const submissionsRoutes = express.Router();

submissionsRoutes.get("/get-all-submissions", authMiddleware, getAllSubmission);
submissionsRoutes.get("/get-submission/:problemId", authMiddleware, getSubmissionsForProblem);
submissionsRoutes.get("/get-submissions-count/:problemId", authMiddleware, getAllTheSubmissionsForProblem);







export default submissionsRoutes;