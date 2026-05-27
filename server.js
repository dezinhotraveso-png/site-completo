const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

// CONEXÃO MONGODB
mongoose.connect("SUA_URL_MONGODB")
.then(() => {
    console.log("MongoDB conectado");
})
.catch((err) => {
    console.log(err);
});

// MODELO DE USUÁRIO
const User = mongoose.model("User", {
    email: String,
    password: String
});

// CADASTRO
app.post("/register", async (req, res) => {

    const { email, password } = req.body;

    const userExists = await User.findOne({ email });

    if(userExists){
        return res.status(400).json({
            message: "Usuário já existe"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        email,
        password: hashedPassword
    });

    await user.save();

    res.json({
        message: "Conta criada"
    });

});

// LOGIN
app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user){
        return res.status(400).json({
            message: "Usuário não encontrado"
        });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if(!validPassword){
        return res.status(400).json({
            message: "Senha incorreta"
        });
    }

    const token = jwt.sign(
        { id: user._id },
        "SEGREDO_JWT"
    );

    res.json({
        message: "Login realizado",
        token
    });

});

// INDEX
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
