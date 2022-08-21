let express = require('express');
let router = express.Router()
let db = require('../modules/dbconnect.js')
let cv = require('../modules/checkValid.js')
let fs = require("fs");
let request = require('request')

const colorArray = ["black", "white", "tiedye"];
const sizeArray = ["xs", "s", "m", "l", "xl", "xxl"]

router.get("/", (req, res) => {
    res.render("cart.pug")
}).get('/list',(req,res)=>{
    res.send(req.cookies['cart'])
}).get('/bill',async function(req, res){
    let cart = req.cookies.cart;
    let total = 0;
    let itemQuantity = 0;
    try{
        cart=JSON.parse(cart);
    }catch(err){
        console.log(err);
        cart = []
    }finally{
        for (let i = 0; i < cart.length; i++) {
            let id = cart[i].id;
            let [data] = await db.promise().query("SELECT * FROM products WHERE id = ?",[id])
            if(data[0]){
                total += data[0].price * cart[i].quantity;
                itemQuantity += cart[i].quantity;
            }else{
                res.cookie('cart','[]')
                res.send({'total':0,'q':0})
                return 0;
            }
        }
        res.send({'total':total,'q':itemQuantity})
    }
})

router.post("/edit", async function (req, res, next) {
    let io = req.app.get('socketio');
    let data = req.body.item;
    let curPath = ['/cart'];
    if(!data) {
        res.cookie("cart", "[]")
        io.emit('show toast', {
            'status': 1,
            'msg': 'Xóa giỏ hàng thành công!',
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
                                    'msg': 'Số lượng sản phẩm ' + data[i].id + '-' + data[i].color + '-' + data[i].size + ' quá lớn.',
                                    'url' : curPath
                                })
                                return 0;
                            } else {
                                continue;
                            }
                    } else {
                        io.emit('show toast', {
                            'status': 0,
                            'msg': 'Sản phẩm '+data[i].id+' không tồn tại/chưa được cập nhật',
                            'url' : curPath
                        })
                        return 0;
                    }
                } catch (err) {
                    console.log(err);
                    io.emit('show toast', {
                        'status': 0,
                        'msg': 'Lỗi cơ sở dữ liệu',
                        'url' : curPath
                    })
                    return 0;
                }
            } else {
                io.emit('show toast', {
                    'status': 0,
                    'msg': 'Thông tin sai định dạng',
                    'url' : curPath
                })
                return 0;
            }
        }
        next();
    } else {
        io.emit('show toast', {
            'status': 0,
            'msg': 'Thông tin sai định dạng',
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

module.exports = router;