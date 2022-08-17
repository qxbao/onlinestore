const routerHandle = (app)=>{

app.get("/", (req,res)=>{
    res.render("homepage.pug")
})
app.get("/cookies",(req,res)=>{
    if(req.cookies[req.query.name]){
        res.send(req.cookies[req.query.name])
    }else{
        res.send('[]')
    }
})
app.use("/cart", require("./cart.js"))
app.use("/products", require("./products.js"))
}

module.exports = routerHandle;