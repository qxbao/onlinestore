let express = require('express');
let router = express.Router()
let db = require('../modules/dbconnect.js')
let fs = require('fs');
const { emitWarning } = require('process');

router.get("/id/:id", (req, res) => {
    let productId = req.params.id;
    db.query("select * from products where id = ?", [productId], (err, re) => {
        if (err) throw err;
        if (re[0]) {
            res.render("products.pug", {
                'product': re[0],
                'desc': re[0].desc
            })
        } else {
            res.sendStatus(404)
        }
    })
}).get('/', (req, res) => {
    res.sendStatus(404)
}).get('/count', (req,res)=>{
    if(req.cookies.cart){
        let items = JSON.parse(req.cookies.cart)
        let counter = 0;
        for(let i=0;i<items.length;i++){
            try{
                counter+=parseInt(items[i].quantity);
            }catch(err){
                console.log(err);
                res.send('0')
                return 0;
            }
        }
        res.send(counter.toString())
    }else{
        res.send('0')
    }
})

router.post("/add", (req, res, next) => {
    if (req.body.id && req.body.size && req.body.quantity && req.body.color && !isNaN(req.body.quantity)) {
        next()
    } else {
        res.sendStatus(404)
    }
}, (req, res) => {
    let io = req.app.get('socketio');
    let id = req.body.id;
    let quantity = parseInt(req.body.quantity);
    let size = req.body.size;
    let color = req.body.color;
    let curPath = ["/products/id/"+id];
    db.query("SELECT * FROM products WHERE id = ?", [id], (er, re) => {
        if (er) throw er;
        if (re[0] && re[0].quantity){
                let processedData = re[0].quantity;
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
                                    io.emit('show toast', {
                                        'status': 1,
                                        'msg': 'Đã thêm ' + quantity + ' sản phẩm vào giỏ hàng!',
                                        'url': ["/products/id/"+id, '/cart']
                                    })
                                    res.sendStatus(200)
                                    io.emit('update bill')
                                    io.emit('navcart quantity')
                                    return 0;
                                } else {
                                    io.emit('show toast', {
                                        'status': 0,
                                        'msg': 'Số lượng sản phẩm hiện có trong giỏ hàng đã vượt giới hạn',
                                        'url': ["/products/id/"+id, '/cart']
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
                        io.emit('show toast', {
                            'status': 1,
                            'msg': 'Đã thêm ' + quantity + ' sản phẩm vào giỏ hàng!',
                            'url': ["/products/id/"+id, '/cart']
                        })
                        io.emit('update bill');
                        io.emit('navcart quantity');
                        res.sendStatus(200)
                    } else {
                        res.cookie('cart', JSON.stringify([{
                            'id': id,
                            'quantity': quantity,
                            'size': size,
                            'color': color
                        }]))
                        io.emit('show toast', {
                            'status': 1,
                            'msg': 'Đã thêm ' + quantity + ' sản phẩm vào giỏ hàng!',
                            'url': ["/products/id/"+id, '/cart']
                        })
                        io.emit('update bill');
                        io.emit('navcart quantity');
                        res.sendStatus(200)
                    }
                } else {
                    io.emit('show toast', {
                        'status': 0,
                        'msg': 'Số lượng sản phẩm không hợp lệ',
                        'url': curPath
                    })
                }
        } else {
            io.emit('show toast', {
                'status': 0,
                'msg': 'Sản phẩm không tồn tại',
                'url': curPath
            })
        }
    })
}).post('/addComment', (req,res,next)=>{
    let io = req.app.get('socketio');
    if(req.body.name && req.body.id && req.body.content){
        db.query('SELECT * FROM comments WHERE id = ? AND ip=?',[req.body.id,req.ip],(er,re)=>{
            if(re[0]){
                io.emit('show toast', {
                    'status': 0,
                    'msg': 'Bạn không thể tiếp tục bình luận tại đây',
                    'url': '/products/'+req.body.id
                })
            }else{
                next()
            }
        })
    }
},(req,res)=>{
    let name = req.body.name;
    let content = req.body.content;
    let id = req.body.id;
    let timenow = (new Date()).getTime();
    let ip = req.ip;
    db.query('SELECT * FROM comments WHERE id = ?',[id],(er,re)=>{
        if(er){
            throw er;
        }
        if(re[0]){
            let max = 0;
            for (let i = 0; i < re.length; i++) {
                if(re[i].order>max){
                    max = re[i].order;
                }
            }
            db.query('INSERT INTO comments(`id`,`name`,`content`,`time`,`order`,`ip`) VALUES(?,?,?,?,?,?)',[id,name,content,timenow,max+1,ip],(er,re)=>{
                if(re){
                    res.send("Bình luận thành công")
                }
            })
        }else{
            db.query('INSERT INTO comments(`id`,`name`,`content`,`time`,`order`,`ip`) VALUES(?,?,?,?,?,?)',[id,name,content,timenow,0,ip],(er,re)=>{
                if(re){
                    res.send("Bình luận thành công")
                }
            })
        }
    });
}).post("/likeComment",(req,res,next)=>{
    if(req.body.id){
        next();
    }
},(req,res)=>{
    let id = req.body.id;
    db.query("SELECT `like`, `like_ip` FROM `comments` WHERE `comment_id` = ?",[id],(er,re)=>{
        if (er) throw er;
        if(re[0]){
            for (let i = 0; i < re[0].like_ip.length; i++) {
                if(re[0].like_ip[i]==req.ip){
                    return 0;
                }
            }
            re[0].like_ip.push(req.ip)
            re[0].like++;
            db.query("UPDATE `comments` SET `like`= ?, `like_ip`=? WHERE `comment_id`=?",[re[0].like, JSON.stringify(re[0].like_ip), id],(er,re2)=>{
                if (er) throw er;
                if(re2){
                    res.send(re[0].like.toString())
                }
            })
        }
    })
})

