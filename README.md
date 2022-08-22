# Tenjikiz

Dự án được phát triển bởi [Orca](https://www.facebook.com/q2theb). Tui xin từ chối mọi trách nhiệm.

Đừng thắc mắc về cái tên, dù sao thì khả năng đặt tên của tui cũng chỉ có hạn

<p align="center">
    <img width="120px" src="https://github.com/qxbao/onlinestore/raw/master/public/img/logo.png">
    <p align="center"><sub>một cái logo khá đần nữa nè</sub></p>
</p>

## Mô tả
Cái project củ chuối này được đẻ ra sau khi mình lỡ tay drop cái database của project cũ :sob: (ngu vcl thề aaaaa). Đây là một web bán hàng, cụ thể là mặt hàng quần áo.

Về cơ bản thì ở đây ngoài Javascript ra thì chỉ có mỗi Javascript vì back-end được viết bằng Nodejs, front-end cũng là pug/jade nên nếu không quen thì config các thứ lại khó khăn lắmm :dizzy_face: Database thì mình chọn MySQL, nếu muốn chỉnh sang Mongo thì đấy là việc của bạnnn lêu lêu :triumph:  

Bảo mật các thứ thì cũng chỉ ở mức trung bình tệ thôi :yum: Nhiều chỗ có bug mà mình cũng lười patch nữa, cái đấy cứ để sau thôi. Mảng này mình không rõ lắm, nhiệt tình + ngu dốt = phá hoại thì lại mệch aiza

Project 1 người làm nên sẽ có những hạn chế nhất định. Bạn có thể tự phát triển thêm.

## Yêu cầu
Thì...vài yêu cầu đơn giản để bạn có thể clone cái project này về mà vẫn dùng được là:
- Máy bạn đã cài [Nodejs](https://nodejs.org/en/download/) (của mình là v16.16)
- Có cài đặt [MySQL Server](https://dev.mysql.com/downloads/mysql/), có gì tạo file .env chỉnh mấy cái thông tin đăng nhập thôi là ok.
- Tải các package cần thiết. Làm như vậy
    - Mở cmd/powershell
    - Di chuyển về folder chứa file index.js
    - Nhập ```npm install --save pug,node-persist,mysql2,express-session,express-mysql-session,express,dotenv,cookie-parser,body-parser,bcrypt,socket.io,request``` ấn ENTER ngồi đợi.
- Biết chút về Javascript, HTML, CSS (về cơ bản là code web), [Nodejs](https://www.w3schools.com/nodejs/), [Pug](https://pugjs.org/api/getting-started.html) (không thích thì đổi)
- Follow [cái này](https://www.instagram.com/qnba0) và [cái này](https://www.facebook.com/q2theb)

## Tính năng, nguyên lý & hướng dẫn
### AdminPanel
- **Hệ thống phân quyền**

    Gồm 3 cấp tài khoản: **Quản trị viên**, **chủ store**, **nhân viên**.
    - Quản trị viên: Tài khoản cho người hiểu cách website vận hành, có khả năng truy cập vào các chức năng nâng cao yêu cầu chuyên môn. Chi tiết sẽ thêm vào sau :yum:
    - Chủ store: Có các quyền quản trị cơ bản như thêm/xóa/sửa sản phẩm, điều chỉnh số lượng sản phẩm, thay ảnh, duyệt/hủy đơn, tạo mới/khóa tài khoản CTV, truy cập log hoạt động tất cả tài khoản...
    - Nhân viên: Được quyền duyệt/hủy đơn, truy cập log bán hàng, kiểm tra trạng thái đơn hàng.
- **Bảo mật**

    Thông tin tài khoản được lưu trữ vào database, mật khẩu được mã hóa 2 lượt không thể dịch ngược. Hệ thống tự động khóa khi xuất hiện nghi vấn brute-force hoặc cố gắng truy cập từ nguồn lạ.

    Các thuật toán phát hiện gian lận, phá hoại (duyệt đơn ảo, spam hủy đơn, DDoS) có thể tự ngăn chặn, khắc phục thiệt hại cũng như thông báo nhanh nhất tới quản trị viên cấp cao hơn.
- **Hướng dẫn**

    Truy cập vào ``/adminpanel/login`` để đăng nhập

### Đặt đơn

Quá trình một đơn hàng được tạo ra gồm
1. Chọn sản phẩm đưa vào giỏ hàng
2. Xác nhận đơn hàng, nhập thông tin ship
3. Đợi chủ store/nhân viên xác nhận đơn hàng và gửi ship

Mỗi đơn hàng đều sở hữu một **mã đơn hàng** riêng và được gửi về email trong trường hợp bạn muốn tra cứu tình trạng đơn hàng của mình.

### Hiển thị sản phẩm
<p align="center">
<image width="50%" src="https://github.com/qxbao/onlinestore/raw/master/public/img/4readme/display.png">
</p>

- **Bình luận**
    Tại mỗi một sản phẩm sẽ có mục bình luận, có thể like hoặc report bình luận. Mỗi IP chỉ có thể bình luận một lần tại mỗi sản phẩm, cũng như chỉ có thể like 1 bình luận 1 lần, nói tục thì ăn auto-ban. Thật ra... tính năng ngu học này không hợp lắm với một cái store =))) Nhưng mà thôi cứ thêm vào cho vui
    <p align="center">
    <image width="50%" src="https://github.com/qxbao/onlinestore/raw/master/public/img/4readme/comment_section.png">
    </p>