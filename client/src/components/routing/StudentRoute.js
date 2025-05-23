import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';

const StudentRoute = ({
  component: Component,
  auth: { isAuthenticated, loading, user },
  ...rest
}) => (
  <Route
    {...rest}
    render={props =>
      loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '50px 0' }}>
          <CircularProgress />
        </div>
      ) : isAuthenticated && user && user.role === 'student' ? (
        <Component {...props} />
      ) : isAuthenticated && user ? (
        <Redirect to="/admin/dashboard" />
      ) : (
        <Redirect to="/student/login" />
      )
    }
  />
);

StudentRoute.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(StudentRoute);