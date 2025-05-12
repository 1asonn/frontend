<template>
    <div class="container">
    <!-- 尾线 -->
    <svg class="g-svg" width="400" height="160" xmlns="http://www.w3.org/2000/svg">
      <path id="svgpath" d="M 350 40 C 1200 1000, -550 1000, 350 1960" stroke="black" fill="transparent" />
    </svg>
    <!-- 箭头 -->
    <div class="tra"></div>
    <div class="point point1"><div class="point-label">患者管理</div></div>
    <div class="point point2"><div class="point-label">药品管理</div></div>
    <div class="point point3"><div class="point-label">设备管理</div></div>
    <div class="point point4"><div class="point-label">人力资源</div></div>
    <div class="point point5"><div class="point-label">AI功能</div></div>
    <p class="p1">
      <span class="module-title">1. 患者信息管理</span><br />
      &emsp;<span class="feature-item">※ 患者基本信息录入与管理</span><br />
      &emsp;<span class="feature-item">※ 就诊记录跟踪</span><br />
      &emsp;<span class="feature-item">※ 病历电子化管理</span><br />
      &emsp;<span class="feature-item">※ 患者预约与随访系统</span>
    </p>
    <p class="p2">
      <span class="module-title">2. 药品管理</span><br />
      &emsp;<span class="feature-item">※ 药品库存实时监控</span><br />
      &emsp;<span class="feature-item">※ 入库与出库管理</span><br />
      &emsp;<span class="feature-item">※ 库存记录追踪</span><br />
      &emsp;<span class="feature-item">※ 药品有效期预警</span><br />
      &emsp;<span class="feature-item">※ 供应商管理系统，支持完整的CRUD操作</span>
    </p>
    <p class="p3">
      <span class="module-title">3. 医疗设备管理</span><br />
      &emsp;<span class="feature-item">※ 设备全生命周期管理（采购、使用、维护、报废）</span><br />
      &emsp;<span class="feature-item">※ 详细设备信息记录（名称、编号、型号、厂商等）</span><br />
      &emsp;<span class="feature-item">※ 设备位置与状态追踪</span><br />
      &emsp;<span class="feature-item">※ 财务信息管理</span><br />
      &emsp;<span class="feature-item">※ 维护计划与记录</span><br />
      &emsp;<span class="feature-item">※ 维修工单系统</span>
    </p>
    <p class="p4">
      <span class="module-title">4. 人力资源管理</span><br />
      &emsp;<span class="feature-item">※ 员工信息管理</span><br />
      &emsp;<span class="feature-item">※ 部门结构管理</span><br />
      &emsp;<span class="feature-item">※ 职工排班系统</span><br />
      &emsp;<span class="feature-item">※ 职工角色管理</span>
    </p>
    <p class="p5">
      <span class="module-title">5. AI增强功能</span><br />
      &emsp;<span class="feature-group">※ AI诊疗辅助</span><br />
      &emsp;&emsp;<span class="feature-subitem">智能诊断建议</span><br />
      &emsp;&emsp;<span class="feature-subitem">病历分析与辅助决策</span><br />
      &emsp;<span class="feature-group">※ 自然语言转SQL查询（SQL Agent）</span><br />
      &emsp;&emsp;<span class="feature-subitem">通过自然语言描述生成SQL查询</span><br />
      &emsp;&emsp;<span class="feature-subitem">支持查询结果导出为Excel文件</span><br />
      &emsp;&emsp;<span class="feature-subitem">简化数据检索流程，无需SQL专业知识</span><br />
      &emsp;<span class="feature-group">※ 数据报表分析</span><br />
      &emsp;&emsp;<span class="feature-subitem">智能数据可视化</span><br />
      &emsp;&emsp;<span class="feature-subitem">趋势分析与预测</span><br />
      &emsp;&emsp;<span class="feature-subitem">医疗资源使用效率分析</span>
    </p>
    <div class="title-container">
      <h2 class="title">智能医疗管理系统功能简介</h2>
      <div class="subtitle">AI+医疗 · 智慧医院解决方案</div>
    </div>
  </div>
