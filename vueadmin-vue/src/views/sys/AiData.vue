<template>
    <div class="ai-data-container">
        <div class="control-panel">
            <el-button type="primary" @click="startAnalysis">开始分析</el-button>
            <el-button type="primary" @click="download">下载</el-button>
        </div>
        <div class="response-area">
            <div class="markdown-content" v-html="renderedContent"></div>
        </div>
    </div>
</template>

<script>
import { DataAnalyze } from '@/api/aiAgent'
import { DownloadFiles } from '@/api/index'
import MarkdownIt from 'markdown-it'

export default {
    name: 'AiData',
    data() {
        return {
            content: '',
            isLoading: false,
            md: new MarkdownIt({
                html: true,
                breaks: true,
                linkify: true
            })
        }
    },
    computed: {
        renderedContent() {
            return this.content ? this.md.render(this.content) : ''
        }
    },
    methods: {
        async startAnalysis() {
            this.content = ''
            this.isLoading = true
            try {
                const response = await DataAnalyze()
                for await(const chunk of response){
                    if (chunk.data?.content) {
                        this.content = chunk.data.content
                    }
                }
            } catch (error) {
                this.$message.error('分析过程中发生错误：' + error.message)
            } finally {
                this.isLoading = false
            }
        },
        async download(){
            const response = await DownloadFiles("patient_record_report_2025-03-26T14-19-44-850Z.xlsx")
            console.log("==============",response)
            this.downloadExcel(response.data.base64, "patient_record_report_2025-03-26T14-19-44-850Z.xlsx")
        },
        downloadExcel(base64Data, fileName = 'download.xlsx') {
            try {
                // 移除base64字符串中可能包含的头部信息
                const base64Content = base64Data.replace(/^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/, '');
                
                // 将base64转换为二进制数据
                const binaryString = window.atob(base64Content);
                const byteArray = new Uint8Array(binaryString.length);
                
                for (let i = 0; i < binaryString.length; i++) {
                    byteArray[i] = binaryString.charCodeAt(i);
                }
                
                // 创建Blob对象
                const blob = new Blob([byteArray], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                
                // 创建下载链接
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = fileName;
                
                // 添加到文档并触发点击
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // 清理
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(downloadLink.href);
                
                this.$message({
                    type: 'success',
                    message: '文件下载成功'
                });
            } catch (error) {
                console.error('下载文件失败:', error);
                this.$message({
                    type: 'error',
                    message: '下载文件失败，请重试'
                });
            }
        }
    }
}
</script>

<style>
.ai-data-container {
    padding: 20px;
}

.control-panel {
    margin-bottom: 20px;
}

.response-area {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    padding: 20px;
}

.markdown-content {
    line-height: 1.6;
}

.markdown-content img {
    max-width: 100%;
    height: auto;
    margin: 16px 0;
    border-radius: 4px;
}

.markdown-content h1 {
    font-size: 24px;
    margin: 24px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eaecef;
}

.markdown-content p {
    margin: 16px 0;
}

.markdown-content mark {
    background-color: #ffe58f;
    padding: 0 4px;
}

.markdown-content hr {
    margin: 24px 0;
    border: none;
    border-top: 1px solid #eaecef;
}
</style>