"use strict";

var ActionTypes = require('./ActionTypes');
var invariant_violation = require('./invariant_violation');
var invariant = require('./invariant');
var _ = require('underscore');
var CardTypes = require('./CardTypes');
var God = require('./God');
var Phases = require('./Phases');
var GameData = require('./GameData');
var fs = require('fs');

var TURNS_PER_AGE = 8;

function Card(id, name, type, cost, ages, effect) {
  this.id_ = id;
  this.name = name;
  this.type = type;
  this.cost = cost;
  this.ages = ages;
  this.effect = effect;

  this.faceDown = false;
  this.position = null;

  return this;
}
Card.prototype.getID = function() {
  return this.id_;
};
Card.prototype.toJSON = function() {
  return {
    id: this.id_,
    name: this.name,
    type: this.type,
    cost: this.cost,
    ages: this.ages,
    effect: this.effect,
    faceDown: this.faceDown,
    position: this.position,
  };
};

function GodPowerCard(id, name, god, cost, age, phase, effect) {
  this.id_ = id;
  this.name = name;
  this.god = god;
  this.cost = cost;
  this.age = age;
  this.phase = phase;
  this.effect = effect;

  this.faceDown = false;
  this.position = null;

  return this;
}

GodPowerCard.prototype.getID = function () {
  return this.id_;
};

GodPowerCard.prototype.toJSON = function() {
  return {
    id: this.id_,
    name: this.name,
    god: this.god,
    cost: this.cost,
    phase: this.phase,
    effect: this.effect,
    faceDown: this.faceDown,
    position: this.position,
  };
};

function Deck() {
  this.cards_ = [];
  return this;
}
Deck.prototype.addCardsToTop = function(cards) {
  this.cards_ = this.cards_.concat(cards);
};
Deck.prototype.shuffle = function() {
  this.cards_ = _.shuffle(this.cards_);
};
Deck.prototype.count = function() {
  return this.cards_.length;
};
Deck.prototype.drawOne = function() {
  if (this.cards_.length > 0) {
    return this.cards_.pop();
  }
  return null;
};
Deck.prototype.drawAll = function() {
  var ret = this.cards_;
  this.cards_ = [];
  return ret;
};
Deck.prototype.toJSON = function() {
  return {
    cards: _.invoke(this.cards_, 'toJSON'),
  };
};

function Player(userID, god) {
  this.userID_ = userID;
  this.god_ = god;

  this.hand = [];
  this.deck = new Deck();
  this.discard = [];
  this.board = [];
  this.private_draft = [];
  this.public_draft = [];
  this.card_notes = {};
  this.gpboard = [];
  this.counters = {
    wood: 0,
    food: 0,
    ore: 0,
    gold: 0,

    military: 0,
    intellect: 0,
    favor: 0,

    vps: 0,

    spent_military: 0,
    spent_intellect: 0,
    spent_variable:0,
  };
  this.ready = false;
  this.usedGodActive = false;

  return this;
}
Player.prototype.getID = function () {
  return this.userID_;
};
Player.prototype.getName = function () {
  return this.name_;
};
Player.prototype.getGod = function () {
  return this.god_;
};
Player.prototype.toJSON = function () {
  return {
    userID: this.userID_,
    god: this.god_.toJSON(),
    deck: this.deck.toJSON(),
    hand: _.invoke(this.hand, 'toJSON'),
    discard: _.invoke(this.discard, 'toJSON'),
    board: _.invoke(this.board, 'toJSON'),
    gpboard: _.invoke(this.gpboard, 'toJSON'),
    counters: this.counters,
    ready: this.ready,
    usedGodActive: this.usedGodActive,
    public_draft: this.public_draft,
    private_draft: this.private_draft,
    card_notes: this.card_notes,
  };
};

