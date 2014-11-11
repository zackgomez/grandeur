/**
 * @jsx React.DOM
 */
"use strict";
var ActionTypes = require('./ActionTypes');
var React = require('react');
var ReactAsync = require('react-async');
var ReactRouter = require('react-router-component');
var CloudListener = require('./CloudListener');
var superagent = require('superagent');
var WebSocket = require('ws');
var _ = require('underscore');
var CardTypes = require('./CardTypes');
var LobbyMutator = require('./LobbyMutator');
var LobbyStore = require('./LobbyStore');
var BaseURL = require('./BaseURL');
var UserFetcher = require('./UserFetcher');
var Session = require('./Session');
var God = require('./God');
var Phases = require('./Phases');
var Pages       = ReactRouter.Pages;
var Page        = ReactRouter.Page;
var NotFound    = ReactRouter.NotFound;
var Link        = ReactRouter.Link;
var GameStore = require('./GameStore');
var Immutable = require('immutable');
var audioContext;

var navigateToHref = function(href, cb) {
  cb = cb || function() {};
  ReactRouter.environment.defaultEnvironment.navigate(href, cb);
};

var HoverCardStore = {
  // a listener is a function of 1 argument, a Card
  addListener: function(listener) {
    this.listeners_.push(listener);
    listener();
  },
  removeListener: function(listener) {
    this.listeners_ = _.without(this.listeners_, listener);
  },
  getHoveredCard: function() { 
    return this.hoveredCard_; 
  },
  getRenderer: function() {
    return this.renderer_;
  },
  // internal
  setCard: function(card, renderer) {
    this.hoveredCard_ = card;
    this.renderer_ = renderer;
    _.each(this.listeners_, function(listener) {
      listener(card);
    });
  },

  hoveredCard_: null,
  renderer_: null,
  listeners_: [],
};

