var React = require('react');

var RoomKeypad = React.createClass({
  getInitialState: function () {
    return {};
  },

  render: function () {
    var controlAll = this.props.controlAll;
    var source, volume, name, clazz = "room-keypad";
    if (!controlAll) {
      source = this.state.source || this.props.room.source;
      volume = this.state.volume || this.props.room.volume || 0;
      name = this.props.room.name;
    } else {
      name = "All rooms";
      source = this.state.source;
      clazz = "room-keypad room-keypad-all"
    }
    return <div className={clazz}>
      <div className="room-back" onClick={this.props.onBack}><span className="glyphicon glyphicon-menu-left" aria-hidden="true"></span> Back</div>
      <h3>{name}</h3>
      <div className="room-sources">
        <div className="room-source" data-active={source == "off"} onClick={this.sourceSelected("off")}>Off</div>
        <div className="room-source" data-active={source == "tuner"} onClick={this.sourceSelected("tuner")}>FM Radio</div>
        <div className="room-source" data-active={source == "cd"} onClick={this.sourceSelected("cd")}>CD</div>
        <div className="room-source" data-active={source == "tape"} onClick={this.sourceSelected("tape")}>AirPlay</div>
        <div className="room-source" data-active={source == "video"} onClick={this.sourceSelected("video")}>Google Cast</div>
      </div>
      <input type="range" min="0" max="150" step="5" defaultValue={volume} onInput={this.volumeChange} disabled={source == "off"}/>
    </div>;
  },
  
  sourceSelected: function (source) {
    var self = this;
    return function (event) {
      self.setState({ source: source });
      self.props.onSourceSelected(source);
      setTimeout(function () {
        // Clear temp state
        // 2 functions - if it failed, it will reflect it
        // If you tune from physical keypad it will not be overriden by state
        // Also animation for all rooms keyboard
        self.setState({ source: null });
      }, 1000);
    };
  },

  volumeChange: function (event) {
    this.props.onVolumeChange(event.target.value);
  }
});

module.exports = RoomKeypad;
