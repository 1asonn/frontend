// 处理成功响应
const handleSuccess = (ctx, data, message = '操作成功') => {
    ctx.body = {
        code: 200,
        data,
        message
    }
}

// 处理错误响应
const handleError = (ctx, error) => {
    ctx.status = 200 // 保持 HTTP 状态码为 200，通过业务状态码区分错误
    ctx.body = {
        code: 500,
        data: null,
        message: error.message || '服务器内部错误'
    }
}

module.exports = {
    handleSuccess,
    handleError
}