var GameMutator = {
  updateResourceCount: function(gameID, userID, resourceName, delta) {
    console.log('updateResourceCount', userID, resourceName, delta);
    this.sendAction(
      gameID,
      ActionTypes.RESOURCE_CHANGE,
      {
        userID: userID,
        resourceName: resourceName,
        delta: delta,
      }
    );
  },
  buildCard: function(gameID, userID, cardID) {
    console.log('buildCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.BUILD_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  selectCard: function(gameID, userID, cardID) {
    console.log('selectCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.SELECT_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  buildBasicCard: function(gameID, userID, cardID) {
    console.log('buildCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.BUILD_BASIC_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  buildKnowledgeCard: function(gameID, userID, cardID) {
    console.log('buildCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.BUILD_KNOWLEDGE_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  playCard: function(gameID, userID, cardID) {
    console.log('playCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.PLAY_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  undoGPCard: function(gameID, userID, cardID) {
    console.log('undoGPCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.UNDO_GP_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  activateCard: function(gameID, userID, cardID) {
    console.log('activateCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.ACTIVATE_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  discardCard: function(gameID, userID, cardID) {
    console.log('discardCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.DISCARD_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  undiscardCard: function(gameID, userID, cardID) {
    console.log('undiscardCard', userID, cardID);
    this.sendAction(
      gameID,
      ActionTypes.UNDISCARD_CARD,
      {
        userID: userID,
        cardID: cardID,
      }
    );
  },
  setCardNote: function(gameID, userID, cardID, note) {
    console.log('setting card note', userID, cardID, note);
    this.sendAction(
      gameID,
      ActionTypes.SET_CARD_NOTE,
      {
        userID: userID,
        cardID: cardID,
        noteText: note,
      }
    );
  },
  useGodActive: function(gameID, userID) {
    console.log('using god active', userID);
    this.sendAction(
      gameID,
      ActionTypes.USE_GOD_ACTIVE,
      {
        userID: userID,
      }
    );
  },
  changeReadyState: function(gameID, userID, state) {
    console.log('changing ready state', userID, state);
    this.sendAction(
      gameID,
      ActionTypes.CHANGE_READY_STATE,
      {
        userID: userID,
        state: state,
      }
    );
  },
  nextAge: function(gameID, userID) {
    console.log('nextAge', userID);
    this.sendAction(
      gameID,
      ActionTypes.NEXT_AGE,
      {
        userID: userID,
      }
    );
  },
  nextTurn: function(gameID, userID) {
    console.log('nextTurn', userID);
    this.sendAction(
      gameID,
      ActionTypes.NEXT_TURN,
      {
        userID: userID,
      }
    );
  },
  nextPhase: function(gameID, userID) {
    console.log('nextPhase', userID);
    this.sendAction(
      gameID,
      ActionTypes.NEXT_PHASE,
      {
        userID: userID,
      }
    );
  },
  sendChatMessage: function(gameID, userID, text) {
    this.sendAction(
      gameID,
      ActionTypes.SEND_CHAT,
      {
        userID: userID,
        text: text,
      }
    );
  },
  drawCard: function(gameID, userID) {
    console.log('drawCard', userID);
    this.sendAction(
      gameID,
      ActionTypes.DRAW_CARD,
      {
        userID: userID,
      }
    );
  },
  sendDieRoll: function(gameID, userID) {
    this.sendAction(
      gameID,
      ActionTypes.DIE_ROLL,
      {
        userID: userID,
      }
    );
  },

  sendAction: function(gameID, action_type, payload) {
    var action = { type: action_type, payload: payload };
    superagent.post('/api/game/' + gameID + '/add_action')
      .send({action: action})
      .set('Accept', 'application/json')
      .end(function(res) {
        if (!res.ok) {
          console.log('error sending action', res.text);
          return;
        }
      });
  },
};

var GodPowerCard = React.createClass({
  handleMouseEnter: function(e) {
    this.props.onCardEnter && this.props.onCardEnter(this.props.card);
  },
  handleMouseLeave: function(e) {
    this.props.onCardLeave && this.props.onCardLeave(this.props.card);
  },
  handleClick: function(e) {
    if (this.props.onClick) {
      this.props.onClick(this.props.card);
    }
  },
  render: function() {
    var cardCSSName = "card " + (this.props.card.god);
    if (this.props.gamePhase && this.props.gamePhase.toLowerCase() != this.props.card.phase.toLowerCase() && this.props.card.phase != "Any"){
      cardCSSName += (" wrong-phase");
    }
    if (this.props.card.faceDown) {
      return (
        <div className={"face-down-card" + (Phases.getPhaseName(this.props.gamePhase) == this.props.card.phase ? " corresponding-phase" :"")}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}>MYTHOS
        </div>
      );
    }
    var costs = <div className="card-cost gp-current">{this.props.card.cost}</div>;
    return (
      <div className={cardCSSName}
        onMouseEnter={this.handleMouseEnter} 
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}>
        <div className="card-name">{this.props.card.name}</div>
        <div className="gp-card-costs">{costs}</div>
        <div className="card-phase">{this.props.card.phase}</div>
        <div className="card-effect">{this.props.card.effect}</div>
      </div>
    );
  },
});

var Card = React.createClass({
  handleMouseEnter: function(e) {
    this.props.onCardEnter && this.props.onCardEnter(this.props.card);
  },
  handleMouseLeave: function(e) {
    this.props.onCardLeave && this.props.onCardLeave(this.props.card);
  },
  handleClick: function(e) {
    if (this.props.onClick) {
      this.props.onClick(this.props.card);
    }
  },
  handleDoubleClick: function(e) {
    this.props.onDoubleClick && this.props.onDoubleClick(this.props.card);
  },
  getDraftSelectText: function(players, private_draft_player) {
    return _.map(_.uniq(players), function(player) {
      if (player === private_draft_player) {
        return <div className="draft-text highlight">{this.props.userByID[player].name}</div>;
      } else {
        return <div className="draft-text">{this.props.userByID[player].name}</div>;
      }
    }, this);
  },
  render: function() {
    if (this.props.card.faceDown) {
      return (
        <div className="face-down-card"
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}
          >
          MYTHOS
        </div>
      );
    }
    var costs = null;
    if (this.props.card.cost !== "Starting Card") {
      costs = _.map(this.props.card.cost, function (num, key) {
        if (num === 0) {
          return null;
        }
        var cssClassName = "card-cost " + key;
        return (
          <div className={cssClassName} key={key} >{num}</div>
        );
      });
    }
    var draft_players = [];
    var private_draft_player;
    if (this.props.playerDrafts) {
      _.each(this.props.playerDrafts, function(drafts, uID) {
        if (_.contains(drafts.public_drafts, this.props.card.id)) {
          draft_players.push(uID);
        }
        if (uID === this.props.sessionPlayerID && 
            _.contains(drafts.private_drafts, this.props.card.id)) {
          private_draft_player = uID;
          draft_players.push(uID);
        }
      }, this);
    }
    return (
      <div>
        <div className={'card '+this.props.card.type}
          onMouseEnter={this.handleMouseEnter} 
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}
          >
          <div className="card-name">{this.props.card.name}</div>
          <div className="card-costs">{costs}</div>
          <div className="card-effect">{this.props.card.effect}</div>
        </div>
        <div className="card-note">{this.props.note}</div>
        {this.getDraftSelectText(draft_players, private_draft_player)}
      </div>
    );
  },
});

var HoverCard = React.createClass({
  render: function() {
    if (!this.props.card) {
      return <script />;
    }
    return (
      <div className="hover-card">
        {this.props.renderer({card:this.props.card, gameAge:this.props.gameAge, gamePhase:this.props.gamePhase})}
      </div>
    );
  },
});


var Deck = React.createClass({
  handleClick: function(e) {
    if (this.props.onClick) {
      this.props.onClick(this.props.card);
    }
  },
  render: function() {
    var expectedMax = 7.0; /* expected maximum number of cards */
    var nCards = this.props.cards.length;
    var cssDeckClassName = "face-down-card deck";
    if (nCards <= 1) {
      cssDeckClassName +=" empty";
    } else if (nCards <= expectedMax/2.0) {
      cssDeckClassName +=" half-full";
    } else if (nCards <= expectedMax*(3.0/4.0)) {
      cssDeckClassName +=" almost-full";
    } 
    return (<div className={cssDeckClassName}
                onClick={this.props.onDeckClick} >{nCards}</div>);
  },
});

var Pile = React.createClass({
  onCardEnter: function(card) {
    var cardToHover = _.clone(card);
    if (cardToHover.faceDown && this.props.showFaceDownCard) {
      cardToHover.faceDown = false;
    }
    HoverCardStore.setCard(cardToHover, this.props.renderer);
  },
  onCardLeave: function(card) {
    HoverCardStore.setCard(null, null);
  },
  render: function() {
    var rendered_cards = [];

    // size/position are only used for the drafting area
    if (this.props.size) {
      for (var i = 0; i < this.props.size; i++) {
        rendered_cards.push(
          <div className="card-space">
          </div>
          );
      }
    }
    if (false && this.props.sortable){
      console.log("sorting");
      this.props.cards = _.sortBy(this.props.cards, function(card){
          console.log(card.index);
          return card.index;
        });
    }
    _.each(this.props.cards, function(card) {
      var card_props = {
        card:card,
        key:card.id,
        onClick:this.props.onCardClick,
        onDoubleClick:this.props.onCardDoubleClick,
        onCardEnter:this.onCardEnter,
        onCardLeave:this.onCardLeave,
        gameAge:this.props.gameAge,
        gamePhase:this.props.gamePhase,
        sessionPlayerID: this.props.sessionPlayerID,
        userByID:this.props.userByID,
        playerDrafts:this.props.playerDrafts,
        note:this.props.cardNotes?this.props.cardNotes[card.id]:null,
      };
      if (this.props.size) {
        rendered_cards[card.position] = this.props.renderer(card_props);
      } else {
        rendered_cards.push(this.props.renderer(card_props));
      }
    }, this);
    return (
      <div className="pile">
        <div className="pile-title">{this.props.title}</div>
        <div className="pile-cards">{rendered_cards}</div>
      </div>
    );
  },
});

var SelfPlayerView = React.createClass({
  onBoardCardClick: function(card) {
    var note = prompt('Add a note to this card:');
    if (note) {
      GameMutator.setCardNote(this.props.gameID, this.props.user.id, card.id, note);
    }
  },
  onHandCardClick: function(card) {
    GameMutator.playCard(this.props.gameID, this.props.user.id, card.id);
  },
  onGPBoardCardClick: function(card) {
    GameMutator.discardCard(this.props.gameID, this.props.user.id, card.id);
  },
  onDiscardCardClick: function(card) {
    GameMutator.undiscardCard(this.props.gameID, this.props.user.id, card.id);
  },
  onGodActiveClick: function() {
    GameMutator.useGodActive(this.props.gameID, this.props.user.id);
  },
  onDeckClick: function() {
    GameMutator.drawCard(this.props.gameID, this.props.user.id);
  },
  render: function() {
    var useGodActiveButton = this.props.player.usedGodActive ?
      <button className="god-active used">ALREADY USED</button> :
      <button className="god-active unused" onClick={this.onGodActiveClick}>USE ABILITY</button>;
    var gpTabs = [];
    var gpPile =  
    (<div className="my-gps">
        <Pile title="" 
          cards={this.props.player.gpboard} 
          onCardClick={this.onGPBoardCardClick} 
          showFaceDownCard={true} 
          gameAge={this.props.gameAge} 
          gamePhase={this.props.gamePhase}
          renderer={GodPowerCard}/>
     </div>);
    var gpTab = {title: "My God Powers", content: gpPile};
    gpTabs.push(gpTab);
    var discardPile = 
      (<div className="my-gps">
          <Pile title="" 
            cards={this.props.player.discard} 
            onCardClick={this.onDiscardCardClick} 
            showFaceDownCard={true} 
            gameAge={this.props.gameAge} 
            gamePhase={this.props.gamePhase}
            renderer={GodPowerCard}/>
      </div>);
    var discardTabTitle = "Discard Pile" + (this.props.player.discard.length > 0 ? "  [" + this.props.player.discard.length +"]" : "");
    var discardTab = {title: discardTabTitle, content: discardPile};
    gpTabs.push(discardTab);
    return (
      <div className="self-view">
        <div className="player-name">{this.props.player.name}</div>
        <div className="hand-and-deck-view">
          <div className="my-hand">
            <Pile title={"My Hand - " + this.props.player.god.name} cards={this.props.player.hand} onCardClick={this.onHandCardClick} gameAge={this.props.gameAge} gamePhase={this.props.gamePhase} renderer={GodPowerCard}/>
          </div>
          <div className="gp-deck">
            <Deck cards={this.props.player.deck.cards} onDeckClick={this.onDeckClick}/>
          </div>
        </div>
        <div className="god-powers-and-descriptions">
          <div className="my-gps-tab">
            <GodPowersTabs tabs={gpTabs} />
          </div>
          <div className="gp-descriptions">
            <div className="self-view-god-info">
              <span> God Bonuses </span>
              <div className="self-view-god-info-item">{this.props.player.god.buildingBonus}</div>
              <div className="self-view-god-info-item">{this.props.player.god.triggeredBonus}</div>
              <div className="self-view-god-info-item">{this.props.player.god.endGameBonus}</div>
            </div>
          </div>
        </div>
       
        <Pile title={"My Board"} 
          sortable={true}
          cards={this.props.player.board} 
          renderer={Card}
          onCardClick={this.onBoardCardClick}
          cardNotes={this.props.player.card_notes} />
      </div>
    );
  },
});

var OpponentPlayerView = React.createClass({
  render: function() {
    var gpTabs = [];
    var gpPile =  
    (<div className="my-gps">
        <Pile
          title=""
          cards={this.props.player.gpboard}
          gameAge={this.props.gameAge}
          renderer={GodPowerCard} />
     </div>);
    var gpTab = {title: this.props.user.name + "'s God Powers", content: gpPile};
    gpTabs.push(gpTab);
    var discardPile = 
      (<div className="my-gps">
          <Pile title="" 
            cards={this.props.player.discard} 
            onCardClick={this.onDiscardCardClick} 
            showFaceDownCard={true} 
            gameAge={this.props.gameAge} 
            gamePhase={this.props.gamePhase}
            renderer={GodPowerCard}/>
      </div>);
    var discardTabTitle = "Discard Pile" + (this.props.player.discard.length > 0 ? "  [" + this.props.player.discard.length +"]" : "");
    var discardTab = {title: discardTabTitle, content: discardPile};
    gpTabs.push(discardTab);
    return (
      <div className="player-view" id={this.props.player.name + "-player-view-div"}>
        <div className="player-name">{this.props.player.name}</div>
        <div className="god-powers-and-descriptions">
          <div className="my-gps-tab">
            <GodPowersTabs tabs={gpTabs} />
          </div>
          <div className="gp-descriptions">
            <div className="self-view-god-info">
              <span> God Bonuses </span>
              <div className="self-view-god-info-item">{this.props.player.god.buildingBonus}</div>
              <div className="self-view-god-info-item">{this.props.player.god.triggeredBonus}</div>
              <div className="self-view-god-info-item">{this.props.player.god.endGameBonus}</div>
            </div>
          </div>
        </div>
        
        <Pile
          title={this.props.user.name + "'s Board"}
          cards={this.props.player.board}
          cardNotes={this.props.player.card_notes}
          renderer={Card} />
      </div>
    );
  },
});

var ResourceCounter = React.createClass({
  onButtonClick: function(delta) {
    this.props.onResourceChange(this.props.name, delta);
  },
  render: function() {
    var controls = [];
    if (this.props.editable) {
      controls.push(<button
        className="resource-button resource-up"
        key="up-button"
        onClick={this.onButtonClick.bind(this, 1)} >+</button>);
      controls.push('  ');
      controls.push(<button
        className="resource-button resource-down"
        key="down-button"
        onClick={this.onButtonClick.bind(this, -1)} >-</button>);
      controls.push('  ');
     
    }
    var cssResourceValue = "resource-value" + (this.props.count == 0 ? " zero" : "");
    var cssResourceName = "resource-name "+this.props.name;
    var displayName;
    var hidden = false;
    if (this.props.name == "spent_military" || this.props.name == "spent_intellect") {
      if (this.props.phase != Phases.RESOLUTION && !this.props.editable ) {
        hidden = true;
      }
    }
    switch(this.props.name) {
      case "wood":
        displayName = "W";
        break;
      case "food":
        displayName = "F";
        break;
      case "ore":
        displayName = "O";
        break;
      case "gold":
        displayName = "G";
        break;
      case "military":
        displayName = "M";
        break;
      case "intellect":
        displayName = "I";
        break;
      case "favor":
        displayName = "V";
        break;
      case "vps":
        displayName = "\u2605";
        break;
      case "spent_military":
        displayName = "M";
        break;
      case "spent_intellect":
        displayName = "I";
        break;
      case "spent_variable":
        displayName = "X";
        break;
      default: 
        displayName = "ERROR";
    }
    if (HoverCardStore.getHoveredCard()) {
      if (HoverCardStore.getRenderer() == GodPowerCard && this.props.name == "favor") {
        if (HoverCardStore.getHoveredCard().cost[this.props.gameAge - 1] >  this.props.playerCounters[this.props.name ]) {
          cssResourceName += " insufficient";
        }
      } else if (HoverCardStore.getHoveredCard().cost[this.props.name] != undefined) {
        if (HoverCardStore.getHoveredCard().cost[this.props.name] > this.props.playerCounters[this.props.name]) {
          cssResourceName += " insufficient";
        }
      }
      
    }
    return (
      <div className="resource-counter">
        <div className={cssResourceName}>
          {displayName}
        </div>
        <div className={cssResourceValue}>
          {hidden ? "" : this.props.count}
        </div>
        {controls}
      </div>
    );
  },
});

var PlayerResourceView = React.createClass({
  getInitialState: function(props){
    return {soundPlayed: false};
  },
  componentWillReceiveProps: function(newProps, oldProps){
      if (newProps.player.ready) {
        if (!this.state.soundPlayed) {
          if (audioContext == null) {
             audioContext = new AudioContext();
          }
          var request = new XMLHttpRequest();
          request.open('GET', "/assets/blip_click.wav", true);
          request.responseType = 'arraybuffer';
          // Decode asynchronously
          request.onload = function() {
            audioContext.decodeAudioData(request.response, function(buffer) {
              var blickSoundBuffer = buffer;
              var source = audioContext.createBufferSource(); // creates a sound source
              source.buffer = blickSoundBuffer;                    // tell the source which sound to play
              source.connect(audioContext.destination);       // connect the source to the context's destination (the speakers)
              source.start(0); 
            }, null);
          }
          request.send();
          this.setState({soundPlayed: true});
        }
      } else {
         this.setState({soundPlayed: false});
      }
  },
  onResourceChange: function(name, delta) {
    GameMutator.updateResourceCount(this.props.gameID, this.props.player.userID, name, delta);
    /*special case*/
    if (name == "favor" && delta > 0){
      GameMutator.updateResourceCount(this.props.gameID, this.props.player.userID, "vps", delta);
    }
  },
  render: function() {
    var counters = _.map(this.props.player.counters, function(count, name) {
      if (name !== "spent_military" && name !== "spent_intellect" && name !== "spent_variable") {
        return <ResourceCounter
          key={name}
          name={name}
          count={count}
          editable={this.props.editable}
          onResourceChange={this.onResourceChange}
          playerCounters={this.props.player.counters}
          gameAge={this.props.gameAge} 
          phase={this.props.phase} />;
      }
      return;
    }, this);
    var warCounters = _.map(this.props.player.counters, function(count, name) {
      if (name == "spent_military" || name == "spent_intellect" || name == "spent_variable") {
        return <ResourceCounter
          key={name}
          name={name}
          count={count}
          editable={this.props.editable && this.props.phase == Phases.WAR}
          onResourceChange={this.onResourceChange}
          playerCounters={this.props.player.counters}
          gameAge={this.props.gameAge}
          phase={this.props.phase} />;
      }
      return;
    }, this);
    var ready_class = 'ready-status ' + (this.props.player.ready ? 'ready' : 'not-ready');
   
    var hasEnough = true;
    if (false && HoverCardStore.getHoveredCard() != null) { //adding false && to disable this so that it can easily be turned back on
      var cost = HoverCardStore.getHoveredCard().cost;
      _.each(this.props.player.counters, function(v, k) {
        if (cost[k] != undefined && cost[k] != null && v != undefined) {
          hasEnough &= (v >= cost[k]);
        }
      });
    }
    var cssCurrentPlayerClassName = (this.props.player.userID == this.props.sessionPlayerID ? " current-player" : "");
    var playerResourceViewClassName = "player-resource-view" + 
      (hasEnough ? "" : " insufficient") + 
      cssCurrentPlayerClassName;
    var playerWarResourceViewClassName = "player-war-resource-view" + 
      cssCurrentPlayerClassName +
      (this.props.phase == Phases.WAR ? " war" : "");
    var resultValue = ""; 
    var rollValues = "";
    var displayDie ='';
    if (this.props.phase == Phases.RESOLUTION) {
      resultValue = 0;
      _.each(this.props.actions, function(k) {
        if (k.type == "HANDLE_WAR") {        
          if (k.payload.userID == this.props.player.userID) {
            rollValues = k.payload.roll;
          }
        }
      }, this);
      displayDie = _.map(rollValues, function(rollValue) {
        resultValue += rollValue;
        //displayDie = displayDie.concat(String.fromCharCode(0x2680 + rollValue - 1));
        var displayDieSrc = "/assets/dice" + rollValue + ".svg";
        return <img src={displayDieSrc} className="roll-result-die" height="12px" width="12px"/> ;
      });
      var intRoll = false;
      _.each(this.props.player.counters, function(count, name) {
        if (count > 0 && (name == "spent_military" || name == "spent_intellect" || name == "spent_variable")) {
          if (name == "spent_intellect" || intRoll){
            intRoll = true;
          } else{
            resultValue += count;
          }
        }
      }, this);
      resultValue = resultValue;
    }
    
    var gpCount= "";
    gpCount = (this.props.player.gpboard.length > 0 ? <div className="god-card-count"> [{this.props.player.gpboard.length}]</div> : "");
    return (
      <div className={playerResourceViewClassName}>
        <div className="player-nonwar-resource-view">
          <div>
            <div className={ready_class} />{}
            <span className="player-name">
              {this.props.user.name}
              {gpCount} - {this.props.player.god.name}
            </span>
          </div>
          <div className="player-counters">
            {counters}
          </div>
        </div>
        <div className={playerWarResourceViewClassName}>
          <span className={"war-view-title" +  cssCurrentPlayerClassName}>
            War
          </span>
          {warCounters}
        </div>
        <div className="player-war-result-view">
          <span className={"roll-result-title" + cssCurrentPlayerClassName}>
            Result
          </span>
          <span className="roll-result-value">
            {resultValue}
          </span>
          <br/>
          <span className="roll-result-dice">
            {displayDie}
          </span>
        </div>
      </div>

    );
  },
});

var PlayerResourceViews = React.createClass({
  render: function() {
    var views = _.map(this.props.players, function(player) {
      return <PlayerResourceView
              key={player.userID}
              gameID={this.props.gameID}
              player={player}
              user={this.props.userByID[player.userID]}
              editable={player.userID == this.props.sessionPlayerID}
              phase={this.props.phase}
              gameAge={this.props.gameAge}
              sessionPlayerID={this.props.sessionPlayerID}
              actions={this.props.actions} />;
    }, this);
    return (
      <div className="player-resource-views">
        {views}
      </div>
    );
  },
});

var GlobalAreaView = React.createClass({
  onDraftingCardClick: function(card) {
    if (this.props.game.phase === Phases.PLANNING || this.props.game.phase === Phases.MOBILIZATION) {
      GameMutator.selectCard(this.props.gameID, this.props.sessionPlayerID, card.id);
    } else if (this.props.game.phase === Phases.RESOLUTION) {
      GameMutator.buildCard(this.props.gameID, this.props.sessionPlayerID, card.id);
    }
  },
  onBasicCardClick: function(card) {
    if (this.props.game.phase === Phases.PLANNING || this.props.game.phase === Phases.MOBILIZATION) {
      GameMutator.selectCard(this.props.gameID, this.props.sessionPlayerID, card.id);
    } else if (this.props.game.phase === Phases.RESOLUTION) {
      GameMutator.buildBasicCard(this.props.gameID, this.props.sessionPlayerID, card.id);
    }
  },
  onKnowledgeCardClick: function(card) {
    if (this.props.game.phase === Phases.PLANNING || this.props.game.phase === Phases.MOBILIZATION) {
      GameMutator.selectCard(this.props.gameID, this.props.sessionPlayerID, card.id);
    } else if (this.props.game.phase === Phases.RESOLUTION) {
      GameMutator.buildKnowledgeCard(this.props.gameID, this.props.sessionPlayerID, card.id);
    }
  },
  getInitialState: function(props){
    return {previousPhase: _.clone(Phases.getPhaseName(this.props.game.phase))};
  },
  componentWillReceiveProps: function(newProps, oldProps){
    if (this.state.previousPhase != Phases.getPhaseName(newProps.game.phase)) {
      this.setState({previousPhase: _.clone(Phases.getPhaseName(newProps.game.phase))});
      if (audioContext == null) {
         audioContext = new AudioContext();
      }
      var request = new XMLHttpRequest();
      request.open('GET', "/assets/melodic2_affirm.wav", true);
      request.responseType = 'arraybuffer';
      // Decode asynchronously
      request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer) {
          var blickSoundBuffer = buffer;
          var source = audioContext.createBufferSource(); // creates a sound source
          source.buffer = blickSoundBuffer;                    // tell the source which sound to play
          source.connect(audioContext.destination);       // connect the source to the context's destination (the speakers)
          source.start(0); 
        }, null);
      }
      request.send();
    }
  },
  render: function() {

    var player_drafts = {};
    _.map(this.props.game.players, function(player) {
      player_drafts[player.userID] = {
        public_drafts: player.public_draft,
        private_drafts: player.private_draft,
      }
    });
    var cssglobalAreaViewClassName = "global-area-view" + 
    (this.props.game.phase == Phases.PLANNING ? " planning-phase" : "") +
    (this.props.game.phase == Phases.MOBILIZATION ? " mobilization-phase" : "") + 
    (this.props.game.phase == Phases.RESOLUTION ? " resolution-phase" : "");
    return (
      <div className={cssglobalAreaViewClassName} >
        <div className="basic-card-and-time-view">
          <div className="basic-cards-view">
            <Pile
            title="Basic Cards"
            cards={this.props.basicPile}
            onCardDoubleClick={this.onBasicCardClick}
            renderer={Card}
            sessionPlayerID={this.props.sessionPlayerID}
            userByID={this.props.userByID}
            playerDrafts={player_drafts} />
          </div>
          <div className="game-time-view">
              <table className="game-time-view-table">
                  <tr className="game-time-view-titles" >
                      <td className="phase-td" >Phase</td>
                      <td className="turn-td" >Turn</td>
                      <td className="age-td" >Age</td>
                  </tr>
                  <tr className="game-time-view-values" >
                    <th>{Phases.getPhaseName(this.props.game.phase)}</th>
                    <th>{this.props.game.turn}</th>
                    <th>{this.props.game.age}</th>
                  </tr>
              </table>
              <div>
                <button className="state-buttons next-age-button" onClick={this.props.onNextAge}>Next Age</button>
                <button className="state-buttons next-turn-button" onClick={this.props.onNextTurn}>Next Turn</button>
                <button className="state-buttons next-phase-button" onClick={this.props.onNextPhase}>Next Phase</button>
              </div>
          </div>
        </div>
        <Pile
          title="Knowledge Cards"
          cards={this.props.knowledgePile}
          onCardDoubleClick={this.onKnowledgeCardClick}
          renderer={Card} 
          sessionPlayerID={this.props.sessionPlayerID}
          userByID={this.props.userByID}
          playerDrafts={player_drafts}
          size={7} />
        <Pile
          title="Drafting Cards"
          cards={this.props.table}
          onCardDoubleClick={this.onDraftingCardClick}
          renderer={Card} 
          sessionPlayerID={this.props.sessionPlayerID}
          userByID={this.props.userByID}
          playerDrafts={player_drafts}
          size={this.props.size} />
      </div>
    );
  },
});

var GameLogItem = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    var userID = this.props.action.payload && this.props.action.payload.userID;
    if (!userID) {
      return cb(null, {});
    }
    console.log('fetching user for ', this.props.action.payload.userID);
    UserFetcher.fetchUser(this.props.action.payload.userID, function (err, user) {
      cb(err, {user: user});
    });
  },

  getUserName: function() {
    if (this.props.action.payload && this.props.action.payload.userID) {
      return this.state.user ? <div className='user-name' key='username'>{this.state.user.name}</div> : '('+this.props.action.payload.userID+')';
    }
    return '(err no user)';
  },
  getCard: function(cardID) {
    if (!cardID) {
      return '(err invalid card id)';
    }
    var card = this.props.cardsByID && this.props.cardsByID[cardID];
    if (!card) {
      return '(err card not found)';
    }
    return <div className='card-name'>{card.name}</div>;
  },

  render: function() {
    var action = this.props.action;
    var children = [];
    var user_name = this.getUserName();
    switch (action.type) {
      case ActionTypes.SET_UP_AGE: {
        children.push('Set up age number ' + action.payload.age);
        break;
      }
      case ActionTypes.SET_UP_TURN: {
        children.push('Set up turn number ' + action.payload.turn);
        break;
      }
      case ActionTypes.SET_UP_PHASE: {
        var phase = Phases.getPhaseName(action.payload.phase);
        children.push('Set up phase ' + phase);
        break;
      }
      case ActionTypes.RESOURCE_CHANGE: {
        children.push(user_name);
        children.push(
          ' changed their ' + action.payload.resourceName +
          ' by ' + action.payload.delta);
          break;
      }
      case ActionTypes.BUILD_CARD: {
        children.push(user_name);
        children.push(' built ');
        children.push(this.getCard(action.payload.cardID));
        children.push(' from the trade row');
        break;
      }
      case ActionTypes.BUILD_BASIC_CARD: {
        children.push(user_name);
        children.push(' built basic card ');
        children.push(this.getCard(action.payload.cardID));
        break;
      }
      case ActionTypes.BUILD_KNOWLEDGE_CARD: {
        children.push(user_name);
        children.push(' built knowledge card ');
        children.push(this.getCard(action.payload.cardID));
        break;
      }
      case ActionTypes.PLAY_CARD: {
        children.push(user_name);
        children.push(' played a card face down');
        break;
      }
      case ActionTypes.UNDO_GP_CARD: {
        children.push(user_name);
        children.push(' played a card face down');
        break;
      }
      case ActionTypes.ACTIVATE_CARD: {
        children.push(user_name);
        children.push(' activated god power card ');
        children.push(this.getCard(action.payload.cardID));
        break;
      }
      case ActionTypes.USE_GOD_ACTIVE: {
        children.push(user_name);
        children.push(' is using their god active bonus.');
        break;
      }
      case ActionTypes.CHANGE_READY_STATE: {
        children.push(user_name);
        children.push(' is now ' + (action.payload.state ? 'ready' : 'not ready'));
        break;
      }
      case ActionTypes.NEXT_AGE: {
        children.push(user_name);
        children.push(' moved to the next age');
        break;
      }
      case ActionTypes.NEXT_TURN: {
        children.push(user_name);
        children.push(' moved to the next turn');
        break;
      }
      case ActionTypes.NEXT_PHASE: {
        children.push(user_name);
        children.push(' moved to the next phase');
        break;
      }
      case ActionTypes.HANDLE_WAR: {
        children.push('Age ');
        children.push(action.payload.age);
        children.push(', Turn ');
        children.push(action.payload.turn);
        children.push(': ');
        children.push(user_name);
        children.push(' spent ');
        children.push(action.payload.spent.military);
        children.push(' military and ');
        children.push(action.payload.spent.intellect);
        children.push(' intellect and rolled: ');
        var total = 0;
        _.each(action.payload.roll, function(roll) {
          children.push(roll);
          children.push(' ');
          total += roll;
        });
        children.push('(total: ');
        children.push(total);
        children.push(')');
        break;
      }
      case ActionTypes.DRAW_CARD: {
        children.push(user_name);
        children.push(' drew a card');
        break;
      }
      case ActionTypes.DIE_ROLL: {
        children.push(user_name);
        children.push(' rolled a die');
        break;
      }
      case ActionTypes.UNDISCARD_CARD:
        children.push(user_name);
        children.push(' retrieved ');
        children.push(this.getCard(action.payload.cardID));
        children.push(' from discard')
        break;
      case ActionTypes.DISCARD_CARD:
        //Do not report
        return <script />;
      case ActionTypes.SET_CARD_NOTE:
      case ActionTypes.SELECT_CARD: {
        // we do not want to globally inform players if a player has made a decision in secret
        return <script />;
      }
      case ActionTypes.END_OF_PHASE:
        children.push('Phase took ' + Math.floor(action.payload.elapsed_phase_time / 1000) + ' seconds');
        break;
      default: {
        console.log('unknown action type', action.type);
        return <script />;
      }
    }
    return (
      <div className="game-log-item">
        {children}
      </div>
    );
  },
});

