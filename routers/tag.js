let express = require('express');
let router = express.Router()
let db = require('../modules/dbconnect.js')
let cv = require('../modules/checkValid.js')
let fs = require('fs');

const tagArray = ['tshirt', 'shirt', 'jeans', 'short', 'jogger', 'accs']

router.get("/", (req,res)=>{
    res.redirect("/")
}).get("/:tag",(req,res,next)=>{
    if(cv.textInArray(req.params.tag,tagArray)){
        next()
    }else{
        res.sendStatus(404)
    }
},(req,res)=>{
    res.render('tag.pug',{'tag': req.params.tag})
})

module.exports = router;