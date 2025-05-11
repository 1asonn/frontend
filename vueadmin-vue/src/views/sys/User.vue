<template>
	<div class="user-container">
		<div class="page-header">
			<div class="header-title">
				<i class="el-icon-user"></i>
				<span>用户管理</span>
			</div>
			<div class="header-actions">
				<el-button type="primary" icon="el-icon-refresh" size="small" circle @click="getUserList" title="刷新数据"></el-button>
			</div>
		</div>

		<el-card shadow="hover" class="main-card">
			<div class="search-area">
				<el-form :inline="true" :model="searchForm" class="search-form" @keyup.enter.native="getUserList">
					<el-form-item>
						<el-input
							v-model="searchForm.username"
							placeholder="用户名"
							prefix-icon="el-icon-search"
							clearable
						>
						</el-input>
					</el-form-item>
					
					<el-form-item>
						<el-select v-model="searchForm.departmentId" placeholder="选择部门" clearable>
							<el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
						</el-select>
					</el-form-item>

					<el-form-item>
						<el-button type="primary" icon="el-icon-search" @click="getUserList">搜索</el-button>
						<el-button icon="el-icon-refresh" @click="resetSearchForm">重置</el-button>
					</el-form-item>
				</el-form>

				<div class="action-buttons">
					<el-button type="success" icon="el-icon-plus" @click="handleRegister">新增用户</el-button>
					<el-button type="danger" icon="el-icon-delete" :disabled="delBtlStatu" @click="batchDelete">批量删除</el-button>
				</div>
			</div>

			<el-table
				ref="multipleTable"
				:data="tableData"
				tooltip-effect="dark"
				style="width: 100%"
				border
				stripe
				highlight-current-row
				:header-cell-style="{backgroundColor: '#f5f7fa', color: '#606266'}"
				v-loading="tableLoading"
				element-loading-text="加载中..."
				element-loading-spinner="el-icon-loading"
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
					width="100">
				</el-table-column>
				<el-table-column
					prop="gender"
					label="性别"
					width="60">
				</el-table-column>
				<el-table-column
					label="部门"
					width="100">
					<template slot-scope="scope">
						<el-tag size="small" type="info" v-if="scope.row.department">
							{{ scope.row.department.name }}
						</el-tag>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column
					label="角色"
					width="100">
					<template slot-scope="scope">
						<el-tag size="small" type="primary" v-if="scope.row.role">
							{{ scope.row.role.role_name }}
						</el-tag>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column
					prop="birth_date"
					label="出生日期"
					width="100">
				</el-table-column>
				<el-table-column
					label="年龄"
					width="60">
					<template slot-scope="scope">
						{{ calculateAge(scope.row.birth_date) || '-' }}
					</template>
				</el-table-column>
				<el-table-column
					prop="phone"
					label="联系电话"
					width="120">
					<template slot-scope="scope">
						{{ scope.row.phone || '-' }}
					</template>
				</el-table-column>
				<el-table-column
					prop="createdAt"
					width="170"
					label="创建时间"
				>
					<template slot-scope="scope">
						{{ formatDate(scope.row.createdAt) }}
					</template>
				</el-table-column>
				<el-table-column
					prop="icon"
					width="200px"
					label="操作">

					<template slot-scope="scope">
						<el-button type="text" @click="checkHandle(scope.row.id)">查看</el-button>
						<el-divider direction="vertical"></el-divider>
						<el-button type="text" @click="editHandle(scope.row)">编辑</el-button>
						<el-divider direction="vertical"></el-divider>       
						<el-popconfirm title="确定要注销该用户吗？" @confirm="delHandle(scope.row.id)">
							<el-button type="text" slot="reference">注销</el-button>
						</el-popconfirm>

					</template>
				</el-table-column>

			</el-table>

			<div class="pagination-container">
				<el-pagination
					@size-change="handleSizeChange"
					@current-change="handleCurrentChange"
					layout="total, sizes, prev, pager, next, jumper"
					:page-sizes="[10, 20, 50, 100]"
					:current-page="current"
					:page-size="size"
					background
					:total="total">
				</el-pagination>
			</div>
		</el-card>

		<!--用户信息对话框-->
		<el-dialog
			:title="editForm.id ? '编辑用户' : '新增用户'"
			:visible.sync="dialogVisible"
			width="65%"
			:fullscreen="isFullscreen"
			:before-close="handleDialogBeforeClose"
			custom-class="user-edit-dialog">

			<div class="dialog-header-actions">
				<el-button 
					type="text" 
					@click="toggleFullscreen" 
					:icon="isFullscreen ? 'el-icon-copy-document' : 'el-icon-full-screen'">
					{{isFullscreen ? '退出全屏' : '全屏编辑'}}
				</el-button>
			</div>

			<!-- 分步表单 -->
			<el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px">
				<el-step title="基本信息" icon="el-icon-user"></el-step>
				<el-step title="联系信息" icon="el-icon-phone"></el-step>
				<el-step title="组织信息" icon="el-icon-office-building"></el-step>
			</el-steps>

			<el-form :model="editForm" :rules="editFormRules" ref="editForm" label-width="100px" class="step-form">
				<!-- 第一步：基本信息 -->
				<div v-show="activeStep === 0">
					<div class="form-section-title">
						<i class="el-icon-user"></i> 基本信息
					</div>

					<el-form-item label="用户名" prop="username">
						<el-input v-model="editForm.username" autocomplete="off" placeholder="请输入用户名"></el-input>
					</el-form-item>

					<!-- 只在新增用户时显示密码字段 -->
					<el-form-item v-if="!editForm.id" label="密码" prop="password">
						<el-input v-model="editForm.password" autocomplete="off" placeholder="初始密码"></el-input>
						<div class="el-form-item__info" style="font-size: 12px; color: #909399; line-height: 1; padding-top: 4px;">
							初始密码默认为123456
						</div>
					</el-form-item>

					<el-form-item label="真实姓名" prop="realname">
						<el-input v-model="editForm.realname" autocomplete="off" placeholder="请输入真实姓名"></el-input>
					</el-form-item>

					<el-form-item label="性别" prop="gender">
						<el-radio-group v-model="editForm.gender">
							<el-radio :label="'male'" :checked="editForm.gender === 'male'">男</el-radio>
							<el-radio :label="'female'" :checked="editForm.gender === 'female'">女</el-radio>
						</el-radio-group>
					</el-form-item>

					<el-form-item label="出生日期" prop="birthDate">
						<el-date-picker 
							v-model="editForm.birthDate" 
							type="date" 
							placeholder="选择日期"
							value-format="yyyy-MM-dd"
							style="width: 100%">
						</el-date-picker>
					</el-form-item>
				</div>

				<!-- 第二步：联系信息 -->
				<div v-show="activeStep === 1">
					<div class="form-section-title">
						<i class="el-icon-phone"></i> 联系信息
					</div>

					<el-form-item label="手机号码" prop="phone">
						<el-input v-model="editForm.phone" placeholder="请输入手机号码">
						</el-input>
					</el-form-item>

					<el-form-item label="身份证号" prop="identity">
						<el-input v-model="editForm.identity" placeholder="请输入身份证号码"></el-input>
					</el-form-item>

					<el-form-item label="地址" prop="address">
						<el-input v-model="editForm.address" type="textarea" :rows="3" placeholder="请输入详细地址"></el-input>
					</el-form-item>
				</div>

				<!-- 第三步：组织信息 -->
				<div v-show="activeStep === 2">
					<div class="form-section-title">
						<i class="el-icon-office-building"></i> 组织信息
					</div>

					<el-form-item label="部门" prop="departmentId">
						<el-select v-model="editForm.departmentId" placeholder="请选择部门" style="width: 100%">
							<el-option 
								v-for="dept in departments" 
								:key="dept.id" 
								:label="dept.name" 
								:value="dept.id">
							</el-option>
						</el-select>
					</el-form-item>

					<el-form-item label="角色" prop="roleId">
						<el-select v-model="editForm.roleId" placeholder="请选择角色" style="width: 100%">
							<el-option 
								v-for="role in roles" 
								:key="role.id" 
								:label="role.role_name" 
								:value="role.id">
							</el-option>
						</el-select>
					</el-form-item>

					<el-form-item label="备注" prop="remark">
						<el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="其他补充信息"></el-input>
					</el-form-item>
				</div>
			</el-form>

			<div slot="footer" class="dialog-footer">
				<div v-if="activeStep === 0">
					<el-button @click="handleClose">取消</el-button>
					<el-button type="primary" @click="nextStep">下一步</el-button>
				</div>
				<div v-else-if="activeStep === 1">
					<el-button @click="prevStep">上一步</el-button>
					<el-button type="primary" @click="nextStep">下一步</el-button>
				</div>
				<div v-else>
					<el-button @click="prevStep">上一步</el-button>
					<el-button type="primary" @click="submitForm('editForm')">提交</el-button>
				</div>
			</div>
		</el-dialog>

		<!-- 用户详情抽屉 -->
		<el-drawer
			title="用户详情"
			:visible.sync="drawer"
			:direction="direction"
			:before-close="handleDrawerClose"
			size="50%"
			custom-class="user-detail-drawer"
		>
			<div v-loading="detailLoading" class="user-detail-container">
				<div v-if="selectedUser" class="user-detail-content">
					<!-- 用户基本信息卡片 -->
					<el-card class="detail-card" shadow="hover">
						<div slot="header" class="card-header">
							<span><i class="el-icon-user"></i> 基本信息</span>
							<div class="header-actions">
								<el-button type="primary" size="mini" icon="el-icon-edit" @click="editFromDetail(selectedUser.id)">编辑信息</el-button>
								<el-button type="success" size="mini" icon="el-icon-printer" @click="printUserDetail">打印信息</el-button>
							</div>
						</div>
						<div class="user-avatar-area">
							<div class="avatar-container">
								<img :src="getUserAvatar(selectedUser)" alt="用户头像" class="user-avatar">
							</div>
							<div class="user-info-summary">
								<h2>{{selectedUser.realname || '未设置姓名'}}</h2>
								<p><el-tag size="small" type="primary">{{getRoleName(selectedUser.roleId || selectedUser.role_id)}}</el-tag></p>
								<p><el-tag size="small" type="info">{{getDepartmentName(selectedUser.departmentId || selectedUser.department_id)}}</el-tag></p>
							</div>
						</div>

						<el-divider content-position="left">账号信息</el-divider>
						<div class="info-item-group">
							<div class="info-item">
								<span class="info-label">账号名称</span>
								<span class="info-value">{{selectedUser.username || '未设置'}}</span>
							</div>
							<div class="info-item">
								<span class="info-label">真实姓名</span>
								<span class="info-value">{{selectedUser.realname || '未设置'}}</span>
							</div>
							<div class="info-item">
								<span class="info-label">性别</span>
								<span class="info-value">{{formatGender(selectedUser.gender)}}</span>
							</div>
							<div class="info-item">
								<span class="info-label">出生日期</span>
								<span class="info-value">{{selectedUser.birth_date || selectedUser.birthDate || '未设置'}}</span>
							</div>
							<div class="info-item">
								<span class="info-label">年龄</span>
								<span class="info-value">{{calculateAge(selectedUser.birth_date || selectedUser.birthDate) || '未知'}}</span>
							</div>
						</div>

						<el-divider content-position="left">联系信息</el-divider>
						<div class="info-item-group">
							<div class="info-item">
								<span class="info-label">联系电话</span>
								<span class="info-value contact-value">
									{{selectedUser.phone || '未设置'}}
									<el-button v-if="selectedUser.phone" type="text" icon="el-icon-document-copy" @click="copyContactNumber(selectedUser.phone)"></el-button>
								</span>
							</div>
							<div class="info-item">
								<span class="info-label">身份证号</span>
								<span class="info-value contact-value">
									{{selectedUser.identity || selectedUser.idCard || '未设置'}}
									<el-button v-if="selectedUser.identity || selectedUser.idCard" type="text" icon="el-icon-document-copy" @click="copyContactNumber(selectedUser.identity || selectedUser.idCard)"></el-button>
								</span>
							</div>
							<div class="info-item full-width">
								<span class="info-label">地址</span>
								<span class="info-value">{{selectedUser.address || '未设置'}}</span>
							</div>
							<div class="info-item" v-if="selectedUser.email">
								<span class="info-label">邮箱</span>
								<span class="info-value contact-value">
									{{selectedUser.email}}
									<el-button v-if="selectedUser.email" type="text" icon="el-icon-document-copy" @click="copyContactNumber(selectedUser.email)"></el-button>
								</span>
							</div>
						</div>
					</el-card>

					<!-- 时间信息卡片 -->
					<el-card class="detail-card" shadow="hover">
						<div slot="header" class="card-header">
							<span><i class="el-icon-time"></i> 时间信息</span>
						</div>
						<el-timeline>
							<el-timeline-item
								timestamp="创建时间"
								placement="top"
								icon="el-icon-circle-plus"
								color="#0bbd87">
								<el-card class="timeline-card">
									<h4>账号创建</h4>
									<p>{{selectedUser.createdAt || '未知时间'}}</p>
								</el-card>
							</el-timeline-item>
							<el-timeline-item
								timestamp="最后登录"
								placement="top"
								icon="el-icon-time"
								color="#409EFF">
								<el-card class="timeline-card">
									<h4>最后登录时间</h4>
									<p>{{formatDateTime(selectedUser.last_login_at) || '从未登录'}}</p>
								</el-card>
							</el-timeline-item>
							<el-timeline-item
								timestamp="最后更新"
								placement="top"
								icon="el-icon-edit"
								color="#E6A23C">
								<el-card class="timeline-card">
									<h4>信息更新时间</h4>
									<p>{{selectedUser.updatedAt || '未更新过'}}</p>
								</el-card>
							</el-timeline-item>
						</el-timeline>
					</el-card>
				</div>
				<div v-else class="no-data-tip">
					<i class="el-icon-warning-outline"></i>
					<p>暂无用户详情数据</p>
				</div>
			</div>
		</el-drawer>

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
				searchForm: {
					username: '',
					departmentId: ''
				},
				delBtlStatu: true,
				tableLoading: false,
				detailLoading: false,
				formChanged: false,
				originalFormData: {},

				// 分步表单相关
				activeStep: 0,
				isFullscreen: false,
				selectedUser: null,

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
					departmentId: '',
					phone: '',
					idCard: '',
					remark: ''
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
			// 重置搜索表单
			resetSearchForm() {
				this.searchForm = {
					username: '',
					departmentId: ''
				}
				this.getUserList()
			},

			// 批量删除用户
			batchDelete() {
				if (this.multipleSelection.length === 0) {
					this.$message.warning('请至少选择一条记录')
					return
				}

				this.$confirm(`确定要删除选中的 ${this.multipleSelection.length} 条记录吗？`, '提示', {
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'warning'
				}).then(() => {
					this.delHandle()
				}).catch(() => {
					this.$message.info('已取消删除操作')
				})
			},

			// 全屏切换
			toggleFullscreen() {
				this.isFullscreen = !this.isFullscreen
			},

			// 下一步
			nextStep() {
				// 定义每个步骤需要验证的字段
				const stepFields = [
					// 如果是编辑用户（有ID），则不验证密码字段
					this.editForm.id ? 
						['username', 'realname', 'gender', 'birthDate'] : // 编辑用户时的第一步字段
						['username', 'password', 'realname', 'gender', 'birthDate'], // 新增用户时的第一步字段
					['phone', 'identity', 'address'], // 第二步字段（注意这里使用identity而不是idCard）
					['departmentId', 'roleId'] // 第三步字段
				]
				
				// 使用Promise来处理表单验证
				const validateCurrentStep = () => {
					return new Promise((resolve, reject) => {
						// 获取当前步骤的字段
						const currentFields = stepFields[this.activeStep];
						
						// 创建一个包含当前步骤字段的规则对象
						const stepRules = {};
						currentFields.forEach(field => {
							if (this.editFormRules[field]) {
								stepRules[field] = this.editFormRules[field];
							}
						});
						
						// 验证当前步骤的字段
						let isValid = true;
						let errorCount = 0;
						
						// 逐个验证字段
						const validatePromises = currentFields.map(field => {
							return new Promise(fieldResolve => {
								// 只验证有规则的字段
								if (!this.editFormRules[field]) {
									fieldResolve(true);
									return;
								}
								
								this.$refs.editForm.validateField(field, errorMsg => {
									if (errorMsg) {
										isValid = false;
										errorCount++;
									}
									fieldResolve(true);
								});
							});
						});
						
						// 等待所有字段验证完成
						Promise.all(validatePromises).then(() => {
							if (isValid) {
								resolve();
							} else {
								reject(`请先完成当前步骤的必填项，还有 ${errorCount} 个字段未通过验证`);
							}
						});
					});
				};
				
				// 执行验证并处理结果
				validateCurrentStep()
					.then(() => {
						// 验证通过，进入下一步
						if (this.activeStep < 2) {
							this.activeStep++;
						}
					})
					.catch(errorMsg => {
						// 验证失败，显示错误提示
						this.$message.warning(errorMsg);
					});
			},

			// 上一步
			prevStep() {
				if (this.activeStep > 0) {
					this.activeStep--
				}
			},

			// 从详情页编辑
			editFromDetail(id) {
				this.drawer = false
				this.$nextTick(() => {
					this.editHandle(id)
				})
			},

			// 打印用户详情
			printUserDetail() {
				const printWindow = window.open('', '_blank')
				const userInfo = this.selectedUser
				const html = `
					<!DOCTYPE html>
					<html>
					<head>
						<title>用户信息 - ${userInfo.realname || userInfo.username}</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; }
							.container { max-width: 800px; margin: 0 auto; padding: 20px; }
							.header { text-align: center; margin-bottom: 30px; }
							.section { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
							.section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
							.info-row { display: flex; margin-bottom: 8px; }
							.info-label { font-weight: bold; width: 150px; }
							.info-value { flex: 1; }
							@media print { body { font-size: 12px; } }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>用户信息</h1>
								<p>打印时间: ${new Date().toLocaleString()}</p>
							</div>
							
							<div class="section">
								<div class="section-title">基本信息</div>
								<div class="info-row">
									<div class="info-label">用户名:</div>
									<div class="info-value">${userInfo.username || '未设置'}</div>
								</div>
								<div class="info-row">
									<div class="info-label">真实姓名:</div>
									<div class="info-value">${userInfo.realname || '未设置'}</div>
								</div>
								<div class="info-row">
									<div class="info-label">性别:</div>
									<div class="info-value">${this.formatGender(userInfo.gender)}</div>
								</div>
								<div class="info-row">
									<div class="info-label">出生日期:</div>
									<div class="info-value">${userInfo.birth_date || '未设置'}</div>
								</div>
								<div class="info-row">
									<div class="info-label">年龄:</div>
									<div class="info-value">${this.calculateAge(userInfo.birth_date) || '未知'}</div>
								</div>
							</div>
							
							<div class="section">
								<div class="section-title">联系信息</div>
								<div class="info-row">
									<div class="info-label">联系电话:</div>
									<div class="info-value">${userInfo.phone || '未设置'}</div>
								</div>
								<div class="info-row">
									<div class="info-label">身份证号:</div>
									<div class="info-value">${userInfo.idCard || '未设置'}</div>
								</div>
								<div class="info-row">
									<div class="info-label">地址:</div>
									<div class="info-value">${userInfo.address || '未设置'}</div>
								</div>
							</div>
							
							<div class="section">
								<div class="section-title">组织信息</div>
								<div class="info-row">
									<div class="info-label">部门:</div>
									<div class="info-value">${this.getDepartmentName(userInfo.departmentId)}</div>
								</div>
								<div class="info-row">
									<div class="info-label">角色:</div>
									<div class="info-value">${this.getRoleName(userInfo.roleId)}</div>
								</div>
							</div>
							
							<div class="section">
								<div class="section-title">时间信息</div>
								<div class="info-row">
									<div class="info-label">创建时间:</div>
									<div class="info-value">${userInfo.createdAt || '未知'}</div>
								</div>
								<div class="info-row">
									<div class="info-label">最后登录:</div>
									<div class="info-value">${userInfo.lastLogin || '从未登录'}</div>
								</div>
								<div class="info-row">
									<div class="info-label">最后更新:</div>
									<div class="info-value">${userInfo.updatedAt || '未更新过'}</div>
								</div>
							</div>
						</div>
					</body>
				</html>
				`
				printWindow.document.write(html)
				printWindow.document.close()
				
				// 添加打印功能
				setTimeout(() => {
					printWindow.print()
				}, 500)
			},

			// 复制联系电话
			copyContactNumber(phone) {
				if (!phone) return
				
				const textArea = document.createElement('textarea')
				textArea.value = phone
				document.body.appendChild(textArea)
				textArea.select()
				
				try {
					document.execCommand('copy')
					this.$message.success('电话号码已复制到剪贴板')
				} catch (err) {
					this.$message.error('复制失败，请手动复制')
				} finally {
					document.body.removeChild(textArea)
				}
			},

			// 获取角色名称
			getRoleName(roleId) {
				if (!roleId || !this.roles) return '未分配角色'
				const role = this.roles.find(r => r.id === roleId)
				return role ? role.role_name : '未分配角色'
			},

			// 获取部门名称
			getDepartmentName(deptId) {
				if (!deptId || !this.departments) return '未分配部门'
				const dept = this.departments.find(d => d.id === deptId)
				return dept ? dept.name : '未分配部门'
			},

			// 格式化性别显示
			formatGender(gender) {
				switch(gender) {
					case 'male': return '男'
					case 'female': return '女'
					default: return '未设置'
				}
			},

			// 获取用户头像
			getUserAvatar(user) {
				// 如果用户有头像，返回头像URL
				if (user && user.avatar) {
					return user.avatar
				}
				
				// 否则根据性别返回默认头像
				if (user && user.gender === 'female') {
					return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
				} else {
					return 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png'
				}
			},

			// 处理关闭弹窗前的确认
			handleDialogBeforeClose(done) {
				if (this.formChanged) {
					this.$confirm('有未保存的更改，确定要关闭吗？', '提示', {
						confirmButtonText: '确定',
						cancelButtonText: '取消',
						type: 'warning'
					}).then(() => {
						done()
					}).catch(() => {})
				} else {
					done()
				}
			},

			async handleRegister() {
			try {
				// 确保角色和部门数据已加载
				if (!this.roles || this.roles.length === 0) {
					await this.getRoles()
				}
				if (!this.departments || this.departments.length === 0) {
					await this.getDepartments()
				}

				// 重置表单状态
				this.activeStep = 0
				this.formChanged = false
				this.$refs['editForm']?.resetFields()

				// 清空表单并设置默认密码
				this.editForm = {
					id: '',
					username: '',
					password: '123456',  // 设置默认密码
					realname: '',
					gender: '',
					birthDate: '',
					address: '',
					roleId: '',
					departmentId: '',
					phone: '',
					idCard: '',
					remark: ''
				}

				// 保存原始数据用于变更检测
				this.originalFormData = JSON.parse(JSON.stringify(this.editForm))
				
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
					this.tableLoading = true
					
					// 构建查询参数
					const params = {
						current: this.current,
						size: this.size,
						username: this.searchForm.username
					}
					
					// 如果选择了部门，添加部门筛选条件
					if (this.searchForm.departmentId) {
						params.departmentId = this.searchForm.departmentId
					}
					
					const res = await GetUserList(params)
					console.log("userList", res)
					
					// 处理返回数据
					this.tableData = res.records
					this.size = res.size
					this.current = res.current
					this.total = res.total
				} catch (error) {
					console.error('获取用户列表失败:', error)
					this.$message.error('获取用户列表失败')
				} finally {
					this.tableLoading = false
				}
			},
			async checkHandle(id){
				try {
					this.detailLoading = true
					console.log('获取用户ID:', id)
					
					// 直接从当前表格数据中查找用户
					const userFromTable = this.tableData.find(user => user.id === id)
					
					if (userFromTable) {
						console.log('从表格数据中找到用户:', userFromTable)
						
						// 创建一个新对象以避免引用问题
						const userData = JSON.parse(JSON.stringify(userFromTable))
						
						// 格式化日期
						if (userData.birth_date) {
							try {
								userData.birth_date = this.formatDate(userData.birth_date)
							} catch (e) {
								console.warn('日期格式化失败:', e)
							}
						}
						
						// 格式化创建时间
						if (userData.createdAt) {
							try {
								userData.createdAt = this.formatDateTime(userData.createdAt)
							} catch (e) {
								console.warn('创建时间格式化失败:', e)
							}
						}
						
						// 格式化更新时间
						if (userData.updatedAt) {
							try {
								userData.updatedAt = this.formatDateTime(userData.updatedAt)
							} catch (e) {
								console.warn('更新时间格式化失败:', e)
							}
						}
						
						// 保存处理后的用户数据
						this.selectedUser = userData
						console.log('设置selectedUser:', this.selectedUser)
						
						// 确保角色和部门数据已加载
						if (!this.roles || this.roles.length === 0) {
							await this.getRoles()
						}
						if (!this.departments || this.departments.length === 0) {
							await this.getDepartments()
						}
						
						// 打开抽屉
						this.drawer = true
					} else {
						// 如果表格中没有找到，尝试从API获取
						console.log('表格中未找到用户，尝试从API获取')
						const res = await this.$axios.get('/sys/user/info/' + id)
						
						// 确保数据存在
						if (res.data && (res.data.data || res.data.records)) {
							// 处理日期格式
							const userData = res.data.data || (res.data.records && res.data.records[0])
							
							if (userData) {
								// 格式化日期
								if (userData.birth_date) {
									try {
										userData.birth_date = this.formatDate(userData.birth_date)
									} catch (e) {
										console.warn('日期格式化失败:', e)
									}
								}
								
								// 格式化创建时间
								if (userData.createdAt) {
									try {
										userData.createdAt = this.formatDateTime(userData.createdAt)
									} catch (e) {
										console.warn('创建时间格式化失败:', e)
									}
								}
								
								// 格式化更新时间
								if (userData.updatedAt) {
									try {
										userData.updatedAt = this.formatDateTime(userData.updatedAt)
									} catch (e) {
										console.warn('更新时间格式化失败:', e)
									}
								}
								
								// 保存处理后的用户数据
								this.selectedUser = userData
								console.log('从API设置selectedUser:', this.selectedUser)
								
								// 打开抽屉
								this.drawer = true
							} else {
								this.$message.warning('获取用户详情数据为空')
							}
						} else {
							this.$message.warning('获取用户详情数据为空')
						}
					}
				} catch (error) {
					console.error('获取用户详情失败:', error)
					this.$message.error('获取用户详情失败: ' + (error.message || ''))
				} finally {
					this.detailLoading = false
				}
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
				this.dialogVisible = false;
				this.activeStep = 0; // 重置步骤到第一步
				this.editForm = {
					id: '',
					username: '',
					password: '',
					realname: '',
					gender: '',
					birthDate: '',
					address: '',
					roleId: '',
					departmentId: '',
					phone: '',
					identity: '', // 使用identity字段名，与表单一致
					remark: ''
				};
				// 重置原始数据
				this.originalFormData = JSON.parse(JSON.stringify(this.editForm));
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
							// 转换字段名称，确保与后端API一致
							// 创建基本数据对象
							const formData = {
								id: this.editForm.id,
								username: this.editForm.username,
								realname: this.editForm.realname,
								gender: this.editForm.gender,
								birth_date: this.editForm.birthDate, // 转换字段名
								address: this.editForm.address,
								role_id: this.editForm.roleId, // 转换字段名
								department_id: this.editForm.departmentId, // 转换字段名
								phone: this.editForm.phone,
								idCard: this.editForm.identity, // 转换字段名
								remark: this.editForm.remark
							};
							
							// 只在新增用户时添加密码字段
							if (!this.editForm.id && this.editForm.password) {
								formData.password = this.editForm.password;
							}

							console.log('提交的表单数据:', formData);
							let response;
							if (this.editForm.id) {
								// 更新用户
								response = await this.$axios.post('/sys/user/update', formData);
							} else {
								// 新增用户
								console.log('新增用户数据:', formData);
								response = await this.UserRegiste(formData);
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

			editHandle(userData) {
				console.log("当前行用户数据:", userData);
				// 重置步骤到第一步
				this.activeStep = 0;
				
				// 直接使用当前行的用户数据
				// 处理字段名称差异
				this.editForm = {
					id: userData.id,
					username: userData.username,
					password: '', // 不回显密码
					realname: userData.realname,
					gender: userData.gender,
					birthDate: userData.birth_date || userData.birthDate, // 兼容不同的字段名
					address: userData.address,
					roleId: userData.role_id || userData.roleId, // 兼容不同的字段名
					departmentId: userData.department_id || userData.departmentId, // 兼容不同的字段名
					phone: userData.phone,
					identity: userData.identity || userData.idCard, // 兼容不同的字段名
					remark: userData.remark
				};
				
				// 保存原始数据用于变更检测
				this.originalFormData = JSON.parse(JSON.stringify(this.editForm));
				
				// 打开对话框
				this.dialogVisible = true;
				console.log('编辑用户数据:', this.editForm);
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
					this.roles = res.data.items
				} catch (error) {
					console.error('获取角色列表失败:', error)
					this.$message.error('获取角色列表失败')
				}
			},
			async getDepartments() {
				try {
					const res = await GetDepartmentList()
					this.departments = res.data
				} catch (error) {
					console.error('获取部门列表失败:', error)
					this.$message.error('获取部门列表失败')
				}
			},
			// 格式化日期显示
			formatDate(dateString) {
				if (!dateString) return '-';
				const date = new Date(dateString);
				if (isNaN(date.getTime())) return '-';
				
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				
				return `${year}-${month}-${day} ${hours}:${minutes}`;
			},
			
			// 计算年龄
			calculateAge(birthDate) {
				if (!birthDate) return null
				
				try {
					const today = new Date()
					const birthDateObj = new Date(birthDate)
					let age = today.getFullYear() - birthDateObj.getFullYear()
					const monthDiff = today.getMonth() - birthDateObj.getMonth()
					
					if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
						age--
					}
					
					return age
				} catch (error) {
					console.error('计算年龄失败:', error)
					return null
				}
			},
			
			// 格式化日期（仅年月日）
			formatDate(dateString) {
				if (!dateString) return ''
				
				try {
					const date = new Date(dateString)
					if (isNaN(date.getTime())) return dateString
					
					const year = date.getFullYear()
					const month = String(date.getMonth() + 1).padStart(2, '0')
					const day = String(date.getDate()).padStart(2, '0')
					
					return `${year}-${month}-${day}`
				} catch (error) {
					console.error('日期格式化失败:', error)
					return dateString
				}
			},
			
			// 格式化日期时间
			formatDateTime(dateTimeString) {
				if (!dateTimeString) return ''
				
				try {
					const date = new Date(dateTimeString)
					if (isNaN(date.getTime())) return dateTimeString
					
					const year = date.getFullYear()
					const month = String(date.getMonth() + 1).padStart(2, '0')
					const day = String(date.getDate()).padStart(2, '0')
					const hours = String(date.getHours()).padStart(2, '0')
					const minutes = String(date.getMinutes()).padStart(2, '0')
					const seconds = String(date.getSeconds()).padStart(2, '0')
					
					return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
				} catch (error) {
					console.error('日期时间格式化失败:', error)
					return dateTimeString
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
.user-container {
  padding: 15px;
  height: 100%;
  box-sizing: border-box;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .header-title {
      font-size: 18px;
      font-weight: bold;
      display: flex;
      align-items: center;

      i {
        margin-right: 8px;
        font-size: 20px;
        color: #409EFF;
      }
    }
  }

  .main-card {
    height: calc(100% - 50px);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .search-area {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      flex-wrap: wrap;

      .search-form {
        display: flex;
        flex-wrap: wrap;
      }

      .action-buttons {
        display: flex;
        gap: 10px;
      }
    }

    .el-table {
      flex: 1;
      overflow: auto;
    }

    .pagination-container {
      margin-top: 15px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

// 用户详情抽屉样式
.user-detail-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 15px 20px;
    border-bottom: 1px solid #e6e6e6;
    font-size: 18px;
    font-weight: bold;
  }

  .user-detail-container {
    padding: 20px;
    height: 100%;
    overflow-y: auto;

    .user-detail-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .detail-card {
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        span {
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;

          i {
            margin-right: 8px;
            font-size: 18px;
          }
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }
      }

      .user-avatar-area {
        display: flex;
        align-items: center;
        padding: 20px 0;
        border-bottom: 1px dashed #eee;
        margin-bottom: 15px;

        .avatar-container {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          margin-right: 20px;
          border: 1px solid #eee;

          .user-avatar {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .user-info-summary {
          h2 {
            margin: 0 0 10px 0;
            font-size: 18px;
          }

          p {
            margin: 5px 0;
          }
        }
      }

      .info-item-group {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 15px;

        .info-item {
          width: 50%;
          margin-bottom: 10px;
          display: flex;

          &.full-width {
            width: 100%;
          }

          .info-label {
            width: 100px;
            color: #606266;
            font-weight: bold;
          }

          .info-value {
            flex: 1;
            word-break: break-all;

            &.contact-value {
              display: flex;
              align-items: center;
              gap: 5px;
            }
          }
        }
      }

      .timeline-card {
        h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
        }

        p {
          margin: 0;
          color: #606266;
        }
      }
    }

    .no-data-tip {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #909399;

      i {
        font-size: 48px;
        margin-bottom: 15px;
      }
    }
  }
}

// 用户编辑弹窗样式
.user-edit-dialog {
  .dialog-header-actions {
    position: absolute;
    top: 20px;
    right: 55px;
    z-index: 10;
  }

  .form-section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
    color: #303133;
    display: flex;
    align-items: center;

    i {
      margin-right: 8px;
      color: #409EFF;
    }
  }

  .step-form {
    padding: 0 20px;
  }
}
</style>