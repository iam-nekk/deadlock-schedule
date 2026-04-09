class Scheduler {
    constructor(schedule = {}) {
        this.time = 0
        this.running = false
        this.schedule = schedule
        this._timer = null
    }

    start() {
        console.log('Scheduler started')
        if (this.running) return
        if (offset_time_input.value) {
            const offsetTime = convertTimeToSeconds(offset_time_input.value)
            if (isNaN(offsetTime)) {
                console.log('Please enter a valid offset time (1:30 or 90). Starting at 0:00.')
            } else {
                this.time = offsetTime - 1 // the first tick will add 1 second, so we start at offsetTime - 1
                console.log(`Starting with offset time: ${convertTime(this.time)}`)
            }
        }
        this.running = true
        this._loop()
        displayState('Running')
    }

    pause() {
        console.log('Scheduler paused')
        if (!this.running) return
        this.running = false
        clearTimeout(this._timer)
        displayState('Paused')
    }

    resume() {
        console.log('Scheduler resumed')
        if (this.running) return
        this.running = true
        this._loop()
        displayState('Running')
    }

    reset() {
        console.log('Scheduler reset')
        this.pause()
        this.time = 0
        displayState('Stopped')
        displayTime(null)
        // clear events        
        event_div.innerHTML = ''
    }

    repeat(event, interval) {
        const repeatTime = this.time + interval
        if (!this.schedule[repeatTime]) {
            this.schedule[repeatTime] = []
        }
        const newEvent = {"name": event.name, "thenRepeatEvery": interval}
        if (this.schedule[repeatTime].some(e => e.name === event.name && e.thenRepeatEvery === interval)) {
            return
        }
        this.schedule[this.time + interval].push(newEvent)
    }

    addTime(seconds) {
        // check for positive number        
        if (seconds > 0) {
            const previousTime = this.time
            for (let i = previousTime; i < previousTime + seconds; i++) {
                this.time++
                const events = this.schedule[this.time]
                if (events) {
                    this._runEvents(events)
                }
            }
        }
        else {
            this.time += seconds
        }
        displayTime(this.time)
    }

    _loop() {
        if (!this.running) return
        
        this._tick()

        this._timer = setTimeout(() => this._loop(), 1000)
    }
    
    _tick() {
        this.time++
        console.log(this.time, convertTime(this.time))
        displayTime(this.time)
        const events = this.schedule[this.time]
        if (events) {
            this._runEvents(events)
        }
    }

    _runEvents(events) {
        events.forEach(event => {
            console.log(`Time ${this.time}: ${event.name}`)
            notifyUser(event.name, this.time)
            if (event.thenRepeatEvery) {
                this.repeat(event, event.thenRepeatEvery)
            }
        })
    }
}

let scheduler
const state_display = document.getElementById('state')
const time_display = document.getElementById('time-display')
const event_div = document.getElementById('events')
const audio_element = document.getElementById('notification-audio')
const add_time_input = document.getElementById('add-time')
const offset_time_input = document.getElementById('offset-time')

const notification_div = document.getElementById('notification-pop')
if (!("Notification" in window)) {
    notification_div.parentElement.removeChild(notification_div)
} else if (Notification.permission !== 'default') {
    notification_div.parentElement.removeChild(notification_div)
}

function run(){
    if (scheduler) {
        scheduler.start()
        return
    }
    fetch('./schedule.json')
        .then(response => response.json())
        .then(schedule => {
            scheduler = new Scheduler(schedule)
            scheduler.start()
        })
        .catch(error => console.error('Error loading schedule:', error))
}

function notifyUser(message, time) {
    if ("Notification" in window ) {
        if (Notification.permission === 'granted') {
            new Notification(message)
        }
    }
    
    audio_element.currentTime = 0
    audio_element.play()
    
    if (navigator.vibrate) {
        navigator.vibrate(200) 
    }

    const eventElement = document.createElement('li')
    eventElement.textContent = `${convertTime(time)}: ${message}`
    event_div.insertBefore(eventElement, event_div.firstChild)
}

function addTime(){
    if (!scheduler) return
    const additionalTime = convertTimeToSeconds(add_time_input.value)
    if (isNaN(additionalTime)) {
        alert('Please enter a valid number of seconds to add.')
        return
    }
    scheduler.addTime(additionalTime)
    displayTime(scheduler.time)
    add_time_input.value = ''
}

function displayState(state) {
    state_display.textContent = `${state}`
}

function displayTime(seconds) {
    if (seconds == null) {
        time_display.textContent = 'No game started'
        return
    } 
    time_display.textContent = `Time: ${convertTime(seconds)}`
}

function convertTime(seconds) {
    let isTimeNegative = false
    if (seconds < 0) {
        isTimeNegative = true
        seconds = Math.abs(seconds)
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    return isTimeNegative ? `-${timeString}` : timeString
}

function convertTimeToSeconds(timeStr) {
    let isTimeNegative = false
    if (timeStr.startsWith('-')) {
        isTimeNegative = true
        timeStr = timeStr.substring(1)
    }
    const [minutes, seconds] = timeStr.split(':').map(Number)
    console.log(timeStr, minutes, seconds, isTimeNegative)
    
    if (seconds === undefined) {
        if (isTimeNegative) return -minutes
        
        return minutes
    }
    if (isTimeNegative) return -(minutes * 60 + seconds)
    return minutes * 60 + seconds
}