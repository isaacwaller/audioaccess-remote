var React = require('react');

var IntercomButton = React.createClass({
  render: function () {
    var state = this.props.state;
    var clazzes = "intercom-button " + state;
    return <div>
      <div className={clazzes} onClick={this.click}>
        <span className="glyphicon glyphicon-earphone"></span>
      </div>
      <div className="error">{this.props.err}</div>
    </div>;
  },

  click: function () {
    console.log("click");
    if (this.props.state == 'connected') {
      this.props.oncall();
    } else if (this.props.state == 'in-call') {
      this.props.onhangup();
    }
  }
});

module.exports = IntercomButton;
