const e = require("express")
const db = require("../modules/dbconnect.js")

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
app.get('/testdb',(req,res)=>{
    let query = req.query.q;
    try{
        db.query(query,(er,re)=>{
            if(er){
                console.log(er);
            }else{
                res.send(re)
            }
        })
    }catch(er){
        res.send(er)
    } 
})
app.use("/cart", require("./cart.js"))
app.use("/products", require("./products.js"))
app.use("/tag", require("./tag.js"))
}

module.exports = routerHandle;