router.get("/get/data", (req, res) => {
    db.query("SELECT " + req.query.query + " FROM products WHERE id = ?", [req.query.id], (er, re) => {
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
}).get('/comments', (req,res)=>{
    db.query("SELECT `name`,`time`,`content`,`like`,`comment_id`,`like_ip` FROM comments WHERE `id` = ? ORDER BY `order` DESC",[req.query.id],(er,re)=>{
        if (er) throw er;
        for (let i = 0; i < re.length; i++) {
            re[i].available = true;
            for (let j = 0; j < re[i].like_ip.length; j++) {
                if(req.ip == re[i].like_ip[j]){
                    re[i].available = false;
                }
            }
            re[i].like_ip = undefined;
        }
        res.send(re)
    })
})

router.get("/get/listByTag", (req, res) => {
    let tag = req.query.tag;
    let respondArray = []
    let curPath = ["/tag/"+tag];
    let io = req.app.get('socketio');
    let order;
    switch(parseInt(req.query.order)){
        case 1:
            order = "ORDER BY price ASC";
            break;
        case 2:
            order = "ORDER BY price DESC";
            break;
        default:
            order = "";
    }
    db.query('SELECT id,name,tag,price FROM products '+order, (err, re) => {
        if (err) {
            console.log(err);
            io.emit('show toast', {
                'status': 0,
                'msg': 'Lỗi database',
                'url' : curPath
            })
        } else {
            if (re[0]) {
                for (let i = 0; i < re.length; i++) {
                    let reTag = re[i]["tag"]
                    for (let j = 0; j < reTag.length; j++) {
                        if (tag == reTag[j]) {
                            respondArray.push(re[i])
                        }
                    }
                }
                res.send({
                    'data': respondArray
                })
            } else {
                io.emit('show toast', {
                    'status': 0,
                    'msg': 'Database rỗng'
                })
            }
        }
    })
})

module.exports = router;