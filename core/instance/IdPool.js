
import Binary from '../binary/Binary';

const usedMap = new Map()

function IdPool(binaryType) {
    this.min = 0
    this.max = Binary[binaryType].max

    this.pool = []
    for (var i = 0; i < this.max; i++) {
        this.pool.push(i)
    }

    this.queue = []
}

IdPool.prototype.nextId = function() {
    if (this.pool.length > 0) {
        const id = this.pool.pop()
        if(usedMap.has(id)) {
            const timesUsed = usedMap.get(id)
            usedMap.set(id, timesUsed+1)
            console.log(`reusing #${id}, ${timesUsed}`)
        } else {
            usedMap.set(id, 1)
        }
        return id
    }
    throw new Error('IdPool overflow')
}

IdPool.prototype.returnId = function(id) {
    if (id >= this.min && id <= this.max) {
        this.pool.unshift(id)
    }
}


IdPool.prototype.queueReturnId = function(id) {
    this.queue.push(id)
}

IdPool.prototype.update = function() {
    for (var i = 0; i < this.queue.length; i++) {
        this.returnId(this.queue[i])
    }
    this.queue = []
}

export default IdPool;