var GameLogView = React.createClass({
  statics: {
    hiddenNotifTypes: Immutable.Set([
      ActionTypes.SELECT_CARD,
      ActionTypes.CHANGE_READY_STATE,
      ActionTypes.SEND_CHAT,
      ActionTypes.DIE_ROLL,
    ]),
    hiddenResourceNames: Immutable.Set([
      'spent_military',
      'spent_intellect',
      'spent_variable',
    ]),
    aggregationWindowMillis: 1000,
  },
  computeNotifsToRender: function() {
    return _.chain(this.props.actions)
    .reduce(function(aggregated_actions, action) {
      if (GameLogView.hiddenNotifTypes.contains(action.type)) {
        return aggregated_actions;
      } else if (action.type === ActionTypes.RESOURCE_CHANGE) {
        if (GameLogView.hiddenResourceNames.contains(action.payload.resourceName)) {
          return aggregated_actions;
        }
        var action_to_aggregate_into = null;
        var i = aggregated_actions.length - 1;
        for (; i >= 0; i--) {
          var candidate = aggregated_actions[i];
          if (action.timestamp - candidate.timestamp > GameLogView.aggregationWindowMillis) {
            break;
          }
          if (candidate.type === ActionTypes.RESOURCE_CHANGE &&
              candidate.payload.resourceName === action.payload.resourceName &&
              candidate.payload.userID === action.payload.userID) {
            action_to_aggregate_into = candidate;
            break;
          }
        }
        if (action_to_aggregate_into) {
          var new_action = _.clone(action);
          new_action.payload = _.clone(action.payload);
          new_action.payload.delta += action_to_aggregate_into.payload.delta;
          aggregated_actions.splice(i, 1)
          return aggregated_actions.concat(new_action);
        } else {
          return aggregated_actions.concat(action);
        }
      } else {
        return aggregated_actions.concat(action);
      }
    }, [], this)
    .reverse()
    .first(50)
    .map(function(action, idx) {
      return <GameLogItem
        key={this.props.actions.length - idx}
        action={action}
        cardsByID={this.props.cardsByID}
        session={this.props.session}
        />
    }, this)
    .value();
  },
  render: function() {
    var log_items = this.computeNotifsToRender();
    return (
      <div className="game-log-view">
        <div className="game-log-items">
          {log_items}
        </div>
      </div>
    );
  },
});