function Game(players) {
  this.id_ = _.uniqueId('game_');
  this.players_ = players;

  this.lastCardID_ = 100;
  this.cardsByID_ = {};

  this.deck_ = new Deck();
  this.table_ = [];
  this.knowledgePile_ = [];
  this.basicPile_ = [];
  this.discard_ = [];

  this.age_ = 1;
  this.turn_ = 0;
  this.phase_ = Phases.getPhaseOrder()[0];

  this.actions_ = [];
  this.messages_ = [];
  this.sequenceID_ = 0;

  this.cardDefinitions_ = null;
  this.gpcardDefinitions_ = null;

  this.thinkingStartTimestampByPlayerID_ = {};
  this.phaseThinkingMillisByPlayerID_ = {};
  this.phaseTimingData_ = [];

  return this;
}
Game.prototype.getID = function() {
  return this.id_;
};
Game.prototype.getSequenceID = function() {
  return this.sequenceID_;
};
Game.prototype.getPlayers = function() {
  return this.players_;
};
Game.prototype.getPlayerByID = function(userID) {
  return _.find(this.players_, function(player) {
    return player.getID() === userID;
  });
};
Game.prototype.getTable = function() {
  return this.table_;
};
Game.prototype.getAge = function() {
  return this.age_;
};
Game.prototype.spawnCard = function(card_def) {
  var card = new Card(this.lastCardID_, card_def.name, card_def.type, card_def.cost, card_def.ages, card_def.effect);
  this.lastCardID_ += 1;
  this.cardsByID_[card.getID()] = card;
  return card;
};
Game.prototype.spawnGPCard = function(card_def) {
  var card = new GodPowerCard(this.lastCardID_, card_def.name, card_def.god, card_def.cost, card_def.age, card_def.phase, card_def.effect);
  this.lastCardID_ += 1;
  this.cardsByID_[card.getID()] = card;
  return card;
};

Game.prototype.bumpSequenceID = function() {
  this.sequenceID_ += 1;
};

Game.prototype.setUpGame = function() {
  this.gameStartTimestamp_ = Date.now();
  this.cardDefinitions_ = GameData.getCardData();
  this.gpcardDefinitions_ = GameData.getGPCardData();
  this.godData_ = God.getAllGods();
  var starting_card_def = _.find(card_definitions, function(def) {
    return def.cost === 'Starting Card';
  });
  _.each(this.players_, function(player) {
    player.board.push(this.spawnCard(starting_card_def));
    _.each(player.getGod().getStartingBuildingNames(), function (building_name) {
      var starting_card_god_def = _.find(card_definitions, function(def) {
        return def.name === building_name;
      });
      player.board.push(this.spawnCard(starting_card_god_def));
    }, this);
  }, this);

  this.age_ = 0;
  this.turn_ = TURNS_PER_AGE;
  this.phase_ = _.last(Phases.getPhaseOrder());
  this.nextPhase();
};

Game.prototype.setUpAge = function(age) {
  this.discard_ = this.discard_.concat(this.deck_.drawAll());
  this.discard_ = this.discard_.concat(this.table_);
  this.table_ = [];
  this.basicPile_ = [];
  this.knowledgePile_ = [];

  this.age_ = age;
  var building_cards = [];
  var knowledge_cards = [];
  var epic_cards = [];
  _.each(this.cardDefinitions_, function(card_def) {
    if (card_def.cost === 'Starting Card') {
      return;
    }
    if (card_def.type === CardTypes.BUILDING) {
      for (var i = 0; i < card_def.ages[age - 1]; i++) {
        building_cards.push(this.spawnCard(card_def));
      }
    } else if (card_def.type === CardTypes.KNOWLEDGE) {
      if (card_def.ages[age - 1] === 1) {
        var card = this.spawnCard(card_def);
        card.position = this.knowledgePile_.length;
        this.knowledgePile_.push(card);
      }
    } else if (card_def.type === CardTypes.EPIC) {
      if (age === 3) {
        epic_cards.push(this.spawnCard(card_def));
      }
    } else if (card_def.type === CardTypes.BASIC_BUILDING)  {
      this.basicPile_.push(this.spawnCard(card_def));
    } else {
      invariant_violation("unknown card type " + card_def.type);
    }
  }, this);
  // add 8(N+1) total buildings to the top of the deck, N=this.players_.length
  // N of those buildings should be wonders if it is the third age.
  if (age === 3) {
    this.deck_.addCardsToTop(_.sample(building_cards, 1 + (this.players_.length + 1) * (TURNS_PER_AGE - 1)));
    this.deck_.addCardsToTop(_.sample(epic_cards, this.players_.length));
  } else {
    this.deck_.addCardsToTop(_.sample(building_cards, (this.players_.length + 1) * TURNS_PER_AGE));
  }
  this.deck_.shuffle();

  // deal out player hands
  _.each(this.players_, function(player) {

    _.each(this.gpcardDefinitions_, function(card_def) {
      if (card_def.age === age && 
         (card_def.god === "Any" || player.getGod().getName() === card_def.god)) {
        player.deck.addCardsToTop([this.spawnGPCard(card_def)]);
      }
    }, this);
    player.public_draft = [];
    player.private_draft = [];
    _.each(player.gpboard, function(card) {
      card.faceDown = false;
    });
    player.discard = player.discard.concat(player.gpboard);
    player.gpboard = [];
    player.discard = player.discard.concat(player.hand);
    player.hand = [];
    player.deck.addCardsToTop(player.discard);
    player.discard = [];
    player.deck.shuffle();
  }, this);
  // reset resources
  _.each(this.players_, function(player) {
    player.usedGodActive = false;
    player.counters.wood = 0;
    player.counters.ore = 0;
    player.counters.food = 0;
    player.counters.gold = 0;
    player.counters.military = 0;
    player.counters.intellect = 0;
    player.counters.favor = 0;
  });

  // initialize first turn
  this.setUpTurn(1);

  this.addActionHelper({
    type: ActionTypes.SET_UP_AGE,
    payload: {
      age: this.age_,
    }
  });
  this.bumpSequenceID();
};

