<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.name"
        placeholder="药品名称"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />
      <el-select
        v-model="listQuery.category"
        placeholder="药品类别"
        clearable
        style="width: 200px"
        class="filter-item"
      >
        <el-option
          v-for="item in categoryOptions"
          :key="item"
          :label="item"
          :value="item"
        />
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
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row
    >
      <el-table-column label="ID" align="center" width="95">
        <template slot-scope="scope">
          {{ scope.row.id }}
        </template>
      </el-table-column>
      
      <el-table-column label="药品名称" align="center">
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>

      <el-table-column label="规格" align="center">
        <template slot-scope="scope">
          {{ scope.row.specification }}
        </template>
      </el-table-column>

      <el-table-column label="生产厂家" align="center">
        <template slot-scope="scope">
          {{ scope.row.manufacturer }}
        </template>
      </el-table-column>

      <el-table-column label="库存" align="center">
        <template slot-scope="scope">
          {{ getTotalStock(scope.row) }} {{ scope.row.unit }}
        </template>
      </el-table-column>

      <el-table-column label="类别" align="center">
        <template slot-scope="scope">
          {{ scope.row.category }}
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" width="230">
        <template slot-scope="scope">
          <el-button
            size="mini"
            @click="handleUpdate(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            size="mini"
            type="success"
            @click="handleViewStock(scope.row)"
          >
            库存
          </el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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
    <el-dialog title="库存详情" :visible.sync="stockDialogVisible" width="800px">
      <el-table :data="stockList" border>
        <el-table-column prop="batch_number" label="批号" align="center" />
        <el-table-column prop="quantity" label="数量" align="center" />
        <el-table-column prop="production_date" label="生产日期" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.production_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="有效期" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.expiry_date) }}
          </template>
        </el-table-column>
      </el-table>
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
      listQuery: {
        page: 1,
        pageSize: 10,
        name: '',
        category: ''
      },
      categoryOptions: ['处方药', '非处方药', '中药', '西药', '其他'],
      dialogVisible: false,
      dialogTitle: '',
      stockDialogVisible: false,
      stockList: [],
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
        console.log(data,"list")
      } catch (error) {
        console.error('获取药品列表失败:', error)
        this.$message.error('获取药品列表失败')
      }
      this.listLoading = false
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
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
    async handleViewStock(row) {
      try {
        const { data } = await getMedicineStock(row.id)
        this.stockList = data
        this.stockDialogVisible = true
      } catch (error) {
        console.error('获取库存详情失败:', error)
        this.$message.error('获取库存详情失败')
      }
    },
    getTotalStock(row) {
      return row.stocks ? row.stocks.reduce((sum, stock) => sum + stock.quantity, 0) : 0
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.filter-container {
  padding-bottom: 10px;
}
.filter-item {
  margin-right: 10px;
}
.dialog-footer {
  text-align: right;
}
</style>
