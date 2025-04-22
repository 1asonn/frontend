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
				<el-button type="success" @click="handleRegister">用户注册</el-button>
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
				<template slot-scope="scope">
					{{ formatDate(scope.row.birth_date) }}
				</template>
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
				title="用户信息"
				:visible.sync="dialogVisible"
				width="600px"
				@close="handleClose">

			<el-form :model="editForm" :rules="editFormRules" ref="editForm">
				<el-form-item label="用户名" prop="username" label-width="100px">
					<el-input v-model="editForm.username" autocomplete="off"></el-input>
				</el-form-item>

				<el-form-item label="密码" prop="password" label-width="100px">
					<el-input v-model="editForm.password" disabled autocomplete="off"></el-input>
					<div class="el-form-item__info" style="font-size: 12px; color: #909399; line-height: 1; padding-top: 4px;">初始密码默认为123456</div>
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
				<el-form-item label="角色" prop="roleId" label-width="100px">
					<el-select v-model="editForm.roleId" placeholder="请选择角色">
						<el-option v-for="role in roles" :key="role.id" :label="role.role_name" :value="role.id"></el-option>
					</el-select>
				</el-form-item>

				<el-form-item label="地址" prop="address" label-width="100px">
					<el-input v-model="editForm.address" type="textarea" :rows="2"></el-input>
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
	</div>
</template>

<script>
    import { GetUserList,GetRoleList,GetDepartmentList } from '@/api/index.js'
	import FullCalendar from '@fullcalendar/vue'  
    import { dayGridPlugin } from '@fullcalendar/daygrid'
	import { interactionPlugin } from '@fullcalendar/interaction'
	import { UserRegiste } from '@/api'
	export default {
		components:{
			FullCalendar
		},
		name: "User",
		data() {
			// 自定义验证规则
			const validatePassword = (rule, value, callback) => {
				if (value === '') {
					callback(new Error('请输入密码'))
				} else if (value.length < 6) {
					callback(new Error('密码长度不能少于6个字符'))
				} else {
					callback()
				}
			}

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
						{ required: true, validator: validatePassword, trigger: 'blur' },
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
        },
		async created() {
			try {
				await Promise.all([
					this.getUserList(),
					this.getRoles(),
					this.getDepartments()
				])
			} catch (error) {
				console.error('初始化数据失败:', error)
				this.$message.error('初始化数据失败，请刷新页面重试')
			}
		},
		methods: {
			UserRegiste,
			async handleRegister() {
			try {
				// 确保角色和部门数据已加载
				if (!this.roles || this.roles.length === 0) {
					await this.getRoles()
				}
				if (!this.departments || this.departments.length === 0) {
					await this.getDepartments()
				}

				// 清空表单并设置默认密码
				this.$refs['editForm']?.resetFields()
				this.editForm = {
					id: '',
					username: '',
					password: '123456',  // 设置默认密码
					realname: '',
					gender: '',
					birthDate: '',
					address: '',
					roleId: '',
					departmentId: ''
				}
				// 打开注册对话框
				this.dialogVisible = true
			} catch (error) {
				console.error('打开注册对话框失败:', error)
				this.$message.error('加载必要数据失败，请重试')
			}
		},
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
					const res = await GetUserList({
						current: this.current,
						size: this.size,
						username: this.searchForm.username
					})
					console.log("userList",res)
					this.tableData = res.records
					this.size = res.size
					this.current = res.current
					this.total = res.total
				} catch (error) {
					console.error('获取用户列表失败:', error)
					this.$message.error('获取用户列表失败')
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
				this.dialogVisible = false
				this.$nextTick(() => {
					this.$refs['editForm'].resetFields()
				})
			},

			submitForm(formName) {
				this.$refs[formName].validate(async (valid) => {
					if (valid) {
						try {
							const formData = {
								...this.editForm,
								birth_date: this.editForm.birthDate
							}

							let response
							if (this.editForm.id) {
								// 更新用户
								response = await this.$axios.post('/sys/user/update', formData)
							} else {
								// 新增用户
								response = await this.UserRegiste(formData)
							}

							this.$message({
								showClose: true,
								message: response.message || '操作成功',
								type: 'success',
								onClose: () => {
									this.getUserList()
								}
							})

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
						} catch (error) {
							console.error('操作失败:', error)
							this.$message.error(error.response?.data?.message || '操作失败')
						}
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
					const res = await GetRoleList()
					console.log("11111",res)
					this.roles = res
				} catch (error) {
					console.error('获取角色列表失败:', error)
					this.$message.error('获取角色列表失败')
				}
			},
			async getDepartments() {
				try {
					const res = await GetDepartmentList()
					console.log("111111111",res)
					this.departments = res.data
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
			},
			formatDate(date) {
				if (!date) return '';
				const d = new Date(date);
				const year = d.getFullYear();
				const month = String(d.getMonth() + 1).padStart(2, '0');
				const day = String(d.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
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