var ChatLogItem = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    console.log('fetching user for ', this.props.message.userID);
    UserFetcher.fetchUser(this.props.message.user, function (err, user) {
      cb(err, {user: user});
    });
  },

  render: function() {
    var message = this.props.message;
    var classes = 'chat-log-item';
    if (message.type == 'die_roll') {
      classes += ' die-roll';
    }
    var content = null;
    if (this.props.message && this.state.user) {
      content = [
        <span className='user-name'>{this.state.user.name}</span>,
        ' ',
        <span className='message-text'>{message.text}</span>
      ];
    }
    return (
      <div className={classes}>
        {content}
      </div>
    );
  },
});

var ChatLogView = React.createClass({
  onChatSubmit: function() {
    var text = this.refs.message.getDOMNode().value;
    if (text == '') {
      return false;
    }
    var userID = this.props.user.id;
    var gameID = this.props.gameID;
    GameMutator.sendChatMessage(gameID, userID, text);
    this.refs.message.getDOMNode().value = '';
    return false;
  },
  onDieRoll: function() {
    var userID = this.props.user.id;
    var gameID = this.props.gameID;
    GameMutator.sendDieRoll(gameID, userID);
  },
  onReadyClick: function() {
    GameMutator.changeReadyState(this.props.gameID, this.props.user.id, !this.props.player.ready);
  },
  render: function() {
    var readyButtonCssName = this.props.player.ready ? "player-status ready" : "player-status waiting";
    var log_items;
    var num_items = this.props.messages.length;
    log_items = _.chain(this.props.messages.slice())
      .reverse()
      .map(function(message, num) {
        return <ChatLogItem key={num_items - num} message={message} />;
      })
      .value();
    return (
      <div className="chat-log-view">
        <button className={readyButtonCssName} onClick={this.onReadyClick}>{this.props.player.ready ? "CANCEL" : "READY"}</button>
        <button className="roll-die-button" onClick={this.onDieRoll}>Roll Die</button>
        <form className="chat-form" onSubmit={this.onChatSubmit}>
          Chat: <input type="text" ref="message" />
        </form>
        <div className="chat-log-items">
          {log_items}
        </div>
      </div>
    );
  },
});

