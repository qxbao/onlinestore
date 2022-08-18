socket.on('show toast', (data)=>{
    let thongbao = new bootstrap.Toast($('#thongBao'))
    let msg;
    let curPath = window.location.pathname;
    if(Array.isArray(data.url)){
        for (let i = 0; i < data.url.length; i++) {
            if(data.url[i]==curPath){
                break;
            }
            if(i == data.url.length-1){
                return 0;
            }
        }
    }
    if(data.status == 1 && data.msg){
        $('#toastTitle').attr("class", "me-auto text-success")
        msg = data.msg
    }else if(data.status == 0 && data.msg){
        $('#toastTitle').attr("class", "me-auto text-danger")
        msg = data.msg
    }else{
        $('#toastTitle').attr("class", "me-auto text-danger")
        msg = "Lỗi không xác định";
    }
    $('#toastContent').text(msg)
    thongbao.show()
})