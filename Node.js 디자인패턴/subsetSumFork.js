const EventEmitter = require('events').EventEmitter;
const ProcessPool = require('./processPool');
const workers = new ProcessPool(__dirname + '/subsetSumWorker.js', 2);

class SubsetSumFork extends EventEmitter {
    constructor(sum, set) {
        super();
        this.sum = sum;
        this.set = set;
    }

    start() {
        workers.acquire((err, worker) => {
        worker.send({sum: this.sum, set: this.set});

        const onMessage = msg => {
            if (msg.event === 'end') {
                worker.removeListener('message', onMessage);
                workers.release(worker);
            }

            this.emit(msg.event, msg.data);
        };

        worker.on('message', onMessage);
        });
    }
}

module.exports = SubsetSumFork;