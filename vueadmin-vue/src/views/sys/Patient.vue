<template>
	<div style="padding: 5px;">
		<el-card class="search-card">
			<div slot="header">
				<span>患者信息查询</span>
			</div>
			<el-form :inline="true" style="text-align: left;">
				<el-form-item label="就诊卡号">
					<el-input
						v-model="searchForm.medicalId"
						placeholder="请输入就诊卡号"
						clearable
					>
					</el-input>
				</el-form-item>

				<el-form-item label="患者姓名">
					<el-input
						v-model="searchForm.name"
						placeholder="请输入患者姓名"
						clearable
					>
					</el-input>
				</el-form-item>

				<el-form-item>
					<el-button type="primary" @click="searchPatients">搜索</el-button>
					<el-button @click="resetSearch">重置</el-button>
				</el-form-item>

				<el-form-item>
					<el-button type="success" @click="dialogVisible = true" v-if="hasAuth('sys:user:save')">新增患者</el-button>
				</el-form-item>
				<el-form-item>
					<el-popconfirm title="确定要批量删除选中的患者吗？" @confirm="delHandle(null)">
						<el-button type="danger" slot="reference" :disabled="delBtlStatu" v-if="hasAuth('sys:user:delete')">批量删除</el-button>
					</el-popconfirm>
				</el-form-item>
			</el-form>
		</el-card>

		<!-- 单个患者信息平铺展示 -->
		<div v-if="searchResults.length === 1" class="single-patient-info">
			<el-card class="single-patient-card">
				<div slot="header" class="single-patient-header">
					<div class="header-title">
						<i class="el-icon-user"></i>
						<span>患者信息</span>
					</div>
					<div class="patient-card-actions">
						<el-button size="small" type="primary" @click="checkHandle(searchResults[0].id)">查看病历</el-button>
						<el-button size="small" type="success" @click="editHandle(searchResults[0].id)">编辑信息</el-button>
					</div>
				</div>
				
				<el-row :gutter="20" class="patient-detail-row">
					<el-col :span="24">
						<div class="patient-name">
							<h2>{{searchResults[0].name}}</h2>
							<el-tag type="success" v-if="searchResults[0].gender === '男'">男</el-tag>
							<el-tag type="danger" v-else-if="searchResults[0].gender === '女'">女</el-tag>
							<el-tag v-else>其他</el-tag>
						</div>
					</el-col>
				</el-row>
				
				<el-row :gutter="20" class="patient-detail-row">
					<el-col :span="8">
						<div class="detail-item">
							<div class="detail-label">就诊卡号</div>
							<div class="detail-value">{{searchResults[0].medicalId}}</div>
						</div>
					</el-col>
					<el-col :span="8">
						<div class="detail-item">
							<div class="detail-label">年龄</div>
							<div class="detail-value">{{getAgeByBirthday(searchResults[0].birthday)}}岁</div>
						</div>
					</el-col>
					<el-col :span="8">
						<div class="detail-item">
							<div class="detail-label">出生日期</div>
							<div class="detail-value">{{searchResults[0].birthday}}</div>
						</div>
					</el-col>
				</el-row>
				
				<el-row :gutter="20" class="patient-detail-row">
					<el-col :span="8">
						<div class="detail-item">
							<div class="detail-label">联系电话</div>
							<div class="detail-value">{{searchResults[0].phone}}</div>
						</div>
					</el-col>
					<el-col :span="16">
						<div class="detail-item">
							<div class="detail-label">身份证号</div>
							<div class="detail-value">{{searchResults[0].idCard}}</div>
						</div>
					</el-col>
				</el-row>
				
				<el-row :gutter="20" class="patient-detail-row" v-if="searchResults[0].createdAt">
					<el-col :span="24">
						<div class="detail-item">
							<div class="detail-label">创建时间</div>
							<div class="detail-value">{{searchResults[0].createdAt}}</div>
						</div>
					</el-col>
				</el-row>
			</el-card>
		</div>
		
		<!-- 多个患者信息卡片展示 -->
		<div v-if="searchResults.length > 1" class="patient-cards">
			<el-row :gutter="20">
				<el-col :span="8" v-for="(patient, index) in searchResults" :key="index">
					<el-card class="patient-card" shadow="hover">
						<div slot="header" class="patient-card-header">
							<span><i class="el-icon-user"></i> {{patient.name}}</span>
							<div class="patient-card-actions">
								<el-button type="text" @click="checkHandle(patient.id)">查看</el-button>
								<el-button type="text" @click="editHandle(patient.id)">编辑</el-button>
							</div>
						</div>
						<div class="patient-info">
							<p><span class="info-label">就诊卡号：</span>{{patient.medicalId}}</p>
							<p><span class="info-label">性别：</span>{{patient.gender}}</p>
							<p><span class="info-label">年龄：</span>{{patient.age}}岁</p>
							<p><span class="info-label">联系电话：</span>{{patient.phone}}</p>
							<p><span class="info-label">身份证号：</span>{{patient.idCard}}</p>
						</div>
					</el-card>
				</el-col>
			</el-row>
		</div>

		<!-- 无搜索结果提示 -->
		<el-empty v-if="hasSearched && searchResults.length === 0" description="未找到符合条件的患者信息"></el-empty>

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



		<el-drawer
		    size="70%"
			:title="currentPatientName ? currentPatientName + ' 的病历记录' : '患者病历记录'"
			:visible.sync="drawer"
			:direction="direction"
			:before-close="handleDrawerClose"
			custom-class="medical-record-drawer">

			<!-- 患者基本信息卡片 -->
			<el-card class="patient-summary-card" v-if="currentPatient">
				<div class="patient-summary-header">
					<div class="patient-avatar">
						<i class="el-icon-user-solid"></i>
					</div>
					<div class="patient-basic-info">
						<h2>{{currentPatient.name}} 
							<el-tag size="small" type="success" v-if="currentPatient.gender === '男'">男</el-tag>
							<el-tag size="small" type="danger" v-else-if="currentPatient.gender === '女'">女</el-tag>
							<el-tag size="small" v-else>其他</el-tag>
						</h2>
						<div class="patient-meta">
							<span><i class="el-icon-document"></i> 就诊卡号: {{currentPatient.medicalId}}</span>
							<span><i class="el-icon-date"></i> 年龄: {{getAgeByBirthday(currentPatient.birthday)}}岁</span>
							<span><i class="el-icon-phone"></i> 电话: {{currentPatient.phone}}</span>
						</div>
					</div>
					<div class="patient-actions">
						<el-button type="primary" size="small" @click="startAiAnalysis" :loading="loading" icon="el-icon-data-analysis">
							AI 分析
						</el-button>
						<el-button type="success" size="small" icon="el-icon-plus">
							新增病历
						</el-button>
					</div>
				</div>
			</el-card>

			<!-- 病历记录标签页 -->
			<el-tabs type="border-card" class="medical-record-tabs">
				<el-tab-pane label="病历记录">
					<div class="record-header">
						<h3><i class="el-icon-document-copy"></i> 病历记录</h3>
						<div class="record-filters">
							<el-radio-group v-model="recordViewType" size="small">
								<el-radio-button label="table">表格视图</el-radio-button>
								<el-radio-button label="timeline">时间线视图</el-radio-button>
							</el-radio-group>
						</div>
					</div>

					<!-- 表格视图 -->
					<div v-if="recordViewType === 'table'" class="table-view">
						<el-table 
							:data="recordData" 
							style="width: 100%"
							row-key="recordId"
							:row-class-name="tableRowClassName"
							:expand-row-keys="expandedRows"
							@expand-change="handleExpandChange"
							:header-cell-style="{backgroundColor: '#f5f7fa', color: '#606266'}"
							:cell-style="{padding: '8px 0'}">
							
							<el-table-column type="expand">
								<template slot-scope="props">
									<div class="expanded-record">
										<el-row :gutter="20">
											<el-col :span="24">
												<div class="detail-section">
													<h4><i class="el-icon-document"></i> 症状描述</h4>
													<p>{{props.row.symptoms}}</p>
												</div>
											</el-col>
										</el-row>
										<el-row :gutter="20">
											<el-col :span="12">
												<div class="detail-section">
													<h4><i class="el-icon-first-aid-kit"></i> 诊断结果</h4>
													<p>{{props.row.diagnosticResults}}</p>
												</div>
											</el-col>
											<el-col :span="12">
												<div class="detail-section">
													<h4><i class="el-icon-medicine-box"></i> 治疗措施</h4>
													<p>{{props.row.treatment}}</p>
												</div>
											</el-col>
										</el-row>
										<el-row v-if="props.row.prescription || props.row.notes">
											<el-col :span="props.row.prescription && props.row.notes ? 12 : 24" v-if="props.row.prescription">
												<div class="detail-section">
													<h4><i class="el-icon-shopping-cart-full"></i> 处方药品</h4>
													<p>{{props.row.prescription}}</p>
												</div>
											</el-col>
											<el-col :span="props.row.prescription && props.row.notes ? 12 : 24" v-if="props.row.notes">
												<div class="detail-section">
													<h4><i class="el-icon-notebook-2"></i> 备注</h4>
													<p>{{props.row.notes}}</p>
												</div>
											</el-col>
										</el-row>
									</div>
								</template>
							</el-table-column>
							
							<el-table-column
								prop="date"
								label="就诊日期"
								width="120">
								<template slot-scope="scope">
									<span class="date-cell">
										<i class="el-icon-date"></i> {{scope.row.date}}
									</span>
								</template>
							</el-table-column>
							
							<el-table-column
								prop="attendingDoctor"
								label="主治医生"
								width="120">
								<template slot-scope="scope">
									<el-tag size="medium" type="info">
										<i class="el-icon-user"></i> {{scope.row.attendingDoctor}}
									</el-tag>
								</template>
							</el-table-column>
							
							<el-table-column
								prop="symptoms"
								label="症状"
								min-width="180">
								<template slot-scope="scope">
									<div class="symptoms-cell">
										{{scope.row.symptoms | truncate(50)}}
									</div>
								</template>
							</el-table-column>
							
							<el-table-column
								prop="diagnosticResults"
								label="诊断结果"
								min-width="180">
								<template slot-scope="scope">
									<div class="diagnosis-cell">
										{{scope.row.diagnosticResults | truncate(50)}}
									</div>
								</template>
							</el-table-column>
							
							<el-table-column
								prop="treatment"
								label="治疗措施"
								min-width="200">
								<template slot-scope="scope">
									<div class="treatment-cell">
										{{scope.row.treatment | truncate(50)}}
									</div>
								</template>
							</el-table-column>
							
							<el-table-column label="操作" width="120" fixed="right">
								<template slot-scope="scope">
									<el-button type="text" size="small" @click="dialogTableVisible = true">
										<i class="el-icon-edit"></i> 编辑
									</el-button>
									<el-divider direction="vertical"></el-divider>
									<el-button type="text" size="small" class="delete-btn" @click="delHandle(scope.row.recordId)">
										<i class="el-icon-delete"></i> 删除
									</el-button>
								</template>
							</el-table-column>
						</el-table>
					</div>
					
					<!-- 时间线视图 -->
					<div v-else class="timeline-view">
						<el-timeline>
							<el-timeline-item
								v-for="(record, index) in recordData"
								:key="index"
								:timestamp="record.date"
								placement="top"
								:type="getTimelineItemType(record)">
								<el-card class="timeline-card">
									<div class="timeline-header">
										<h4>
											<span class="diagnosis-tag">
												{{record.diagnosticResults | truncate(30)}}
											</span>
										</h4>
										<div class="doctor-info">
											<i class="el-icon-user"></i> 主治医生: {{record.attendingDoctor}}
										</div>
									</div>
									<div class="timeline-content">
										<div class="content-section">
											<h5>症状</h5>
											<p>{{record.symptoms}}</p>
										</div>
										<div class="content-section">
											<h5>治疗措施</h5>
											<p>{{record.treatment}}</p>
										</div>
									</div>
									<div class="timeline-footer">
										<el-button type="text" size="small" @click="dialogTableVisible = true">
											<i class="el-icon-edit"></i> 编辑
										</el-button>
										<el-button type="text" size="small" class="delete-btn" @click="delHandle(record.recordId)">
											<i class="el-icon-delete"></i> 删除
										</el-button>
									</div>
								</el-card>
							</el-timeline-item>
						</el-timeline>
					</div>
				</el-tab-pane>
				
				<el-tab-pane label="AI 分析">
				<!-- AI分析结果展示 -->
				<div v-if="aiAnalysis">
					<el-card class="ai-analysis">
						<div slot="header">
							<span>AI 诊疗分析报告</span>
						</div>
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
				
				<!-- Loading提示 -->
				<div v-else-if="!aiAnalysis" class="analysis-loading">
					<div style="text-align: center; margin: 20px;">
						<el-button type="primary" @click="startAiAnalysis" :loading="loading">
							开始 AI 分析
						</el-button>
					</div>

					<div v-if="loading" class="analysis-progress">
						<el-card>
							<div slot="header">
								<span>分析进度</span>
							</div>
							
							<!-- 总体进度条 -->
							<el-progress 
								:percentage="analysisProgress" 
								:status="progressStatus"
								:format="progressFormat">
							</el-progress>

							<!-- 分析阶段 -->
							<div class="analysis-stages">
								<el-steps :active="currentStage" finish-status="success" simple>
									<el-step 
										v-for="(stage, index) in analysisStages" 
										:key="index"
										:title="stage.title"
										:description="stage.status">
									</el-step>
								</el-steps>
							</div>

							<!-- 当前状态 -->
							<div class="current-status" v-if="currentStageDetails">
								<el-alert
									:title="currentStageDetails"
									type="info"
									:closable="false"
									show-icon>
								</el-alert>
							</div>
						</el-card>
					</div>

					<el-skeleton v-if="loading" style="width: 100%; margin-top: 20px" :rows="6" animated />
				</div>
				</el-tab-pane>
			</el-tabs>
		</el-drawer>
	</div>
