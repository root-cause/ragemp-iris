// https://wiki.rage.mp/index.php?title=Entity::getType
const ENTITY_TYPE_VEHICLE = 2;
const ENTITY_TYPE_OBJECT = 3;

// Create some interactions
// "eventName" and "selectedFn" properties only work with the default iris-ui script, they're intended to show two simple ways to handle interactions.
const myVehicleInteraction = Iris.createInteraction(Iris.SearchType.EntityType, ENTITY_TYPE_VEHICLE, {
    name: "Generic vehicle interaction (get remoteId)",
    eventName: "my_custom_event_name"
});

const myObjectInteraction = Iris.createInteraction(Iris.SearchType.EntityType, ENTITY_TYPE_OBJECT, {
    name: "Generic object interaction (get handle)",
    selectedFn: function(entityHandle) {
        mp.gui.chat.push(`This object's handle is: ${entityHandle}`);
    }
});

const adderOnlyInteraction = Iris.createInteraction(Iris.SearchType.EntityModel, mp.game.joaat("adder"), {
    name: "Adder only interaction",
    eventName: "adder_option_clicked",
    order: 99 // make it the top option
});

// Liquor store example (non-functional)
const mp_m_shopkeep_01 = mp.game.joaat("mp_m_shopkeep_01");
mp.peds.new(mp_m_shopkeep_01, new mp.Vector3(-2966.05, 391.43, 15.05), 90.0, 0);

// Options for the shopkeeper
Iris.createInteraction(Iris.SearchType.EntityModel, mp_m_shopkeep_01, { name: "Ask about his day"});
Iris.createInteraction(Iris.SearchType.EntityModel, mp_m_shopkeep_01, { name: "Pay for items" });
Iris.createInteraction(Iris.SearchType.EntityModel, mp_m_shopkeep_01, { name: "Threaten" });

// Options for various items inside the store
Iris.createInteraction(Iris.SearchType.EntityModel, mp.game.joaat("v_ret_ml_sweetego"), { name: "Add EgoChaser to cart ($5)" });
Iris.createInteraction(Iris.SearchType.EntityModel, mp.game.joaat("v_ret_ml_sweet4"), { name: "Add Sweet Nothings to cart ($2)" });
Iris.createInteraction(Iris.SearchType.EntityModel, mp.game.joaat("v_ret_ml_sweet3"), { name: "Add P's & Q's to cart ($1)" });
Iris.createInteraction(Iris.SearchType.EntityModel, mp.game.joaat("v_ret_ml_beeram"), { name: "Add A. M. Beer (6-pack) to cart ($12)" });
Iris.createInteraction(Iris.SearchType.EntityModel, mp.game.joaat("v_ret_ml_beerdus"), { name: "Add Dusche Gold (6-pack) to cart ($14)" })

// Event handlers
function handleGetVehicleRemoteId(entityHandle) {
    const vehicle = mp.vehicles.atHandle(entityHandle);
    if (vehicle) {
        mp.gui.chat.push(`This vehicle's remoteId is: ${vehicle.remoteId}`);
    }
}

function handleAdderClick() {
    mp.gui.chat.push("You found the adder exclusive interaction... aaand it's gone.");
    Iris.removeInteraction(adderOnlyInteraction);
    Iris.setActive(false);
}

// Register event handlers
mp.events.add({
    "my_custom_event_name": handleGetVehicleRemoteId,
    "adder_option_clicked": handleAdderClick
});
