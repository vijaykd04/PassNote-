import UserModel from "../models/user.model.js"
import { getToken } from "../utils/token.js"


export const googleAuth = async (req,res) => {
    try {
        
        const {name , email} = req.body
        let user = await UserModel.findOne({email})
        if(!user){
            user = await UserModel.create({
                name , email
            })
        }
        let token = await getToken(user._id)
        const isProd = process.env.NODE_ENV === "production"
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProd,                      // true on HTTPS in prod
            sameSite: isProd ? "none" : "lax",   // "none" = cross-origin cookie
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({message:`googleSignup Error  ${error}`})
    }
    
}

export const logOut = async (req,res) => {
    try {
        await res.clearCookie("token")
         return res.status(200).json({message:"LogOut Successfully"})
    } catch (error) {
        return res.status(500).json({message:`Logout Error  ${error}`})
    }
}