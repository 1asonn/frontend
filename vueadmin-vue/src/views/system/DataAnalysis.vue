<template>
  <div class="app-container">
    <!-- 添加 GitHub Markdown CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.2.0/github-markdown.min.css">
    
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">数据报表分析</h2>
        <div class="header-info">
          <el-tag type="info" size="small">AI智能分析</el-tag>
          <span class="last-update">最后更新时间: {{ new Date().toLocaleString() }}</span>
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="刷新数据" placement="top">
          <el-button type="info" icon="el-icon-refresh" circle @click="resetAnalysis"></el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div class="upload-container">
      <el-upload
        class="upload-dragger"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        accept=".xlsx,.xls"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          将Excel文件拖到此处，或<em>点击上传</em>
        </div>
        <div class="el-upload__tip" slot="tip">
          支持 .xlsx, .xls 格式文件
        </div>
      </el-upload>
    </div>

    <!-- 历史SQL查询文件列表 -->
    <div class="history-container">
      <el-card class="history-card">
        <div slot="header" class="card-header">
          <span>历史SQL查询文件</span>
          <el-button 
            type="text" 
            icon="el-icon-refresh"
            @click="fetchSqlReportFiles"
            :loading="loadingFiles"
          >
            刷新列表
          </el-button>
        </div>
        <div class="history-content">
          <div v-if="loadingFiles" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="sqlReportFiles.length === 0" class="empty-data">
            <i class="el-icon-document"></i>
            <p>暂无历史SQL查询文件</p>
          </div>
          <el-table
            v-else
            :data="sqlReportFiles"
            style="width: 100%"
            @row-click="handleFileSelect"
            highlight-current-row
            max-height="350"
            border
          >
            <el-table-column prop="name" label="文件名称" min-width="200">
              <template slot-scope="scope">
                <el-tooltip :content="scope.row.name" placement="top">
                  <span class="file-name">{{ formatFileName(scope.row.name) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="client_modified" label="创建时间" width="160">
              <template slot-scope="scope">
                {{ formatDate(scope.row.client_modified) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button 
                  size="mini" 
                  type="info" 
                  icon="el-icon-view"
                  @click.stop="previewFile(scope.row)"
                  style="margin-right: 5px"
                >
                  预览
                </el-button>
                <el-button 
                  size="mini" 
                  type="primary" 
                  icon="el-icon-data-analysis"
                  @click.stop="analyzeWithFile(scope.row)"
                >
                  分析
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- 分析结果展示区域 -->
    <div v-if="streamingInProgress || analysisResult" class="analysis-container">
      <el-card class="analysis-card">
        <div slot="header" class="card-header">
          <span>分析结果</span>
          <el-button 
            type="text" 
            icon="el-icon-download"
            @click="downloadReport"
            :disabled="!analysisResult"
          >
            下载报告
          </el-button>
        </div>
        <div class="analysis-content">
          <!-- 分析进度显示 -->
          <div v-if="streamingInProgress" class="progress-container">
            <p class="progress-text">正在分析数据，请稍等...</p>
            <el-progress :percentage="streamingProgress" :format="progressFormat"></el-progress>
          </div>
          
          <!-- 加载中显示 -->
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="6" animated />
          </div>
          
          <!-- 结果内容区域 -->
          <div v-if="analysisResult" class="result-content">
            <!-- 完整分析内容 -->
            <div class="full-analysis">
              <h3>详细分析结果</h3>
              <div class="response-area">
                <div class="markdown-content markdown-body" v-html="renderedContent"></div>
              </div>
            </div>
            
            <!-- 调试按钮，显示原始内容 -->
            <div class="debug-controls">
              <el-button size="mini" type="text" @click="toggleRawMode">
                {{ showRawContent ? '显示格式化内容' : '显示原始内容' }}
              </el-button>
              <pre v-if="showRawContent" class="raw-content">{{ analysisResult }}</pre>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分析按钮 -->
    <div class="action-container">
      <!-- <el-button 
        type="primary" 
        :loading="loading"
        :disabled="!selectedFile"
        @click="startAnalysis"
      >
        <i class="el-icon-data-analysis"></i> 开始分析
      </el-button> -->
    </div>
    
    <!-- 文件预览对话框 -->
    <el-dialog
      title="文件预览"
      :visible.sync="previewDialogVisible"
      width="70%"
      :before-close="closePreview"
    >
      <div class="preview-container">
        <div v-if="previewLoading" class="loading-container">
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else-if="previewError" class="preview-error">
          <i class="el-icon-warning"></i>
          <p>{{ previewError }}</p>
        </div>
        <div v-else>
          <div class="file-preview-card">
            <div class="file-icon">
              <i class="el-icon-document-copy"></i>
            </div>
            <div class="file-info">
              <h3 class="file-name">{{ previewFileName }}</h3>
              <div class="file-meta">
                <p><span>创建时间：</span>{{ previewFileDate }}</p>
                <p v-if="previewingFile && previewingFile.size"><span>文件大小：</span>{{ formatFileSize(previewingFile.size) }}</p>
                <p v-if="previewingFile && previewingFile.path_display"><span>文件路径：</span>{{ previewingFile.path_display }}</p>
              </div>
              <div class="file-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="el-icon-download"
                  @click="downloadFile(previewingFile)"
                  :disabled="!previewingFile"
                >
                  下载文件
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  icon="el-icon-data-analysis"
                  @click="analyzeWithFile(previewingFile)"
                  :disabled="!previewingFile"
                >
                  分析此文件
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 文件直接预览 -->
          <div class="file-preview-container" v-if="previewingFile && previewingFile.downloadLink">
            <h4 class="preview-subtitle">文件预览</h4>
            <div class="iframe-container">
              <iframe 
                :src="getPreviewUrl(previewingFile.downloadLink)" 
                frameborder="0" 
                class="preview-iframe"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closePreview">关闭</el-button>
        <el-button type="primary" @click="analyzeWithFile(previewingFile)" :disabled="!previewingFile">分析此文件</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { analyzeExcelData } from '@/api/dataAnalysis'
import { listFiles, getFileUrl, deleteFile, uploadFile } from '@/api/cos'


export default {
  name: 'DataAnalysis',
  data() {
    return {
      fileList: [],
      selectedFile: null,
      loading: false,
      loadingFiles: false,
      analysisResult: null,
      analysisStream: null,
      streamingInProgress: false,
      streamingProgress: 0,
      streamingMessages: [],
      sqlReportFiles: [],
      selectedSqlFile: null,
      // 文件预览相关数据
      previewDialogVisible: false,
      previewLoading: false,
      previewError: null,
      previewingFile: null,
      previewData: [],
      previewColumns: [],
      previewFileName: '',
      previewFileDate: '',
      // 分析结果处理相关
      showRawContent: false,    // 是否显示原始内容（调试模式）
      renderedContent: ''       // 添加新的数据属性
    }
  },
  created() {
    // 组件创建时加载历史SQL查询文件列表
    this.fetchSqlReportFiles()

  },
  watch: {
    analysisResult: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // 处理 Markdown 内容
          this.renderedContent = this.processMarkdownContent(newVal)
        } else {
          this.renderedContent = ''
        }
      }
    }
  },
  methods: {
    // 开始分析
    async startAnalysis() {
      if (!this.selectedFile) {
        this.$message.warning('请先选择Excel文件')
        return
      }

      this.loading = true
      this.streamingInProgress = true
      this.streamingProgress = 0
      this.streamingMessages = []
      this.analysisResult = null
      
      try {
        // 创建FormData对象，上传到COS
        const formData = new FormData()
        formData.append('file', this.selectedFile.raw)
        formData.append('prefix', 'reports/sql-reports/')
        
        // 上传文件到COS
        const uploadResponse = await uploadFile(formData)
        
        if (uploadResponse.data && uploadResponse.data.success) {
          const fileInfo = uploadResponse.data.fileInfo
          
          // 调用分析接口，使用上传后的文件URL
          const excelUrl = fileInfo.url
          await this.handleAnalysisRequest({
            excelUrl: excelUrl,
            fileName: fileInfo.originalName
          })
          
          // 刷新文件列表
          this.fetchSqlReportFiles()
        } else {
          throw new Error(uploadResponse.data?.message || '文件上传失败')
        }
      } catch (error) {
        console.error('数据分析失败:', error)
        this.$message.error(error.message || '数据分析失败')
        this.streamingInProgress = false
      } finally {
        this.loading = false
      }
    },

    // 使用选中的SQL查询文件进行分析
    async analyzeWithFile(file) {
      if (!file) return
      
      this.loading = true
      this.streamingInProgress = true
      this.streamingProgress = 0
      this.streamingMessages = []
      this.analysisResult = null
      this.selectedSqlFile = file
      
      try {
        // 如果文件没有下载链接，先获取
        if (!file.downloadLink) {
          const urlResponse = await getFileUrl({ key: file.key, expires: 3600 })
          if (urlResponse.data && urlResponse.data.success) {
            file.downloadLink = urlResponse.data.url
          } else {
            throw new Error('获取文件下载链接失败')
          }
        }
        
        // 使用文件的下载链接作为分析入参
        const data = {
          excelUrl: file.downloadLink,
          fileName: file.name
        }
        
        // 调用分析接口
        await this.handleAnalysisRequest(data)
        
        // 如果是从预览对话框分析的，关闭预览对话框
        if (this.previewDialogVisible) {
          this.closePreview()
        }
      } catch (error) {
        console.error('数据分析失败:', error)
        this.$message.error(error.message || '数据分析失败')
        this.streamingInProgress = false
      } finally {
        this.loading = false
      }
    },

    // 处理分析请求
    async handleAnalysisRequest(data) {
      try {
        this.streamingProgress = 30
        // 调用分析接口
        const response = await analyzeExcelData(data)
        this.streamingProgress = 60
        
        console.log('分析响应:', response)
        
        if (response && response.data) {
          const responseData = response.data.data
          
          if (responseData && typeof responseData === 'object') {
            // 获取分析内容
            if (responseData.analysisContent) {
              this.analysisResult = responseData.analysisContent
              console.log('成功获取分析内容')
              
              this.streamingProgress = 100
              this.$message.success('数据分析完成')
              return
            }
          }
          
          // 如果无法获取到预期的数据结构，直接使用响应数据作为Markdown内容
          this.analysisResult = typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2)
          this.streamingProgress = 100
          this.$message.success('数据分析完成')
        } else {
          throw new Error(response.message || '无效的响应数据结构')
        }
      } catch (error) {
        console.error('数据分析失败:', error)
        this.$message.error(error.message || '数据分析失败')
        this.streamingProgress = 0
      } finally {
        this.streamingInProgress = false
      }
    },

    // 下载报告
    downloadReport() {
      if (!this.analysisResult) {
        this.$message.warning('没有可下载的分析结果')
        return
      }

      const blob = new Blob([this.formattedResult], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `数据分析报告_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    // 获取历史SQL查询文件列表
    async fetchSqlReportFiles() {
      this.loadingFiles = true
      try {
        const response = await listFiles({
          prefix: 'reports/sql-reports/',
          delimiter: '/'
        })
        if (response.data && response.data.success) {
          // 只显示文件，不显示文件夹
          this.sqlReportFiles = response.data.files.map(file => ({
            name: file.Key.split('/').pop(), // 获取文件名
            key: file.Key,
            size: file.Size,
            client_modified: file.LastModified,
            url: null // 将在需要时获取
          }))
        } else {
          throw new Error(response.data?.message || '获取文件列表失败')
        }
      } catch (error) {
        console.error('获取SQL查询文件失败:', error)
        this.$message.error(error.message || '获取SQL查询文件失败')
        this.sqlReportFiles = []
      } finally {
        this.loadingFiles = false
      }
    },

    // 格式化文件名，截取过长的文件名
    formatFileName(fileName) {
      if (fileName.length > 40) {
        return fileName.substring(0, 20) + '...' + fileName.substring(fileName.length - 17)
      }
      return fileName
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString()
    },

    // 处理文件选择
    handleFileSelect(row) {
      this.selectedSqlFile = row
      this.$message.info(`已选择文件: ${this.formatFileName(row.name)}`)
    },
    // 预览文件
    async previewFile(file) {
      if (!file || !file.key) {
        this.$message.warning('无法预览此文件')
        return
      }

      this.previewDialogVisible = true
      this.previewLoading = true
      this.previewError = null
      this.previewingFile = file
      this.previewFileName = file.name
      this.previewFileDate = this.formatDate(file.client_modified)

      try {
        // 获取文件的临时下载链接
        const urlResponse = await getFileUrl({ key: file.key, expires: 3600 })
        if (urlResponse.data && urlResponse.data.success) {
          this.previewingFile.downloadLink = urlResponse.data.url
        } else {
          throw new Error('获取文件预览链接失败')
        }
      } catch (error) {
        console.error('获取文件预览链接失败:', error)
        this.previewError = '获取文件预览链接失败: ' + (error.message || '')
      } finally {
        this.previewLoading = false
      }
    },

    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'

      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    // 格式化进度条显示
    progressFormat(percentage) {
      if (percentage === 100) {
        return '完成'
      }
      return `${percentage}%`
    },
  
    // 切换原始内容/格式化内容显示
    toggleRawMode() {
      this.showRawContent = !this.showRawContent
    },
  
    // 打开PDF报告
    openPdfReport() {
      if (this.pdfReportUrl) {
        window.open(this.pdfReportUrl, '_blank')
      } else {
        this.$message.warning('没有可用的PDF报告')
      }
    },
  
    // 处理文件选择变更
    handleFileChange(file) {
      if (!file) return
      
      const isExcel = file.raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.raw.type === 'application/vnd.ms-excel'
      
      if (!isExcel) {
        this.$message.error('只能上传Excel文件（.xlsx, .xls）')
        // 移除非Excel文件
        const fileIndex = this.fileList.findIndex(item => item.uid === file.uid)
        if (fileIndex > -1) {
          this.fileList.splice(fileIndex, 1)
        }
        return
      }
      
      // 限制只能选择一个文件
      this.fileList = [file]
      this.selectedFile = file.raw
      
      // 如果有在分析的文件，重置分析状态
      if (this.analysisResult || this.streamingInProgress) {
        this.resetAnalysis()
      }
      
      this.$message.success(`已选择文件: ${file.name}`)
    },
  
    // 重置分析状态
    resetAnalysis() {
      // 清除分析结果
      this.analysisResult = null
      this.showRawContent = false
      
      // 重置流式处理相关状态
      this.streamingInProgress = false
      this.streamingProgress = 0
      this.streamingMessages = []
      
      // 刷新文件列表
      this.fetchSqlReportFiles()
      
      this.$message.success('已重置分析状态')
    },
  
    // 下载文件
    async downloadFile(file) {
      if (!file || !file.key) {
        this.$message.warning('无法下载此文件')
        return
      }

      try {
        // 获取文件的临时下载链接
        const response = await getFileUrl({ key: file.key, expires: 3600 })

        if (response.data && response.data.success) {
          // 创建一个临时链接并模拟点击
          const link = document.createElement('a')
          link.href = response.data.url
          link.target = '_blank'
          link.download = file.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          this.$message.success('文件下载已开始')
        } else {
          throw new Error(response.data?.message || '获取文件下载链接失败')
        }
      } catch (error) {
        console.error('文件下载失败:', error)
        this.$message.error(error.message || '文件下载失败')
      }
    },

    // 获取文件预览URL
    getPreviewUrl(downloadLink) {
      // 尝试使用Microsoft Office Online Viewer
      // 注意：这需要文件链接是公开可访问的
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadLink)}`
    },
    
    // 读取Excel文件
    readExcelFile(data) {
      try {
        // 如果项目中已经安装了xlsx库，可以直接使用
        if (window.XLSX) {
          return window.XLSX.read(data, { type: 'array' })
        }
        
        // 如果没有xlsx库，尝试使用简单的CSV解析方法
        // 这只是一个备选方案，只能处理简单的CSV文件
        const text = new TextDecoder().decode(data)
        return { 
          SheetNames: ['Sheet1'], 
          Sheets: { 'Sheet1': this.parseCSV(text) } 
        }
      } catch (error) {
        console.error('解析Excel文件失败:', error)
        return null
      }
    },
    
    // 将Excel工作表转换为JSON
    excelToJson(worksheet) {
      try {
        // 如果项目中已经安装了xlsx库，可以直接使用
        if (window.XLSX) {
          return window.XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            .filter(row => row.length > 0) // 过滤空行
            .map((row, index) => {
              // 将数组转换为对象，使用第一行作为列名
              if (index === 0) return row
              
              const headers = this.previewData.length > 0 ? Object.keys(this.previewData[0]) : []
              const obj = {}
              
              row.forEach((cell, i) => {
                const header = headers[i] || `列${i+1}`
                obj[header] = cell
              })
              
              return obj
            })
        }
        
        // 如果没有xlsx库，使用我们的简单CSV解析结果
        return this.convertCSVToJson(worksheet)
      } catch (error) {
        console.error('转换Excel到JSON失败:', error)
        return []
      }
    },
    
    // 解析CSV文本
    parseCSV(text) {
      const lines = text.split('\n')
      const result = {}
      
      lines.forEach((line, i) => {
        const cells = line.split(',')
        
        cells.forEach((cell, j) => {
          const cellRef = this.getCellRef(i, j)
          result[cellRef] = { v: cell.trim() }
        })
      })
      
      return result
    },
    
    // 获取单元格引用（例如A1, B2等）
    getCellRef(row, col) {
      const colStr = String.fromCharCode(65 + col) // A, B, C, ...
      return `${colStr}${row + 1}`
    },
    
    // 将CSV数据转换为JSON
    convertCSVToJson(csvData) {
      const rows = []
      const headers = []
      let headerRow = true
      
      // 找出所有单元格并确定行列
      Object.keys(csvData).forEach(cellRef => {
        const col = cellRef.charCodeAt(0) - 65 // A=0, B=1, ...
        const row = parseInt(cellRef.substring(1)) - 1
        
        if (row === 0) {
          // 收集标题行
          headers[col] = csvData[cellRef].v
        } else {
          // 确保行数组存在
          if (!rows[row - 1]) rows[row - 1] = {}
          
          // 使用标题行作为键
          const header = headers[col] || `列${col+1}`
          rows[row - 1][header] = csvData[cellRef].v
        }
      })
      
      return rows
    },
    
    // 关闭预览对话框
    closePreview() {
      this.previewDialogVisible = false
      this.previewingFile = null
      this.previewData = []
      this.previewColumns = []
      this.previewError = null
    },

    // 处理 Markdown 内容
    processMarkdownContent(content) {
      if (!content) return ''
      
      // 处理图片链接
      let processedContent = content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
        return `<img src="${src}" alt="${alt}" class="markdown-image">`
      })

      // 处理标题
      processedContent = processedContent.replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>')
      processedContent = processedContent.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>')
      processedContent = processedContent.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>')

      // 处理分隔线
      processedContent = processedContent.replace(/^----$/gm, '<hr>')

      // 处理段落
      processedContent = processedContent.replace(/^([^<].*?)$/gm, '<p>$1</p>')

      return processedContent
    }
  }
}
</script>

