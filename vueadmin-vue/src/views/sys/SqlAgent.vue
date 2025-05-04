<template>
  <div class="sql-agent-container">
    <div class="page-header">
      <h2>SQL智能查询助手</h2>
      <p class="description">使用自然语言描述您的查询需求，系统将自动转换为SQL并执行</p>
    </div>

    <el-card class="query-card">
      <div class="query-input-container">
        <el-input
          type="textarea"
          v-model="queryInput"
          :rows="4"
          placeholder="请输入您的查询需求，例如：'查询最近30天内的所有维修工单' 或 '统计各科室设备数量'"
          :disabled="loading"
          @keyup.ctrl.enter="executeQuery"
        ></el-input>
        <div class="query-examples">
          <p>示例查询：</p>
          <el-button 
            type="text" 
            v-for="(example, index) in queryExamples" 
            :key="index"
            @click="useExample(example)"
          >
            {{ example }}
          </el-button>
        </div>
        <div class="query-actions">
          <el-button 
            type="primary" 
            @click="executeQuery" 
            :loading="loading"
            icon="el-icon-search"
          >
            执行查询
          </el-button>
          <el-button 
            type="success" 
            @click="exportToExcel" 
            :disabled="!hasResults || loading"
            icon="el-icon-download"
          >
            导出Excel
          </el-button>
          <el-button 
            type="info" 
            @click="clearResults" 
            :disabled="!hasResults || loading"
            icon="el-icon-delete"
          >
            清空结果
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 查询结果展示 -->
    <el-card class="results-card" v-if="hasResults || loading">
      <div slot="header" class="results-header">
        <span>查询结果</span>
        <div class="result-meta" v-if="hasResults">
          <span class="result-count">共 {{ allResultData.length }} 条记录</span>
          <span class="query-time">查询耗时: {{ queryTime }}ms</span>
        </div>
      </div>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
        <div class="loading-text">正在分析您的查询并执行...</div>
      </div>
      
      <div v-else-if="hasResults">
        <!-- SQL转换结果 -->
        <div class="sql-translation" v-if="generatedSql">
          <div class="sql-header">
            <span>生成的SQL查询</span>
            <el-button type="text" @click="copySql" size="mini">
              <i class="el-icon-document-copy"></i> 复制SQL
            </el-button>
          </div>
          <pre class="sql-code">{{ generatedSql }}</pre>
        </div>
        
        <!-- 表格结果 -->
        <el-table
          :data="paginatedData"
          style="width: 100%"
          border
          stripe
          max-height="500"
          v-loading="tableLoading"
        >
          <el-table-column
            v-for="(column, index) in resultColumns"
            :key="index"
            :prop="column"
            :label="formatColumnLabel(column)"
            :min-width="120"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span v-if="isDate(scope.row[column])">{{ formatDate(scope.row[column]) }}</span>
              <span v-else>{{ scope.row[column] }}</span>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container" v-if="allResultData.length > pageSize">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="allResultData.length"
          >
          </el-pagination>
        </div>
      </div>
      
      <div v-else-if="error" class="error-container">
        <i class="el-icon-warning-outline"></i>
        <p>{{ error }}</p>
      </div>
      
      <div v-else class="no-results">
        <i class="el-icon-search"></i>
        <p>暂无查询结果</p>
      </div>
    </el-card>

    <!-- 导出成功提示 -->
    <el-dialog
      title="导出成功"
      :visible.sync="exportDialogVisible"
      width="30%"
      center
    >
      <div class="export-success">
        <i class="el-icon-success"></i>
        <p>查询结果已成功导出为Excel文件</p>
        <div class="file-info">
          <p>文件名: {{ exportFileName }}</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadExport">
          <i class="el-icon-download"></i> 下载文件
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { executeQuery, exportQueryResult } from '@/api/sqlAgent';

