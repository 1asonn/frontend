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
						<el-button size="small" type="warning" @click="openPrescriptionDialog(searchResults[0])">开具处方</el-button>
						<el-button size="small" type="danger" @click="openDispenseDialog(searchResults[0])">处方出库</el-button>
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
								<el-button type="text" @click="openPrescriptionDialog(patient)">处方</el-button>
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
				@selection-change="handleSelectionChange"
				class="patient-table">

			<el-table-column
					type="selection"
					width="55">
			</el-table-column>

			<el-table-column
					prop="medicalId"
					label="就诊卡号"
					width="140"
					show-overflow-tooltip>
			</el-table-column>

			<el-table-column
					prop="name"
					label="患者姓名"
					width="100">
			</el-table-column>
			<el-table-column
					prop="gender"
					label="性别"
					width="80">
			</el-table-column>
			<el-table-column
					prop="birthday"
					label="出生日期"
					width="120"
					show-overflow-tooltip>
			</el-table-column>
			<el-table-column
					label="年龄"
					width="80">
				<template slot-scope="scope">
					{{ calculateAge(scope.row.birthday) }}
				</template>
			</el-table-column>

			<el-table-column
					prop="idCard"
					label="身份证号码"
					width="180"
					show-overflow-tooltip>
			</el-table-column>
			<el-table-column
					prop="phone"
					label="联系电话"
					width="140"
					show-overflow-tooltip>
			</el-table-column>
		
			<el-table-column
					prop="icon"
					width="200px"
					label="操作"
					fixed="right">

				<template slot-scope="scope">
					<el-button type="text" @click="showPatientDetails(scope.row)">查看详情</el-button>
					<el-divider direction="vertical"></el-divider>
					<el-button type="text" @click="checkHandle(scope.row.id)">查看病历</el-button>
					<el-divider direction="vertical"></el-divider>
					<el-button type="text" @click="editHandle(scope.row.id)">编辑</el-button>
					<el-divider direction="vertical"></el-divider>
					<el-button type="text" @click="openPrescriptionDialog(scope.row)">处方</el-button>
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
				<el-form-item label="用户名" prop="name" label-width="100px">
					<el-input v-model="editForm.name" autocomplete="off"></el-input>
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
						<el-button type="success" size="small" icon="el-icon-plus" @click="openAddMedicalRecordDialog">
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
										<i class="el-icon-user"></i> {{scope.row.doctor.realname}}
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
											<i class="el-icon-user"></i> 主治医生: {{record.doctor.realname}}
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
			<!-- 处方对话框 -->
	<el-dialog
		title="开具处方"
		:visible.sync="prescriptionDialogVisible"
		width="800px"
		:before-close="handlePrescriptionClose">
		<el-form :model="prescriptionForm" :rules="prescriptionRules" ref="prescriptionForm" label-width="100px">
			<!-- 患者信息摘要 -->
			<div class="patient-summary" v-if="currentPatient">
				<el-card class="mb-20">
					<div class="patient-info-summary">
						<div class="summary-item">
							<span class="label">患者姓名:</span>
							<span class="value">{{ currentPatient.name }}</span>
						</div>
						<div class="summary-item">
							<span class="label">性别:</span>
							<span class="value">{{ currentPatient.gender }}</span>
						</div>
						<div class="summary-item">
							<span class="label">年龄:</span>
							<span class="value">{{ getAgeByBirthday(currentPatient.birthday) }}岁</span>
						</div>
						<div class="summary-item">
							<span class="label">就诊卡号:</span>
							<span class="value">{{ currentPatient.medicalId }}</span>
						</div>
					</div>
				</el-card>
			</div>

			<!-- 诊断结果 -->
			<el-form-item label="诊断结果" prop="diagnosis">
				<el-input type="textarea" v-model="prescriptionForm.diagnosis" :rows="2" placeholder="请输入诊断结果"></el-input>
			</el-form-item>

			<!-- 药品列表 -->
			<div class="medicine-list-section">
				<div class="section-header">
					<h3>药品列表</h3>
					<el-button type="primary" size="small" icon="el-icon-plus" @click="addMedicine">添加药品</el-button>
				</div>

				<div v-for="(medicine, index) in prescriptionForm.medicines" :key="index" class="medicine-item">
					<el-card class="mb-10">
						<div class="medicine-header">
							<span class="medicine-index">药品 #{{ index + 1 }}</span>
							<el-button 
								type="danger" 
								size="mini" 
								icon="el-icon-delete" 
								@click="removeMedicine(index)" 
								:disabled="prescriptionForm.medicines.length <= 1"
							>删除</el-button>
						</div>

						<el-row :gutter="20">
							<el-col :span="12">
								<el-form-item 
									:label="'药品名称'"
									:prop="`medicines.${index}.name`"
									:rules="[{ required: true, message: '请选择药品', trigger: 'change' }]"
									label-width="80px"
								>
									<el-select v-model="medicine.name" placeholder="请选择药品" style="width: 100%">
										<el-option label="阿莫西林胶囊" value="阿莫西林胶囊"></el-option>
										<el-option label="布洛芬片" value="布洛芬片"></el-option>
										<el-option label="头孢克洛胶囊" value="头孢克洛胶囊"></el-option>
										<el-option label="感冒灵颗粒" value="感冒灵颗粒"></el-option>
										<el-option label="维生素C片" value="维生素C片"></el-option>
										<el-option label="盐酸氨溴索口服溶液" value="盐酸氨溴索口服溶液"></el-option>
										<el-option label="复方甘草片" value="复方甘草片"></el-option>
										<el-option label="银黄颗粒" value="银黄颗粒"></el-option>
									</el-select>
								</el-form-item>
							</el-col>
							<el-col :span="12">
								<el-form-item 
									:label="'规格'"
									:prop="`medicines.${index}.spec`"
									:rules="[{ required: true, message: '请输入规格', trigger: 'blur' }]"
									label-width="80px"
								>
									<el-input v-model="medicine.spec" placeholder="如: 0.5g*24粒/盒"></el-input>
								</el-form-item>
							</el-col>
						</el-row>

						<el-row :gutter="20">
							<el-col :span="12">
								<el-form-item 
									:label="'数量'"
									label-width="80px"
								>
									<el-input-number 
										v-model="medicine.quantity" 
										:min="1" 
										:max="100"
										style="width: 120px"
									></el-input-number>
									<el-select v-model="medicine.unit" style="width: 80px; margin-left: 10px">
										<el-option label="盒" value="盒"></el-option>
										<el-option label="瓶" value="瓶"></el-option>
										<el-option label="袋" value="袋"></el-option>
										<el-option label="支" value="支"></el-option>
									</el-select>
								</el-form-item>
							</el-col>
						</el-row>

						<el-form-item 
							:label="'用法用量'"
							:prop="`medicines.${index}.usage`"
							:rules="[{ required: true, message: '请输入用法用量', trigger: 'blur' }]"
							label-width="80px"
						>
							<el-input 
								type="textarea" 
								v-model="medicine.usage" 
								:rows="2" 
								placeholder="如: 口服，一次1片，一日3次"
							></el-input>
						</el-form-item>
					</el-card>
				</div>
			</div>

			<!-- 医嘱 -->
			<el-form-item label="医嘱" prop="instructions">
				<el-input 
					type="textarea" 
					v-model="prescriptionForm.instructions" 
					:rows="3" 
					placeholder="请输入医嘱内容"
				></el-input>
			</el-form-item>

			<!-- 处方医生 -->
			<el-form-item label="处方医生" prop="doctor">
				<el-input v-model="prescriptionForm.doctor"></el-input>
			</el-form-item>
		</el-form>

		<div slot="footer" class="dialog-footer">
			<el-button @click="handlePrescriptionClose">取 消</el-button>
			<el-button type="success" @click="submitPrescription('prescriptionForm')">保存处方</el-button>
			<el-button type="warning" @click="submitAndCreateStockOut('prescriptionForm')">保存并出库</el-button>
			<el-button type="primary" @click="submitAndPrintPrescription('prescriptionForm')">保存并打印</el-button>
		</div>
	</el-dialog>


	<!-- 处方出库对话框 -->
	<el-dialog
		title="处方药品出库"
		:visible.sync="dispenseDialogVisible"
		width="800px"
		:before-close="handleDispenseDialogClose"
		:close-on-click-modal="false"
	>
		<div v-loading="prescriptionLoading">
			<!-- 患者信息摘要 -->
			<div class="patient-summary mb-20" v-if="currentPatient">
				<h3 class="mb-10">患者信息</h3>
				<div class="patient-info-summary">
					<div class="summary-item">
						<span class="label">姓名:</span>
						<span class="value">{{ currentPatient.name || '-' }}</span>
					</div>
					<div class="summary-item">
						<span class="label">性别:</span>
						<span class="value">{{ currentPatient.gender || '-' }}</span>
					</div>
					<div class="summary-item">
						<span class="label">年龄:</span>
						<span class="value">{{ currentPatient.birthday ? getAgeByBirthday(currentPatient.birthday) + '岁' : '-' }}</span>
					</div>
					<div class="summary-item">
						<span class="label">就诊卡号:</span>
						<span class="value">{{ currentPatient.medicalId || '-' }}</span>
					</div>
				</div>
			</div>
			<div class="patient-summary mb-20" v-else>
				<el-alert
					title="请先选择患者"
					type="info"
					:closable="false">
				</el-alert>
			</div>

			<!-- 处方选择 -->
			<div class="prescription-select-section mb-20">
				<div class="section-header">
					<h3>选择处方</h3>
				</div>
				<el-select 
					v-model="selectedPrescriptionId" 
					placeholder="请选择处方" 
					style="width: 100%"
					@change="handlePrescriptionChange"
				>
					<el-option 
						v-for="item in patientPrescriptions" 
						:key="item.id" 
						:label="item.code + ' - ' + item.created_at" 
						:value="item.id"
					>
						<span style="float: left">{{ item.code }}</span>
						<span style="float: right; color: #8492a6; font-size: 13px">{{ item.created_at }}</span>
					</el-option>
				</el-select>
			</div>

			<!-- 处方药品列表 -->
			<div class="prescription-medicines mb-20" v-if="selectedPrescription">
				<div class="section-header">
					<h3>处方药品</h3>
					<el-tag type="success" v-if="selectedPrescription.status === 'APPROVED'">已审核</el-tag>
					<el-tag type="warning" v-else-if="selectedPrescription.status === 'PENDING'">待审核</el-tag>
					<el-tag type="danger" v-else-if="selectedPrescription.status === 'REJECTED'">已拒绝</el-tag>
					<el-tag type="info" v-else-if="selectedPrescription.status === 'DISPENSED'">已发药</el-tag>
				</div>

				<el-table :data="selectedPrescription.items || []" border style="width: 100%">
					<el-table-column type="index" label="#" width="50" align="center"></el-table-column>
					<el-table-column prop="medicine_name" label="药品名称" min-width="150"></el-table-column>
					<el-table-column prop="specification" label="规格" width="120"></el-table-column>
					<el-table-column prop="unit" label="单位" width="80" align="center"></el-table-column>
					<el-table-column prop="quantity" label="数量" width="80" align="center"></el-table-column>
					<el-table-column prop="usage" label="用法" min-width="120"></el-table-column>
					<el-table-column prop="frequency" label="频次" width="100"></el-table-column>
					<el-table-column prop="days" label="天数" width="80" align="center"></el-table-column>
					<el-table-column label="库存状态" width="100" align="center">
						<template slot-scope="{row}">
							<el-tag type="success" v-if="row.stock_status === 'SUFFICIENT'">充足</el-tag>
							<el-tag type="warning" v-else-if="row.stock_status === 'LOW'">偏低</el-tag>
							<el-tag type="danger" v-else-if="row.stock_status === 'INSUFFICIENT'">不足</el-tag>
							<el-tag type="info" v-else>未知</el-tag>
						</template>
					</el-table-column>
				</el-table>
			</div>

			<!-- 出库备注 -->
			<div class="dispense-remark mb-20">
				<el-form :model="dispenseForm" label-width="80px">
					<el-form-item label="出库备注">
						<el-input 
							v-model="dispenseForm.remark" 
							type="textarea" 
							:rows="2" 
							placeholder="请输入出库备注信息"
						></el-input>
					</el-form-item>
				</el-form>
			</div>
		</div>

		<div slot="footer" class="dialog-footer">
			<el-button @click="dispenseDialogVisible = false">取 消</el-button>
			<el-button 
				type="primary" 
				@click="handleDispensePrescription"
				:disabled="!selectedPrescription || selectedPrescription.status !== 'APPROVED' || hasInsufficientStock"
				:loading="dispensing"
			>
				确认出库
			</el-button>
		</div>
	</el-dialog>

	<!-- 患者详情对话框 -->
	<el-dialog
		title="患者详细信息"
		:visible.sync="patientDetailsDialogVisible"
		width="700px"
		:before-close="handlePatientDetailsClose">
		<div v-if="selectedPatientDetails" class="patient-details-container">
			<el-card class="patient-details-card">
				<div class="patient-details-header">
					<div class="patient-avatar-large">
						<i class="el-icon-user-solid"></i>
					</div>
					<div class="patient-name-info">
						<h2>{{selectedPatientDetails.name}}</h2>
						<div class="patient-tags">
							<el-tag type="success" v-if="selectedPatientDetails.gender === '男'">男</el-tag>
							<el-tag type="danger" v-else-if="selectedPatientDetails.gender === '女'">女</el-tag>
							<el-tag v-else>其他</el-tag>
							<el-tag type="info" style="margin-left: 10px">
								{{getAgeByBirthday(selectedPatientDetails.birthday)}}岁
							</el-tag>
						</div>
					</div>
				</div>

				<el-divider content-position="left">基本信息</el-divider>
				
				<el-row :gutter="20" class="details-row">
					<el-col :span="12">
						<div class="details-item">
							<span class="details-label">就诊卡号：</span>
							<span class="details-value">{{selectedPatientDetails.medicalId}}</span>
						</div>
					</el-col>
					<el-col :span="12">
						<div class="details-item">
							<span class="details-label">出生日期：</span>
							<span class="details-value">{{selectedPatientDetails.birthday}}</span>
						</div>
					</el-col>
				</el-row>

				<el-row :gutter="20" class="details-row">
					<el-col :span="12">
						<div class="details-item">
							<span class="details-label">联系电话：</span>
							<span class="details-value">{{selectedPatientDetails.phone}}</span>
						</div>
					</el-col>
					<el-col :span="12">
						<div class="details-item">
							<span class="details-label">身份证号：</span>
							<span class="details-value">{{selectedPatientDetails.idCard}}</span>
						</div>
					</el-col>
				</el-row>

				<el-row :gutter="20" class="details-row">
					<el-col :span="24">
						<div class="details-item">
							<span class="details-label">家庭住址：</span>
							<span class="details-value">{{selectedPatientDetails.address}}</span>
						</div>
					</el-col>
				</el-row>

				<el-divider content-position="left">医疗信息</el-divider>

				<el-row :gutter="20" class="details-row">
					<el-col :span="24">
						<div class="details-item">
							<span class="details-label">病史记录：</span>
							<div class="medical-history-tags">
								<template v-if="selectedPatientDetails.medicalHistory && selectedPatientDetails.medicalHistory !== '无'">
									<el-tag 
										v-for="(history, index) in selectedPatientDetails.medicalHistory.split(',')" 
										:key="index"
										type="warning"
										effect="dark"
										size="medium"
										style="margin-right: 10px; margin-bottom: 10px;"
									>
										{{ history.trim() }}
									</el-tag>
								</template>
								<el-tag v-else type="info" effect="plain">无病史记录</el-tag>
							</div>
						</div>
					</el-col>
				</el-row>

				<el-divider content-position="left">系统信息</el-divider>

				<el-row :gutter="20" class="details-row">
					<el-col :span="12">
						<div class="details-item">
							<span class="details-label">创建时间：</span>
							<span class="details-value">{{formatDateTime(selectedPatientDetails.createdAt)}}</span>
						</div>
					</el-col>
					<el-col :span="12">
						<div class="details-item">
							<span class="details-label">更新时间：</span>
							<span class="details-value">{{formatDateTime(selectedPatientDetails.updatedAt)}}</span>
						</div>
					</el-col>
				</el-row>
			</el-card>
		</div>
		<div slot="footer" class="dialog-footer">
			<el-button @click="patientDetailsDialogVisible = false">关 闭</el-button>
			<el-button type="primary" @click="editHandle(selectedPatientDetails.id)">编辑信息</el-button>
			<el-button type="warning" @click="openPrescriptionDialog(selectedPatientDetails)">开具处方</el-button>
		</div>
	</el-dialog>
	<!-- 新增病历对话框 -->
	<el-dialog
		title="新增病历记录"
		:visible.sync="addMedicalRecordDialogVisible"
		width="650px"
		:before-close="handleAddMedicalRecordDialogClose">
		<el-form :model="medicalRecordForm" :rules="medicalRecordRules" ref="medicalRecordForm" label-width="100px">
			<el-form-item label="患者" prop="patientId">
				<el-input v-model="medicalRecordForm.patientName" disabled></el-input>
				<input type="hidden" v-model="medicalRecordForm.patientId">
			</el-form-item>
			<el-form-item label="就诊日期" prop="visitDate">
				<el-date-picker
					v-model="medicalRecordForm.visitDate"
					type="date"
					placeholder="选择就诊日期"
					value-format="yyyy-MM-dd"
					style="width: 100%">
				</el-date-picker>
			</el-form-item>
			<el-form-item label="主诉" prop="chiefComplaint">
				<el-input v-model="medicalRecordForm.chiefComplaint" placeholder="请输入患者主诉"></el-input>
			</el-form-item>
			<el-form-item label="症状描述" prop="symptoms">
				<el-input 
					type="textarea" 
					v-model="medicalRecordForm.symptoms" 
					:rows="3"
					placeholder="请详细描述患者症状">
				</el-input>
			</el-form-item>
			<el-form-item label="诊断结果" prop="diagnosis">
				<el-input 
					type="textarea" 
					v-model="medicalRecordForm.diagnosis" 
					:rows="2"
					placeholder="请输入诊断结果">
				</el-input>
			</el-form-item>
			<el-form-item label="治疗方案" prop="treatmentPlan">
				<el-input 
					type="textarea" 
					v-model="medicalRecordForm.treatmentPlan" 
					:rows="3"
					placeholder="请输入治疗方案">
				</el-input>
			</el-form-item>
			<el-form-item label="医生建议" prop="doctorAdvice">
				<el-input 
					type="textarea" 
					v-model="medicalRecordForm.doctorAdvice" 
					:rows="2"
					placeholder="请输入医生建议">
				</el-input>
			</el-form-item>
			<el-form-item label="下次复诊" prop="followUpDate">
				<el-date-picker
					v-model="medicalRecordForm.followUpDate"
					type="date"
					placeholder="选择下次复诊日期"
					value-format="yyyy-MM-dd"
					style="width: 100%">
				</el-date-picker>
			</el-form-item>
		</el-form>
		<div slot="footer" class="dialog-footer">
			<el-button @click="addMedicalRecordDialogVisible = false">取 消</el-button>
			<el-button type="primary" @click="submitMedicalRecord" :loading="submittingMedicalRecord">确 定</el-button>
		</div>
	</el-dialog>