<style lang="scss" scoped>
/* 页面布局 */
.app-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  overflow-y: auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border-left: 4px solid #409EFF;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.header-info {
  display: flex;
  align-items: center;
  margin-top: 8px;
  
  .el-tag {
    margin-right: 10px;
  }
  
  .last-update {
    font-size: 12px;
    color: #909399;
  }
}

.header-actions {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  
  &:before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background-color: #409EFF;
    margin-right: 10px;
    border-radius: 2px;
  }
}

/* 上传区域样式 */
.upload-container {
  margin: 20px 0;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.upload-dragger {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

/* 历史SQL查询文件列表样式 */
.history-container {
  margin: 20px 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.history-card {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.history-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #909399;
  
  i {
    font-size: 40px;
    margin-bottom: 10px;
  }
  
  p {
    margin: 0;
  }
}

.file-name {
  cursor: pointer;
  color: #606266;
  
  &:hover {
    color: #409EFF;
    text-decoration: underline;
  }
}

/* 分析结果区域样式 */
.analysis-container {
  margin: 20px 0;
}

.analysis-card {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.analysis-content {
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
  padding: 15px;
  background-color: #f8f8f9;
  border-radius: 4px;
}

/* 进度条容器样式 */
.progress-container {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #ecf5ff;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}

.progress-text {
  margin: 0 0 10px 0;
  font-weight: 500;
  color: #409EFF;
}

/* Markdown内容样式 */
.markdown-body {
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px auto;
  border-radius: 4px;
}

.markdown-body mark {
  background-color: #ffe58f;
  padding: 2px 4px;
  border-radius: 2px;
}

.markdown-body h1, .markdown-body h2 {
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

/* 新UI组件样式 */
.summary-section {
  background-color: #f0f9ff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  border-left: 4px solid #409EFF;
}

.summary-content {
  font-size: 14px;
  line-height: 1.6;
}

.charts-section {
  margin: 20px 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.chart-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 12px;
  text-align: center;
}

.chart-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.chart-title {
  margin-top: 10px;
  font-weight: 500;
  color: #606266;
}

.section-divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 24px 0;
}

.full-analysis {
  margin: 20px 0;
}

.pdf-report-section {
  margin-top: 20px;
  text-align: center;
}

/* 调试按钮样式 */
.debug-controls {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px dashed #e8e8e8;
  text-align: right;
}

.raw-content {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.loading-container {
  padding: 20px;
}

.result-content {
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
  }

  .analysis-result {
    background-color: #f8f9fa;
    padding: 16px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    margin: 16px 0;
    max-height: 600px;
    overflow-y: auto;
  }

  .markdown-body {
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }

    p {
      margin-top: 0;
      margin-bottom: 16px;
    }

    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27,31,35,0.05);
      border-radius: 3px;
    }

    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 3px;
    }

    table {
      display: block;
      width: 100%;
      overflow: auto;
      margin-top: 0;
      margin-bottom: 16px;
      border-spacing: 0;
      border-collapse: collapse;

      th, td {
        padding: 6px 13px;
        border: 1px solid #dfe2e5;
      }

      th {
        font-weight: 600;
        background-color: #f6f8fa;
      }

      tr {
        background-color: #fff;
        border-top: 1px solid #c6cbd1;
      }

      tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
    }

    blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin: 0 0 16px 0;
    }

    ul, ol {
      padding-left: 2em;
      margin-top: 0;
      margin-bottom: 16px;
    }
  }
}