export default {
  name: 'SqlAgent',
  data() {
    return {
      // 查询输入
      queryInput: '',
      loading: false,
      tableLoading: false,
      
      // 查询结果
      resultData: [],
      allResultData: [], // 存储所有结果数据（用于分页）
      resultColumns: [],
      generatedSql: '',
      queryTime: 0,
      error: null,
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 导出
      exportDialogVisible: false,
      exportFileName: '',
      downloadUrl: '',
      
      // 示例查询
      queryExamples: [
        '查询最近30天内的所有维修工单',
        '统计各科室设备数量',
        '查找保修期即将到期的设备',
        '显示所有状态为维修中的设备',
        '统计每月维修工单数量'
      ]
    };
  },
  computed: {
    hasResults() {
      return this.allResultData && this.allResultData.length > 0;
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.allResultData.slice(start, end);
    }
  },
  methods: {
    // 执行查询
    async executeQuery() {
      if (!this.queryInput.trim()) {
        this.$message.warning('请输入查询内容');
        return;
      }
      
      this.loading = true;
      this.error = null;
      this.resultData = [];
      this.allResultData = [];
      this.resultColumns = [];
      
      try {
        const startTime = Date.now();
        const response = await executeQuery(this.queryInput);
        const endTime = Date.now();
        this.queryTime = endTime - startTime;
        
        console.log('API Response:', response);
        
        if (response.success) {
          // 处理查询结果
          const responseData = response.data || {};
          this.generatedSql = responseData.sql || '';
          
          // 新的响应格式包含 data 数组和 result 文本
          if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
            // 直接使用数据数组
            this.allResultData = responseData.data;
            this.resultColumns = Object.keys(this.allResultData[0]);
            this.currentPage = 1;
            console.log('Result columns:', this.resultColumns);
            console.log('Data count:', this.allResultData.length);
          } else if (responseData.result) {
            // 如果没有data字段，尝试解析result字段
            if (typeof responseData.result === 'string') {
              try {
                // 尝试将字符串解析为JSON
                const parsedResult = JSON.parse(responseData.result);
                if (Array.isArray(parsedResult) && parsedResult.length > 0) {
                  this.allResultData = parsedResult;
                  this.resultColumns = Object.keys(this.allResultData[0]);
                  this.currentPage = 1;
                  console.log('Parsed result array:', this.allResultData);
                } else {
                  // 如果解析结果不是数组，显示文本结果
                  this.$message.info('查询成功，但返回的不是表格数据');
                  // 显示文本结果
                  this.showTextResult(responseData.result);
                }
              } catch (e) {
                console.error('解析结果数据失败:', e);
                // 如果解析失败，将其视为文本结果
                this.showTextResult(responseData.result);
              }
            } else if (Array.isArray(responseData.result)) {
              // 如果结果已经是数组，直接使用
              this.allResultData = responseData.result;
              this.resultColumns = Object.keys(this.allResultData[0]);
              this.currentPage = 1;
              console.log('Result is already an array:', this.allResultData);
            } else {
              // 如果是其他类型，显示文本结果
              this.showTextResult(String(responseData.result));
            }
          } else {
            this.$message.info('查询成功，但没有返回数据');
          }
        } else {
          this.error = response.message || '查询执行失败';
          this.$message.error(this.error);
        }
      } catch (error) {
        console.error('查询错误:', error);
        this.error = error.message || '查询执行出错';
        this.$message.error(this.error);
      } finally {
        this.loading = false;
      }
    },
    
    // 显示文本结果
    showTextResult(text) {
      // 创建一个单列的表格数据来显示文本结果
      this.allResultData = [{ result: text }];
      this.resultColumns = ['result'];
      this.currentPage = 1;
    },
    
    // 导出Excel
    async exportToExcel() {
      if (!this.queryInput.trim()) {
        this.$message.warning('请先执行查询');
        return;
      }
      
      this.loading = true;
      
      try {
        const fileName = `查询结果_${new Date().toISOString().slice(0, 10)}`;
        const response = await exportQueryResult(this.queryInput, fileName);
        
        if (response.success && response.data.downloadUrl) {
          this.downloadUrl = response.data.downloadUrl;
          this.exportFileName = response.data.fileName || fileName;
          this.exportDialogVisible = true;
        } else {
          this.$message.error(response.message || '导出失败');
        }
      } catch (error) {
        this.$message.error(error.message || '导出过程中发生错误');
      } finally {
        this.loading = false;
      }
    },
    
    // 下载导出的文件
    downloadExport() {
      if (this.downloadUrl) {
        window.open(this.downloadUrl, '_blank');
        this.exportDialogVisible = false;
      }
    },
    
    // 清空结果
    clearResults() {
      this.resultData = [];
      this.allResultData = [];
      this.resultColumns = [];
      this.generatedSql = '';
      this.error = null;
    },
    
    // 复制SQL
    copySql() {
      if (!this.generatedSql) return;
      
      const textarea = document.createElement('textarea');
      textarea.value = this.generatedSql;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      this.$message.success('SQL已复制到剪贴板');
    },
    
    // 使用示例查询
    useExample(example) {
      this.queryInput = example;
    },
    
    // 处理分页
    handleSizeChange(size) {
      this.pageSize = size;
      this.handleCurrentChange(1);
    },
    
    handleCurrentChange(page) {
      this.currentPage = page;
      const start = (page - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.resultData = this.allResultData.slice(start, end);
    },
    
    // 格式化列名
    formatColumnLabel(column) {
      // 将下划线转换为空格，首字母大写
      return column
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    
    // 判断是否为日期
    isDate(value) {
      if (!value) return false;
      
      // 检查是否为日期字符串
      if (typeof value === 'string') {
        const datePattern = /^\d{4}(-\d{2}){2}(T|\s)\d{2}(:\d{2}){1,2}/;
        return datePattern.test(value);
      }
      
      return value instanceof Date;
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      } catch (e) {
        return dateString;
      }
    }
  }
};
</script>

<style scoped>
.sql-agent-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #303133;
}

.description {
  color: #606266;
  font-size: 14px;
}

.query-card {
  margin-bottom: 20px;
}

.query-input-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.query-examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px dashed #ebeef5;
}

.query-examples p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.query-actions {
  display: flex;
  gap: 10px;
}

.results-card {
  margin-bottom: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-meta {
  font-size: 13px;
  color: #909399;
}

.result-count {
  margin-right: 15px;
}

.sql-translation {
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 20px;
}

.sql-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
  color: #606266;
}

.sql-code {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #409EFF;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.loading-container {
  padding: 20px 0;
  text-align: center;
}

.loading-text {
  margin-top: 15px;
  color: #909399;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  color: #f56c6c;
}

.error-container i {
  font-size: 48px;
  margin-bottom: 15px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  color: #909399;
}

.no-results i {
  font-size: 48px;
  margin-bottom: 15px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.export-success {
  text-align: center;
  padding: 20px 0;
}

.export-success i {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 15px;
}

.file-info {
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 10px;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .query-actions {
    flex-direction: column;
  }
  
  .query-actions .el-button {
    width: 100%;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .result-meta {
    margin-top: 10px;
  }
}
</style>
