import EDictionary from "../../external/EDictionary";

class GridCell {
    constructor() {
        this.numberOfStaticEntities = 0;
        this.numberOfDynamicEntities = 0;
        this.staticEntities = [];
        this.dynamicEntities = [];
        this.events = [];
    }
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

export default class GridBasedInterestManagement {
    constructor(ID_PROPERTY_NAME, worldWidth, worldHeight, cellSize) {
        this.ID_PROPERTY_NAME = ID_PROPERTY_NAME || "id";
        this.events = new EDictionary(ID_PROPERTY_NAME);
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.gridCellSize = cellSize;
        this.thresholdToBeConsideredABigEntity = 400
        this.gridWidth = Math.floor(this.worldWidth / this.gridCellSize);
        this.gridHeight = Math.floor(this.worldHeight / this.gridCellSize);
        this.maxGridXIndex = this.gridWidth - 1;
        this.maxGridYIndex = this.gridHeight - 1;
        // this.AABBComparisonsThisTick = 0
        // this.numberOfEntitiesNeedingToBeMovedToANewCellThisTick = 0

        this.numberOfEntitiesInMasterList = 0;
        this.masterEntityList = [];

        this.numberOfBigEntities = 0;
        this.bigEntityList = [];

        this.cells = [];

        for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
            this.cells[i] = new GridCell();
        }
    }

    create(ID_PROPERTY_NAME) {
        return new GridBasedInterestManagement(ID_PROPERTY_NAME);
    }

    insertEntity(entity) {
        const indexInMasterList = this.masterEntityList.push(entity) - 1;

        this.numberOfEntitiesInMasterList += 1;

        entity.nengiInternalMasterListIndex = indexInMasterList;

        if (entity.visibilityRadius !== undefined && entity.visibilityRadius >= this.thresholdToBeConsideredABigEntity) {

            const indexInBigEntityList = this.bigEntityList.push(entity) - 1;

            this.numberOfBigEntities += 1;

            entity.nengiinternalBigEntityListIndex = indexInBigEntityList;
        } else {
            const cellToBeAddedTo = this.getCellFromWorldPos(entity.x, entity.y)

            entity.nengiInternalSpatialGridCell = cellToBeAddedTo

            let indexInGridCellEntityList

            if (entity.isStaticEntity) {
                indexInGridCellEntityList = cellToBeAddedTo.staticEntities.push(entity) - 1
                cellToBeAddedTo.numberOfStaticEntities += 1;
            } else {
                indexInGridCellEntityList = cellToBeAddedTo.dynamicEntities.push(entity) - 1
                cellToBeAddedTo.numberOfDynamicEntities += 1;
            }

            entity.nengiInternalSpatialGridCellEntityListIndex = indexInGridCellEntityList
        }
    }

    removeEntity(entity) {
        const indexInMasterList = entity.nengiInternalMasterListIndex

        for (var i = 0; i < this.numberOfEntitiesInMasterList; i++) {
            if (i > indexInMasterList) {
                const entityThatNeedsMasterListIndexUpdate = this.masterEntityList[i]

                entityThatNeedsMasterListIndexUpdate.nengiInternalMasterListIndex -= 1;
            }
        }

        this.masterEntityList.splice(indexInMasterList, 1)

        this.numberOfEntitiesInMasterList -= 1;

        if (entity.visibilityRadius !== undefined && entity.visibilityRadius >= this.thresholdToBeConsideredABigEntity) {

            const indexInBigEntityList = entity.nengiinternalBigEntityListIndex

            for (var i = 0; i < this.numberOfBigEntities; i++) {
                if (i > indexInBigEntityList) {
                    const entityThatNeedsBigEntityListIndexUpdate = this.bigEntityList[i]

                    entityThatNeedsBigEntityListIndexUpdate.nengiinternalBigEntityListIndex -= 1;
                }
            }

            this.bigEntityList.splice(indexInBigEntityList, 1)

            this.numberOfBigEntities -= 1;

        } else {

            const cellThatEntityBelongsTo = entity.nengiInternalSpatialGridCell

            const indexInCell = entity.nengiInternalSpatialGridCellEntityListIndex

            const arrayToUpdate = entity.isStaticEntity ? cellThatEntityBelongsTo.staticEntities : cellThatEntityBelongsTo.dynamicEntities

            for (var i = 0; i < (entity.isStaticEntity ? cellThatEntityBelongsTo.numberOfStaticEntities : cellThatEntityBelongsTo.numberOfDynamicEntities); i++) {

                if (i > indexInCell) {
                    const entityThatNeedsCellIndexUpdate = arrayToUpdate[i]

                    entityThatNeedsCellIndexUpdate.nengiInternalSpatialGridCellEntityListIndex -= 1;
                }
            }

            arrayToUpdate.splice(indexInCell, 1)

            entity.isStaticEntity ? cellThatEntityBelongsTo.numberOfStaticEntities-- : cellThatEntityBelongsTo.numberOfDynamicEntities--
        }
    }

    insertEvent(event) {
        this.events.add(event);
    }

    flushEvents() {
        this.events = new EDictionary(this.ID_PROPERTY_NAME);
    }

    getCellFromCellPos(x, y) {
        const cell = this.cells[y * this.gridWidth + x]

        if (!cell) {
            throw new Error(`Cell Position (${x, y}) did not result in a valid grid cell; math is wrong or position is fucked`)
        }
        return cell
    }

