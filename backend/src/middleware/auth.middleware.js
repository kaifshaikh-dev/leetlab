
import jwt from "jsonwebtoken";
import {db} from "../libs/db.js";

export const authMiddleware =  async (req, res, next) => {

 try {

       const token = req.cookies.jwt; 

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
     
    let decoded;
    try {
         decoded = jwt.verify(token, process.env.JWT_SECRET);

    } catch (error) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    
     const user = await db.user.findUnique({
        
        where: {id: decoded.Id},

        select:{ 
            id: true,
            email: true,
            name: true,
            role: true,
            image: true 
        }
        
     });

        if (!user) {    
            return res.status(401).json({ error: "Unauthorized: User not found" });
        }

        req.user = user;
        next();



 } catch (error) {
    console.error("Error in auth middleware:", error);
    res.status(500).json({ error: "authentication error" });
 }
};


export const checkAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await db.user.findUnique({
            where: {id: userId},
            select: {role: true}
        });

        if(!user || user.role !== 'ADMIN'){
            console.error("User is not admin:", user?.role);
            return res.status(403).json({message: "Forbidden- You don't have admin access"});
        }
        
        next();
    } catch (error) {
        console.error("Error in admin check middleware:", error);
        res.status(500).json({ error: "error checking admin access" });
    }
}