class EDictionary {
    constructor(ID_PROPERTY_NAME) {
        this.ID_PROPERTY_NAME = ID_PROPERTY_NAME || 'id'
        this.map = new Map()
        this._cachedArray = null
        this.object = {}
    }

    get size() {
        return this.map.size
    }

    get(id) {
        return this.map.get(id) || null
    }

    forEach(fn) {
        for (const [key, elem] of this.map) {
            fn(elem)
        }
    }

    toArray() {
        if (this._cachedArray) {
            return this._cachedArray
        }
        this._cachedArray = [...this.map.values()]
        return this._cachedArray
    }

    add(obj) {
        this._cachedArray = null
        if (typeof obj === 'object' && typeof obj[this.ID_PROPERTY_NAME] !== 'undefined') {
            this.map.set(obj[this.ID_PROPERTY_NAME], obj)
        } else {
            throw new Error('EDictionary could not add object, invalid object or object.id.')
        }
    }

    remove(obj) {
        if (typeof obj === 'object' && typeof obj[this.ID_PROPERTY_NAME] !== 'undefined') {
            return this.removeById(obj[this.ID_PROPERTY_NAME])
        } else {
            //throw new Error('EDictionary could not remove object, invalid object or object.id.')
        }
    }

    removeById(id) {
        this._cachedArray = null
        const temp = this.map.get(id)
        this.map.delete(id)
        return temp
    }
}

export default EDictionary