    getCellFromWorldPos(x, y) {
        const cellX = Math.floor(x.clamp(0, this.worldWidth - 1) / this.gridCellSize);
        const cellY = Math.floor(y.clamp(0, this.worldHeight - 1) / this.gridCellSize);
        const cell = this.cells[cellY * this.gridWidth + cellX]
        if (!cell) {
            throw new Error(`World Position (${x, y}) did not result in a valid grid cell; math is wrong or position is fucked`)
        }
        return cell
    }

    queryArea(nengiView) {
        const worldMinX = (nengiView.x - nengiView.halfWidth).clamp(0, this.worldWidth);
        const worldMinY = (nengiView.y - nengiView.halfHeight).clamp(0, this.worldHeight);
        const worldMaxX = (nengiView.x + nengiView.halfWidth).clamp(0, this.worldWidth);
        const worldMaxY = (nengiView.y + nengiView.halfHeight).clamp(0, this.worldHeight);
        const cellMinX = Math.floor(worldMinX / this.gridCellSize)
        const cellMinY = Math.floor(worldMinY / this.gridCellSize)

        const cellMaxX = (Math.floor(worldMaxX / this.gridCellSize)).clamp(0, this.maxGridXIndex)
        const cellMaxY = (Math.floor(worldMaxY / this.gridCellSize)).clamp(0, this.maxGridYIndex)

        let entitiesInArea = [];

        for (let cellY = cellMinY; cellY <= cellMaxY; cellY++) {
            for (let cellX = cellMinX; cellX <= cellMaxX; cellX++) {

                const cell = this.getCellFromCellPos(cellX, cellY)
                for (let s = 0; s < cell.numberOfStaticEntities; s++) {
                    let entity = cell.staticEntities[s]

                    // this.AABBComparisonsThisTick++
                    if (entity.x <= worldMaxX
                        && entity.x >= worldMinX
                        && entity.y <= worldMaxY
                        && entity.y >= worldMinY) {
                        entitiesInArea.push(entity)
                    }
                }

                for (let d = 0; d < cell.numberOfDynamicEntities; d++) {
                    let entity = cell.dynamicEntities[d]
                    // this.AABBComparisonsThisTick++
                    if (entity.x <= worldMaxX
                        && entity.x >= worldMinX
                        && entity.y <= worldMaxY
                        && entity.y >= worldMinY) {
                        entitiesInArea.push(entity)
                    }
                }
            }
        }

        for (var i = 0; i < this.numberOfBigEntities; i++) {
            var entity = this.bigEntityList[i]
            const radius = entity.visibilityRadius || 0

            if (entity.x - radius <= worldMaxX
                && entity.x + radius >= worldMinX
                && entity.y - radius <= worldMaxY
                && entity.y + radius >= worldMinY) {
                entitiesInArea.push(entity)
            }
        }

        // TODO maybe never: gridify events too; for now use identical to old
        var events = this.events.toArray()
        let eventsInArea = []
        for (var i = 0; i < events.length; i++) {
            var event = events[i]
            if (event.x <= worldMaxX
                && event.x >= worldMinX
                && event.y <= worldMaxY
                && event.y >= worldMinY) {
                eventsInArea.push(event)
            }
        }

        return { entities: entitiesInArea, events: eventsInArea };
    }

    update() {
        // this.AABBComparisonsThisTick = 0
        // this.numberOfEntitiesNeedingToBeMovedToANewCellThisTick = 0
        for (let i = 0; i < this.numberOfEntitiesInMasterList; i++) {

            let entity = this.masterEntityList[i]

            // TODO: separate big entities and static entities into their own lists so we dont have to check in the update loop

            // static entities do not move and will never need to have their cell updated
            if (entity.isStaticEntity) continue

            // Big entities dont exist in cells, skip
            if (entity.visibilityRadius !== undefined && entity.visibilityRadius >= this.thresholdToBeConsideredABigEntity) continue

            const potentiallyNewEntityCell = this.getCellFromWorldPos(entity.x, entity.y)
            const oldEntityCell = entity.nengiInternalSpatialGridCell

            // this dynamic entity did not change cells since last tick; no-op
            if (potentiallyNewEntityCell === oldEntityCell) continue

            // this.numberOfEntitiesNeedingToBeMovedToANewCellThisTick++

            const indexInCell = entity.nengiInternalSpatialGridCellEntityListIndex

            for (let j = 0; j < oldEntityCell.numberOfDynamicEntities; j++) {

                if (j > indexInCell) {
                    const entityThatNeedsCellIndexUpdate = oldEntityCell.dynamicEntities[j]

                    entityThatNeedsCellIndexUpdate.nengiInternalSpatialGridCellEntityListIndex  -= 1;
                }
            }

            oldEntityCell.dynamicEntities.splice(indexInCell, 1)

            oldEntityCell.numberOfDynamicEntities--

            entity.nengiInternalSpatialGridCell = potentiallyNewEntityCell

            const indexInNewGridCellEntityList = potentiallyNewEntityCell.dynamicEntities.push(entity) - 1

            potentiallyNewEntityCell.numberOfDynamicEntities += 1;

            entity.nengiInternalSpatialGridCellEntityListIndex = indexInNewGridCellEntityList
        }
    }

    release() {}
}
