let express = require('express');
let router = express.Router()
let db = require('../modules/dbconnect.js')
let cv = require('../modules/checkValid.js')
let fs = require("fs");
let request = require('request');
const { isBuffer } = require('util');

const colorArray = ["black", "white", "tiedye"];
const sizeArray = ["xs", "s", "m", "l", "xl", "xxl"]

const couponHandler = (code,subtotal,vat,ship,quantity, resolve)=>{
    let data;
    if(!code){
        data = {'code':code, 'subtotal':subtotal, 'vat':vat, 'ship':ship, 'q':quantity, 'status':false}
        resolve(data)
    }
    if(!isNaN(Number(subtotal)) && !isNaN(Number(vat)) && !isNaN(Number(ship) && !isNaN(Number(quantity)))){
        db.query("SELECT * FROM coupons WHERE code=?",[code],(er,re)=>{
            if(re[0]){
                let cp = re[0];
                if(cp.min <= subtotal && subtotal <= cp.max){
                    subtotal = subtotal - subtotal*(cp.total)/100;
                    ship = ship - ship*(cp.ship)/100;
                    vat = vat - vat*(cp.vat)/100;
                    data = {'code':code, 'subtotal':subtotal, 'vat':vat, 'ship':ship, 'q':quantity, 'status':true}
                }else{
                    data = {'code':code, 'subtotal':subtotal, 'vat':vat, 'ship':ship, 'q':quantity, 'status':false}
                }
            }else{
                data = {'code':code, 'subtotal':subtotal, 'vat':vat, 'ship':ship, 'q':quantity, 'status':false}
            }
        })
    }else{
        data = {'code':code, 'subtotal':subtotal, 'vat':vat, 'ship':ship, 'q':quantity, 'status':false}
    }
    resolve(data);
}

router.get("/", (req, res) => {
    res.render("cart.pug")
}).get('/list',(req,res)=>{
    res.send(req.cookies['cart'])
}).get('/bill',async function(req, res){
    let cart = req.cookies.cart;
    let subtotal = 0;
    let itemQuantity = 0;
    let code = req.body.code;
    try{
        cart=JSON.parse(cart);
    }catch(err){
        res.cookie('cart','[]')
        cart = []
    }finally{
        for (let i = 0; i < cart.length; i++) {
            let id = cart[i].id;
            let [data] = await db.promise().query("SELECT * FROM products WHERE id = ?",[id])
            if(data[0]){
                subtotal += data[0].price * cart[i].quantity;
                itemQuantity += cart[i].quantity;
            }
        }
        res.send({'subtotal':subtotal,'q':itemQuantity, 'vat':subtotal*0.08, 'ship':30000})
    }
}).get("/afterCoupon",(req,res)=>{
    let data = req.query.data;
    let apc = req.cookies.applied_coupon;
    if(apc){
        var promise = new Promise((resolve,reject)=>{
            data = couponHandler(apc,data.subtotal,data.vat,data.ship,data.q,resolve);
        })
        promise.then((result)=>{
            if(!result.status){
                res.cookie("applied_coupon","")
            }
            res.send(result)
        })
    }else{
        res.send(data)
    }
}).post("/applyCoupon",(req,res)=>{
    let code = req.body.code;
    if(code){
        db.query("SELECT * FROM coupons WHERE code=?",[code],async function(er,re){
            let cp = re[0];
            let subtotal = 0;
            if(cp){
                try{
                    let cart = JSON.parse(req.cookies.cart);
                    for (let i = 0; i < cart.length; i++) {
                        let id = cart[i].id;
                        let [data] = await db.promise().query("SELECT * FROM products WHERE id = ?",[id]);
                        if(cart[i].quantity==0){
                            continue;
                        }
                        if(data[0]){
                            subtotal += data[0].price * cart[i].quantity;
                        }
                    }
                }catch(er){
                    subtotal = 0;
                }finally{
                    if(cp.min <= subtotal && subtotal <= cp.max){
                        res.cookie("applied_coupon",code)
                        res.send({'status':1, 'msg': "??p d???ng th??nh c??ng!"})
                    }else{
                        res.send({'status':0, 'msg': "Kh??ng ????? ??i???u ki???n ??p d???ng"})
                    }
                }
            }else{
                res.send({'status':0, 'msg': "M?? gi???m gi?? kh??ng t???n t???i"})
            }
        })
    }else{
        res.send({'status':0, 'msg': "Vui l??ng nh???p m??"})
    }
}).post("/removeCoupon",(req,res)=>{
    res.cookie("applied_coupon","")
    res.sendStatus(200)
})

