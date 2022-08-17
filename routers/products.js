let express = require('express');
let router = express.Router()
let db = require('../modules/dbconnect.js')
let fs = require('fs');

router.get("/:id", (req, res) => {
    let productId = req.params.id;
    db.query("select * from products where id = ?", [productId], (err, re) => {
        if (err) throw err;
        if (re[0]) {
            fs.readFile("./public/json/products/" + productId + ".json", (er, info) => {
                if (er) {
                    res.sendStatus(404)
                } else {
                    res.render("products.pug", {
                        'product': re[0]
                    })
                }
            })
        } else {
            res.sendStatus(404)
        }
    })
}).get('/', (req, res) => {
    res.sendStatus(404)
})

router.post("/add", (req, res, next) => {
    if (req.body.id && req.body.size && req.body.quantity && req.body.color && !isNaN(req.body.quantity)) {
        next()
    } else {
        res.sendStatus(404)
    }
}, (req, res) => {
    let id = req.body.id;
    let quantity = parseInt(req.body.quantity);
    let size = req.body.size;
    let color = req.body.color;
    db.query("SELECT * FROM products WHERE id = ?", [id], (er, re) => {
        if (er) throw er;
        if (re[0]) {
            fs.readFile("./public/json/products/" + id + ".json", (er, info) => {
                if (er) {
                    res.send({
                        'status': 0,
                        'msg': 'Sản phẩm không tồn tại'
                    })
                    return 0;
                }
                let processedData = JSON.parse(info).data;
                let remain = processedData[color][size]
                if (quantity <= remain && 0 < quantity) {
                    // cookie handle
                    if (req.cookies.cart) {
                        let cartCookie = JSON.parse(req.cookies.cart);
                        for (let i = 0; i < cartCookie.length; i++) {
                            if (cartCookie[i]['id'] == id && cartCookie[i]['color'] == color && cartCookie[i]['size'] == size) {
                                cartCookie[i]['quantity'] = parseInt(cartCookie[i]['quantity']) + quantity;
                                if (cartCookie[i]['quantity'] <= remain) {
                                    res.cookie("cart", JSON.stringify(cartCookie))
                                    res.send({
                                        'status': 1,
                                        'msg': 'Đã thêm ' + quantity + ' sản phẩm vào giỏ hàng!'
                                    })
                                    return 0;
                                } else {
                                    res.send({
                                        'status': 0,
                                        'msg': 'Số sản phẩm trong giỏ đã vượt giới hạn!'
                                    })
                                    return 0;
                                }
                            }
                        }
                        cartCookie.push({
                            'id': id,
                            'quantity': quantity,
                            'size': size,
                            'color': color
                        })
                        res.cookie("cart", JSON.stringify(cartCookie))
                        res.send({
                            'status': 1,
                            'msg': 'Đã thêm vào giỏ hàng!'
                        })
                    } else {
                        res.cookie('cart', JSON.stringify([{
                            'id': id,
                            'quantity': quantity,
                            'size': size,
                            'color': color
                        }]))
                        res.send({
                            'status': 1,
                            'msg': 'Đã thêm ' + quantity + ' sản phẩm vào giỏ hàng!'
                        })
                    }
                } else {
                    res.send({
                        'status': 0,
                        'msg': 'Số lượng sản phẩm không hợp lệ'
                    })
                }
            })
        } else {
            res.send({
                'status': 0,
                'msg': 'Sản phẩm không tồn tại'
            })
        }
    })
})

router.get("/get/data", (req, res) => {
    db.query("SELECT "+req.query.query+" FROM products WHERE id = ?", [req.query.id], (er, re) => {
        if (er) {
            console.log(er)
            res.send('')
        } else {
            if (re[0]) {
                res.send(re[0])
            } else {
                res.send('')
            }
        }
    })
})

module.exports = router;