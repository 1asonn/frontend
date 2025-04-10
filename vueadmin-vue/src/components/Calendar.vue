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
                    const scheduleTime = this.scheduleData[dayOfWeek];
                    
                    if (scheduleTime && scheduleTime !== '休息') {
                        const [startTime, endTime] = scheduleTime.split('-');
                        events.push({
                            title: scheduleTime,
                            start: `${date.toISOString().split('T')[0]}T${startTime}:00`,
                            end: `${date.toISOString().split('T')[0]}T${endTime}:00`,
                            backgroundColor: '#42b983',
                            borderColor: '#42b983',
                            classNames: ['work-schedule-event']
                        });
                    }
                }
                
                console.log("events", events);
                return events;
            },
            renderEventContent(eventInfo) {
                return {
                    html: `<div class="fc-content">
                            <div class="fc-time">${eventInfo.timeText}</div>
                            <div class="fc-title">工作时间</div>
                           </div>`
                };
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
    padding: 2px 4px;
}

.fc-time {
    font-size: 0.8em;
    color: #666;
}

.fc-title {
    font-weight: bold;
    font-size: 0.9em;
}

.fc-description {
    font-size: 0.8em;
    color: #666;
}

:deep(.fc-event) {
    cursor: pointer;
    border-radius: 3px;
}

:deep(.fc-day-today) {
    background-color: #f8f9fa !important;
}

:deep(.work-schedule-event) {
    border-left: 3px solid #42b983;
    background-color: rgba(66, 185, 131, 0.1);
    padding-left: 5px;
}

:deep(.work-schedule-event .fc-content) {
    color: #2c3e50;
}
</style>