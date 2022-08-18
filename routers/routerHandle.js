const routerHandle = (app)=>{

app.get("/", (req,res)=>{
    res.render("homepage.pug")
})
app.get("/cookies",(req,res)=>{
    if(req.cookies[req.query.name]){
        res.send(req.cookies[req.query.name])
    }else if(req.signedCookies[req.query.name]){
        res.send(req.signedCookies[req.query.name])
    }else{
        res.sendStatus(404)
    }
})
app.use("/cart", require("./cart.js"))
app.use("/products", require("./products.js"))
app.use("/tag", require("./tag.js"))
}

module.exports = routerHandle;