</template>

<script>
    import { GetPatientList, GetPatientRecord } from '@/api/index.js' 
	import { MedicalHistoryAnalysis } from '@/api/aiAgent.js' 
	export default {
		name: "patient",
		filters: {
			truncate(value, length = 30) {
				if (!value) return '';
				if (value.length <= length) return value;
				return value.substr(0, length) + '...';
			}
		},
		data() {
			return {
		
        dialogTableVisible: false,
				drawer: false,
        		direction: 'rtl',
				searchForm: {
					medicalId: '',
					name: ''
				},
				searchResults: [],
				hasSearched: false,
				recordViewType: 'table',
				expandedRows: [],
				currentPatient: null,
				currentPatientName: '',
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
				checkStrictly: true,

				loading: false,
				analysisProgress: 0,
				progressStatus: '',
				currentStage: 0,
				currentStageDetails: '',
				analysisStages: [
					{ title: '收集信息', status: '收集患者历史数据' },
					{ title: '分析症状', status: '分析症状特征和模式' },
					{ title: '匹配数据', status: '匹配疾病数据库' },
					{ title: '生成建议', status: '生成诊断建议' },
					{ title: '风险评估', status: '评估潜在风险' }
				],
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
					this.patientData = res.data.data.records
					console.log(res.data,"res")
				} catch (error) {
					console.log("Error fetching patient list", error)
					this.$message.error('获取患者列表失败')
				}
			},
			
			async searchPatients() {
				try {
					const params = {}
					if (this.searchForm.medicalId) {
						params.medicalId = this.searchForm.medicalId
					}
					if (this.searchForm.name) {
						params.name = this.searchForm.name
					}
					
					const res = await GetPatientList(params)
					this.searchResults = res.data.data.records
					this.hasSearched = true
					
					if (this.searchResults.length === 0) {
						this.$message.info('未找到符合条件的患者')
					}
				} catch (error) {
					console.error("搜索患者失败", error)
					this.$message.error('搜索患者失败')
				}
			},
			
			resetSearch() {
				this.searchForm = {
					medicalId: '',
					name: ''
				}
				this.searchResults = []
				this.hasSearched = false
			},
			checkHandle(id){
				// Find the patient in the data
				const patient = this.patientData.find(p => p.id === id) || 
							 this.searchResults.find(p => p.id === id);
				if (patient) {
					this.currentPatient = patient;
					this.currentPatientName = patient.name;
				}
				
				GetPatientRecord(id).then(res => {
					console.log(res,"this is record data")
					this.recordData = res.data
					this.drawer = true
					// Expand the first row by default if there are records
					if (this.recordData && this.recordData.length > 0) {
						this.expandedRows = [this.recordData[0].recordId];
					}
				})
			},
			
			// Table row class based on record type
			tableRowClassName({row}) {
				// You can add logic here to style rows differently based on record properties
				return '';
			},
			
			// Handle row expansion change
			handleExpandChange(row, expandedRows) {
				if (expandedRows.length > 0) {
					this.expandedRows = [row.recordId];
				} else {
					this.expandedRows = [];
				}
			},
			
			// Get timeline item type based on record
			getTimelineItemType(record) {
				// You can add logic here to determine the timeline item type
				// based on record properties (e.g., primary, success, warning, danger)
				return 'primary';
			},

            test(){
                console.log("permList",this.$store.state.menu.permList)
            },
            
            // Calculate age from birth date
            getAgeByBirthday(birthdate) {
                if (!birthdate) return '';
                
                // Parse the birthdate string to a Date object
                // The format may vary, so we handle different possibilities
                let birthDate;
                
                // Try different date formats
                if (birthdate.includes('-')) {
                    // Format: YYYY-MM-DD
                    const parts = birthdate.split('-');
                    if (parts.length === 3) {
                        birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    }
                } else if (birthdate.includes('/')) {
                    // Format: YYYY/MM/DD or DD/MM/YYYY
                    const parts = birthdate.split('/');
                    if (parts.length === 3) {
                        // Check if the first part is a 4-digit year
                        if (parts[0].length === 4) {
                            birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
                        } else {
                            birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    }
                } else {
                    // Try direct parsing
                    birthDate = new Date(birthdate);
                }
                
                // Check if the date is valid
                if (isNaN(birthDate.getTime())) {
                    console.error('Invalid birth date format:', birthdate);
                    return '';
                }
                
                // Get current date
                const currentDate = new Date();
                
                // Calculate age
                let age = currentDate.getFullYear() - birthDate.getFullYear();
                
                // Adjust age if birthday hasn't occurred yet this year
                const currentMonth = currentDate.getMonth();
                const birthMonth = birthDate.getMonth();
                
                if (birthMonth > currentMonth || 
                    (birthMonth === currentMonth && birthDate.getDate() > currentDate.getDate())) {
                    age--;
                }
                
                return age;
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
				this.aiAnalysis = null
				this.loading = false
				this.analysisProgress = 0
				this.currentStage = 0
				this.progressStatus = ''
				this.currentStageDetails = ''
				this.currentPatient = null
				this.currentPatientName = ''
				this.expandedRows = []
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
			},

			async startAiAnalysis() {
				if (!this.recordData) {
					this.$message.error('无法获取患者信息')
					return
				}

				this.loading = true
				this.analysisProgress = 0
				this.currentStage = 0
				this.progressStatus = ''
				this.currentStageDetails = this.analysisStages[0].status

				// 模拟进度更新
				const updateProgress = () => {
					const stages = [
						{ progress: 20, delay: 800 },
						{ progress: 40, delay: 600 },
						{ progress: 60, delay: 700 },
						{ progress: 80, delay: 500 },
						{ progress: 95, delay: 400 }
					]

					let currentIndex = 0
					const nextStage = () => {
						if (currentIndex < stages.length) {
							this.analysisProgress = stages[currentIndex].progress
							this.currentStage = currentIndex
							this.currentStageDetails = this.analysisStages[currentIndex].status
							currentIndex++
							setTimeout(nextStage, stages[currentIndex - 1].delay)
						}
					}

					nextStage()
				}

				// 开始模拟进度
				updateProgress()

				try {
					const response = await MedicalHistoryAnalysis(this.recordData)
					this.aiAnalysis = response.data
					this.analysisProgress = 100
					this.currentStage = this.analysisStages.length
					this.progressStatus = 'success'
					this.currentStageDetails = '分析完成'
				} catch (error) {
					console.error('AI分析失败:', error)
					this.$message.error('AI分析失败，请稍后重试')
					this.progressStatus = 'exception'
					this.currentStageDetails = '分析过程中出现错误'
				} finally {
					this.loading = false
				}
			},

			progressFormat(percentage) {
				return percentage === 100 ? '完成' : `${percentage}%`
			},
		}
	}