</template>

<script>
</script>

<style scoped>

  /* 标题样式 */
  .title-container {
    position: absolute;
    left: 0;
    right: 0;
    text-align: center;
    top: 50px;
    z-index: 30;
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    border-radius: 10px;
    width: 80%;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  
  h2 {
    font-size: 42px;
    color: #fff;
    text-shadow: 0 0 15px rgba(255, 87, 34, 0.9);
    margin-bottom: 15px;
    font-family: 'Noto Sans SC', sans-serif;
    font-weight: 700;
    letter-spacing: 3px;
    background: linear-gradient(90deg, #ff5722, #ff9800);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }
  
  .subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    font-weight: 300;
    letter-spacing: 5px;
    position: relative;
    padding-bottom: 10px;
  }
  
  .subtitle::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 30%;
    right: 30%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 87, 34, 0.7), transparent);
  }
  
  .g-svg {
    position: absolute;
    top: 0;
    left: 50%;
    width: 700px;
    height: 2000px;
    transform: translate(-50%, 0);
  }

  #svgpath {
    stroke: #ff5722;
    stroke-width: 2px;
    /* 第一部分为实线长度 第二部分为虚线长度 */
    stroke-dasharray: 2222,2222;
    animation: lineMove 3s linear;
    animation-timeline: scroll();
  }

  @keyframes lineMove {
    /* 初始状态为实线刚好结束，将要进入虚线的状态 */
      0% {
          stroke-dashoffset: 2222;
      }
      /* 将实线拖出来 */
      100% {
          stroke-dashoffset: 0;
      }
  }
  
  .tra {
    position: absolute;
    width: 40px;
    height: 40px;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
    offset-path: path("M 350 40 C 1200 1000, -550 1000, 350 1960");
    background: linear-gradient(270deg, #673AB7, #FF5722);
    animation: move 1s linear;
    animation-timeline: scroll();
    z-index: 0;
  }

  @keyframes move{
    0%{
      offset-distance: 0%;
    }
    50% {
        transform: scale(2.5);
    }
    100%{
      offset-distance: 100%;
    }
  }

  .container{
    position: absolute;
    top: 0;
    left: 50%;
    width: 700px;
    height: 2200px;
    transform: translate(-50%, 0);
  }

  .container::before{ 
    content: "";
    position: absolute;
    inset: 0 -30vw;
    background: linear-gradient(#000, purple);
  }
  
  .point{
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff5722, #ff9800);
    opacity: 0;
    animation: show 1s linear forwards;
    animation-timeline: scroll();
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(255, 87, 34, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.5);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .point::before,
  .point::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, .5);
    animation: circleScale 3s infinite ease-in;
    z-index: -1;
  }
  .point::after {
    animation-delay: -1.5s;
    background: rgba(255, 87, 34, .3);
  }
  
  .point1{
    top: 310px;
    left: 520px;
    animation-range: 150px 200px;
  }

  .point2 {
    top: 680px;
    left: 530px;
    animation-range: 400px 450px;
  }

  .point3 {
    top: 1040px;
    left: 255px;
    animation-range: 650px 700px;
  }

  .point4 {
    top: 1300px;
    left: 85px;
    animation-range: 900px 950px; 
  }

  .point5{
    top: 1650px;
    left: 120px;
    animation-range: 1150px 1200px
  }

  p{
    position: absolute;
    top: 0;
    left: 0;
    width: 50vw;
    font-size: 22px;
    padding: 20px;
    text-align: justify;
    color: #fff;
    opacity: 0;
    background: rgba(30, 10, 60, 0.7);
    backdrop-filter: blur(5px);
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
    /* forwards ---> 设置动画结束后停留在最后一帧 */
    animation: textshow 1s linear forwards;  
    animation-timeline: scroll();
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
    
  p:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 87, 34, 0.3);
  }

  .p1{
    --x:-500px;
    top: 260px;
    left: 40px;
    width: 400px;
    animation-range: 150px 200px;
  }

  .p2{
    --x:-150px;
    width:600px;
    top: 600px;
    left: 400px;
    animation-range: 350px 450px;
  }

  .p2::before {
  content: "";
  float: left;
  width: 200px;
  height: 200px;
  shape-outside: polygon(100% 0, 100% 0, 0 100%, 50% 90%);
  }

  .p3{
    --x:-500px;
    top: 910px;
    left:-320px;
    width: 580px;
    animation-range: 650px 700px;
  }

  .p4{
    --x:-500px;
    top: 1250px;
    left: 150px;
    width: 570px;
    animation-range: 900px 950px;
  }

  .p5{
    --x:-500px;
    top: 1550px;
    left:-270px;
    width:600px;
    animation-range: 1150px 1200px
  }

  @keyframes textshow {
    0%{
      transform: translate(var(--x),0);
      opacity: 0;
    }
    100%{
      transform: translate(0,0);
      opacity: 1;
    }
  }

  @keyframes circleScale {
    0% {
      transform: scale(1);
      opacity: 0.5;
    }
    50% {
      opacity: 0.2;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes show {
    0%{
      opacity: 0;
    }
    100%{
      opacity: 1;
    }
    
  }
    /* 标题容器样式 */
    .title-container {
      position: absolute;
      left: 0;
      right: 0;
      text-align: center;
      top: 50px;
      z-index: 30;
      padding: 20px;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(5px);
      border-radius: 10px;
      width: 80%;
      max-width: 800px;
      margin: 0 auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    
    /* 模块标题和功能项样式 */
    .module-title {
      font-size: 26px;
      font-weight: 600;
      color: #ff9800;
      display: inline-block;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      letter-spacing: 1px;
    }
    
    .feature-item {
      font-size: 18px;
      line-height: 1.6;
      transition: color 0.2s ease, transform 0.2s ease;
      display: inline-block;
    }
    
    p:hover .feature-item {
      color: #fff;
      transform: translateX(5px);
    }
    
    .feature-group {
      font-weight: 600;
      color: #ff9800;
      font-size: 18px;
      display: inline-block;
    }
    
    .feature-subitem {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      display: inline-block;
      transition: color 0.2s ease, transform 0.2s ease;
    }
    
    p:hover .feature-subitem {
      color: #fff;
      transform: translateX(5px);
    }
    
    /* 点标签样式 */
    .point-label {
      position: absolute;
      white-space: nowrap;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      top: -35px;
      opacity: 0;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 87, 34, 0.3);
      transform: translateY(10px);
    }
    
    .point:hover .point-label {
      opacity: 1;
      transform: translateY(0);
    }
    
    .point:hover {
      transform: scale(1.2);
      box-shadow: 0 0 25px rgba(255, 87, 34, 0.9), inset 0 0 15px rgba(255, 255, 255, 0.7);
    }
    
    /* 标题样式 */
    h2 {
      font-size: 42px;
      color: #fff;
      text-shadow: 0 0 15px rgba(255, 87, 34, 0.9);
      margin-bottom: 15px;
      font-family: 'Noto Sans SC', sans-serif;
      font-weight: 700;
      letter-spacing: 3px;
      background: linear-gradient(90deg, #ff5722, #ff9800);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }
    
    .subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 18px;
      font-weight: 300;
      letter-spacing: 5px;
      position: relative;
      padding-bottom: 10px;
    }
    
    .subtitle::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 30%;
      right: 30%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 87, 34, 0.7), transparent);
    }
    .background-gradient { 
      content: "";
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #000 0%, #2d1b4e 40%, #4a0072 70%, #330055 100%);
      background-size: 200% 200%;
      z-index: 1;
      animation: gradientShift 15s infinite alternate ease-in-out;
    }
    
    @keyframes gradientShift {
      0% {
        background-position: 0% 0%;
      }
      100% {
        background-position: 100% 100%;
      }
    }
</style>