Game.prototype.setUpTurn = function(turn) {
  this.discard_ = this.discard_.concat(this.table_);
  this.table_ = [];
  for (var i = 0; i < this.players_.length + 1 && this.deck_.count() > 0; i++) {
    var new_card = this.deck_.drawOne();
    new_card.position = i;
    this.table_.push(new_card);
  }
  _.each(this.players_, function(player) {
    _.each(player.gpboard, function(card) {
      card.faceDown = false;
    });
    player.discard = player.discard.concat(player.gpboard);
    while (player.hand.length < 5 && player.deck.count() > 0) {
      player.hand.push(player.deck.drawOne());
    }
    player.gpboard = [];
    player.counters.spent_variable = 0;
    player.counters.spent_military = 0;
    player.counters.spent_intellect = 0;
    player.private_draft = [];
    player.public_draft = [];
  });
  this.turn_ = turn;
  this.phase_ = Phases.getPhaseOrder()[0];
  this.addActionHelper({
    type: ActionTypes.SET_UP_TURN,
    payload: {
      turn: this.turn_,
    }
  });
};

Game.prototype.saveTimeStats = function() {
  var timeStats = {
    total_game_time: Date.now() - this.gameStartTimestamp_,
    phase_timing_data: this.phaseTimingData_,
  };
  var contents = JSON.stringify(timeStats);
  var filename = 'timing_' + this.getID() + '.json';
  fs.writeFile(filename, contents, function (err) {
    console.log('saved timing data to file', filename, 'error', err);
  });
};

