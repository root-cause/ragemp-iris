// Script constants
const MENU_BASE_X = 0.5;
const MENU_BASE_Y = 0.6;
const MENU_TEXT_GAP = 0.03;
const MENU_TEXT_FONT = 0;
const MENU_TEXT_COLOR = [255, 255, 255, 255];
const MENU_TEXT_SCALE = [0.33, 0.33];
const DISABLED_CONTROLS = [14, 15, 16, 17, 24, 25, 50, 140, 141, 142, 143, 257, 261, 262]; // https://wiki.rage.mp/index.php?title=Controls

// Menu variables
let menuData = null;
let menuIndex = 0;

// Cache game functions for a small performance boost
const { isControlJustPressed, disableControlAction, getControlNormal } = mp.game.pad;
const { getActiveScreenResolution, drawSprite } = mp.game.graphics;

// Handler functions
function onRender() {
    // Toggle interaction mode by pressing the character wheel control (LeftAlt by default)
    if (isControlJustPressed(0, 19 /* INPUT_CHARACTER_WHEEL */)) {
        Iris.setActive(!Iris.isActive());
    }

    // Draw the eye sprite/crosshair
    if (Iris.isActive()) {
        const screenRes = getActiveScreenResolution();
        const width = 32 / screenRes.x;
        const height = 32 / screenRes.y;
        drawSprite("mphud", "spectating", 0.5, 0.5, width, height, 0, 255, 255, 255, 255);

        // Some controls are disabled for a better experience
        for (const control of DISABLED_CONTROLS) {
            disableControlAction(0, control, true);
        }
    }

    // Interaction menu
    if (menuData) {
        // Handle navigation (if there are multiple options)
        if (menuData.length > 1) {
            const scrollNormal = getControlNormal(0, 198 /* INPUT_FRONTEND_RIGHT_AXIS_Y */);

            if (scrollNormal) {
                menuIndex += scrollNormal;

                if (menuIndex < 0) {
                    menuIndex = menuData.length - 1;
                } else if (menuIndex >= menuData.length) {
                    menuIndex = 0;
                }
            }
        }

        // Draw the menu
        for (let i = 0; i < menuData.length; i++) {
            const item = menuData[i];

            mp.game.graphics.drawText(menuIndex === i ? `→ ${item.name}` : item.name, [item.textX, item.textY], {
                font: MENU_TEXT_FONT,
                color: MENU_TEXT_COLOR,
                scale: MENU_TEXT_SCALE,
                outline: true
            });
        }

        // Handle selection
        if (isControlJustPressed(0, 176 /* INPUT_CELLPHONE_SELECT */) && menuData[menuIndex]) {
            const selectedItem = menuData[menuIndex];
            const entityHandle = Iris.getLastEntityHandle();

            // If the interaction has eventName property, call the specified event
            if (typeof selectedItem.eventName === "string") {
                mp.events.call(selectedItem.eventName, entityHandle);
            }

            // If the interaction has selectedFn property, call the function
            if (typeof selectedItem.selectedFn === "function") {
                selectedItem.selectedFn(entityHandle);
            }
        }
    }
}

function onStateChange(isActive) {
    mp.gui.chat.push(`Iris is now ${isActive ? "enabled" : "disabled"}.`);

    if (!isActive) {
        menuData = null;
        menuIndex = 0;
    }
}

function onFocusChange(context) {
    menuIndex = 0;

    if (context.interactions) {
        menuData = context.interactions.map((item, index) => {
            return {
                textX: MENU_BASE_X,
                textY: MENU_BASE_Y + (MENU_TEXT_GAP * index),
                ...item
            };
        });

        if (menuData.length > 0) {
            mp.gui.chat.push("This entity has interactions! Use the scroll wheel to go up/down and left click to select.");
        }
    } else {
        menuData = null;
    }
}

// Request the eye texture dictionary
mp.game.graphics.requestStreamedTextureDict("mphud", true);

// Register event handlers
mp.events.add({
    "render": onRender,
    "iris::stateChange": onStateChange,
    "iris::focusChange": onFocusChange
});
