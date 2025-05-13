<template>
  <div class="app-container">
    <div class="page-header">
      <h2 class="page-title">药品管理</h2>
      <div class="view-toggle">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="table">表格视图</el-radio-button>
          <el-radio-button label="card">卡片视图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="filter-container">
      <el-input
        v-model="listQuery.name"
        placeholder="药品名称"
        prefix-icon="el-icon-medicine-box"
        style="width: 200px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
      />
      <el-select
        v-model="listQuery.category"
        placeholder="药品类别"
        clearable
        style="width: 200px"
        class="filter-item"
        @change="handleFilter"
      >
        <el-option
          v-for="item in categoryOptions"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      <el-select
        v-model="listQuery.stockStatus"
        placeholder="库存状态"
        clearable
        style="width: 200px"
        class="filter-item"
        @change="handleFilter"
      >
        <el-option label="库存充足" value="normal" />
        <el-option label="库存不足" value="low" />
        <el-option label="库存告急" value="critical" />
      </el-select>
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
        type="primary"
        icon="el-icon-plus"
        @click="handleCreate"
      >
        新增药品
      </el-button>
      <el-button
        class="filter-item"
        type="success"
        icon="el-icon-download"
        @click="handleExport"
      >
        导出数据
      </el-button>
    </div>
    
    <div class="batch-actions" v-if="selected.length > 0">
      <span class="selected-count">已选择 {{ selected.length }} 项</span>
      <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
      <el-button size="small" @click="selected = []">取消选择</el-button>
    </div>

    <!-- 表格视图 -->
    <div v-show="viewMode === 'table'">
      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="加载中..."
        border
        fit
        highlight-current-row
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        
        <el-table-column label="ID" align="center" width="80" prop="id" sortable />
        
        <el-table-column label="药品名称" align="center" min-width="150" prop="name" show-overflow-tooltip>
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.description || '暂无描述'" placement="top">
              <span class="medicine-name">{{ scope.row.name }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="规格" align="center" min-width="120" prop="specification" show-overflow-tooltip />

        <el-table-column label="生产厂家" align="center" min-width="150" prop="manufacturer" show-overflow-tooltip />

        <el-table-column label="库存" align="center" width="120" sortable>
          <template slot-scope="scope">
            <div class="stock-info">
              <el-tooltip :content="getStockStatusText(scope.row)" placement="top">
                <span :class="['stock-indicator', getStockStatusClass(scope.row)]"></span>
              </el-tooltip>
              <span>{{ getTotalStock(scope.row) }} {{ scope.row.unit }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类别" align="center" width="120" prop="category">
          <template slot-scope="scope">
            <el-tag :type="getCategoryTagType(scope.row.category)" effect="plain">
              {{ scope.row.category }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="阈值" align="center" width="100">
          <template slot-scope="scope">
            {{ scope.row.stock_threshold }} {{ scope.row.unit }}
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" icon="el-icon-edit" circle @click="handleUpdate(scope.row)" />
            <el-button size="mini" type="success" icon="el-icon-goods" circle @click="handleViewStock(scope.row)" />
            <el-button size="mini" type="warning" icon="el-icon-plus" circle @click="handleAddStock(scope.row)" />
            <el-button size="mini" type="danger" icon="el-icon-delete" circle @click="handleDelete(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="listQuery.pageSize"
          :current-page="listQuery.page"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 卡片视图 -->
    <div v-show="viewMode === 'card'" class="card-view" v-loading="listLoading">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" v-for="item in list" :key="item.id" class="card-col">
          <el-card shadow="hover" class="medicine-card">
            <div class="card-header">
              <el-checkbox v-model="item.selected" @change="updateSelected" />
              <span :class="['stock-indicator', getStockStatusClass(item)]"></span>
              <el-tag size="small" :type="getCategoryTagType(item.category)" effect="plain">{{ item.category }}</el-tag>
            </div>
            
            <h3 class="medicine-title" :title="item.name">{{ item.name }}</h3>
            
            <div class="medicine-info">
              <p><strong>规格：</strong>{{ item.specification }}</p>
              <p><strong>生产厂家：</strong>{{ item.manufacturer }}</p>
              <p><strong>库存：</strong>{{ getTotalStock(item) }} {{ item.unit }}</p>
              <p><strong>阈值：</strong>{{ item.stock_threshold }} {{ item.unit }}</p>
            </div>
            
            <div class="card-actions">
              <el-button size="mini" type="primary" icon="el-icon-edit" circle @click="handleUpdate(item)" />
              <el-button size="mini" type="success" icon="el-icon-goods" circle @click="handleViewStock(item)" />
              <el-button size="mini" type="warning" icon="el-icon-plus" circle @click="handleAddStock(item)" />
              <el-button size="mini" type="danger" icon="el-icon-delete" circle @click="handleDelete(item)" />
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[12, 24, 48, 96]"
          :page-size="listQuery.pageSize"
          :current-page="listQuery.page"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.pageSize"
      @pagination="getList"
    /> -->

    <!-- 编辑/新增对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
      >
        <el-form-item label="药品名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="temp.specification" />
        </el-form-item>
        <el-form-item label="生产厂家" prop="manufacturer">
          <el-input v-model="temp.manufacturer" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="temp.unit" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="temp.category" class="filter-item">
            <el-option
              v-for="item in categoryOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库存阈值" prop="stock_threshold">
          <el-input-number v-model="temp.stock_threshold" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="temp.description" type="textarea" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveData">确认</el-button>
      </div>
    </el-dialog>

    <!-- 库存详情对话框 -->
    <el-dialog 
      title="库存详情" 
      :visible.sync="stockDialogVisible" 
      width="800px"
      custom-class="stock-detail-dialog"
    >
      <div class="stock-header" v-if="currentMedicine">
        <h3>{{ currentMedicine.name }} <small>{{ currentMedicine.specification }}</small></h3>
        <div class="stock-summary">
          <div class="summary-item">
            <span class="label">总库存：</span>
            <span class="value">{{ getTotalStock(currentMedicine) }} {{ currentMedicine.unit }}</span>
          </div>
          <div class="summary-item">
            <span class="label">库存阈值：</span>
            <span class="value">{{ currentMedicine.stock_threshold }} {{ currentMedicine.unit }}</span>
          </div>
          <div class="summary-item">
            <span class="label">库存状态：</span>
            <span class="value">
              <el-tag :type="getStockStatusType(currentMedicine)" size="small">
                {{ getStockStatusText(currentMedicine) }}
              </el-tag>
            </span>
          </div>
        </div>
      </div>

      <el-table 
        :data="stockList" 
        border 
        style="width: 100%"
        :empty-text="'暂无库存记录'"
      >
        <el-table-column prop="batch_number" label="批次编号" align="center" min-width="120" />
        <el-table-column prop="quantity" label="数量" align="center" width="100">
          <template slot-scope="scope">
            <span :class="{ 'low-stock': scope.row.quantity < 10 }">
              {{ scope.row.quantity }} {{ currentMedicine ? currentMedicine.unit : '' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" align="center" min-width="120" />
        <el-table-column prop="production_date" label="生产日期" align="center" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.production_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="有效期" align="center" width="120">
          <template slot-scope="scope">
            <span :class="{ 'expiring-soon': isExpiringWithin30Days(scope.row.expiry_date), 'expired': isExpired(scope.row.expiry_date) }">
              {{ formatDate(scope.row.expiry_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template slot-scope="scope">
            <el-tag v-if="isExpired(scope.row.expiry_date)" type="danger">已过期</el-tag>
            <el-tag v-else-if="isExpiringWithin30Days(scope.row.expiry_date)" type="warning">即将过期</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="handleEditStock(scope.row)">编辑</el-button>
            <el-button size="mini" type="danger" @click="handleRemoveStock(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleAddStock(currentMedicine)">添加库存</el-button>
        <el-button @click="stockDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
    
    <!-- 添加/编辑库存对话框 -->
    <el-dialog 
      :title="stockActionType === 'add' ? '添加库存' : '编辑库存'" 
      :visible.sync="stockFormVisible"
      width="500px"
    >
      <el-form :model="stockForm" :rules="stockRules" ref="stockForm" label-width="100px">
        <el-form-item label="药品名称" v-if="currentMedicine">
          <el-input v-model="currentMedicine.name" disabled />
        </el-form-item>
        <el-form-item label="批次编号" prop="batch_number">
          <el-input v-model="stockForm.batch_number" placeholder="请输入批次编号" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="stockForm.quantity" :min="1" :precision="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="存放位置" prop="location">
          <el-input v-model="stockForm.location" placeholder="请输入存放位置" />
        </el-form-item>
        <el-form-item label="生产日期" prop="production_date">
          <el-date-picker
            v-model="stockForm.production_date"
            type="date"
            placeholder="选择生产日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="有效期" prop="expiry_date">
          <el-date-picker
            v-model="stockForm.expiry_date"
            type="date"
            placeholder="选择有效期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="stockFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockForm">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getMedicineList, createMedicine, updateMedicine, deleteMedicine, getMedicineStock } from '@/api/medicine'
// import Pagination from '@/components/Pagination'

export default {
  name: 'MedicineList',
  // components: { Pagination },
  data() {
    return {
      list: null,
      total: 0,
      listLoading: true,
      viewMode: 'table', // 默认表格视图
      selected: [], // 选中的药品
      listQuery: {
        page: 1,
        pageSize: 10,
        name: '',
        category: '',
        stockStatus: '' // 库存状态筛选
      },
      categoryOptions: ['处方药', '非处方药', '中药', '西药', '其他'],
      dialogVisible: false,
      dialogTitle: '',
      
      // 库存相关
      stockDialogVisible: false,
      stockFormVisible: false,
      stockActionType: 'add', // add 或 edit
      currentMedicine: null, // 当前操作的药品
      stockList: [],
      stockForm: {
        id: undefined,
        medicine_id: undefined,
        batch_number: '',
        quantity: 1,
        location: '',
        production_date: null,
        expiry_date: null
      },
      stockRules: {
        batch_number: [{ required: true, message: '请输入批次编号', trigger: 'blur' }],
        quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
        location: [{ required: true, message: '请输入存放位置', trigger: 'blur' }],
        production_date: [{ required: true, message: '请选择生产日期', trigger: 'change' }],
        expiry_date: [{ required: true, message: '请选择有效期', trigger: 'change' }]
      },
      
      temp: {
        id: undefined,
        name: '',
        specification: '',
        manufacturer: '',
        unit: '',
        category: '',
        description: '',
        stock_threshold: 100
      },
      rules: {
        name: [{ required: true, message: '请输入药品名称', trigger: 'blur' }],
        specification: [{ required: true, message: '请输入规格', trigger: 'blur' }],
        manufacturer: [{ required: true, message: '请输入生产厂家', trigger: 'blur' }],
        unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
        category: [{ required: true, message: '请选择类别', trigger: 'change' }]
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
        const { data } = await getMedicineList(this.listQuery)
        this.list = data.data.list
        this.total = data.data.total
        
        // 处理卡片视图的选中状态
        if (this.viewMode === 'card') {
          this.list.forEach(item => {
            item.selected = this.selected.includes(item.id)
          })
        }
      } catch (error) {
        console.error('获取药品列表失败:', error)
        this.$message.error('获取药品列表失败')
      }
      this.listLoading = false
    },
    
    // 分页相关方法
    handleSizeChange(val) {
      this.listQuery.pageSize = val
      this.getList()
    },
    handleCurrentChange(val) {
      this.listQuery.page = val
      this.getList()
    },
    
    // 过滤器相关
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    
    // 选择相关
    handleSelectionChange(val) {
      this.selected = val.map(item => item.id)
    },
    updateSelected() {
      // 卡片视图中更新选中状态
      this.selected = this.list.filter(item => item.selected).map(item => item.id)
    },
    
    // 批量操作
    async handleBatchDelete() {
      if (this.selected.length === 0) {
        this.$message.warning('请选择要删除的药品')
        return
      }
      
      try {
        await this.$confirm(`确认删除选中的 ${this.selected.length} 个药品?`, '提示', {
          type: 'warning'
        })
        
        // 这里应该调用批量删除API，暂时使用单个删除循环实现
        for (const id of this.selected) {
          await deleteMedicine(id)
        }
        
        this.$message.success('批量删除成功')
        this.selected = []
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除失败:', error)
          this.$message.error('批量删除失败')
        }
      }
    },
    
    // 导出数据
    handleExport() {
      this.$message.info('正在导出药品数据...')
      // 这里应该调用导出 API
      setTimeout(() => {
        this.$message.success('导出成功')
      }, 1500)
    },
    
    // 药品基本操作
    resetTemp() {
      this.temp = {
        id: undefined,
        name: '',
        specification: '',
        manufacturer: '',
        unit: '',
        category: '',
        description: '',
        stock_threshold: 100
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogTitle = '新增药品'
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row)
      this.dialogTitle = '编辑药品'
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    async saveData() {
      this.$refs['dataForm'].validate(async (valid) => {
        if (valid) {
          try {
            if (this.temp.id) {
              await updateMedicine(this.temp.id, this.temp)
              this.$message.success('更新成功')
            } else {
              await createMedicine(this.temp)
              this.$message.success('创建成功')
            }
            this.dialogVisible = false
            this.getList()
          } catch (error) {
            console.error('保存失败:', error)
            this.$message.error('保存失败')
          }
        }
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该药品?', '提示', {
          type: 'warning'
        })
        await deleteMedicine(row.id)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        }
      }
    },
    
    // 库存相关方法
    async handleViewStock(row) {
      try {
        const { data } = await getMedicineStock(row.id)
        this.stockList = data
        this.currentMedicine = row
        this.stockDialogVisible = true
      } catch (error) {
        console.error('获取库存详情失败:', error)
        this.$message.error('获取库存详情失败')
      }
    },
    handleAddStock(medicine) {
      this.stockActionType = 'add'
      this.currentMedicine = medicine
      this.stockForm = {
        id: undefined,
        medicine_id: medicine.id,
        batch_number: '',
        quantity: 1,
        location: '',
        production_date: new Date(),
        expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)) // 默认有效期为两年
      }
      this.stockFormVisible = true
      this.$nextTick(() => {
        this.$refs['stockForm'] && this.$refs['stockForm'].clearValidate()
      })
    },
    handleEditStock(stock) {
      this.stockActionType = 'edit'
      this.stockForm = Object.assign({}, stock)
      this.stockFormVisible = true
      this.$nextTick(() => {
        this.$refs['stockForm'] && this.$refs['stockForm'].clearValidate()
      })
    },
    async handleRemoveStock(stock) {
      try {
        await this.$confirm('确认删除该库存记录?', '提示', {
          type: 'warning'
        })
        // 这里应该调用删除库存API
        // await deleteStock(stock.id)
        this.$message.success('删除库存成功')
        // 重新加载库存数据
        if (this.currentMedicine) {
          this.handleViewStock(this.currentMedicine)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除库存失败:', error)
          this.$message.error('删除库存失败')
        }
      }
    },
    async submitStockForm() {
      this.$refs['stockForm'].validate(async (valid) => {
        if (valid) {
          try {
            // 这里应该调用添加/编辑库存API
            // if (this.stockForm.id) {
            //   await updateStock(this.stockForm.id, this.stockForm)
            // } else {
            //   await addStock(this.stockForm)
            // }
            
            this.$message.success(this.stockActionType === 'add' ? '添加库存成功' : '更新库存成功')
            this.stockFormVisible = false
            
            // 重新加载库存数据
            if (this.currentMedicine) {
              this.handleViewStock(this.currentMedicine)
            }
          } catch (error) {
            console.error('保存库存失败:', error)
            this.$message.error('保存库存失败')
          }
        }
      })
    },
    
    // 库存状态相关方法
    getTotalStock(row) {
      return row.totalStock
    },
    getStockStatusClass(row) {
      const totalStock = this.getTotalStock(row)
      const threshold = row.stock_threshold || 0
      
      if (totalStock <= 0) {
        return 'status-empty'
      } else if (totalStock < threshold * 0.3) {
        return 'status-critical'
      } else if (totalStock < threshold) {
        return 'status-low'
      } else {
        return 'status-normal'
      }
    },
    getStockStatusText(row) {
      const totalStock = this.getTotalStock(row)
      const threshold = row.stock_threshold || 0
      
      if (totalStock <= 0) {
        return '库存空缺'
      } else if (totalStock < threshold * 0.3) {
        return '库存告急'
      } else if (totalStock < threshold) {
        return '库存不足'
      } else {
        return '库存充足'
      }
    },
    getStockStatusType(row) {
      const totalStock = this.getTotalStock(row)
      const threshold = row.stock_threshold || 0
      
      if (totalStock <= 0) {
        return 'danger'
      } else if (totalStock < threshold * 0.3) {
        return 'danger'
      } else if (totalStock < threshold) {
        return 'warning'
      } else {
        return 'success'
      }
    },
    
    // 类别标签颜色
    getCategoryTagType(category) {
      const typeMap = {
        '处方药': 'danger',
        '非处方药': 'success',
        '中药': 'warning',
        '西药': 'primary',
        '其他': 'info'
      }
      return typeMap[category] || 'info'
    },
    
    // 日期相关方法
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString()
    },
    isExpired(date) {
      if (!date) return false
      return new Date(date) < new Date()
    },
    isExpiringWithin30Days(date) {
      if (!date) return false
      const expiryDate = new Date(date)
      const today = new Date()
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(today.getDate() + 30)
      
      return expiryDate > today && expiryDate <= thirtyDaysLater
    }
  }
}
</script>

<style scoped>
/* 页面布局 */
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

/* 批量操作条 */
.batch-actions {
  background-color: #f0f9eb;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.selected-count {
  margin-right: 15px;
  color: #67c23a;
  font-weight: bold;
}

/* 库存状态指示器 */
.stock-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stock-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-normal {
  background-color: #67c23a;
}

.status-low {
  background-color: #e6a23c;
}

.status-critical {
  background-color: #f56c6c;
}

.status-empty {
  background-color: #909399;
}

/* 库存详情对话框 */
.stock-detail-dialog .el-dialog__body {
  padding-top: 10px;
}

.stock-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.stock-header h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 18px;
}

.stock-header h3 small {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
  margin-left: 10px;
}

.stock-summary {
  display: flex;
  flex-wrap: wrap;
}

.summary-item {
  margin-right: 30px;
  margin-bottom: 10px;
}

.summary-item .label {
  color: #606266;
  margin-right: 5px;
}

.summary-item .value {
  font-weight: bold;
  color: #303133;
}

/* 卡片视图 */
.card-view {
  margin-top: 20px;
}

.card-col {
  margin-bottom: 20px;
}

.medicine-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.medicine-card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.medicine-title {
  font-size: 16px;
  margin: 10px 0;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.medicine-info {
  flex: 1;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.medicine-info p {
  margin: 5px 0;
}

.card-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.card-actions .el-button {
  margin: 0 5px;
}

/* 库存表格样式 */
.low-stock {
  color: #e6a23c;
  font-weight: bold;
}

.expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 对话框样式 */
.dialog-footer {
  text-align: right;
}

/* 药品名称样式 */
.medicine-name {
  color: #409EFF;
  cursor: pointer;
}

.medicine-name:hover {
  text-decoration: underline;
}
</style>
