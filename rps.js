// map moves to an integer representation
var MoveType = {
  ROCK: 0,
  PAPER: 1,
  SCISSOR: 2
};

// function that returns 1 if m1 wins, -1 if m2 wins, or 0 if draw
function win(m1, m2) {
  // return 0 if the same play
  if (m1 === m2) return 0;
  // rock case
  else if (m1 === MoveType.ROCK) {
    if (m2 === MoveType.SCISSOR) return 1;
    else return -1;
  }
  // paper case
  else if (m1 === MoveType.PAPER) {
    if (m2 === MoveType.ROCK) return 1;
    else return -1;
  }
  // scissor case
  else if (m1 === MoveType.SCISSOR) {
    if (m2 === MoveType.PAPER) return 1;
    else return -1;
  }
}

// define a collection to store status message, because it doesn't appear Meteor is great at broadcasts
var Status = new Mongo.Collection('status');

// the mongo id of the status message
var statusID;

if (Meteor.isServer) {
  Meteor.startup(function() {
    // setup the status message or reset it
    var startupMsg = 'Waiting on moves from both players...';
    if (Status.find().count() === 0) Status.insert({msg: startupMsg});
    statusID = Status.findOne()._id;
    Status.update(statusID, {$set: {msg: startupMsg}});
  });

  // moves array [player1, player2]
  var moves = [false, false];

  Meteor.methods({
    // remote method for making a move
    makeMove: function(player, move) {
      var result;
      moves[player] = move;
      // Both players have made a move
      if (moves[0] !== false && moves[1] !== false) {
        result = win(moves[0], moves[1]);
        if (result === 0) Status.update(statusID, {$set: {msg: 'Draw! Waiting on moves from both players...'}});
        else if (result === 1) Status.update(statusID, {$set: {msg: 'Player 1 wins! Waiting on moves from both players...'}});
        else if (result === -1) Status.update(statusID, {$set: {msg: 'Player 2 wins! Waiting on moves from both players...'}});
        moves = [false, false];
      }
      // Only player 1 has made a move
      else if (moves[0] !== false && moves[1] === false) {
        Status.update(statusID, {$set: {msg: 'Waiting on a move from player 2...'}});
      }
      // Only player 2 has made a move
      else if (moves[0] === false && moves[1] !== false) {
        Status.update(statusID, {$set: {msg: 'Waiting on a move from player 1...'}});
      }
    }
  });
}

// route for player 1
Router.route('/player1', function() {
  this.render('Game', {data: {player: 0}});
});

// route for player 2
Router.route('/player2', function() {
  this.render('Game', {data: {player: 1}});
});

if (Meteor.isClient) {
  // click events
  Template.Game.events({
    'click button.rock': function () {
      Meteor.call("makeMove", this.player, MoveType.ROCK, function(err, data) {
        if (err) throw err;
      });
    },
    'click button.paper': function () {
      Meteor.call("makeMove", this.player, MoveType.PAPER, function(err, data) {
        if (err) throw err;
      });
    },
    'click button.scissor': function () {
      Meteor.call("makeMove", this.player, MoveType.SCISSOR, function(err, data) {
        if (err) throw err;
      });
    }
  });
  // sync status message
  Template.Game.helpers({
    status: function () {
      // no id necessary since there is one entry
      return Status.findOne().msg;
    }
  });
}
