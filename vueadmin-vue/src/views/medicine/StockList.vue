<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">药品库存列表</h2>
      <div>
        <el-button plain icon="el-icon-refresh" @click="getList">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.medicine_name"
        placeholder="药品名称"
        clearable
        class="filter-item"
        style="width: 200px"
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
      >
        <i slot="prefix" class="el-input__icon el-icon-search"></i>
      </el-input>
      
      <el-input
        v-model="listQuery.batch_number"
        placeholder="批号"
        clearable
        class="filter-item"
        style="width: 150px"
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
      >
        <i slot="prefix" class="el-input__icon el-icon-document"></i>
      </el-input>
      
      <el-date-picker
        v-model="expiryDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="有效期开始日期"
        end-placeholder="有效期结束日期"
        value-format="yyyy-MM-dd"
        class="filter-item"
        style="width: 380px"
        @change="handleExpiryDateChange"
      />
      
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        搜索
      </el-button>
      
      <el-button
        class="filter-item"
        icon="el-icon-download"
        @click="handleExport"
      >
        导出
      </el-button>
    </div>

    <!-- 库存列表 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      :row-class-name="getRowClassName"
    >
      <el-table-column label="药品名称" prop="medicine_name" min-width="150" show-overflow-tooltip />
      
      <el-table-column label="规格" prop="specification" width="120" show-overflow-tooltip />
      
      <el-table-column label="单位" prop="unit" width="80" align="center" />
      
      <el-table-column label="批号" prop="batch_number" width="120" />
      
      <el-table-column label="库存数量" width="100" align="center">
        <template slot-scope="{row}">
          <span :class="{'stock-warning': isLowStock(row)}">
            {{ row.quantity }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column label="预警阈值" prop="min_stock" width="100" align="center" />
      
      <el-table-column label="有效期至" width="120" align="center">
        <template slot-scope="{row}">
          <span :class="{'expiring-soon': isExpiringSoon(row.expiry_date), 'expired': isExpired(row.expiry_date)}">
            {{ formatDate(row.expiry_date) }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column label="存放位置" prop="location" width="150" />
      
      <el-table-column label="单价" width="100" align="center">
        <template slot-scope="{row}">
          <span>¥{{ formatPrice(row.price) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button
            size="mini"
            type="primary"
            icon="el-icon-view"
            @click="handleViewDetail(row)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <!-- 库存详情对话框 -->
    <el-dialog
      title="药品库存详情"
      :visible.sync="detailDialogVisible"
      width="650px"
    >
      <div v-loading="detailLoading">
        <el-descriptions title="药品基本信息" :column="2" border>
          <el-descriptions-item label="药品名称">{{ currentDetail.medicine_name }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ currentDetail.specification || '无' }}</el-descriptions-item>
          <el-descriptions-item label="库存数量">{{ currentDetail.quantity }} {{ currentDetail.unit }}</el-descriptions-item>
          <el-descriptions-item label="预警阈值">{{ currentDetail.min_stock || '无' }}</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ formatPrice(currentDetail.price) }}</el-descriptions-item>
          <el-descriptions-item label="库存总值">¥{{ formatPrice(currentDetail.price * currentDetail.quantity) }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">批次信息</el-divider>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="批号">{{ currentDetail.batch_number || '无' }}</el-descriptions-item>
          <el-descriptions-item label="有效期至" v-if="currentDetail.expiry_date">
            <span :class="{'expiring-soon': isExpiringSoon(currentDetail.expiry_date), 'expired': isExpired(currentDetail.expiry_date)}">
              {{ formatDate(currentDetail.expiry_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="生产日期" v-if="currentDetail.production_date">
            {{ formatDate(currentDetail.production_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="存放位置">{{ currentDetail.location || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getStockList } from '@/api/medicineStock'
import Pagination from '@/components/Pagination'

export default {
  name: 'MedicineStockList',
  components: {
    Pagination
  },
  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,
      detailLoading: false,
      detailDialogVisible: false,
      currentDetail: {},
      expiryDateRange: null,
      listQuery: {
        page: 1,
        limit: 10,
        medicine_name: '',
        batch_number: '',
        expiry_start_date: '',
        expiry_end_date: ''
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.listLoading = true
      
      try {
        const res = await getStockList(this.listQuery)
        this.list = res.data.items || []
        this.total = res.data.total || 0
      } catch (error) {
        console.error('获取库存列表失败:', error)
        let errorMsg = '服务器错误'
        if (error) {
          if (error.response && error.response.data && error.response.data.message) {
            errorMsg = error.response.data.message
          } else if (error.message) {
            errorMsg = error.message
          }
        }
        this.$message.error('获取库存列表失败: ' + errorMsg)
      } finally {
        this.listLoading = false
      }
    },
    
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    
    handleExpiryDateChange(val) {
      if (val) {
        this.listQuery.expiry_start_date = val[0]
        this.listQuery.expiry_end_date = val[1]
      } else {
        this.listQuery.expiry_start_date = ''
        this.listQuery.expiry_end_date = ''
      }
      this.handleFilter()
    },
    
    handleExport() {
      this.$message({
        message: '导出功能开发中...',
        type: 'info'
      })
    },
    
    handleViewDetail(row) {
      this.detailDialogVisible = true
      this.detailLoading = true
      this.currentDetail = { ...row }
      
      // 如果需要获取更详细的信息，可以在这里添加API调用
      setTimeout(() => {
        this.detailLoading = false
      }, 500)
    },
    
    formatDate(date) {
      if (!date) return '无数据'
      return new Date(date).toLocaleDateString()
    },
    
    formatPrice(price) {
      if (!price && price !== 0) return '0.00'
      return parseFloat(price).toFixed(2)
    },
    
    isExpiringSoon(expiryDate) {
      if (!expiryDate) return false
      
      const today = new Date()
      const expiry = new Date(expiryDate)
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
      
      return diffDays > 0 && diffDays <= 30
    },
    
    isExpired(expiryDate) {
      if (!expiryDate) return false
      
      const today = new Date()
      const expiry = new Date(expiryDate)
      
      return expiry < today
    },
    
    isLowStock(row) {
      return row.min_stock && row.quantity <= row.min_stock
    },
    
    getRowClassName({ row }) {
      if (this.isExpired(row.expiry_date)) {
        return 'expired-row'
      } else if (this.isExpiringSoon(row.expiry_date)) {
        return 'expiring-soon-row'
      } else if (this.isLowStock(row)) {
        return 'low-stock-row'
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.filter-container {
  padding-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

.expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}

.stock-warning {
  color: #f56c6c;
  font-weight: bold;
}

.expired-row {
  background-color: #fef0f0;
}

.expiring-soon-row {
  background-color: #fdf6ec;
}

.low-stock-row {
  background-color: #f0f9eb;
}

.pagination-container {
  margin-top: 20px;
}

::v-deep .el-descriptions__header {
  margin-bottom: 15px;
}

.el-divider {
  margin: 20px 0;
}
</style>
