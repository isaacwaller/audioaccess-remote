var React = require('react');

var RoomKeypad = React.createClass({
  render: function () {
    var source = this.props.room.source;
    return <div className="room-keypad">
      <div className="room-back" onClick={this.props.onBack}><span className="glyphicon glyphicon-menu-left" aria-hidden="true"></span> Back</div>
      <h3>{this.props.room.name}</h3>
      <div className="room-sources">
        <div className="room-source" data-active={source == "off" || !source} onClick={this.props.onSourceSelected("off")}>Off</div>
        <div className="room-source" data-active={source == "tuner"} onClick={this.props.onSourceSelected("tuner")}>FM Radio</div>
        <div className="room-source" data-active={source == "cd"} onClick={this.props.onSourceSelected("cd")}>CD</div>
        <div className="room-source" data-active={source == "tape"} onClick={this.props.onSourceSelected("tape")}>AirPlay</div>
        <div className="room-source" data-active={source == "video"} onClick={this.props.onSourceSelected("video")}>Google Cast</div>
      </div>
      <input type="range" />
    </div>;
  }
});

module.exports = RoomKeypad;
