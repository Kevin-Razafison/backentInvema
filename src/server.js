import app from "./app.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const PORT = process.env.PORT || 4000;

bcrypt.hash('arkangel123', 10)
    .then(hash => {
        console.log('Hashed Password: ', hash ,' here is the end');
    })
    .catch(err => {
        console.error('Error hashing password:', e);
    })

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
