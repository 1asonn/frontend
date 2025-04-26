<template>
    <div style="padding:5px;">
    <div class="search-area">
        <el-card shadow="hover" class="filter-card">
            <div class="filter-header">
                <i class="el-icon-search"></i>
                <span>搜索条件</span>
            </div>
            <el-form :inline="true" :model="searchForm" size="small">
                <el-form-item>
                    <el-input 
                        v-model="searchForm.name" 
                        placeholder="角色名称" 
                        clearable 
                        prefix-icon="el-icon-user" 
                        @keyup.enter.native="searchHandle"
                        @clear="searchHandle">
                    </el-input>
                </el-form-item>

                <el-form-item>
                    <el-select 
                        v-model="searchForm.status" 
                        placeholder="状态" 
                        clearable 
                        style="width: 120px"
                        @change="searchHandle">
                        <el-option label="正常" :value="1">
                            <span style="float: left"><i class="el-icon-success" style="color: #67C23A; margin-right: 5px"></i>正常</span>
                        </el-option>
                        <el-option label="禁用" :value="0">
                            <span style="float: left"><i class="el-icon-error" style="color: #F56C6C; margin-right: 5px"></i>禁用</span>
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" icon="el-icon-search" @click="searchHandle">查询</el-button>
                    <el-button icon="el-icon-refresh" @click="resetSearchForm">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        
        <div class="operation-area">
            <el-button type="primary" icon="el-icon-plus" @click="openAddRoleDialog">新增角色</el-button>
            <el-popconfirm title="确定进行批量删除吗？" @confirm="deleteHandle(null)">
                <el-button type="danger" icon="el-icon-delete" slot="reference" :disabled="delBtnStatus">批量删除</el-button>
            </el-popconfirm>
        </div>
    </div>

    <el-card shadow="hover" class="table-card">
        <div slot="header" class="table-header">
            <span><i class="el-icon-s-grid"></i> 角色列表</span>
            <span class="table-total">共 <el-tag size="small" type="info">{{total}}</el-tag> 条数据</span>
        </div>
        <el-table ref="multipleTable" 
            :data="tableData" 
            tooltip-effect="dark" 
            style="width: 100%" 
            @selection-change="handleSelectionChange"
            v-loading="loading"
            border
            stripe
            highlight-current-row>
            <el-table-column type="selection" width="55" align="center">
            </el-table-column>
            <el-table-column prop="id" label="ID" width="60" align="center">
            </el-table-column>
            <el-table-column prop="role_name" label="角色名称" min-width="120">
                <template slot-scope="scope">
                    <div class="role-name">
                        <i class="el-icon-user-solid" style="margin-right: 5px; color: #409EFF;"></i>
                        <span>{{ scope.row.role_name }}</span>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
                <template slot-scope="scope">
                    <el-tag size="small" v-if="scope.row.status === 1" type="success">正常</el-tag>
                    <el-tag size="small" v-else-if="scope.row.status === 0" type="danger">禁用</el-tag>
                </template>
            </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="150" align="center">
                <template slot-scope="scope">
                    <i class="el-icon-time" style="margin-right: 5px"></i>
                    {{ scope.row.created_at || '未知' }}
                </template>
            </el-table-column>
            <el-table-column prop="operate" label="操作" width="220" align="center" fixed="right">
                <template slot-scope="scope">
                    <div class="button-group">
                        <el-tooltip content="分配权限" placement="top" :enterable="false">
                            <el-button type="primary" size="mini" icon="el-icon-s-tools" circle @click="permHandle(scope.row.id,scope.row.authoritys)"></el-button>
                        </el-tooltip>
                        
                        <el-tooltip content="编辑角色" placement="top" :enterable="false">
                            <el-button type="warning" size="mini" icon="el-icon-edit" circle @click="editHandle(scope.row.id)"></el-button>
                        </el-tooltip>
                        
                        <el-tooltip content="删除角色" placement="top" :enterable="false">
                            <el-popconfirm title="删除后数据无法恢复,确定删除吗？" @confirm="deleteHandle(scope.row.id)">
                                <el-button type="danger" size="mini" icon="el-icon-delete" circle slot="reference"></el-button>
                            </el-popconfirm>
                        </el-tooltip>
                    </div>
                </template>
            </el-table-column>
            <template slot="empty">
                <div class="empty-data">
                    <i class="el-icon-warning-outline"></i>
                    <p>暂无数据</p>
                </div>
            </template>
    </el-table>
    </el-card>
    
    <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page.sync="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="size"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background>
        </el-pagination>
    </div>

    <!-- 新增按钮弹窗 -->
    <el-dialog
        title="角色信息"
        :visible.sync="dialogVisible"
        width="650px"
        :before-close="handleClose"
        custom-class="role-dialog"
        top="5vh">
        <el-form :model="editForm" :rules="editFormRules" ref="editForm" label-width="100px" size="small">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="角色名称" prop="role_name" required>
                        <el-input v-model="editForm.name" placeholder="请输入角色名称" prefix-icon="el-icon-user"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="状态" prop="status" required>
                        <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 100%">
                            <el-option label="正常" :value="1">
                                <span style="float: left"><i class="el-icon-success" style="color: #67C23A; margin-right: 5px"></i>正常</span>
                            </el-option>
                            <el-option label="禁用" :value="0">
                                <span style="float: left"><i class="el-icon-error" style="color: #F56C6C; margin-right: 5px"></i>禁用</span>
                            </el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
            
            <el-row>
                <el-col :span="24">
                    <el-form-item label="描述" prop="remark">
                        <el-input v-model="editForm.remark" placeholder="请输入角色描述" type="textarea" :rows="2" autocomplete="off"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>
            
            <el-divider content-position="left">权限设置</el-divider>
            
            <el-form-item label="分配权限" prop="authoritys" required>
                <div class="permission-panel">
                    <TreeSelect :initialData="permTreeData"
                        :defaultProps="defaultProps"
                        :default-checked-keys="[]"
                        @get-checkedNodes="handleNewRoleCheckedNodes">
                    </TreeSelect>
                </div>
                <div v-if="showAuthWarning" class="el-form-item__error">请选择要分配的权限</div>
            </el-form-item>
            
            <div class="dialog-footer">
                <el-button @click="handleClose" icon="el-icon-close">取消</el-button>
                <el-button type="primary" @click="submitForm('editForm')" icon="el-icon-check" :loading="loading">提交</el-button>
            </div>
        </el-form>
    </el-dialog>

        
        <el-dialog
			title="分配权限"
			:visible.sync="permDialogVisible"
			width="600px"
			custom-class="role-dialog"
			top="10vh">

			<el-form :model="permForm">
				<el-alert
					title="请选择该角色可以访问的菜单和功能"
					type="info"
					:closable="false"
					show-icon
					style="margin-bottom: 15px">
				</el-alert>
                <div class="permission-panel">
                    <TreeSelect :initialData="permTreeData"
                                :defaultProps="defaultProps"
                                :default-checked-keys="defaultCheckedKeys"
                                v-if="permTreeData"
                                @get-checkedNodes="handleCheckedNodes">
                    </TreeSelect>
                </div>
			</el-form>

			<div class="dialog-footer">
			    <el-button icon="el-icon-close" @click="permDialogVisible = false">取消</el-button>
			    <el-button type="primary" icon="el-icon-check" :loading="loading" @click="submitPermFormHandle('permForm')">确定</el-button>
			</div>

		</el-dialog>

    </div>
