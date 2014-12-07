/*
 * This class is used for the different events that we could display in the log view
 */
var _ = require('underscore');

var EventType = {
    BUILD_HAND_CARD: false,
    BUILD_TABLE_CARD: false,
    DRAFT_MULTI_CHIP: false,
    DRAFT_TWO_CHIP: false, 
    RESERVE_CARD_TABLE: false, 
    RESERVE_CARD_DECK: false,
    RECEIVE_NOBLE: false,
    DISCARD_CHIPS: false,
    START_TURN: false,
};

_.each(EventType, function(value, key) {
    EventType[key] = key;
});

module.exports = EventType;