/* 操作按钮区域 */
.action-container {
  margin: 20px 0;
  text-align: center;
}

/* 动画效果 */
.upload-container, .analysis-container, .action-container, .history-container {
  transition: all 0.3s ease;
}

/* 预览对话框样式 */
.preview-container {
  min-height: 300px;
}

.file-preview-card {
  display: flex;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background-color: #ecf5ff;
  border-radius: 8px;
  margin-right: 20px;
  
  i {
    font-size: 40px;
    color: #409EFF;
  }
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
}

.file-meta {
  margin-bottom: 15px;
  
  p {
    margin: 5px 0;
    color: #606266;
    font-size: 14px;
    
    span {
      font-weight: 600;
      margin-right: 5px;
    }
  }
}

.file-actions {
  display: flex;
  gap: 10px;
}

.file-preview-container {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.preview-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
}

.iframe-container {
  width: 100%;
  height: 500px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #f56c6c;
  
  i {
    font-size: 40px;
    margin-bottom: 10px;
  }
  
  p {
    margin: 0;
  }
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
  
  i {
    font-size: 40px;
    margin-bottom: 10px;
  }
  
  p {
    margin: 0;
  }
}

.response-area {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .markdown-content {
    font-size: 14px;
    line-height: 1.6;
    color: #333;

    :deep(.markdown-body) {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      word-wrap: break-word;
      padding: 0;
      background-color: transparent;
    }

    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    :deep(h1) {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    :deep(h2) {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    :deep(h3) {
      font-size: 1.25em;
    }

    :deep(p) {
      margin-top: 0;
      margin-bottom: 16px;
    }

    :deep(code) {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27,31,35,0.05);
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    }

    :deep(pre) {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 3px;
      margin: 16px 0;

      code {
        padding: 0;
        margin: 0;
        background-color: transparent;
        border: 0;
        word-break: normal;
        white-space: pre;
      }
    }

    :deep(blockquote) {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin: 0 0 16px 0;
    }

    :deep(ul), :deep(ol) {
      padding-left: 2em;
      margin-top: 0;
      margin-bottom: 16px;
    }

    :deep(table) {
      display: block;
      width: 100%;
      overflow: auto;
      margin-top: 0;
      margin-bottom: 16px;
      border-spacing: 0;
      border-collapse: collapse;

      th, td {
        padding: 6px 13px;
        border: 1px solid #dfe2e5;
      }

      th {
        font-weight: 600;
        background-color: #f6f8fa;
      }

      tr {
        background-color: #fff;
        border-top: 1px solid #c6cbd1;
      }

      tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
    }

    :deep(img) {
      max-width: 100%;
      box-sizing: content-box;
      background-color: #fff;
      margin: 16px 0;
    }
  }
}
</style> 