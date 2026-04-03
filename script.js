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
        displayTime(this.time)
    }

    repeat(event, interval) {
        const repeatTime = this.time + interval
        if (!this.schedule[repeatTime]) {
            this.schedule[repeatTime] = []
        }
        this.schedule[this.time + interval].push({"name": event.name, "thenRepeatEvery": interval})
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
            events.forEach(event => {
                console.log(`Time ${this.time}: ${event.name}`)
                if (event.thenRepeatEvery) {
                    this.repeat(event, event.thenRepeatEvery)
                }
            })
        }
    }
}

let scheduler
const state_display = document.getElementById('state')
const time_display = document.getElementById('time-display')

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

function displayState(state) {
    state_display.textContent = `State: ${state}`
}

function displayTime(seconds) {
    time_display.textContent = `Time: ${convertTime(seconds)}`
}

function convertTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}