import express from "express"
import isAuth from "../middleware/isAuth.js"
import { companionChat } from "../controllers/companion.controller.js"

const companionRouter = express.Router()
companionRouter.post("/chat", companionChat)
export default companionRouter
