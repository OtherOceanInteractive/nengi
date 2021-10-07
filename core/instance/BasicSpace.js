
// the most basic spatial structure that will work with nengi's instance
import EDictionary from '../../external/EDictionary'

function BasicSpace(ID_PROPERTY_NAME) {
    this.ID_PROPERTY_NAME = ID_PROPERTY_NAME || 'id'
    this.entities = new EDictionary(ID_PROPERTY_NAME)
    this.events = new EDictionary(ID_PROPERTY_NAME)
    this.iterationsThisTick = 0
}

BasicSpace.create = function(ID_PROPERTY_NAME) {
    return new BasicSpace(ID_PROPERTY_NAME)
}

BasicSpace.prototype.update = function () {
    // console.log("Iterations last tick:", this.iterationsThisTick)
    this.iterationsThisTick = 0
}

BasicSpace.prototype.insertEntity = function(entity) {
    this.entities.add(entity)
}

BasicSpace.prototype.removeEntity = function (entity) {
    this.entities.remove(entity)
}

BasicSpace.prototype.insertEvent = function(event) {
    this.events.add(event)    
}

BasicSpace.prototype.flushEvents = function() {
    this.events = new EDictionary(this.ID_PROPERTY_NAME)
}

BasicSpace.prototype.queryAreaEMap = function(aabb) {
    var minX = aabb.x - aabb.halfWidth
    var minY = aabb.y - aabb.halfHeight
    var maxX = aabb.x + aabb.halfWidth
    var maxY = aabb.y + aabb.halfHeight

    var entitiesInArea = new Map()

    var entities = this.entities.toArray()
    
    for (var i = 0; i < entities.length; i++) {
        var entity = entities[i]
        const radius = entity.visibilityRadius || 0

        if (entity.x - radius <= maxX
            && entity.x + radius >= minX
            && entity.y - radius <= maxY
            && entity.y + radius >= minY) {
            entitiesInArea.set(entity[this.ID_PROPERTY_NAME], entity)
        }
    }
    return entitiesInArea
}

BasicSpace.prototype.queryArea = function(aabb) {
    var minX = aabb.x - aabb.halfWidth
    var minY = aabb.y - aabb.halfHeight
    var maxX = aabb.x + aabb.halfWidth
    var maxY = aabb.y + aabb.halfHeight

    var entitiesInArea = []
    var eventsInArea = []

    var entities = this.entities.toArray()

    for (var i = 0; i < entities.length; i++) {
        var entity = entities[i]
        const radius = entity.visibilityRadius || 0

        this.iterationsThisTick++
        if (entity.x - radius <= maxX
            && entity.x + radius >= minX
            && entity.y - radius <= maxY
            && entity.y + radius >= minY) {
            entitiesInArea.push(entity)
        }
    }

    var events = this.events.toArray()

    for (var i = 0; i < events.length; i++) {
        var event = events[i]

        if (event.x <= maxX
            && event.x >= minX
            && event.y <= maxY
            && event.y >= minY) {

            eventsInArea.push(event)
        }
    }
    return { entities: entitiesInArea, events: eventsInArea}
}

BasicSpace.prototype.release = function() {

}

export default BasicSpace