var GamePage = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    if (!this.props.session) {
        return cb(null);
    }
    var gameStore = this.props.session.GameStore();
    gameStore.syncGameState(this.props.gameID, null, function() {
      var game = gameStore.getGameState(this.props.gameID);
      if (!game) {
        cb(new Error('unable to fetch game', null));
        return;
      }
      var userIDs = _.pluck(game.players, 'userID');
      UserFetcher.fetchUsers(userIDs, function (err, userByID) {
        cb(err, {game: game, userByID: userByID});
      });
    }.bind(this));
  },

  onGameStateChange: function(changedGameIDs) {
    if (!this.state.game) {
      return;
    }
    if (!_.contains(changedGameIDs, this.props.gameID)) {
      return;
    }
    var game = this.props.session.GameStore().getGameState(this.props.gameID);
    if (game) {
      this.setState({game:  game});
    }
  },

  onHoverCardChange: function(card) {
    this.forceUpdate();
  },

  onNextAge: function() {
    var sessionUser = this.props.session && this.props.session.getUser();
    if (!sessionUser) {
      return;
    }
    GameMutator.nextAge(this.props.gameID, sessionUser.id);
  },
  onNextTurn: function() {
    var sessionUser = this.props.session && this.props.session.getUser();
    if (!sessionUser) {
      return;
    }
    GameMutator.nextTurn(this.props.gameID, sessionUser.id);
  },
  onNextPhase: function() {
    var sessionUser = this.props.session && this.props.session.getUser();
    if (!sessionUser) {
      return;
    }
    GameMutator.nextPhase(this.props.gameID, sessionUser.id);
  },

  componentWillMount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.GameStore().addListener(this.onGameStateChange);
      HoverCardStore.addListener(this.onHoverCardChange);
    }
  },
  componentWillUnmount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.GameStore().removeListener(this.onGameStateChange);
      HoverCardStore.removeListener(this.onHoverCardChange);
    }
  },

  render: function() {
    var loadingView = (<div className="game-loading-view">Loading...</div>);
    if (!this.state || _.size(this.state) === 0) {
      return loadingView;
    }
    if (this.state.error) {
      return <div>{'error: ' + this.state.error}</div>;
    }
    var sessionPlayer = this.props.session && this.props.session.getUser();
    if (!sessionPlayer) {
      return loadingView;
    }
    var selfPlayerView = null;
    var otherPlayerViews = [];
    var otherPlayerViewsTabs = []
    _.each(this.state.game.players, function(player) {
      if (player.userID === sessionPlayer.id) {
        selfPlayerView = <SelfPlayerView
          gameID={this.state.game.id}
          user={this.state.userByID[sessionPlayer.id]}
          player={player}
          gameAge={this.state.game.age}
          gamePhase={this.state.game.phase} />;
        return;
      }
      var playerView = <OpponentPlayerView
          gameID={this.state.id}
          key={player.userID}
          user={this.state.userByID[player.userID]}
          player={player}
          gameAge={this.state.game.age} />;
      //otherPlayerViews.push(playerView);

      var playerViewTab = {player: player, user: this.state.userByID[player.userID], content: playerView};
      otherPlayerViewsTabs.push(playerViewTab);
    }, this);
    var thisPlayer = _.find(this.state.game.players, function(player) {
      return player.userID === sessionPlayer.id;
    });
    return (
      <div className="game-view">
        <div className="left-pane">
          <GlobalAreaView
            gameID={this.state.game.id}
            sessionPlayerID={sessionPlayer.id}
            table={this.state.game.table}
            deck={this.state.game.deck}
            basicPile={this.state.game.basicPile}
            knowledgePile={this.state.game.knowledgePile}
            onNextAge={this.onNextAge}
            onNextTurn={this.onNextTurn}
            onNextPhase={this.onNextPhase}
            game={this.state.game}
            userByID={this.state.userByID}
            size={this.state.game.players.length + 1} />
          {selfPlayerView}
          {otherPlayerViews}
          <div>
            <PlayerTabs 
              tabs={otherPlayerViewsTabs} />
          </div>
        </div>
        <div className="right-pane">
          <PlayerResourceViews
            sessionPlayerID={sessionPlayer.id}
            user={this.state.userByID[sessionPlayer.id]}
            gameID={this.state.game.id}
            players={this.state.game.players}
            userByID={this.state.userByID}
            phase={this.state.game.phase} 
            gameAge={this.state.game.age} 
            actions={this.state.game.actions} />
          <ChatLogView 
            gameID={this.state.game.id}
            user={this.state.userByID[sessionPlayer.id]}
            messages={this.state.game.messages} 
            player={thisPlayer} />
          <GameLogView
            actions={this.state.game.actions}
            cardsByID={this.state.game.cardsByID}
            session={this.props.session} />
        </div>
        <HoverCard 
          gameAge={this.state.game.age}
          gamePhase={this.state.game.phase}
          renderer={HoverCardStore.getRenderer()}
          card={HoverCardStore.getHoveredCard()} />
      </div>
    );
  }
});