</template>

<script>
    import {GetRoleList, GetAuthTree, GetUserInfo, SetRoleAuthority, AddRole} from '@/api/index.js'
    import TreeSelect from '@/components/TreeSelect.vue'
    export default {
        data(){
            return{
                roleId:'',
                defaultCheckedKeys:[],
                selectedAuth:'',
                newRoleSelectedAuth: '', // 新增角色时选择的权限
                showAuthWarning: false, // 显示权限选择警告
                activeCollapse: ['1'], 
                searchForm: {
                    name: '',
                    status: ''
                },
                tableData: [],
                multipleSelection: [],
                delBtnStatus: true,
                loading: false, // 加载状态

                currentPage : 1,
                total : 0,
                size : 10,

                dialogVisible:false,
                permDialogVisible:false,
                editForm:{},
                editFormRules: {
                    name: [{
                        required: true,
                        message: '请输入角色名称',
                        trigger: 'blur'
                    }],
                    status: [{
                        required: true,
                        message: '请选择状态',
                        trigger: 'change'
                    }],
                    authoritys: [
                        {required: true, message: '请选择要分配的权限', trigger: 'change'}
                    ]
                },
                defaultProps: {
                    label: "title", 
                    children: "children" ,
                    value:"name"
                },
                permTreeData: [],
                permForm: {}
            }
        },
    created(){
        // 初始化数据
        this.initData()
    },
        methods: {
        async getUserAuthority(id){
            const res = await GetUserInfo(id)
            this.permDialogVisible = true
        },
        
        // 初始化数据
        async initData() {
            // 显示加载中
            this.loading = true
            
            try {
                // 并行加载角色列表和权限树
                await Promise.all([
                    this.Async_GetRoleList(),
                    this.Async_GetAuthTree()
                ])
            } catch (error) {
                console.error('初始化数据失败:', error)
            } finally {
                this.loading = false
            }
        },
        handleCheckedNodes(payload){
            console.log("these are selected~",payload.join(','))
            this.selectedAuth = payload.join(',')
        },
        handleNewRoleCheckedNodes(payload){
            console.log("新角色选择的权限:", payload)
            if (payload && payload.length > 0) {
                // 将选择的权限转换为逗号分隔的字符串
                this.newRoleSelectedAuth = payload.join(',')
                // 将权限值设置到表单字段中，以通过表单验证
                this.$set(this.editForm, 'authoritys', this.newRoleSelectedAuth)
                // 隐藏警告
                this.showAuthWarning = false
                
                // 强制重新验证表单
                this.$nextTick(() => {
                    if (this.$refs.editForm) {
                        this.$refs.editForm.validateField('authoritys')
                    }
                })
            } else {
                // 没有选择权限
                this.newRoleSelectedAuth = ''
                this.$set(this.editForm, 'authoritys', '')
            }
        },
        async Async_GetRoleList(){
            this.loading = true
            try {
                // 处理搜索参数
                const searchParams = {
                    role_name: this.searchForm.name, // 将name字段映射为role_name参数
                    status: this.searchForm.status
                }
                
                const { data } = await GetRoleList(this.currentPage, this.size, searchParams)
                
                // 处理返回数据
                this.tableData = data.items || []
                this.total = data.total || 0
                
                // 如果没有数据且不是第一页，返回上一页
                if (this.tableData.length === 0 && this.currentPage > 1) {
                    this.currentPage--
                    this.Async_GetRoleList()
                    return
                }
                
                // 成功获取数据后的提示
                if (this.tableData.length > 0 && this.searchForm.name) {
                    this.$message({
                        type: 'success',
                        message: `找到 ${this.tableData.length} 条符合条件的角色`,
                        duration: 1500
                    })
                }
            } catch (error) {
                console.error('获取角色列表失败:', error)
                this.$message.error('获取角色列表失败')
            } finally {
                this.loading = false
            }
        },
        
        // 搜索角色
        searchHandle() {
            this.currentPage = 1 // 重置为第一页
            this.Async_GetRoleList()
        },
        
        // 重置搜索条件
        resetSearchForm() {
            // 重置表单数据
            this.searchForm = {
                name: '',
                status: ''
            }
            // 重置分页
            this.currentPage = 1
            // 重新加载数据
            this.$nextTick(() => {
                this.Async_GetRoleList()
            })
            // 提示用户
            this.$message({
                type: 'info',
                message: '已重置搜索条件',
                duration: 1000
            })
        },

        async Async_GetAuthTree(){
            try {
                const res = await GetAuthTree();
                this.permTreeData = res;
            } catch (error) {
                console.error('获取权限树失败:', error);
                this.$message.error('获取权限树失败: ' + (error.message || '未知错误'));
            }
        },
        toggleSelection(rows) {
            if (rows) {
            rows.forEach(row => {
                this.$refs.multipleTable.toggleRowSelection(row);
            });
            } else {
            this.$refs.multipleTable.clearSelection();
            }
            },

        handleSelectionChange(val) {
            this.multipleSelection = val;
            this.delBtnStatus = val.length === 0
            if (val.length > 0) {
              this.$message({
                type: 'info',
                message: `已选中 ${val.length} 项`,
                duration: 1000,
                showClose: false
              })
            }
        },
        
        handleSizeChange(val) {
            this.size = val
            this.Async_GetRoleList()
        },
        handleCurrentChange(val) {
            this.currentPage = val
            this.Async_GetRoleList()
        },

        resetForm(formName){
            // 先检查表单引用是否存在
            if (this.$refs[formName]) {
                this.$refs[formName].resetFields();
            }
            // 重置表单数据
            this.editForm = {
                status: 1 // 默认状态为正常
            };
            this.newRoleSelectedAuth = ''; // 重置新角色选择的权限
            this.showAuthWarning = false; // 重置权限警告状态
            },

        handleClose(){
            // 先关闭对话框
            this.dialogVisible = false
            // 然后重置表单
            this.$nextTick(() => {
                this.resetForm('editForm')
            })
            },
            
        // 打开新增角色对话框
        openAddRoleDialog() {
            // 初始化表单数据
            this.editForm = {
                status: 1 // 默认状态为正常
            };
            this.newRoleSelectedAuth = ''; // 重置新角色选择的权限
            this.showAuthWarning = false; // 重置权限警告状态
            
            // 显示对话框
            this.dialogVisible = true;
            // 确保权限面板展开
            this.activeCollapse = ['1'];
            
            // 在对话框渲染完成后重置表单
            this.$nextTick(() => {
                if (this.$refs.editForm) {
                    this.$refs.editForm.resetFields();
                }
            });
        },

        submitForm(formName){
        /* 调用表单DOM元素 进行表单校验及提交操作 */
        this.$refs[formName].validate(async (valid) => {
          if (valid) {
            this.loading = true;
            try {
              // 创建角色数据对象
              const roleData = { ...this.editForm };
              
              // 如果是新增角色
              if (!roleData.id) {
                // 检查是否选择了权限
                if (!this.newRoleSelectedAuth || this.newRoleSelectedAuth.trim() === '') {
                  this.$message({
                    showClose: true,
                    message: '请选择要分配的权限',
                    type: 'warning'
                  });
                  this.showAuthWarning = true; // 显示权限警告
                  // 确保权限面板展开
                  this.activeCollapse = ['1'];
                  this.loading = false;
                  return; // 没有选择权限，不继续提交
                }
                
                // 将权限添加到角色数据中
                roleData.authoritys = this.newRoleSelectedAuth;
                
                // 调用添加角色API
                const response = await AddRole(roleData);
                
                if (response.code === 200) {
                  this.$message({
                    showClose: true,
                    message: '角色创建成功并已分配权限',
                    type: 'success'
                  });
                  
                  // 关闭对话框
                  this.dialogVisible = false;
                  // 重置表单 - 在对话框关闭后重置
                  this.$nextTick(() => {
                    this.resetForm('editForm');
                  });
                  // 刷新角色列表
                  await this.Async_GetRoleList();
                } else {
                  // 如果返回码为400，表示缺少必填项
                  if (response.code === 400) {
                    this.$message({
                      showClose: true,
                      message: response.message || '角色名称和权限列表为必填项',
                      type: 'warning'
                    });
                    // 不关闭弹窗，允许用户继续编辑
                  } else {
                    this.$message({
                      showClose: true,
                      message: response.message || '创建角色失败',
                      type: 'error'
                    });
                  }
                }
              } else {
                // 编辑角色逻辑
                // TODO: 实现编辑角色的API调用
                this.$message({
                  showClose: true,
                  message: '更新角色成功',
                  type: 'success'
                });
                
                // 关闭对话框
                this.dialogVisible = false;
                // 重置表单 - 在对话框关闭后重置
                this.$nextTick(() => {
                  this.resetForm('editForm');
                });
                // 刷新角色列表
                await this.Async_GetRoleList();
              }
            } catch (error) {
              console.error('提交角色数据失败:', error);
              this.$message({
                showClose: true,
                message: '提交失败: ' + (error.message || '未知错误'),
                type: 'error'
              });
              // 失败时不关闭弹窗
            } finally {
              this.loading = false;
            }
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },

      permHandle(id,authoritys) {
        this.roleId = id
        this.permDialogVisible = true
        this.defaultCheckedKeys = authoritys.split(',')
      },

      editHandle(id){
      },

      deleteHandle(id){
        let ids = []

        if(id){
            ids.push(id)
        }else{
            this.multipleSelection.forEach(item =>{
                ids.push(item.id)
            })
        }
        
        if (ids.length === 0) {
          this.$message({
            type: 'warning',
            message: '请选择要删除的角色'
          })
          return
        }
        
        this.$message({
          type: 'success',
          message: `删除操作成功，已删除 ${ids.length} 项`,
          duration: 2000
        })
        
        // 刷新列表
        this.Async_GetRoleList()
      },

      async submitPermFormHandle(formName) {
        if (this.selectedAuth) {
            this.loading = true;
            try {
                const response = await SetRoleAuthority(this.roleId, this.selectedAuth);
                
                if (response && response.code === 200) {
                    this.$message({
                        showClose: true,
                        message: '权限设置成功',
                        type: 'success'
                    });
                    // 刷新角色列表
                    await this.Async_GetRoleList();
                    // 成功时关闭弹窗
                    this.permDialogVisible = false;
                } else {
                    this.$message({
                        showClose: true,
                        message: (response && response.message) || '权限设置失败',
                        type: 'error'
                    });
                    // 失败时不关闭弹窗
                }
            } catch (error) {
                console.error('设置权限失败:', error);
                this.$message({
                    showClose: true,
                    message: '设置权限失败: ' + (error.message || '未知错误'),
                    type: 'error'
                });
                // 失败时不关闭弹窗
            } finally {
                this.loading = false;
            }
        } else {
            this.$message({
                showClose: true,
                message: '请选择要分配的权限',
                type: 'warning'
            });
            // 没有选择权限时不关闭弹窗
        }
      }
    },
    name: 'Role',
    components:{
        TreeSelect
    }
}
</script>

<style scoped>
    .search-area {
        text-align: left;
        margin-bottom: 20px;
    }
    
    .filter-card {
        margin-bottom: 15px;
        border-radius: 5px;
    }
    
    .filter-header {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #606266;
    }
    
    .filter-header i {
        margin-right: 5px;
        color: #409EFF;
    }
    
    .operation-area {
        margin: 15px 0;
    }
    
    .operation-area .el-button {
        margin-right: 10px;
    }
    
    .table-card {
        margin-bottom: 20px;
        border-radius: 5px;
    }
    
    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .table-header i {
        margin-right: 5px;
        color: #409EFF;
    }
    
    .table-total {
        font-size: 13px;
        color: #606266;
    }
    
    .role-name {
        display: flex;
        align-items: center;
    }
    
    .empty-data {
        padding: 30px 0;
        text-align: center;
        color: #909399;
    }
    
    .empty-data i {
        font-size: 40px;
        margin-bottom: 10px;
    }
    
    .pagination-container {
        text-align: right;
        margin-top: 20px;
        padding: 10px 0;
    }
    
    /* 角色对话框样式 */
    .role-dialog .el-dialog__body {
        padding: 20px 30px;
    }
    
    .role-dialog .el-form-item {
        margin-bottom: 18px;
    }
    
    .role-dialog .el-divider__text {
        font-size: 14px;
        font-weight: bold;
        color: #409EFF;
    }
    
    .permission-panel {
        border: 1px solid #EBEEF5;
        border-radius: 4px;
        padding: 10px;
        background-color: #F8F9FA;
        max-height: 300px;
        overflow-y: auto;
    }
    
    .dialog-footer {
        text-align: right;
        margin-top: 20px;
    }
    
    /* 搜索区域按钮样式 */
    .search-area .el-button {
        margin-left: 5px;
    }
    
    /* 操作按钮组样式 */
    .button-group {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .button-group .el-button {
        margin: 0 5px;
    }
    
    .button-group .el-tooltip {
        display: inline-block;
    }
</style>