router.post("/edit", async function (req, res, next) {
    let io = req.app.get('socketio');
    let data = req.body.item;
    let curPath = ['/cart'];
    if(!data) {
        res.cookie("cart", "[]")
        io.emit('show toast', {
            'status': 1,
            'msg': 'X??a gi??? h??ng th??nh c??ng!',
            'url' : curPath
        })
        io.emit('navcart quantity')
        res.sendStatus(200)
        return 0;
    }
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].id && !isNaN(data[i].quantity) && data[i].quantity >= 0 && cv.textInArray(data[i].color.toLowerCase(), colorArray) && cv.textInArray(data[i].size.toLowerCase(), sizeArray)) {
                try {
                    let [found] = await db.promise().query("SELECT * FROM products WHERE id=?", [data[i].id])
                    if (found[0]) {
                            let remain = found[0].quantity[data[i].color][data[i].size];
                            if (remain < data[i].quantity) {
                                io.emit('show toast', {
                                    'status': 0,
                                    'msg': 'S??? l?????ng s???n ph???m ' + data[i].id + '-' + data[i].color + '-' + data[i].size + ' qu?? l???n.',
                                    'url' : curPath
                                })
                                return 0;
                            } else {
                                continue;
                            }
                    } else {
                        io.emit('show toast', {
                            'status': 0,
                            'msg': 'S???n ph???m '+data[i].id+' kh??ng t???n t???i/ch??a ???????c c???p nh???t',
                            'url' : curPath
                        })
                        return 0;
                    }
                } catch (err) {
                    console.log(err);
                    io.emit('show toast', {
                        'status': 0,
                        'msg': 'L???i c?? s??? d??? li???u',
                        'url' : curPath
                    })
                    return 0;
                }
            } else {
                io.emit('show toast', {
                    'status': 0,
                    'msg': 'Th??ng tin sai ?????nh d???ng',
                    'url' : curPath
                })
                return 0;
            }
        }
        next();
    } else {
        io.emit('show toast', {
            'status': 0,
            'msg': 'Th??ng tin sai ?????nh d???ng',
            'url' : curPath
        })
    }
}, (req, res) => {
    let io = req.app.get('socketio');
    let curPath = ['/cart'];
    let data = req.body.item;
    let cart = req.cookies.cart;
    if(!cart){
        "[]"
    }
    cart = JSON.parse(cart);
    for (let i = 0; i < data.length; i++) {
        data[i].quantity = parseInt(data[i].quantity);
    }

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < cart.length; j++) {
            if(data[i].id == cart[j].id && data[i].size == cart[j].size && data[i].color == cart[j].color){
                cart[j].quantity = data[i].quantity;
                break;
            }
            if(j == cart.length-1){
                cart.push(data[i])
            }
        }
    }    
    res.cookie("cart", JSON.stringify(cart));
    io.emit('navcart quantity')
    io.emit('update bill')
    res.sendStatus(200)
})


router.post('/lastStep',(req,res,next)=>{
    let io = req.app.get('socketio'); 
    if(req.body.name && req.body.phone && req.body.email && req.body.address){
        if (req.cookies.cart) {
            let cart;
            try{
                cart = JSON.parse(req.cookies.cart);
                if(cart && cart != '[]'){
                    db.query("SELECT * FROM orders WHERE ip=? AND (status=0 OR status=1)",[req.ip],(er,re)=>{
                        if (er) throw er;
                        if(re.length <= 2){
                            next();
                        }else{
                            io.emit('show toast', {
                                'status': 0,
                                'msg': 'B???n hi???n ??ang c?? '+re.length+' ????n h??ng ch??a nh???n, kh??ng th??? t???o th??m!',
                                'url' : '/cart'
                            })
                        }
                    })
                }else{
                    res.send({'status':0, 'msg': 'Gi??? h??ng r???ng'})
                }
            }catch(er){
                res.cookie("cart","[]")
                res.send({'status':0, 'msg': 'C?? l???i x???y ra! Vui l??ng th??? l???i sau'})
            }
        }else{
            res.cookie("cart","[]")
            res.send({'status':0, 'msg': 'Gi??? h??ng r???ng'})
        }
    }else{
        res.send({'status':0, 'msg': 'B???n c???n ??i???n t???t c??? c??c m???c'})
    }
},async function(req,res){
    let name = req.body.name;
    let phone = req.body.phone;
    let phonePattern = /^([0][1-9][0-9]{8})|([+][84][1-9][0-9]{9})|([84][1-9][0-9]{9})$/i;
    let email = req.body.email;
    let emailPattern = /^[a-zA-Z0-9]+[.]?[a-zA-Z0-9]+[@][a-zA-Z0-9]*[.](com|vn|edu([.]?([a-zA-Z]{2,}){1})?|gov|eu|ru|com.vn|net|org|ca|uk|de|co|io|biz)$/i;
    let address = req.body.address;
    if(emailPattern.test(email) && phonePattern.test(phone)){
        let cart = JSON.parse(req.cookies.cart);
        let subtotal = 0;
        for (let i = 0; i < cart.length; i++) {
            if(cart[i].quantity==0){
                continue;
            }
            let id = cart[i].id;
            let [data] = await db.promise().query("SELECT * FROM products WHERE id = ?",[id]);
            if(data[0]){
                subtotal += data[0].price * cart[i].quantity;
            }
        }
        let vat = subtotal*0.08;
        let ship = 30000;
        let apc = req.cookies.applied_coupon;
        let timenow = (new Date()).getTime();
        let promise = new Promise((resolve,reject)=>{
            couponHandler(apc,subtotal,vat,ship,0,resolve);
        })
        promise.then((re)=>{
            db.query('INSERT INTO `orders`(`name`,`phone`,`email`,`address`,`subtotal`,`tax`,`ship`,`total`,`items`,`created_time`,`ip`) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[name,phone,email,address,re.subtotal,re.vat,re.ship,(re.subtotal+re.vat+re.ship),JSON.stringify(cart),timenow,req.ip],(er,result)=>{
                if(er){
                    throw er;
                }
                if(result){
                    console.log(result)
                    db.query("SELECT order_id FROM orders WHERE created_time=? AND ip = ?",[timenow,req.ip],(er,re)=>{
                        res.cookie("cart","")
                        res.cookie("applied_coupon","")
                        res.send({'status':1,'order_id':re[0].order_id})
                    })
                }else{
                    res.send({'status':0, 'msg': 'L???i kh??ng x??c ?????nh'})
                }
            })
        })
    }else{
        res.send({'status':0, 'msg': 'Email ho???c s??? ??i???n tho???i sai ?????nh d???ng'})
    }
})


module.exports = router;