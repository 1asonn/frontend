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
				<el-button @click="">搜索</el-button>
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
				:data="patientData"
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
					prop="medicalId"
					label="就诊卡号"
					width="120">
			</el-table-column>

			<el-table-column
					prop="name"
					label="患者姓名"
					width="120">
			</el-table-column>
			<el-table-column
					prop="gender"
					label="性别">
			</el-table-column>
			<el-table-column
					prop="birthday"
					label="出生日期">
			</el-table-column>
			<el-table-column
					prop="age"
					label="年龄">
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
							<el-button type="text" slot="reference">删除</el-button>
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
					<el-alert
							title="初始密码为888888"
							:closable="false"
							type="info"
							style="line-height: 12px;"
					></el-alert>
				</el-form-item>

				<el-form-item label="邮箱"  prop="email" label-width="100px">
					<el-input v-model="editForm.email" autocomplete="off"></el-input>
				</el-form-item>
				<el-form-item label="手机号"  prop="phone" label-width="100px">
					<el-input v-model="editForm.phone" autocomplete="off"></el-input>
				</el-form-item>

				<el-form-item label="状态"  prop="statu" label-width="100px">
					<el-radio-group v-model="editForm.statu">
						<el-radio :label="0">禁用</el-radio>
						<el-radio :label="1">正常</el-radio>
					</el-radio-group>
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
		    size="60%"
			title="患者信息详情"
			:visible.sync="drawer"
			:direction="direction"
			:before-close="handleDrawerClose">

			<span>我来啦!</span>
			<div class="RecordBox">
				<el-table :data="recordData" style="width: 100% ">
			
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

				<!-- AI分析结果展示 -->
				<div class="ai-analysis" v-if="aiAnalysis">
					<h3>AI诊疗分析报告</h3>
					<el-card class="analysis-card">
						<div class="analysis-item">
							<h4><i class="el-icon-trend-charts"></i> 病情趋势分析</h4>
							<p>{{aiAnalysis.trend}}</p>
						</div>
						<div class="analysis-item">
							<h4><i class="el-icon-medicine-box"></i> 用药建议</h4>
							<p>{{aiAnalysis.medicationAdvice}}</p>
						</div>
						<div class="analysis-item">
							<h4><i class="el-icon-warning-outline"></i> 风险预警</h4>
							<div v-for="(risk, index) in aiAnalysis.risks" :key="index" class="risk-item">
								<el-tag :type="risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'info'">
									{{ risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中等风险' : '低风险' }}
								</el-tag>
								<div class="risk-content">
									<p class="description">{{risk.description}}</p>
									<p class="suggestion" v-if="risk.suggestion">建议：{{risk.suggestion}}</p>
								</div>
							</div>
						</div>
						<div class="analysis-item" v-if="aiAnalysis.lifestyle">
							<h4><i class="el-icon-user"></i> 生活方式建议</h4>
							<div class="lifestyle-content">
								<div class="lifestyle-item" v-if="aiAnalysis.lifestyle.diet">
									<h5><i class="el-icon-food"></i> 饮食建议</h5>
									<p>{{aiAnalysis.lifestyle.diet}}</p>
								</div>
								<div class="lifestyle-item" v-if="aiAnalysis.lifestyle.exercise">
									<h5><i class="el-icon-position"></i> 运动建议</h5>
									<p>{{aiAnalysis.lifestyle.exercise}}</p>
								</div>
								<div class="lifestyle-item" v-if="aiAnalysis.lifestyle.monitoring">
									<h5><i class="el-icon-monitor"></i> 监测建议</h5>
									<p>{{aiAnalysis.lifestyle.monitoring}}</p>
								</div>
							</div>
						</div>
					</el-card>
				</div>
			</div>
		</el-drawer>
		<!-- <el-dialog title="详情" :visible.sync="dialogTableVisible">
			<el-table :data="gridData">
				<el-table-column property="date" label="日期" width="150"></el-table-column>
				<el-table-column property="name" label="姓名" width="200"></el-table-column>
				<el-table-column property="address" label="地址"></el-table-column>
			</el-table>
		</el-dialog> -->
	</div>
</template>

<script>
    import { GetPatientList, GetPatientRecord } from '@/api/index.js' 
	import { MedicalHistoryAnalysis } from '@/api/aiAgent.js' 
	export default {
		name: "patient",
		data() {
			return {
		
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

				},

				patientData: [],
				recordData: [],
				aiAnalysis: null,

				editFormRules: {
					username: [
						{required: true, message: '请输入用户名称', trigger: 'blur'}
					],
					email: [
						{required: true, message: '请输入邮箱', trigger: 'blur'}
					],
					statu: [
						{required: true, message: '请选择状态', trigger: 'blur'}
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
				checkStrictly: true

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
			this.getPatientList()
		},
		methods: {
			async getPatientList() {
				try {
					const res = await GetPatientList()
					this.patientData  = res.data.data.records
					console.log(res.data,"res")
				} catch (error) {
					console.log("Error fetching patient list", error)
					
				}
			},
			checkHandle(id){
				GetPatientRecord(id).then(res => {
					console.log(res,"this is record data")
					this.recordData = res.data
					this.drawer = true 
					return MedicalHistoryAnalysis(this.recordData);
				})
				.then(res =>{
						console.log("this is aiiii",res)
						console.log('this is ai analysis',typeof(res))
						this.aiAnalysis = res.data
				})
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
			},
			handleCurrentChange(val) {
				console.log(`当前页: ${val}`);
				this.current = val
			},

			resetForm(formName) {
				this.$refs[formName].resetFields();
				this.dialogVisible = false
				this.editForm = {}
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
						this.$axios.post('/sys/user/' + (this.editForm.id?'update' : 'save'), this.editForm)
							.then(res => {

								this.$message({
									showClose: true,
									message: '恭喜你，操作成功',
									type: 'success',
									onClose:() => {
									}
								});

								this.dialogVisible = false
							})
					} else {
						console.log('error submit!!');
						return false;
					}
				});
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
			}
		}
	}
</script>

<style scoped>
.ai-analysis {
	margin-top: 20px;
	padding: 15px;
}
.analysis-card {
	margin-top: 10px;
	padding: 10px;
}
.analysis-item {
	margin-bottom: 20px;
	padding: 10px;
	border-radius: 4px;
	background-color: #f8f9fa;
}
.analysis-item:last-child {
	margin-bottom: 0;
}
.analysis-item h4 {
	margin-bottom: 15px;
	color: #303133;
	font-weight: bold;
	display: flex;
	align-items: center;
}
.analysis-item h4 i {
	margin-right: 8px;
	font-size: 18px;
}
.analysis-item p {
	line-height: 1.6;
	color: #606266;
	margin: 0;
}
.risk-item {
	margin-bottom: 12px;
	display: flex;
	align-items: flex-start;
}
.risk-item:last-child {
	margin-bottom: 0;
}
.risk-content {
	margin-left: 10px;
	flex: 1;
}
.risk-content .description {
	margin-bottom: 5px;
}
.risk-content .suggestion {
	color: #67c23a;
	font-size: 14px;
}
.lifestyle-content {
	margin-top: 10px;
}
.lifestyle-item {
	margin-bottom: 15px;
	padding: 10px;
	background-color: #fff;
	border-radius: 4px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.lifestyle-item:last-child {
	margin-bottom: 0;
}
.lifestyle-item h5 {
	margin: 0 0 8px 0;
	color: #409eff;
	font-weight: bold;
	display: flex;
	align-items: center;
}
.lifestyle-item h5 i {
	margin-right: 5px;
}

	.el-pagination {
		float: right;
		margin-top: 22px;
	}

	.RecordBox {
		padding: 20px;
	}
</style>