</script>

<style scoped>
/* Medical Record Drawer Styles */
.medical-record-drawer .el-drawer__header {
	margin-bottom: 0;
	padding: 15px 20px;
	background-color: #f5f7fa;
	border-bottom: 1px solid #e6e6e6;
}

.patient-summary-card {
	margin: 15px;
	box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.patient-summary-header {
	display: flex;
	align-items: center;
}

.patient-avatar {
	width: 60px;
	height: 60px;
	border-radius: 50%;
	background-color: #409EFF;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: 15px;
}

.patient-avatar i {
	font-size: 30px;
	color: white;
}

.patient-basic-info {
	flex: 1;
}

.patient-basic-info h2 {
	margin: 0 0 5px 0;
	display: flex;
	align-items: center;
	gap: 10px;
}

.patient-meta {
	display: flex;
	gap: 15px;
	color: #606266;
}

.patient-meta span {
	display: flex;
	align-items: center;
}

.patient-meta i {
	margin-right: 5px;
}

.patient-actions {
	display: flex;
	gap: 10px;
}

.medical-record-tabs {
	margin: 15px;
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15px;
}

.record-header h3 {
	margin: 0;
	display: flex;
	align-items: center;
}

.record-header h3 i {
	margin-right: 8px;
}

.expanded-record {
	padding: 20px;
	background-color: #f9fafc;
	margin-bottom: 10px;
}

.detail-section {
	margin-bottom: 15px;
}

.detail-section h4 {
	margin: 0 0 8px 0;
	color: #606266;
	font-size: 14px;
	display: flex;
	align-items: center;
}

.detail-section h4 i {
	margin-right: 5px;
	color: #409EFF;
}

.detail-section p {
	margin: 0;
	line-height: 1.6;
	word-break: break-word;
	white-space: pre-wrap;
}

.date-cell {
	display: flex;
	align-items: center;
}

.date-cell i {
	margin-right: 5px;
	color: #909399;
}

.symptoms-cell, .diagnosis-cell, .treatment-cell {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.delete-btn {
	color: #F56C6C;
}

.timeline-view {
	padding: 0 20px;
}

.timeline-card {
	margin-bottom: 10px;
}

.timeline-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10px;
}

.timeline-header h4 {
	margin: 0;
}

.diagnosis-tag {
	color: #409EFF;
	font-weight: 500;
}

.doctor-info {
	color: #909399;
	font-size: 13px;
}

.timeline-content {
	margin-bottom: 15px;
}

.content-section {
	margin-bottom: 10px;
}

.content-section h5 {
	margin: 0 0 5px 0;
	color: #606266;
	font-size: 13px;
}

.content-section p {
	margin: 0;
	color: #303133;
	line-height: 1.5;
}

.timeline-footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

.RecordBox {
	padding: 15px;
}
.search-card {
	margin-bottom: 20px;
}

.single-patient-info {
	margin-bottom: 30px;
}

.single-patient-card {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.single-patient-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-title {
	display: flex;
	align-items: center;
	font-size: 16px;
	font-weight: bold;
}

.header-title i {
	margin-right: 8px;
	color: #409EFF;
	font-size: 20px;
}

.patient-detail-row {
	margin-bottom: 20px;
}

.patient-name {
	display: flex;
	align-items: center;
	margin-bottom: 15px;
}

.patient-name h2 {
	margin: 0 10px 0 0;
	color: #303133;
}

.detail-item {
	margin-bottom: 15px;
}

.detail-label {
	font-size: 13px;
	color: #909399;
	margin-bottom: 5px;
}

.detail-value {
	font-size: 15px;
	color: #303133;
	font-weight: 500;
}

.patient-cards {
	margin-top: 20px;
}

.patient-card {
	margin-bottom: 20px;
	transition: all 0.3s;
}

.patient-card:hover {
	transform: translateY(-5px);
	box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.patient-card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.patient-card-header i {
	margin-right: 8px;
	color: #409EFF;
}

.patient-info p {
	margin: 8px 0;
	line-height: 1.5;
}

.info-label {
	font-weight: bold;
	color: #606266;
	margin-right: 5px;
}

.patient-card-actions {
	display: flex;
	gap: 10px;
}
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

	.analysis-progress {
		margin-bottom: 20px;
	}

	.analysis-stages {
		margin: 20px 0;
	}

	.current-status {
		margin-top: 20px;
	}

	.el-step__title.is-process {
		color: #409EFF;
		font-weight: 500;
	}
</style>