/** TODO: come up with a more modular way of making unique tab views **/
var PlayerTabs = React.createClass({
  getInitialState: function() {
    return {
      /*tabs: [
        {title: 'first', content: 'Content 1'},
        {title: 'second', content: 'Content 2'}
      ],*/
      active: 0
    };
  },
  render: function() {
    return <div>
      <PlayerTabsSwitcher items={this.props.tabs} active={this.state.active} onTabClick={this.handleTabClick}/>
      <TabsContent items={this.props.tabs} active={this.state.active}/>
    </div>;
  },
  handleTabClick: function(index) {
    this.setState({active: index})
  }
});

var PlayerTabsSwitcher = React.createClass({
  render: function() {
    var active = this.props.active;
    var items = _.map(this.props.items,function(item, index) {
      return <button href="#" className={'tab ' + (active === index ? 'tab_selected' : '')} onClick={this.onClick.bind(this, index)}>
        {item.user.name} <span className="tab-god_name">{item.player.god.name}</span>
      </button>;
    }.bind(this));
    return <div className="tabs-switcher">{items}</div>;
  },
  onClick: function(index) {
    this.props.onTabClick(index);
  }
});

var GodPowersTabs = React.createClass({
  getInitialState: function() {
    return {
      active: 0
    };
  },
  render: function() {
    return <div>
      <GodPowersTabsSwitcher items={this.props.tabs} active={this.state.active} onTabClick={this.handleTabClick}/>
      <TabsContent items={this.props.tabs} active={this.state.active}/>
    </div>;
  },
  handleTabClick: function(index) {
    this.setState({active: index})
  }
});