</div>
</template>

<script>
import { getToken, getCurrentUserId } from "../../utils/auth";
import { getMedicineList, prescriptionOut, createStockOutFromPrescription } from "../../api/medicineStock";
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
				// 患者详情对话框相关
				patientDetailsDialogVisible: false,
				selectedPatientDetails: null,
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

				// 处方出库相关
				dispenseDialogVisible: false,
				patientPrescriptions: [],
				selectedPrescriptionId: null,
				selectedPrescription: null,
				prescriptionLoading: false,
				dispensing: false,
				dispenseForm: {
					remark: ''
				},

				total: 10,
				size: 10,
				current: 1,

				dialogVisible: false,
				editForm: {

				},

				patientData: [],
				recordData: [],
				aiAnalysis: null,

				// 新增病历相关
				addMedicalRecordDialogVisible: false,
				submittingMedicalRecord: false,
				medicalRecordForm: {
					patientId: '',
					patientName: '',
					visitDate: '',
					chiefComplaint: '',
					symptoms: '',
					diagnosis: '',
					treatmentPlan: '',
					doctorAdvice: '',
					followUpDate: ''
				},
				medicalRecordRules: {
					visitDate: [
						{ required: true, message: '请选择就诊日期', trigger: 'change' }
					],
					chiefComplaint: [
						{ required: true, message: '请输入患者主诉', trigger: 'blur' }
					],
					symptoms: [
						{ required: true, message: '请输入症状描述', trigger: 'blur' }
					],
					diagnosis: [
						{ required: true, message: '请输入诊断结果', trigger: 'blur' }
					]
				},

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

				prescriptionDialogVisible: false,
				prescriptionForm: {
					diagnosis: '',
					medicines: [{
						name: '',
						spec: '',
						quantity: 1,
						unit: '盒',
						usage: ''
					}],
					instructions: '',
					doctor: ''
				},
				prescriptionRules: {
					diagnosis: [
						{ required: true, message: '请输入诊断结果', trigger: 'blur' }
					],
					instructions: [
						{ required: true, message: '请输入医嘱内容', trigger: 'blur' }
					],
					doctor: [
						{ required: true, message: '请输入处方医生姓名', trigger: 'blur' }
					]
				},
				medicineOptions: [
					{ value: '阿莫西林胶囊', label: '阿莫西林胶囊' },
					{ value: '布洛芬片', label: '布洛芬片' },
					{ value: '感冒灵颗粒', label: '感冒灵颗粒' },
					{ value: '头孢克洛胶囊', label: '头孢克洛胶囊' },
					{ value: '盐酸左氧氟沙星片', label: '盐酸左氧氟沙星片' },
					{ value: '复方甘草片', label: '复方甘草片' },
					{ value: '阿司匹林肠溶片', label: '阿司匹林肠溶片' },
					{ value: '氯雷他定片', label: '氯雷他定片' },
					{ value: '维生素C片', label: '维生素C片' },
					{ value: '奥美拉唑肠溶胶囊', label: '奥美拉唑肠溶胶囊' }
				],
			}
		},
        computed: {
            hasSysUserSaveAuth() {
                return this.hasAuth('sys:user:save');
            },
            hasSysUserDeleteAuth() {
                return this.hasAuth('sys:user:delete');
            },
            // 处方出库相关计算属性
            hasInsufficientStock() {
                if (!this.selectedPrescription || !this.selectedPrescription.items) {
                    return false;
                }
                return this.selectedPrescription.items.some(item => item.stock_status === 'INSUFFICIENT');
            }
        },
			created() {
				this.getPatientList()
			},

		methods: {
				// 根据出生日期计算年龄
				calculateAge(birthday) {
					if (!birthday) return '-';
					
					try {
						// 将生日字符串转换为日期对象
						const birthDate = new Date(birthday);
						
						// 如果日期无效，返回空字符串
						if (isNaN(birthDate.getTime())) return '-';
						
						// 获取当前日期
						const today = new Date();
						
						// 计算年龄
						let age = today.getFullYear() - birthDate.getFullYear();
						
						// 检查是否已过生日
						const monthDiff = today.getMonth() - birthDate.getMonth();
						if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
							age--;
						}
						
						return age + '岁';
					} catch (error) {
						console.error('计算年龄错误:', error);
						return '-';
					}
				},
				
				// 格式化日期时间
			formatDateTime(dateTimeStr) {
				if (!dateTimeStr) return '-';
				try {
					const date = new Date(dateTimeStr);
					return date.toLocaleString('zh-CN', { 
						year: 'numeric', 
						month: '2-digit', 
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					});
				} catch (error) {
					console.error('Error formatting date:', error);
					return dateTimeStr;
				}
			},
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
			
			// 显示患者详情对话框
			showPatientDetails(patient) {
				this.selectedPatientDetails = JSON.parse(JSON.stringify(patient)); // 深拷贝患者数据
				this.patientDetailsDialogVisible = true;
			},
			
			// 关闭患者详情对话框
			handlePatientDetailsClose() {
				this.patientDetailsDialogVisible = false;
				setTimeout(() => {
					this.selectedPatientDetails = null;
				}, 300);
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
			
			// 计算患者年龄
			getAgeByBirthday(birthday) {
				if (!birthday) {
					return '-';
				}
				
				try {
					const birthDate = new Date(birthday);
					if (isNaN(birthDate.getTime())) {
						return '-';
					}
					
					const today = new Date();
					let age = today.getFullYear() - birthDate.getFullYear();
					const monthDiff = today.getMonth() - birthDate.getMonth();
					
					if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
						age--;
					}
					
					return age;
				} catch (error) {
					console.error('Error calculating age:', error);
					return '-';
				}
			},
			
			// 打开新增病历对话框
			openAddMedicalRecordDialog() {
				this.resetMedicalRecordForm();
				
				// 设置当前患者信息
				if (this.currentPatient) {
					this.medicalRecordForm.patientId = this.currentPatient.id;
					this.medicalRecordForm.patientName = this.currentPatient.name;
				}
				
				// 设置默认就诊日期为今天
				const today = new Date();
				const year = today.getFullYear();
				const month = String(today.getMonth() + 1).padStart(2, '0');
				const day = String(today.getDate()).padStart(2, '0');
				this.medicalRecordForm.visitDate = `${year}-${month}-${day}`;
				
				this.addMedicalRecordDialogVisible = true;
			},
			
			// 重置病历表单
			resetMedicalRecordForm() {
				this.medicalRecordForm = {
					patientId: '',
					patientName: '',
					visitDate: '',
					chiefComplaint: '',
					symptoms: '',
					diagnosis: '',
					treatmentPlan: '',
					doctorAdvice: '',
					followUpDate: ''
				};
				
				// 如果表单引用存在，重置验证
				if (this.$refs.medicalRecordForm) {
					this.$refs.medicalRecordForm.resetFields();
				}
			},
			
			// 关闭新增病历对话框
			handleAddMedicalRecordDialogClose() {
				this.resetMedicalRecordForm();
				this.addMedicalRecordDialogVisible = false;
			},
			
			// 提交病历记录
			submitMedicalRecord() {
				this.$refs.medicalRecordForm.validate(async (valid) => {
					if (valid) {
						try {
							this.submittingMedicalRecord = true;
							
							// 准备提交的数据
							const medicalRecordData = {
								patientId: this.medicalRecordForm.patientId,
								visitDate: this.medicalRecordForm.visitDate,
								chiefComplaint: this.medicalRecordForm.chiefComplaint,
								symptoms: this.medicalRecordForm.symptoms,
								diagnosis: this.medicalRecordForm.diagnosis,
								treatmentPlan: this.medicalRecordForm.treatmentPlan,
								doctorAdvice: this.medicalRecordForm.doctorAdvice,
								followUpDate: this.medicalRecordForm.followUpDate || null
							};
							
							// 发送请求创建新病历
							const response = await this.$axios.post('/medical_records', medicalRecordData);
							
							if (response.status === 201) {
								this.$message.success('病历记录添加成功');
								
								// 关闭对话框
								this.addMedicalRecordDialogVisible = false;
								
								// 刷新病历记录列表
								this.fetchPatientRecords(this.currentPatient.id);
							} else {
								this.$message.error('添加病历记录失败');
							}
						} catch (error) {
							console.error('添加病历记录时出错:', error);
							this.$message.error('添加病历记录失败: ' + (error.response?.data?.message || error.message || '未知错误'));
						} finally {
							this.submittingMedicalRecord = false;
						}
					} else {
						return false;
					}
				});
			},
			
			// 获取患者病历记录
			async fetchPatientRecords(patientId) {
				try {
					const response = await this.$axios.get(`/medical_records?patientId=${patientId}`);
					if (response.status === 200) {
						this.recordData = response.data;
					} else {
						this.$message.error('获取病历记录失败');
						this.recordData = [];
					}
				} catch (error) {
					console.error('获取病历记录时出错:', error);
					this.$message.error('获取病历记录失败: ' + (error.response?.data?.message || error.message || '未知错误'));
					this.recordData = [];
				}
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

			// 处方相关方法
			openPrescriptionDialog(patient) {
				console.log("this is patient",patient)
				this.currentPatient = JSON.parse(JSON.stringify(patient));
				this.prescriptionForm = {
					diagnosis: '',
					medicines: [{
						name: '',
						spec: '',
						quantity: 1,
						unit: '盒',
						usage: ''
					}],
					instructions: '',
					doctor: 'czl'
				};
				this.prescriptionDialogVisible = true;
			},

			// 处方出库相关方法
			openDispenseDialog(patient) {
				if (!patient) {
					this.$message.warning('请先选择患者');
					return;
				}
				
				try {
					this.currentPatient = JSON.parse(JSON.stringify(patient));
				} catch (error) {
					console.error('Error parsing patient data:', error);
					this.currentPatient = patient || {};
				}
				
				this.dispenseForm = {
					remark: ''
				};
				this.selectedPrescriptionId = null;
				this.selectedPrescription = null;
				this.prescriptionLoading = true;
				this.dispenseDialogVisible = true;
				
				// 获取患者的处方列表
				setTimeout(() => {
					// 模拟从API获取处方列表
					this.patientPrescriptions = [
						{
							id: '1',
							code: 'RX' + new Date().getTime().toString().substring(5),
							created_at: new Date().toLocaleString(),
							status: 'APPROVED',
							items: [
								{
									medicine_id: '101',
									medicine_name: '阿莫西林胶囊',
									specification: '0.25g*24粒',
									unit: '盒',
									quantity: 2,
									usage: '口服',
									frequency: '一日三次',
									days: 5,
									stock_status: 'SUFFICIENT'
								},
								{
									medicine_id: '102',
									medicine_name: '布洛芬片',
									specification: '0.2g*24片',
									unit: '盒',
									quantity: 1,
									usage: '口服',
									frequency: '需要时服用',
									days: 3,
									stock_status: 'LOW'
								}
							]
						},
						{
							id: '2',
							code: 'RX' + (new Date().getTime() - 86400000).toString().substring(5),
							created_at: new Date(Date.now() - 86400000).toLocaleString(),
							status: 'DISPENSED',
							items: [
								{
									medicine_id: '103',
									medicine_name: '感冒灵颗粒',
									specification: '10g*10袋',
									unit: '盒',
									quantity: 1,
									usage: '温开水冲服',
									frequency: '一日三次',
									days: 3,
									stock_status: 'SUFFICIENT'
								}
							]
						}
					];
					this.prescriptionLoading = false;
				}, 800);
			},

			handleDispenseDialogClose() {
				this.dispenseDialogVisible = false;
				this.selectedPrescriptionId = null;
				this.selectedPrescription = null;
				this.dispenseForm.remark = '';
			},

			handlePrescriptionChange(prescriptionId) {
				if (!prescriptionId) {
					this.selectedPrescription = null;
					return;
				}
				
				this.prescriptionLoading = true;
				setTimeout(() => {
					// 模拟从API获取处方详情
					this.selectedPrescription = this.patientPrescriptions.find(p => p.id === prescriptionId);
					this.prescriptionLoading = false;
				}, 500);
			},

			handleDispensePrescription() {
				if (!this.selectedPrescription || this.selectedPrescription.status !== 'APPROVED') {
					this.$message.warning('请选择一个已审核的处方');
					return;
				}

				if (this.hasInsufficientStock) {
					this.$message.error('存在库存不足的药品，无法出库');
					return;
				}

				if (!this.currentPatient) {
					this.$message.error('患者信息不完整，无法出库');
					return;
				}

				this.dispensing = true;

				// 准备出库数据
				const dispenseData = {
					prescription_id: this.selectedPrescription.id || '',
					patient_id: this.currentPatient.id || '',
					patient_name: this.currentPatient.name || '',
					medical_record_id: this.currentPatient.medicalId || '',
					remark: this.dispenseForm.remark || '',
					items: (this.selectedPrescription.items || []).map(item => ({
						medicine_id: item.medicine_id || '',
						quantity: item.quantity || 0
					}))
				};

				// 调用处方出库API
				setTimeout(() => {
					// 模拟API调用
					console.log('处方出库数据:', dispenseData);
					
					// 实际项目中应该调用API
					// prescriptionOut(dispenseData).then(response => {
					//   this.$message.success('处方出库成功');
					//   this.dispenseDialogVisible = false;
					// }).catch(error => {
					//   this.$message.error('处方出库失败: ' + error.message);
					// }).finally(() => {
					//   this.dispensing = false;
					// });

					// 模拟成功响应
					this.$message.success('处方出库成功');
					
					// 更新处方状态
					this.selectedPrescription.status = 'DISPENSED';
					const index = this.patientPrescriptions.findIndex(p => p.id === this.selectedPrescription.id);
					if (index !== -1) {
						this.patientPrescriptions[index] = this.selectedPrescription;
					}
					
					this.dispensing = false;
					this.dispenseDialogVisible = false;
				}, 1000);
			},

			handlePrescriptionClose() {
				this.$confirm('关闭将丢失已填写的处方内容，是否确认关闭?', '提示', {
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'warning'
				}).then(() => {
					this.prescriptionDialogVisible = false;
					if (this.$refs.prescriptionForm) {
						this.$refs.prescriptionForm.resetFields();
					}
				}).catch(() => {});
			},

			addMedicine() {
				this.prescriptionForm.medicines.push({
					name: '',
					spec: '',
					quantity: 1,
					unit: '盒',
					usage: ''
				});
			},

			removeMedicine(index) {
				this.prescriptionForm.medicines.splice(index, 1);
			},

			submitPrescription(formName) {
				this.$refs[formName].validate((valid) => {
					if (valid) {
						// 这里应该调用API保存处方
						const prescriptionData = {
							patientId: this.currentPatient.id,
							patientName: this.currentPatient.name,
							medicalId: this.currentPatient.medicalId,
							diagnosis: this.prescriptionForm.diagnosis,
							medicines: this.prescriptionForm.medicines,
							instructions: this.prescriptionForm.instructions,
							doctor: this.prescriptionForm.doctor,
							createTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
						};

						console.log('保存处方数据:', prescriptionData);
						
						// 模拟API调用
						setTimeout(() => {
							this.$message.success('处方保存成功');
							this.prescriptionDialogVisible = false;
						}, 500);
					} else {
						return false;
					}
				});
			},

			submitAndCreateStockOut(formName) {
				this.$refs[formName].validate(async (valid) => {
					if (valid) {
						try {
							// 先保存处方
							const prescriptionData = {
								patientId: this.currentPatient.id,
								patientName: this.currentPatient.name,
								medicalId: this.currentPatient.medicalId,
								diagnosis: this.prescriptionForm.diagnosis,
								medicines: this.prescriptionForm.medicines,
								instructions: this.prescriptionForm.instructions,
								doctor: this.prescriptionForm.doctor,
								createTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
							};

							// 在实际项目中这里应该调用API保存处方
							// 模拟保存处方并返回处方ID
							let prescriptionId = 'PR' + Date.now().toString();
							// 准备生成出库单数据
							const stockOutData = {
								prescription_id: prescriptionId,
								patient_id: this.currentPatient.id,
								patient_name: this.currentPatient.name,
								doctor_id: getCurrentUserId() || '',  // 从 token 中获取医生的ID
								doctor_name: this.prescriptionForm.doctor,
								department_id: this.currentPatient.departmentId || '',
								department_name: this.currentPatient.departmentName || '',
								prescription_date: new Date().toISOString().split('T')[0], // 当前日期 YYYY-MM-DD
								prescription_remark: this.prescriptionForm.instructions || '根据电子处方自动生成',
								is_insurance: false,  // 默认不是医保
								prescription_items: this.prescriptionForm.medicines.map(med => ({
									medicine_id: med.id || '', // 注意实际实现中需要确保药品有正确的ID
									medicine_name: med.name,
									quantity: med.quantity,
									unit: med.unit,
									specification: med.spec,
									usage: med.usage || ''
								}))
							};
							
							console.log('准备生成出库单数据:', stockOutData);
							
							// 调用从处方生成出库单的API
							const stockOutResult = await createStockOutFromPrescription(stockOutData);
							
							this.$message.success('处方保存成功，出库单已生成');
							this.prescriptionDialogVisible = false;
							
							// 询问是否查看出库单
							const stockOutId = stockOutResult.data.data.id;
							this.$confirm('出库单已成功创建，是否查看出库单详情?', '提示', {
								confirmButtonText: '查看出库单',
								cancelButtonText: '继续工作',
								type: 'success'
							}).then(() => {
								this.$router.push(`/medicine/stockOut?id=${stockOutId}`);
							}).catch(() => {});
						} catch (error) {
							console.error('保存处方并生成出库单失败:', error);
							this.$message.error('保存处方并生成出库单失败: ' + (error.response?.data?.msg || '未知错误'));
						}
					} else {
						return false;
					}
				});
			},
			
			submitAndPrintPrescription(formName) {
				this.$refs[formName].validate((valid) => {
					if (valid) {
						// 这里应该调用API保存处方并打印
						const prescriptionData = {
							patientId: this.currentPatient.id,
							patientName: this.currentPatient.name,
							medicalId: this.currentPatient.medicalId,
							diagnosis: this.prescriptionForm.diagnosis,
							medicines: this.prescriptionForm.medicines,
							instructions: this.prescriptionForm.instructions,
							doctor: this.prescriptionForm.doctor,
							createTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
						};

						console.log('保存并打印处方数据:', prescriptionData);
						
						// 模拟API调用
						setTimeout(() => {
							this.$message.success('处方保存成功，正在打印...');
							this.prescriptionDialogVisible = false;
						}, 500);
					} else {
						return false;
					}
				});
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

	/* 处方对话框样式 */
	.patient-summary {
		margin-bottom: 20px;
	}

	.mb-20 {
		margin-bottom: 20px;
	}

	.mb-10 {
		margin-bottom: 10px;
	}

	.patient-info-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 15px 30px;
	}

	.summary-item {
		display: flex;
		align-items: center;
	}

	.summary-item .label {
		color: #909399;
		margin-right: 8px;
		font-size: 14px;
	}

	.summary-item .value {
		color: #303133;
		font-weight: 500;
		font-size: 14px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
	}

	.section-header h3 {
		margin: 0;
		color: #303133;
		font-size: 16px;
		font-weight: 500;
	}

	.medicine-list-section {
		margin-bottom: 20px;
	}

	.medicine-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
	}

	.medicine-index {
		font-weight: 500;
		color: #409EFF;
	}

	.medicine-item .el-card__body {
		padding: 15px;
	}

	/* 患者详情对话框样式 */
	.patient-details-container {
		padding: 10px;
	}

	.patient-details-card {
		box-shadow: none;
	}

	.patient-details-header {
		display: flex;
		align-items: center;
		margin-bottom: 20px;
	}

	.patient-avatar-large {
		width: 70px;
		height: 70px;
		border-radius: 50%;
		background-color: #409EFF;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 20px;
	}

	.patient-avatar-large i {
		font-size: 40px;
		color: white;
	}

	.patient-name-info h2 {
		margin: 0 0 8px 0;
		color: #303133;
		font-size: 22px;
	}

	.patient-tags {
		display: flex;
		align-items: center;
	}

	.details-row {
		margin-bottom: 15px;
	}

	.details-item {
		display: flex;
		align-items: flex-start;
	}

	.details-label {
		color: #909399;
		min-width: 80px;
		font-weight: 500;
	}

	.details-value {
		color: #303133;
		flex: 1;
		word-break: break-word;
	}

	.medical-history-tags {
		margin-top: 5px;
	}
</style>