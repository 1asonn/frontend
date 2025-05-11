<template>
    <FullCalendar
        :options="calendarOptions"
    />
</template>


<script>
    import FullCalendar from '@fullcalendar/vue'  
    import dayGridPlugin from '@fullcalendar/daygrid'
    import interactionPlugin from '@fullcalendar/interaction'
    import zhCnLocale from '@fullcalendar/core/locales/zh-cn'

    export default{
        props:{
            scheduleData: {
                type: Object,
                required: true
            }
        },
        name:"calender",
        components:{
            FullCalendar
        },
        data(){
            return {
                calendarOptions: {
                    plugins: [ dayGridPlugin, interactionPlugin ],
                    initialView: 'dayGridMonth',
                    selectable: false,
                    events: this.generateEvents(),
                    eventContent: this.renderEventContent,
                    locale: zhCnLocale,
                    firstDay: 1,
                    headerToolbar: {
                        left: '',
                        center: 'title',
                        right: ''
                    },
                    dayHeaderFormat: { weekday: 'short' },
                    slotMinTime: '06:00:00',
                    slotMaxTime: '22:00:00',
                    navLinks: false,
                    fixedWeekCount: false,
                    validRange: {
                        start: new Date().toISOString().split('T')[0]
                    }
                },
            }
        },
        methods: {
            generateEvents() {
                const events = [];
                const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                
                // Get the first day of current month
                const currentDate = new Date();
                currentDate.setDate(1); // Set to first day of month
                currentDate.setHours(0, 0, 0, 0);
                
                // Get the last day of current month
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                
                // Generate events for current month only
                for (let date = new Date(currentDate); date <= lastDay; date.setDate(date.getDate() + 1)) {
                    const dayOfWeek = daysOfWeek[date.getDay()];
                    const scheduleInfo = this.scheduleData[dayOfWeek];
                    
                    if (scheduleInfo) {
                        let title, timeRange, startTime, endTime, backgroundColor;
                        
                        // 处理新格式（对象格式）
                        if (typeof scheduleInfo === 'object' && scheduleInfo !== null) {
                            if (scheduleInfo.timeRange) {
                                timeRange = scheduleInfo.timeRange;
                                [startTime, endTime] = timeRange.split('-');
                                title = `${scheduleInfo.name || ''} (${timeRange})`;
                                backgroundColor = this.getShiftColor(scheduleInfo.id);
                            } else {
                                continue; // 跳过没有时间范围的班次
                            }
                        } 
                        // 处理旧格式（字符串格式）
                        else if (typeof scheduleInfo === 'string' && scheduleInfo !== '休息') {
                            timeRange = scheduleInfo;
                            [startTime, endTime] = timeRange.split('-');
                            title = `工作时间 (${timeRange})`;
                            backgroundColor = '#42b983';
                        } else {
                            continue; // 跳过休息或无效数据
                        }
                        
                        // 创建日历事件
                        events.push({
                            title: title,
                            start: `${date.toISOString().split('T')[0]}T${startTime}:00`,
                            end: `${date.toISOString().split('T')[0]}T${endTime}:00`,
                            backgroundColor: backgroundColor,
                            borderColor: backgroundColor,
                            classNames: ['work-schedule-event'],
                            extendedProps: {
                                shiftInfo: typeof scheduleInfo === 'object' ? scheduleInfo : { timeRange }
                            }
                        });
                    }
                }
                
                console.log("events", events);
                return events;
            },
            renderEventContent(eventInfo) {
                const shiftInfo = eventInfo.event.extendedProps.shiftInfo;
                let title = '工作时间';
                let timeRange = eventInfo.timeText || '';
                
                // 处理班次信息
                if (shiftInfo) {
                    if (shiftInfo.name) {
                        title = shiftInfo.name;
                    }
                    
                    if (shiftInfo.timeRange) {
                        timeRange = shiftInfo.timeRange;
                    }
                }
                
                // 简化显示，只展示班次名称和时间范围
                return {
                    html: `<div class="fc-content">
                            <div class="fc-time">${timeRange}</div>
                            <div class="fc-title">${title}</div>
                           </div>`
                };
            },
            
            // 根据班次ID返回不同的颜色
            getShiftColor(shiftId) {
                // 根据班次ID返回不同的颜色
                const colorMap = {
                    1: '#42b983', // 早班 - 绿色
                    2: '#409EFF', // 中班 - 蓝色
                    3: '#6959CD', // 晚班 - 紫色
                    4: '#FF9800', // 全天班 - 橙色
                    5: '#9C27B0', // 夜间值班 - 深紫色
                    6: '#2196F3', // 门诊早班 - 浅蓝色
                    7: '#00BCD4', // 门诊午班 - 青色
                    8: '#FF5722', // 急诊白班 - 红橙色
                    9: '#673AB7', // 急诊夜班 - 深紫色
                    10: '#4CAF50', // 手术室班 - 绿色
                };
                
                return colorMap[shiftId] || '#42b983'; // 默认返回绿色
            }
        },
        watch: {
            scheduleData: {
                handler(newVal) {
                    if (newVal) {
                        this.calendarOptions = {
                            ...this.calendarOptions,
                            events: this.generateEvents()
                        };
                    }
                },
                deep: true
            }
        }
    }
</script>

<style scoped>
.fc-content {
    padding: 4px 6px;
    white-space: normal !important; /* 允许文本换行 */
    overflow: visible !important; /* 允许内容溢出 */
}

.fc-time {
    font-size: 0.85em;
    color: #333;
    font-weight: bold;
    margin-bottom: 2px;
}

.fc-title {
    font-weight: bold;
    font-size: 0.9em;
    margin-bottom: 2px;
    white-space: normal !important; /* 允许标题换行 */
    word-break: break-word; /* 在单词间换行 */
}

.fc-description {
    font-size: 0.8em;
    color: #666;
    white-space: normal !important; /* 允许描述换行 */
    word-break: break-word; /* 在单词间换行 */
}

:deep(.fc-event) {
    cursor: pointer;
    border-radius: 4px;
    min-height: 30px;
    margin-bottom: 2px;
    overflow: visible !important; /* 允许内容溢出 */
}

:deep(.fc-day-today) {
    background-color: #f8f9fa !important;
}

:deep(.work-schedule-event) {
    border-left: 4px solid #42b983;
    background-color: rgba(66, 185, 131, 0.1);
    padding-left: 5px;
    white-space: normal !important; /* 允许文本换行 */
    height: auto !important; /* 允许高度自适应 */
    max-height: none !important; /* 取消最大高度限制 */
}

:deep(.work-schedule-event .fc-content) {
    color: #2c3e50;
    white-space: normal !important; /* 允许文本换行 */
}

:deep(.fc-daygrid-event-harness) {
    margin-bottom: 2px;
}

:deep(.fc-daygrid-day-events) {
    min-height: 2em;
    padding-top: 2px;
    padding-bottom: 2px;
}

:deep(.fc-daygrid-day-frame) {
    min-height: 100px;
}

:deep(.fc-daygrid-day-number) {
    font-weight: bold;
}
</style>