var GodPowersTabsSwitcher = React.createClass({
  render: function() {
    var active = this.props.active;
    var items = _.map(this.props.items,function(item, index) {
      return <button href="#" className={'tab ' + (active === index ? 'tab_selected' : '')} onClick={this.onClick.bind(this, index)}>
        {item.title}
      </button>;
    }.bind(this));
    return <div className="tabs-switcher">{items}</div>;
  },
  onClick: function(index) {
    this.props.onTabClick(index);
  }
});

var TabsContent = React.createClass({
  render: function() {
    var active = this.props.active;
    var items = _.map(this.props.items, function(item, index) {
      return <div className={'tabs-panel ' + (active === index ? 'tabs-panel_selected' : '')}>{item.content}</div>;
    });
    return <div>{items}</div>;
  }
});


var LoginPage = React.createClass({
  getInitialState: function() {
    return { requestInProgess: false };
  },
  onLoginSubmit: function(event) {
    if (this.state.requestInProgress) {
      return false;
    }
    this.setState({requestInProgress: true});
    var username = this.refs.username.getDOMNode().value.trim();
    superagent.post('/login')
    .send({username: username, password: 'abc123'})
    .end(function(res) {
      this.setState({requestInProgress: false});
      if (!res.ok) {
        console.log('error logging in', res.text);
        return;
      }
      var user = res.body.user;
      var session = new Session(user);
      console.log('redirect to', res.body.redirect);
      navigateToHref(res.body.redirect);
      renderApp(session);
    }.bind(this));
    return false;
  },
  render: function() {
    return (
      <div className="login-container">
        <h1>Please log in to Mythos</h1>
        <form className="login-username-form" onSubmit={this.onLoginSubmit}>
          Username: <input className="login-username-input" type="text" ref="username" />
          <button className="lobby-button login-button" onClick={this.onLoginSubmit}> Log In </button>
        </form>
      </div>
    );
  },
});

