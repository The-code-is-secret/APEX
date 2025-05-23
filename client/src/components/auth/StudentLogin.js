import React from 'react';
// import toast from "react-hot-toast";
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  Button,
  TextField,
  // Box,
  Paper,
  makeStyles
} from '@material-ui/core';
import { loginStudent } from '../../redux/actions/authActions';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

// Validation schema
const LoginSchema = Yup.object().shape({
  rollNo: Yup.string().required('Roll number is required'),
  password: Yup.string().required('Password is required'),
});

const StudentLogin = ({ loginStudent, isAuthenticated, user }) => {
  const classes = useStyles();

  // Redirect if logged in
  if (isAuthenticated && user) {
    return user.role === 'student' ? (
      <Redirect to="/student/dashboard" />
    ) : (
      <Redirect to="/admin/dashboard" />
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper className={classes.paper} elevation={3}>
        <Typography component="h1" variant="h5">
          Student Login
        </Typography>
        <Formik
          initialValues={{ rollNo: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={(values, { setSubmitting }) => {
            loginStudent(values.rollNo, values.password);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className={classes.form}>
              <Field
                as={TextField}
                variant="outlined"
                margin="normal"
                fullWidth
                id="rollNo"
                label="Roll Number"
                name="rollNo"
                autoComplete="rollNo"
                autoFocus
                error={touched.rollNo && Boolean(errors.rollNo)}
                helperText={touched.rollNo && errors.rollNo}
              />
              <Field
                as={TextField}
                variant="outlined"
                margin="normal"
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                disabled={isSubmitting}
              >
                Sign In
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

StudentLogin.propTypes = {
  loginStudent: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  user: PropTypes.object
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user
});

export default connect(mapStateToProps, { loginStudent })(StudentLogin);