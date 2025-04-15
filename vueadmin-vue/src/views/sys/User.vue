<template>
	<div style="padding: 5px;">
		<el-form :inline="true" style="text-align: left;">
			<el-form-item>
				<el-input
						v-model="searchForm.username"
						placeholder="用户名"
						clearable
				>
				</el-input>
			</el-form-item>

			<el-form-item>
				<el-button @click="getUserList">搜索</el-button>
			</el-form-item>

			<el-form-item>
				<el-button type="primary" @click="dialogVisible = true" v-if="hasAuth('sys:user:save')">新增</el-button>
			</el-form-item>
			<el-form-item>
				<el-popconfirm title="这是确定批量删除吗？" @confirm="delHandle(null)">
					<el-button type="danger" slot="reference" :disabled="delBtlStatu" v-if="hasAuth('sys:user:delete')">批量删除</el-button>
				</el-popconfirm>
			</el-form-item>
		</el-form>

		<el-table
				ref="multipleTable"
				:data="tableData"
				tooltip-effect="dark"
				style="width: 100%"
				border
				stripe
				@selection-change="handleSelectionChange">

			<el-table-column
					type="selection"
					width="55">
			</el-table-column>

			<el-table-column
					prop="username"
					label="账号"
					width="120">
			</el-table-column>

			<el-table-column
					prop="realname"
					label="姓名"
					width="120">
			</el-table-column>
			<el-table-column
					prop="gender"
					label="性别">
			</el-table-column>
			<el-table-column
					prop="birth_date"
					label="出生日期">
			</el-table-column>
			<el-table-column
					label="年龄">
				<template slot-scope="scope">
					{{ calculateAge(scope.row.birth_date) }}
				</template>
			</el-table-column>
			<el-table-column
					prop="idCard"
					label="身份证号码"
					width="120">
			</el-table-column>
			<el-table-column
					prop="phone"
					label="联系电话">
			</el-table-column>
			<el-table-column
					prop="createdAt"
					width="200"
					label="创建时间"
			>
			</el-table-column>
			<el-table-column
					prop="icon"
					width="200px"
					label="操作">

				<template slot-scope="scope">
					<!-- <el-button type="text" @click="roleHandle(scope.row.id)">分配角色</el-button>
					<el-divider direction="vertical"></el-divider>

					<el-button type="text" @click="repassHandle(scope.row.id, scope.row.username)">重置密码</el-button>
					<el-divider direction="vertical"></el-divider> -->
					<el-button type="text" @click="checkHandle(scope.row.id)">查看</el-button>
					<el-divider direction="vertical"></el-divider>
					<el-button type="text" @click="editHandle(scope.row.id)">编辑</el-button>
					<el-divider direction="vertical"></el-divider>       
					<template>
						<el-popconfirm title="这是一段内容确定删除吗？" @confirm="delHandle(scope.row.id)">
							<el-button type="text" slot="reference">注销</el-button>
						</el-popconfirm>
					</template>

				</template>
			</el-table-column>

		</el-table>

		<el-pagination
				@size-change="handleSizeChange"
				@current-change="handleCurrentChange"
				layout="total, sizes, prev, pager, next, jumper"
				:page-sizes="[10, 20, 50, 100]"
				:current-page="current"
				:page-size="size"
				:total="total">
		</el-pagination>


		<!--新增对话框-->
		<el-dialog
				title="提示"
				:visible.sync="dialogVisible"
				width="600px"
				:before-close="handleClose">

			<el-form :model="editForm" :rules="editFormRules" ref="editForm">
				<el-form-item label="用户名" prop="username" label-width="100px">
					<el-input v-model="editForm.username" autocomplete="off"></el-input>
				</el-form-item>

				<el-form-item label="密码" prop="password" label-width="100px">
					<el-input v-model="editForm.password" type="password" autocomplete="off"></el-input>
				</el-form-item>

				<el-form-item label="真实姓名" prop="realname" label-width="100px">
					<el-input v-model="editForm.realname" autocomplete="off"></el-input>
				</el-form-item>

				<el-form-item label="性别" prop="gender" label-width="100px">
					<el-select v-model="editForm.gender" placeholder="请选择性别">
						<el-option label="男" value="male"></el-option>
						<el-option label="女" value="female"></el-option>
					</el-select>
				</el-form-item>

				<el-form-item label="出生日期" prop="birthDate" label-width="100px">
					<el-date-picker v-model="editForm.birthDate" type="date" placeholder="选择日期"></el-date-picker>
				</el-form-item>

				<el-form-item label="地址" prop="address" label-width="100px">
					<el-input v-model="editForm.address" autocomplete="off"></el-input>
				</el-form-item>

				<el-form-item label="角色" prop="roleId" label-width="100px">
					<el-select v-model="editForm.roleId" placeholder="请选择角色">
						<el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id"></el-option>
					</el-select>
				</el-form-item>

				<el-form-item label="部门" prop="departmentId" label-width="100px">
					<el-select v-model="editForm.departmentId" placeholder="请选择部门">
						<el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
					</el-select>
				</el-form-item>
			</el-form>
			<div slot="footer" class="dialog-footer">
				<el-button @click="resetForm('editForm')">取 消</el-button>
				<el-button type="primary" @click="submitForm('editForm')">确 定</el-button>
			</div>
		</el-dialog>

		<!-- 分配权限对话框 -->
		<el-dialog title="分配角色" :visible.sync="roleDialogFormVisible" width="600px">

			<el-form :model="roleForm">
				<el-tree
						:data="roleTreeData"
						show-checkbox
						ref="roleTree"
						:check-strictly=checkStrictly
						node-key="id"
						:default-expand-all=true
						:props="defaultProps">
				</el-tree>
			</el-form>

			<div slot="footer" class="dialog-footer">
				<el-button @click="roleDialogFormVisible=false">取 消</el-button>
				<el-button type="primary" @click="submitRoleHandle('roleForm')">确 定</el-button>
			</div>
		</el-dialog>

		<el-drawer
		    size="50%"
			title="患者信息详情"
			:visible.sync="drawer"
			:direction="direction"
			:before-close="handleDrawerClose">

			<span>我来啦!</span>
			<el-table :data="tableData" style="width: 100%">
        <el-table-column
          prop="date"
          label="日期"
          width="180">
        </el-table-column>
        <el-table-column
          prop="attendingDoctor"
          label="主治医生"
          width="180">
        </el-table-column>
        <el-table-column
          prop="symptoms"
          label="症状"
          width="180">
        </el-table-column>
        <el-table-column
          prop="diagnosticResults"
          label="诊断结果"
          width="180">
        </el-table-column>
        <el-table-column
          prop="treatment"
          label="治疗措施"
          width="180">
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <el-button type="text" @click="dialogTableVisible = true">编辑</el-button>
            <el-button type="text" @click="delHandle(scope.row.recordId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
		</el-drawer>
		<!-- <el-dialog title="详情" :visible.sync="dialogTableVisible">
			<el-table :data="gridData">
				<el-table-column property="date" label="日期" width="150"></el-table-column>
				<el-table-column property="name" label="姓名" width="200"></el-table-column>
				<el-table-column property="address" label="地址"></el-table-column>
			</el-table>
		</el-dialog> -->
		<FullCalendar
			:options="calendarOptions"
		/>
	</div>