Game.prototype.nextPhase = function() {
  if (this.phaseStartTimestamp_) {
    var elapsed = Date.now() - this.phaseStartTimestamp_;
    var timingStats = {
      age: this.age_,
      turn: this.turn_,
      phase: this.phase_,
      elapsed_phase_time: elapsed,
      elapsed_phase_time_by_player_id: this.phaseThinkingMillisByPlayerID_,
      elapsed_game_time: Date.now() - this.gameStartTimestamp_,
    };
    this.phaseTimingData_.push(timingStats);
    this.addActionHelper({
      type: ActionTypes.END_OF_PHASE,
      payload: timingStats,
    });
    this.saveTimeStats();
  }
  this.phaseStartTimestamp_ = Date.now();
  this.phaseThinkingMillisByPlayerID_ = {};
  this.thinkingStartTimestampByPlayerID_ = {};
  _.each(this.players_, function(player) {
    this.phaseThinkingMillisByPlayerID_[player.getID()] = 0;
    this.thinkingStartTimestampByPlayerID_[player.getID()] = null;
  }, this);

  var phase_order = Phases.getPhaseOrder();
  for (var i = 0; i < phase_order.length; i++) {
    if (phase_order[i] === this.phase_) {
      this.phase_ = phase_order[(i + 1) % phase_order.length];
      break;
    }
  }
  if (this.phase_ === phase_order[0]) {
    if (this.turn_ === TURNS_PER_AGE) {
      this.setUpAge(this.age_ + 1);
    } else {
      this.setUpTurn(this.turn_ + 1);
    }
  }
  _.each(this.players_, function(p) {
    p.ready = false;
  });
  this.addActionHelper({
    type: ActionTypes.SET_UP_PHASE,
    payload: {
      age: this.age_,
      turn: this.turn_,
      phase: this.phase_,
    }
  });

  if (this.phase_ === Phases.MOBILIZATION) {
    _.each(this.players_, function(player) {
      player.public_draft = player.private_draft;
      if (player.public_draft.length === 1) {
        player.ready = true;
      } else {
        player.private_draft = [];
      }
    });
  } else if (this.phase_ === Phases.WAR) {
    var card_id_to_count = {};
    _.each(this.players_, function(player) {
      player.public_draft = player.private_draft;
      _.each(player.public_draft, function(card_id) {
        var existing = card_id_to_count[card_id];
        card_id_to_count[card_id] = existing ? existing + 1 : 1;
      });
    });
    _.each(this.players_, function(player) {
      var knowledge_ids = _.invoke(this.knowledgePile_, 'getID');
      player.ready = _.every(player.public_draft, function(card_id) {
        return card_id_to_count[card_id] <= 1 &&
               !_.contains(knowledge_ids, card_id);
      });
    }, this);
  } else if (this.phase_ === Phases.RESOLUTION) {
    _.each(this.players_, function(player) {
      player.private_draft = [];
      var spent = {
        military: player.counters.spent_military,
        intellect: player.counters.spent_intellect,
      };
      player.counters.military -= spent.military;
      player.counters.intellect -= spent.intellect;
      var roll = [];
      for (var i = 0; i < this.age_; i++) {
       roll.push(Math.floor(Math.random() * 6) + 1);
      }
      this.addActionHelper({
        type: ActionTypes.HANDLE_WAR,
        payload: {
          age: this.age_,
          turn: this.turn_,
          userID: player.getID(),
          roll: roll,
          spent: spent,
        }
      });
    }, this);
  }

  var all_ready = _.every(_.pluck(this.players_, 'ready'));
  if (all_ready) {
    this.nextPhase();
  } else {
    _.each(this.players_, function(player) {
      if (!player.ready) {
        this.thinkingStartTimestampByPlayerID_[player.getID()] = Date.now();
      }
    }, this);
  }
}

Game.prototype.addActionHelper = function(action) {
  action.timestamp = Date.now();
  this.actions_.push(action);
};