var LobbyPage = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    var lobbyStore = this.props.session.LobbyStore();
    lobbyStore.syncLobby(this.props.lobbyID, null, function(err) {
      if (err) {
        cb(null, {error: err});
        return;
      }
      var lobby = lobbyStore.getLobby(this.props.lobbyID);
      cb(null, {lobby: lobby});
    }.bind(this));
  },

  onLobbyStoreUpdate: function(changed_lobby_by_id) {
    var lobby = changed_lobby_by_id[this.props.lobbyID];
    console.log('lobby update', changed_lobby_by_id, this.props.lobbyID, lobby);
    if (lobby) {
      this.setState({lobby: lobby});
    }
  },

  componentWillMount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.LobbyStore().addListener(this.onLobbyStoreUpdate);
    }
  },
  componentWillUnmount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.LobbyStore().removeListener(this.onLobbyStoreUpdate);
    }
  },

  onAddBot: function() {
    var mutator = new LobbyMutator(this.props.session, this.props.lobbyID);
    mutator.addBot();
  },
  onStartGame: function() {
    var mutator = new LobbyMutator(this.props.session, this.props.lobbyID);
    mutator.startGame(function(err, gameID) {
      if (!err) {
        navigateToHref('/game/' + gameID);
      }
    });
  },
  onSelectGod: function(e) {
    var selected_god = e.target.value;
    var mutator = new LobbyMutator(this.props.session, this.props.lobbyID);
    mutator.setGod(selected_god);
  },

  render: function() {
    if (this.state.error) {
      return <div className="error">Lobby not found</div>;
    }
    if (this.state.lobby.gameID) {
      return <GamePage gameID={this.state.lobby.gameID} session={this.props.session} />;
    }
    var local_player_god = this.state.lobby.godByUserID[_.find(this.state.lobby.players, function(user) {
      return user.id === this.props.session.getUser().id;
    }, this).id];
    var user_entries = _.map(this.state.lobby.players, function(user) {
      var selected_god = this.state.lobby.godByUserID[user.id];
      var selected_god_name = selected_god ? selected_god.name : 'Random';
      var god_entry = selected_god_name;
      if (this.props.session.getUser().id === user.id) {
        var god_names = _.pluck(this.state.lobby.gods, 'name').concat('Random');
        var god_options = _.map(god_names, function(god_name) {
          return <option key={god_name} value={god_name}>{god_name}</option>;
        });
        god_entry = <select value={selected_god_name} onChange={this.onSelectGod}>{god_options}</select>;
      }
      return <li className="lobby-player-entry" key={user.id}>{user.name} - God: {god_entry}</li>;
    }, this);
    var local_player_buildings =  local_player_god ? _.map(local_player_god.startingBuildingNames, function(building_name) {
      return <div className="lobby-god-info-building-item">{building_name}</div>;
    }) : null;
    var lobby_god_info = local_player_god ? (
      <div className="lobby-god-info">
        <div className="lobby-god-info-descriptor-item">{local_player_god.name}</div>
        <div className="lobby-god-info-descriptor-item">{local_player_god.title}</div>
        <div className="lobby-god-info-descriptor-item">{local_player_god.description}</div>
        <div className="lobby-god-info-abilities">
          <div className="lobby-god-info-abilities-item">
            <div className="lobby-god-info-buildings">
              <div className="lobby-god-info-building-item">Begin the game with:</div>
              {local_player_buildings}
            </div>
          </div>
          <div className="lobby-god-info-abilities-item">{local_player_god.buildingBonus}</div>
          <div className="lobby-god-info-abilities-item">{local_player_god.triggeredBonus}</div>
          <div className="lobby-god-info-abilities-item">{local_player_god.endGameBonus}</div>
        </div>
      </div>
    ) : null;
    return (
      <div>
        <div className="ribbon">
          Mythos
        </div>
        <div className="lobby-container">
          <h1>Welcome to lobby {this.state.lobby.name}</h1>
          <button className="lobby-button start-game-button" onClick={this.onStartGame}>Start Game</button>
          <h3> Players </h3>
          <ul className="lobby-player-list">{user_entries}</ul>
          <button className="lobby-button add-bot-button" onClick={this.onAddBot}>Add a Bot</button>
        </div>
        {lobby_god_info}
      </div>
    );
  },
});

var LobbyListEntry = React.createClass({
  onClick: function() {
    this.props.onClick(this.props.lobby);
  },
  render: function() {
    return (
      <button className="lobby-button lobby-list-entry" onClick={this.onClick}>{this.props.lobby.name}</button>
      );
  },
});


/* Lobby content */
var LobbyListView = React.createClass({
  getInitialState: function() {
    return {};
  },
  onCreateLobby: function() {
    if (this.state.requestInProgress) {
      return;
    }
    this.setState({requestInProgress: true});
    superagent.post('/api/lobby/create')
      .send({host_id: this.props.session.getUser().id})
      .end(function(res) {
        this.setState({requestInProgress: false});
        if (!res.ok) {
          alert('error creating lobby', res.text);
          return;
        }
        var lobby = res.body;
        navigateToHref('/lobby/' + lobby.id);
      }.bind(this));
  },

  onLobbyClick: function(lobby) {
    var mutator = new LobbyMutator(this.props.session, lobby.id);
    mutator.joinGame(function(err) {
      navigateToHref('/lobby/' + lobby.id);
    });
  },

  render: function() {
    var user = this.props.session && this.props.session.getUser();
    var lobbies = _.map(this.props.lobbies, function(lobby) {
      return <LobbyListEntry key={lobby.id} lobby={lobby} onClick={this.onLobbyClick} />;
    }, this);
    var chrome;
    if (user) {
      chrome = (
        <div>
          <h1>Welcome to Mythos</h1>
          <h2>Logged in as {user.name}</h2>
          <button className="lobby-button create-lobby-button" onClick={this.onCreateLobby}>Create Lobby</button>
        </div>
        );
    } else {
      chrome = (
        <div>
          <h1>Welcome to Mythos</h1>
          <Link href="/login">Login</Link>
        </div>
      );
    }

    return (
      <div className="home-container">
        <div className="lobby-list">
          {chrome}
          {lobbies}
        </div>
      </div>
    );
  },
});

var LobbyListPage = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    this.props.session.LobbyStore().fetchLobbyList(function(err, lobbies) {
      cb(err, lobbies && {lobbies: lobbies});
    });
  },

  render: function() {
    return <LobbyListView lobbies={this.state.lobbies} session={this.props.session} />;
  },
});


var MainPage = React.createClass({
  onLogin: function() {
    this.forceUpdate();
  },

  render: function() {
    var session = this.props.session;
    var loginElement = !session ? (<LoginPage onLogin={this.onLogin} />) : (<LobbyListPage session={session} />);
    return (
      <div>
        <div className="ribbon">
          Mythos
        </div>
        {loginElement}
      </div>
    );
  }
});

var NotFoundHandler = React.createClass({
  render: function() {
    return (
      <p>Page not found</p>
    );
  }
});

var App = React.createClass({
  render: function() {
    var session = this.props.session;
    var session_data = session
        ? <script dangerouslySetInnerHTML={{__html: 'window.__session='+JSON.stringify(session.toJSON())}} />
        : null;
    return (
      <html>
        <head>
          {session_data}
          <link rel="stylesheet" href="/assets/style.css" />
          <link href='http://fonts.googleapis.com/css?family=Lato:100,300,400,700,100italic,300italic,400italic,700italic' rel='stylesheet' type='text/css' />
          <script src="/assets/bundle.js" />
        </head>
        <Pages className="App" path={this.props.path}>
          <Page path="/" handler={MainPage} session={session} />
          <Page path="/login" handler={LoginPage} />
          <Page path="/game/:gameID" handler={GamePage} session={session} />
          <Page path="/lobby/:lobbyID" handler={LobbyPage} session={session}/>
          <Page path="/lobby-list" handler={LobbyListPage} session={session}/>
          <NotFound handler={NotFoundHandler} />
        </Pages>
      </html>
    );
  }
});

module.exports = App;

var renderApp = function(session) {
  React.renderComponent(<App session={session} />, document);
};

var ws;
if (typeof window !== 'undefined') {
  window.onload = function() {
    var json_session = window.__session;
    var session = json_session ? Session.sessionFromJSON(json_session) : null;

    CloudListener.start();
    renderApp(session);
  };
}
