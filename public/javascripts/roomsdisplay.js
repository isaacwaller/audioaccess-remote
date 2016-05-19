var React = require('react');
var RoomKeypad = require('./roomkeypad');

var RoomsDisplay = React.createClass({
  getInitialState: function () {
      return { withKeypad: null };
  },

  render: function () {
    // Sidebar
    var sidebar;
    if (this.state.withKeypad) {
      sidebar = <RoomKeypad room={this.props.rooms[this.state.withKeypad - 1]}
        onBack={this.dismissKeypad}
        onVolumeChange={this.props.onVolumeChange(this.state.withKeypad)}
        onSourceSelected={this.props.onSourceSelected(this.state.withKeypad)} />;
    } else {
      sidebar = <div>
        {this.props.rooms.map(function (room) {
          var summary;
          switch (room.source) {
          case "off":
            summary = "Off";
            break;
          case "tuner":
            summary = "Playing FM radio";
            break;
          case "cd":
            summary = "Playing CD";
            break;
          case "tape":
            summary = "Playing AirPlay";
            break;
          case "aux":
            summary = "Playing AUX";
            break;
          case "video":
            summary = "Playing Google Cast";
            break;
          case "page":
            summary = "Playing PAGE";
            break;
          }
          var clazz = "sidebar-room";
          if (room.source != "off" && room.source) {
            clazz += " active";
          }
          var icon = "";
          if (room.source == "video") {
            icon = <div className="sidebar-room-icon icon-google-cast"></div>;
          } else if (room.source == "tape") {
            icon = <div className="sidebar-room-icon icon-airplay"></div>;
          }
          return <div className={clazz} key={room.id} onClick={function () { this.showKeypad(room.id) }.bind(this)}>
            {icon}
            <h3>{room.name}</h3>
            <div className="subtitle">{summary}</div>
          </div>;
        }.bind(this))}
      </div>;
    }


    return <div>
      <div className="col-sm-8 map">

      </div>
      <div className="col-sm-4 sidebar">
        {sidebar}
      </div>
    </div>;
  },

  showKeypad: function (room) {
    this.setState({ withKeypad: room });
  },

  dismissKeypad: function () {
    this.setState({ withKeypad: null });
  }
});

module.exports = RoomsDisplay;