Game.prototype.addAction = function(action) {
  switch (action.type) {
    case ActionTypes.RESOURCE_CHANGE: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      player.counters[action.payload.resourceName] += action.payload.delta;
      break;
    }
    case ActionTypes.BUILD_KNOWLEDGE_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(this.knowledgePile_, function(card) {
        return card.getID() === action.payload.cardID;
      }, this);
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      this.knowledgePile_ = _.without(this.knowledgePile_, card);
      card.position = null;
      player.board.push(this.spawnCard(card));
      break;
    }
    case ActionTypes.BUILD_BASIC_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(this.basicPile_, function(card) {
        return card.getID() === action.payload.cardID;
      }, this);
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      player.board.push(this.spawnCard(card));
      break;
    }
    case ActionTypes.BUILD_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(this.table_, function(card) {
        return card.getID() === action.payload.cardID;
      }, this);
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      this.table_ = _.without(this.table_, card);
      card.position = null;
      player.board.push(card);
      break;
    }
    case ActionTypes.SELECT_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(this.table_, function(card) {
        return card.getID() === action.payload.cardID;
      }, this);
      if (!card) {
        card = _.find(this.basicPile_, function(card) {
          return card.getID() === action.payload.cardID;
        }, this);
      }
      if (!card) {
        card = _.find(this.knowledgePile_, function(card) {
          return card.getID() === action.payload.cardID;
        }, this);
      }
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      if (this.phase_ === Phases.PLANNING) {
        if (_.contains(player.private_draft, card.getID())) {
          player.private_draft = _.without(player.private_draft, card.getID());
        } else {
          player.private_draft.push(card.getID());
        }
      } else if (this.phase_ === Phases.MOBILIZATION) {
        player.private_draft = [card.getID()];
      }
      break;
    }
    case ActionTypes.PLAY_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(player.hand, function(card) {
        return card.getID() === action.payload.cardID;
      });
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      player.hand = _.without(player.hand, card);
      player.gpboard.push(card);
      break;
    }
    case ActionTypes.UNDO_GP_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(player.gpboard, function(card) {
        return card.getID() === action.payload.cardID;
      });
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      player.gpboard = _.without(player.gpboard, card);
      card.faceDown = false;
      player.hand.push(card);
      break;
    }
    case ActionTypes.ACTIVATE_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find card', action.payload.userID);
        return;
      }
      var card = _.find(player.gpboard, function(card) {
        return card.getID() === action.payload.cardID;
      });
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      card.faceDown = false;
      break;
    }
    case ActionTypes.DISCARD_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(player.gpboard, function(card) {
        return card.getID() === action.payload.cardID;
      });
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      player.gpboard = _.without(player.gpboard, card);
      player.discard.push(card);
      break;
    }
    case ActionTypes.UNDISCARD_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(player.discard, function(card) {
        return card.getID() === action.payload.cardID;
      });
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      player.discard = _.without(player.discard, card);
      player.gpboard.push(card);
      break;
    }
    case ActionTypes.SET_CARD_NOTE: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      var card = _.find(player.board, function(card) {
        return card.getID() === action.payload.cardID;
      });
      if (!card) {
        console.log('could not find card', action.payload.cardID);
        return;
      }
      player.card_notes[action.payload.cardID] = action.payload.noteText;
      break;
    }
    case ActionTypes.CHANGE_READY_STATE: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      player.ready = action.payload.state;
      var now = Date.now();
      if (player.ready) {
        var elapsedMillis = now - (this.thinkingStartTimestampByPlayerID_[player.getID()] || now);
        this.phaseThinkingMillisByPlayerID_[player.getID()] += elapsedMillis;
        this.thinkingStartTimestampByPlayerID_[player.getID()] = null;
      } else {
        this.thinkingStartTimestampByPlayerID_[player.getID()] = now;
      }

      if (_.every(_.pluck(this.players_, 'ready'))) {
        this.nextPhase();
      }
      break;
    }
    case ActionTypes.USE_GOD_ACTIVE: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      player.usedGodActive = true;
      break;
    }
    case ActionTypes.NEXT_AGE: {
      this.setUpAge(this.age_ + 1);
      break;
    }
    case ActionTypes.NEXT_TURN: {
      this.setUpTurn(this.turn_ + 1);
      break;
    }
    case ActionTypes.NEXT_PHASE: {
      this.nextPhase();
      break;
    }
    case ActionTypes.SEND_CHAT: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      this.messages_.push(
        {
          user: action.payload.userID,
          text: action.payload.text,
        }
      );
      break;
    }
    case ActionTypes.DRAW_CARD: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      if (player.deck.count() > 0) {
        player.hand.push(player.deck.drawOne());
      }
      break;
    }
    case ActionTypes.DIE_ROLL: {
      var roll = Math.floor(Math.random() * 6) + 1;
      var message = 'rolled a ' + roll;
      this.messages_.push({
        user: action.payload.userID,
        type: 'die_roll',
        text: message,
      });
      break;
    }
    default:
      console.log('unknown action: ', action);
      return;
  }
  if (action.type !== ActionTypes.SEND_CHAT) {
    this.addActionHelper(action);
  }
  this.bumpSequenceID();
};

Game.prototype.toJSON = function() {
  return {
    id: this.id_,
    sequenceID: this.sequenceID_,
    lastCardID: this.lastCardID_,
    players: _.invoke(this.players_, 'toJSON'),
    deck: this.deck_.toJSON(),
    table: _.invoke(this.table_, 'toJSON'),
    basicPile: _.invoke(this.basicPile_, 'toJSON'),
    knowledgePile: _.invoke(this.knowledgePile_, 'toJSON'),
    discard: _.invoke(this.discard_, 'toJSON'),
    age: this.age_,
    turn: this.turn_,
    phase: this.phase_,
    actions: this.actions_,
    messages: this.messages_,
    cardsByID: this.cardsByID_,
    godData: this.godData_,
  };
};

module.exports = {
  Game: Game,
  Card: Card,
  Deck: Deck,
  Player: Player,
};