</template>

<script>
    import { GetUserList } from '@/api/index.js'
	import FullCalendar from '@fullcalendar/vue'  
    import dayGridPlugin from '@fullcalendar/daygrid'
    import interactionPlugin from '@fullcalendar/interaction'
	import { options } from 'marked'
	export default {
		components:{
			FullCalendar
		},
		name: "User",
		data() {
			return {
				calendarOptions: {
					plugins: [ dayGridPlugin, interactionPlugin ],
					initialView: 'dayGridMonth',
					selectable:false
      			},
				calendarPlugins: [dayGridPlugin, interactionPlugin],
				events: [],
                dialogTableVisible: false,
				drawer: false,
        		direction: 'rtl',
				searchForm: {},
				delBtlStatu: true,

				total: 10,
				size: 10,
				current: 1,

				dialogVisible: false,
				editForm: {
					id: '',
					username: '',
					password: '',
					realname: '',
					gender: '',
					birthDate: '',
					address: '',
					roleId: '',
					departmentId: ''
				},

				tableData: [],

				editFormRules: {
					username: [
						{ required: true, message: '请输入用户名', trigger: 'blur' },
						{ min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
					],
					password: [
						{ required: true, message: '请输入密码', trigger: 'blur' },
						{ min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
					],
					realname: [
						{ required: true, message: '请输入真实姓名', trigger: 'blur' }
					],
					gender: [
						{ required: true, message: '请选择性别', trigger: 'change' }
					],
					birthDate: [
						{ required: true, message: '请选择出生日期', trigger: 'change' }
					],
					roleId: [
						{ required: true, message: '请选择角色', trigger: 'change' }
					],
					departmentId: [
						{ required: true, message: '请选择部门', trigger: 'change' }
					]
				},

				multipleSelection: [],

				roleDialogFormVisible: false,
				defaultProps: {
					children: 'children',
					label: 'name'
				},
				roleForm: {},
				roleTreeData:  [],
				treeCheckedKeys: [],
				checkStrictly: true,

				roles: [],
				departments: []
			}
		},
        computed: {
            hasSysUserSaveAuth() {
                return this.hasAuth('sys:user:save');
            },	
            hasSysUserDeleteAuth() {
                return this.hasAuth('sys:user:delete');
            }
        },
		created() {
			this.getUserList()
			this.getRoles()
			this.getDepartments()
		},
		methods: {
			handleSelect(selectionInfo) {
				const { start, end } = selectionInfo;
				this.events.push({
					title: '新班次',
					start,
					end,
					color: '#FF69B4'
			});
			},
			handleEventChange(eventInfo) {
				const { event } = eventInfo;
				console.log('班次变更：', event.title, event.start, event.end);
			},
			async getUserList() {
				try {
					const res = await GetUserList()
					this.tableData  = res
					console.log(res.data,"res")
				} catch (error) {
					console.log("Error fetching patient list", error)
				}
			},
			checkHandle(id){
				this.drawer = true
			},

            test(){
                console.log("permList",this.$store.state.menu.permList)
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
				console.log("勾选")
				console.log(val)
				this.multipleSelection = val;

				this.delBtlStatu = val.length == 0
			},

			handleSizeChange(val) {
				console.log(`每页 ${val} 条`);
				this.size = val
				this.getUserList()
			},
			handleCurrentChange(val) {
				console.log(`当前页: ${val}`);
				this.current = val
				this.getUserList()
			},

			resetForm(formName) {
				this.$refs[formName].resetFields();
				this.dialogVisible = false
				this.editForm = {
					id: '',
					username: '',
					password: '',
					realname: '',
					gender: '',
					birthDate: '',
					address: '',
					roleId: '',
					departmentId: ''
				}
			},
			handleDrawerClose(){
				this.drawer = false
			},
			handleClose() {
				this.resetForm('editForm')
			},

			submitForm(formName) {
				this.$refs[formName].validate((valid) => {
					if (valid) {
						const url = this.editForm.id ? '/sys/user/update' : '/sys/user/register'
						this.$axios.post(url, this.editForm)
							.then(res => {
								this.$message({
									showClose: true,
									message: '操作成功',
									type: 'success',
									onClose: () => {
										this.getUserList()
									}
								});
								this.dialogVisible = false
								this.editForm = {
									id: '',
									username: '',
									password: '',
									realname: '',
									gender: '',
									birthDate: '',
									address: '',
									roleId: '',
									departmentId: ''
								}
							})
							.catch(error => {
								console.error('操作失败:', error)
								this.$message.error(error.response?.data?.message || '操作失败')
							})
					} else {
						return false
					}
				})
			},

			editHandle(id) {
				this.$axios.get('/sys/user/info/' + id).then(res => {
					this.editForm = res.data.data

					this.dialogVisible = true
				})
			},

			delHandle(id) {

				var ids = []

				if (id) {
					ids.push(id)
				} else {
					this.multipleSelection.forEach(row => {
						ids.push(row.id)
					})
				}

				console.log(ids)

				this.$axios.post("/sys/user/delete", ids).then(res => {
					this.$message({
						showClose: true,
						message: '恭喜你，操作成功',
						type: 'success',
						onClose:() => {
							this.getUserList()
						}
					});
				})
			},

			roleHandle (id) {
				this.roleDialogFormVisible = true

				this.$axios.get('/sys/user/info/' + id).then(res => {
					this.roleForm = res.data.data

					let roleIds = []
					res.data.data.sysRoles.forEach(row => {
						roleIds.push(row.id)
					})

					this.$refs.roleTree.setCheckedKeys(roleIds)
				})
			},
			submitRoleHandle(formName) {
				var roleIds = this.$refs.roleTree.getCheckedKeys()

				console.log(roleIds)

				this.$axios.post('/sys/user/role/' + this.roleForm.id, roleIds).then(res => {
					this.$message({
						showClose: true,
						message: '恭喜你，操作成功',
						type: 'success',
						onClose:() => {
							this.getUserList()
						}
					});

					this.roleDialogFormVisible = false
				})
			},
			repassHandle(id, username) {

				this.$confirm('将重置用户【' + username + '】的密码, 是否继续?', '提示', {
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'warning'
				}).then(() => {
					this.$axios.post("/sys/user/repass", id).then(res => {
						this.$message({
							showClose: true,
							message: '恭喜你，操作成功',
							type: 'success',
							onClose: () => {
							}
						});
					})
				})
			},
			async getRoles() {
				try {
					const res = await this.$axios.get('/sys/role/list')
					this.roles = res.data.data
				} catch (error) {
					console.error('获取角色列表失败:', error)
					this.$message.error('获取角色列表失败')
				}
			},
			async getDepartments() {
				try {
					const res = await this.$axios.get('/sys/department/list')
					this.departments = res.data.data
				} catch (error) {
					console.error('获取部门列表失败:', error)
					this.$message.error('获取部门列表失败')
				}
			},
			calculateAge(birthDate) {
				if (!birthDate) return '';
				const today = new Date();
				const birth = new Date(birthDate);
				let age = today.getFullYear() - birth.getFullYear();
				const monthDiff = today.getMonth() - birth.getMonth();
				if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
					age--;
				}
				return age;
			}
		}
	}
</script>

<style scoped>

	.el-pagination {
		float: right;
		margin-top: 22px;
	}

</style>