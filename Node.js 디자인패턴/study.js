const EventEmitter = require('events');

module.exports = class Roee extends EventEmitter {
    constructor(executor) {
        super();
        const emit = this.emit.bind(this);
        this.emit = undefined;
        executor(emit);
    }
};

const Roee = require('./roee');

const ticker = new Roee((emit) => {
    let tickCount = 0;
    setInterval(() => emit('tick', tickCount++), 1000);
});

module.exports = ticker;