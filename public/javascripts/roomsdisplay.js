var React = require('react');

var RoomsDisplay = React.createClass({
  getInitialState: function () {
      return { withKeypad: null };
  },

  render: function () {
    // Sidebar
    var sidebar;
    if (this.state.withKeypad) {

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
          }
          var clazz = "sidebar-room";
          if (room.source != "off" && room.source) {
            clazz += " active";
          }
          return <div className={clazz} key={room.id} onClick={function () { this.showKeypad(room.id) }.bind(this)}>
            <h3>{room.name}</h3>
            <div>{summary}</div>
          </div>;
        }.bind(this))}
      </div>;
    }


    return <div>
      <div className="col-xs-8 map">

      </div>
      <div className="col-xs-4 sidebar">
        {sidebar}
      </div>
    </div>;
  },

  showKeypad: function (room) {
    this.setState({ withKeypad: room });
  }
});

module.exports = RoomsDisplay;
