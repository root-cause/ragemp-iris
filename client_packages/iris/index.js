const allInteractions = [];
let interactionId = 0;
let isRunning = false;
let raycastDistance = 5.0;
let raycastFlags = 1 | 2 | 4 | 16;
let lastEntityHandle = 0;

// Cache game functions for a small performance boost
const { getCoord: getGameplayCameraCoord, getDirection: getGameplayCameraDirection } = mp.cameras.gameplay;
const { getType: getEntityType, getModel: getEntityModel } =  mp.game.entity;
const { getControlNormal } = mp.game.pad;

// Internal functions
function isMatch(interaction, entityType, entityModel, entityHandle) {
    switch (interaction.searchType) {
        case SearchType.EntityType:
            return interaction.searchValue === entityType;

        case SearchType.EntityModel:
            return interaction.searchValue === entityModel;

        case SearchType.EntityHandle:
            return interaction.searchValue === entityHandle;

        default:
            return false;
    }
}

function getInteractions(entityType, entityModel, entityHandle) {
    return allInteractions
        .filter(i => isMatch(i, entityType, entityModel, entityHandle))
        .map(i => i.interaction)
        .sort((a, b) => (b.order ?? -Infinity) - (a.order ?? -Infinity));
}

// API
const SearchType = Object.freeze({
    Invalid: 0,
    EntityType: 1,
    EntityModel: 2,
    EntityHandle: 3,
    NumSearchTypes: 4
});

/**
 * Creates an interaction.
 * @param {number} searchType
 * @param {number} target
 * @param {object} interaction Must have a `name` property. `order` (number) is also an optional property to display the interaction above/below other interactions.
 * @returns {number} The interaction ID which can be used with `getInteraction` and `removeInteraction` functions.
 */
function createInteraction(searchType, target, interaction) {
    if (!Number.isInteger(searchType)) {
        throw new TypeError("'searchType' is not an integer");
    } else if (searchType <= SearchType.Invalid || searchType >= searchType.NumSearchTypes) {
        throw new RangeError("unsupported value for 'searchType'");
    } else if (!Number.isInteger(target)) {
        throw new TypeError("'target' is not an integer");
    } else if (interaction == null) {
        throw new TypeError("'interaction' cannot be null");
    } else if (typeof interaction.name !== "string") {
        throw new TypeError("'name' is not a string");
    } else if (interaction.order && !Number.isInteger(interaction.order)) {
        throw new TypeError("'order' is not an integer");
    }

    const id = ++interactionId;
    allInteractions.push({
        id,
        searchType,
        searchValue: target,
        interaction
    });

    return id;
}

/**
 * Returns the interaction with the specified ID.
 * @param {number} interactionId
 * @returns {object|undefined} The interaction object if found, `undefined` otherwise.
 */
function getInteraction(interactionId) {
    const entry = allInteractions.find(i => i.id === interactionId);
    return entry?.interaction;
}

/**
 * Removes the interaction with the specified ID.
 * @param {number} interactionId
 * @returns {boolean} `true` if the removal is successful, `false` otherwise.
 */
function removeInteraction(interactionId) {
    const index = allInteractions.findIndex(i => i.id === interactionId);
    if (index === -1) {
        return false;
    }

    allInteractions.splice(index, 1);
    return true;
}

/**
 * Returns whether the library is scanning for interactions or not.
 * @returns {boolean}
 */
function isActive() {
    return isRunning;
}

/**
 * Sets the interaction scanning status of the library.
 * @fires `iris::stateChange` clientside event with the first argument being the new scanning status.
 * @param {boolean} value
 */
function setActive(value) {
    value = Boolean(value);

    if (value !== isRunning) {
        isRunning = value;
        
        if (!isRunning) {
            lastEntityHandle = 0;
        }

        mp.events.call("iris::stateChange", isRunning);
    }
}

/**
 * Returns the distance used for the interaction scanning raycast.
 * @returns {number}
 */
function getRaycastDistance() {
    return raycastDistance;
}

/**
 * Sets the distance used for the interaction scanning raycast.
 * @param {number} newDistance
 */
function setRaycastDistance(newDistance) {
    if (typeof newDistance !== "number") {
        throw new TypeError("'newDistance' must be a number");
    }

    raycastDistance = newDistance;
}

/**
 * Returns the flags used for the interaction scanning raycast. Refer to: https://wiki.rage.mp/index.php?title=Raycasting::testPointToPoint
 * @returns {number}
 */
function getRaycastFlags() {
    return raycastFlags;
}

/**
 * Sets the flags used for the interaction scanning raycast. Refer to: https://wiki.rage.mp/index.php?title=Raycasting::testPointToPoint
 * @param {number} newFlags
 */
function setRaycastFlags(newFlags) {
    if (typeof newFlags !== "number") {
        throw new TypeError("'newFlags' must be a number");
    }

    raycastFlags = newFlags;
}

/**
 * Returns the handle of the last entity that was hit by the interaction scanning raycast.
 * @returns {number}
 */
function getLastEntityHandle() {
    return lastEntityHandle;
}

// Event handlers
function run() {
    if (!isRunning) {
        return;
    }

    const camPos = getGameplayCameraCoord();
    const camDir = getGameplayCameraDirection();
    const rayEnd = {
        x: camPos.x + (camDir.x * raycastDistance),
        y: camPos.y + (camDir.y * raycastDistance),
        z: camPos.z + (camDir.z * raycastDistance)
    };

    const result = mp.raycasting.testPointToPoint(camPos, rayEnd, mp.players.local, raycastFlags);
    if (result) {
        let curEntityHandle = result.entity.handle ?? result.entity; // to handle both ragemp and game entities

        // hit the world, crashes the game if interacted with so consider it invalid
        const curEntityType = getEntityType(curEntityHandle);
        if (curEntityType === 0) {
            curEntityHandle = 0;
        }

        if (lastEntityHandle !== curEntityHandle) {
            if (curEntityHandle) {
                const curEntityModel = getEntityModel(curEntityHandle);
                const interactions = getInteractions(curEntityType, curEntityModel, curEntityHandle);

                mp.events.call("iris::focusChange", {
                    newEntityHandle: curEntityHandle,
                    newEntityType: curEntityType,
                    newEntityModel: curEntityModel,
                    oldEntityHandle: lastEntityHandle,
                    interactions: interactions,
                    raycastResult: result
                });
            } else {
                mp.events.call("iris::focusChange", { newEntityHandle: 0, oldEntityHandle: lastEntityHandle });
            }

            lastEntityHandle = curEntityHandle;
        }
    } else if (!result && lastEntityHandle) {
        mp.events.call("iris::focusChange", { newEntityHandle: 0, oldEntityHandle: lastEntityHandle });
        lastEntityHandle = 0;
    }
}

// Register the global variable
global.Iris = Object.freeze({
    SearchType,
    createInteraction,
    getInteraction,
    removeInteraction,
    isActive,
    setActive,
    getRaycastDistance,
    getRaycastFlags,
    setRaycastDistance,
    setRaycastFlags,
    getLastEntityHandle
});

// Register event handlers
mp.events.add("render", run);
