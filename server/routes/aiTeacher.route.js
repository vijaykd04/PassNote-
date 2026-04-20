import express from "express"
import isAuth from "../middleware/isAuth.js"
import { aiTeacherChat } from "../controllers/aiTeacher.controller.js"

const aiTeacherRouter = express.Router()

aiTeacherRouter.post("/chat", aiTeacherChat)

export default aiTeacherRouter
