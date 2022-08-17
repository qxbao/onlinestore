let express = require('express');
let router = express.Router()
let db = require('../modules/dbconnect.js')
let fs = require("fs");

const isDataValid = (data, array) => {
    if (!Array.isArray(array) || !data) {
        return false;
    }
    for (let i = 0; i < array.length; i++) {
        if (data == array[i]) {
            return true;
        }
    }
    return false;
}

const colorArray = ["black", "white", "tiedye"];
const sizeArray = ["xs", "s", "m", "l", "xl", "xxl"]
router.get("/", (req, res) => {
    res.render("cart.pug")
})

router.post("/edit",async function (req, res, next) {
    let data = req.body.list;
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].id && !isNaN(data[i].quantity) && data[i].quantity > 0 && isDataValid(data[i].color.toLowerCase(), colorArray) && isDataValid(data[i].size.toLowerCase(), sizeArray)) {
                try{
                    let [found] = await db.promise().query("SELECT * FROM products WHERE id=?", [data[i].id])
                    if(found[0]){
                        try{
                            let fileData = await fs.readFileSync('./public/json/products/' + data[i].id + '.json');
                            let remain = JSON.parse(fileData)['data'][data[i].color][data[i].size];
                            if(remain < data[i].quantity){
                                res.send({
                                    'status': 0,
                                    'msg': 'Số lượng sản phẩm ' + data[i].id + '-' + data[i].color + '-' + data[i].size + ' quá lớn.'
                                })
                                return 0;
                            }else{
                                continue;
                            }
                        }catch(err){
                            console.log(err);
                            res.send({
                                'status': 0,
                                'msg': 'Sản phẩm không tồn tại'
                            })
                            return 0;
                        }
                    }else{  
                        res.send({
                            'status': 0,
                            'msg': 'Thông tin sai'
                        })
                        return 0;
                    }
                }catch(err){
                    console.log(err);
                    res.send({
                        'status': 0,
                        'msg': 'Lỗi database'
                    })
                    return 0;
                }
            } else {
                res.send({
                    'status': 0,
                    'msg': 'Thông tin sai định dạng'
                })
                return 0;
            }
        }
        next();
    } else {
        res.send({
            'status': 0,
            'msg': 'Thông tin sai định dạng'
        })
    }
}, (req, res) => {
    let data = req.body.list;
    for (let i = 0; i < data.length; i++) {
        data[i].quantity = parseInt(data[i].quantity);
    }
    if (JSON.stringify(data) == req.cookies.cart) {
        res.send({
            'status': 0,
            'msg': 'Ấn cho vui à???'
        })
        return 0;
    }
    res.cookie("cart", JSON.stringify(data));
    res.send({
        'status': 1,
        'msg': 'Thay đổi đã được lưu!'
    })
})

module.exports = router;