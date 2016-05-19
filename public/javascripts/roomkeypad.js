var React = require('react');

var RoomKeypad = React.createClass({
  getInitialState: function () {
    return {};
  },

  render: function () {
    var source = this.state.source || this.props.room.source;
    var volume = this.state.volume || this.props.room.volume || 0;
    return <div className="room-keypad">
      <div className="room-back" onClick={this.props.onBack}><span className="glyphicon glyphicon-menu-left" aria-hidden="true"></span> Back</div>
      <h3>{this.props.room.name}</h3>
      <div className="room-sources">
        <div className="room-source" data-active={source == "off" || !source} onClick={this.sourceSelected("off")}>Off</div>
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
        self.setState({ source: null });
      }, 1000);
    };
  },

  volumeChange: function (event) {
    this.props.onVolumeChange(event.target.value);
  }
});

module.exports = RoomKeypad;
