<template>
    <div style="padding:5px;">
    <div class="search-area">
        <el-form :inline="true">
            <el-form-item>
            <el-input v-model="searchForm.name" placeholder="名称" clearable></el-input>
            </el-form-item>
            <el-form-item>
                <el-button  @click="">搜索</el-button>
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="dialogVisible=true">新增</el-button>
            </el-form-item>

            <el-form-item>
                <el-popconfirm title="确定进行批量删除吗？" @confirm="deleteHandle(null)">
                    <el-button type="danger" slot="reference" :disabled="delBtnStatus">批量删除</el-button>
                </el-popconfirm>
            </el-form-item>
        </el-form>
    </div>

    <el-table ref="multipleTable" 
    :data="tableData" 
    tooltip-effect="dark" 
    style="width: 100%" 
    @selection-change="handleSelectionChange"
    border
    stripe>
        <el-table-column type="selection" width="55">
        </el-table-column>
        <!-- <el-table-column label="日期" width="120">
        <template slot-scope="scope">{{ scope.row.date }}</template>
        </el-table-column> -->
        <el-table-column prop="role_name" label="角色名称" width="120">
        </el-table-column>
        <el-table-column prop="code" label="唯一编码" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="remark" label="描述" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="status" label="状态">
            <template slot-scope="scope">
                <el-tag size="small" v-if="scope.row.status === 1" type="success">正常</el-tag>
                <el-tag size="small" v-else-if="scope.row.status === 0" type="danger">禁用</el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="operate" label="操作">
            <template slot-scope="scope">
                <el-button type="text" @click="permHandle(scope.row.id,scope.row.authoritys)">分配权限</el-button>
                <el-divider direction="vertical"></el-divider>

                <el-button type="text" @click="editHandle(scope.row.id)">编辑</el-button>
                <el-divider direction="vertical"></el-divider>
                
                <template>
                    <el-popconfirm title="删除后数据无法恢复,确定删除吗？" @confirm="deleteHandle(scope.row.id)">
                        <el-button type="text" slot="reference">删除</el-button>
                    </el-popconfirm>
                </template>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page.sync="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="size"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total">
    </el-pagination>

    <!-- 新增按钮弹窗 -->
    <el-dialog
        title="角色信息"
        :visible.sync="dialogVisible"
        width="600px"
        :before-close="handleClose">
        <el-form :model="editForm" :rules="editFormRules" ref="editForm">
            <el-form-item label="角色名称" prop="role_name" label-width="100px" >
                <el-input v-model="editForm.name"></el-input>
            </el-form-item>
         
            <el-form-item label="唯一编码" prop="code" label-width="100px">
               <el-input v-model="editForm.code" autocomplete="off"></el-input>
            </el-form-item>
            
            <el-form-item label="描述" prop="remark" label-width="100px">
               <el-input v-model="editForm.remark" autocomplete="off"></el-input>
            </el-form-item>
      
            <el-form-item label="状态" prop="status" label-width="100px">
               <el-radio-group v-model="editForm.status">
                  <el-radio :label=0>禁用</el-radio>
                  <el-radio :label=1>正常</el-radio>
               </el-radio-group>
            </el-form-item>
            <el-form-item style="justify-content: center;">
                <el-button type="primary" @click="submitForm('editForm')">立即创建</el-button>
                <el-button @click="resetForm('editForm')">重置</el-button>
            </el-form-item>
        </el-form>
        </el-dialog>

        
        <el-dialog
				title="分配权限"
				:visible.sync="permDialogVisible"
				width="600px">

			<el-form :model="permForm">
                <TreeSelect :initialData="permTreeData"
                            :defaultProps="defaultProps"
                            :default-checked-keys="defaultCheckedKeys"
                            v-if="permTreeData"
                            @get-checkedNodes="handleCheckedNodes"
                    >
                </TreeSelect>

			</el-form>

			<span slot="footer" class="dialog-footer">
			    <el-button @click="permDialogVisible = false">取 消</el-button>
			    <el-button type="primary" @click="submitPermFormHandle('permForm')">确 定</el-button>
			</span>

		</el-dialog>

    </div>
</template>

<script>
    import {GetRoleList,GetAuthTree,GetUserInfo,SetRoleAuthority} from '@/api/index.js'
    import TreeSelect from '@/components/TreeSelect.vue'
    export default {
        data(){
            return{
                roleId:'',
                defaultCheckedKeys:[],
                selectedAuth:'',
                searchForm:{},
                delBtnStatus:true,
                tableData: [],
                multipleSelection: [],

                currentPage : 1,
                total : 0,
                size : 10,

                dialogVisible:false,
                permDialogVisible:false,
                editForm:{},
                editFormRules: {
                    name: [
                        {required: true, message: '请输入名称', trigger: 'blur'}
                    ],
                    code: [
                        {required: true, message: '请输入唯一编码', trigger: 'blur'}
                    ],
                    status: [
                        {required: true, message: '请选择状态', trigger: 'blur'}
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
            this.Async_GetRoleList()
            this.Async_GetAuthTree()
        },
        methods: {
        async getUserAuthority(id){
            const res = await GetUserInfo(id)
            return res.role.authoritys
            console.log("this is what i get",res)
        },
        handleCheckedNodes(payload){
            console.log("these are selected~",payload.join(','))
            this.selectedAuth = payload.join(',')
        },
        async Async_GetRoleList(){
            const res = await GetRoleList()
            this.tableData = res
        },
        async Async_GetAuthTree(){
            const res = await GetAuthTree()
            this.permTreeData = res
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
            console.log("测试内容",this.multipleSelection)
            this.delBtnStatus = val.length == 0
            },
        
        handleSizeChange(val) {
            // console.log(`每页 ${val} 条`);
            this.size = val

            },

        handleCurrentChange(val) {
            // console.log(`当前页: ${val}`);
            this.current = val

            },

        resetForm(formName){
            this.$refs[formName].resetFields();
            this.editForm = {}
            },

        handleClose(){
            this.resetForm('editForm')
            this.dialogVisible = false
            },

        submitForm(formName){
        /* 调用表单DOM元素 进行表单校验及提交操作 */
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.$axios.post('/sys/role/'+ (this.editForm.code?'updata':'save'),this.editForm).then(res => {
               this.$message({
                showClose:true,
                message:'提交成功',
                type:'success',
                onClose:() => {                               //弹窗关闭时更新列表数据

                }
               }),
               this.dialogVisible = false                     //表单提交成功后关闭弹窗
            })

          } else {
            console.log('error submit!!');
            return false;
          }
        })
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
      },

      submitPermFormHandle(formName) {
        if (this.selectedAuth) {
            SetRoleAuthority(this.roleId,this.selectedAuth).then(() =>{
                this.$message({
                showClose: true,
                message: '恭喜你，操作成功',
                type: 'success',
                onClose:() => {}
                })
            })
        }
            this.permDialogVisible = false
            // this.resetForm(formName)
        }
    },
    name: 'Role',
    components:{
        TreeSelect
    }
}
</script>

<style scoped>
    .search-area{
        text-align: left;
        margin-left:1%;
    }

    .el-pagination{
        float: right;
        margin-top: 5px;
    }
</style>