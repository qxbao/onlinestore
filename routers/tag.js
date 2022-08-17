let express = require('express');
let router = express.Router()
let db = require('../modules/dbconnect.js')
let fs = require('fs');

router.get("/", (req,res)=>{
    res.send('12313213')
})

module.exports = router;