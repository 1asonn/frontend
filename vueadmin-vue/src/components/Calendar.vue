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
                    firstDay: 1, // Start week from Monday
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    },
                    buttonText: {
                        today: '今天',
                        month: '月',
                        week: '周'
                    },
                    dayHeaderFormat: { weekday: 'short' },
                    slotMinTime: '06:00:00',
                    slotMaxTime: '22:00:00'
                },
            }
        },
        methods: {
            generateEvents() {
                const events = [];
                const startDate = new Date(); // Current date
                const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                
                // Get the start of the current week
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const currentDay = currentDate.getDay();
                currentDate.setDate(currentDate.getDate() - currentDay);

                // Generate events for next 12 weeks
                for (let week = 0; week < 12; week++) {
                    daysOfWeek.forEach((day, index) => {
                        const scheduleTime = this.scheduleData[day];
                        if (scheduleTime && scheduleTime !== '休息') {
                            const [startTime, endTime] = scheduleTime.split('-');
                            const eventDate = new Date(currentDate);
                            eventDate.setDate(currentDate.getDate() + (week * 7) + index);
                            
                            events.push({
                                title: scheduleTime,
                                start: `${eventDate.toISOString().split('T')[0]}T${startTime}:00`,
                                end: `${eventDate.toISOString().split('T')[0]}T${endTime}:00`,
                                backgroundColor: '#42b983',
                                borderColor: '#42b983',
                                classNames: ['work-schedule-event']
                            });
                        }
                    });
                }
                console.log("events",events)
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