import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Alert as MuiAlert, AlertTitle } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'fixed',
    top: theme.spacing(9),
    right: theme.spacing(2),
    zIndex: 9999,
    maxWidth: '400px',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
  alert: {
    boxShadow: theme.shadows[3],
  }
}));

const Alert = ({ alerts }) => {
  const classes = useStyles();
  
  if (alerts !== null && alerts.length > 0) {
    return (
      <div className={classes.root}>
        {alerts.map((alert) => (
          <MuiAlert
            key={alert.id}
            elevation={6}
            variant="filled"
            severity={alert.alertType}
            className={classes.alert}
          >
            {alert.alertType === 'error' && <AlertTitle>Error</AlertTitle>}
            {alert.msg}
          </MuiAlert>
        ))}
      </div>
    );
  }
  
  return null;
};

Alert.propTypes = {
  alerts: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  alerts: state.alert
});

export default connect(mapStateToProps)(Alert);