import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import connectDB from './configs/db.js';
import sellerRouter from './routes/sellerRoute.js';
import userRouter from './routes/userRoute.js';


const app = express();
const port = process.env.PORT || 5000;

await connectDB()
// Allow multiple Origins
const allowedOrigins = ['http://localhost:5173']

// Middlewear Config
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, Credentials: true}));

app.get('/', (req,res) => res.send(" API is Working"))
app.use('/api/user', userRouter)
app.use('/api/seller', sellerRouter)

app.listen(port, ()=>{
    app.listen(port,()=>{
        console.log(`Server is running on http://localhost:${port} `)
    })
}) 