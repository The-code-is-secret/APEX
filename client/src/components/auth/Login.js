import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  makeStyles
} from '@material-ui/core';
import PersonIcon from '@material-ui/icons/PersonRounded';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccountRounded';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    marginBottom: theme.spacing(4),
  },
  userTypeContainer: {
    marginTop: theme.spacing(2),
  },
  userTypeButton: {
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing(1),
  },
}));

const Login = () => {
  const classes = useStyles();

  return (
    <Container component="main" maxWidth="md">
      <Paper className={classes.paper} elevation={3}>
        <Typography component="h1" variant="h4" className={classes.title}>
          Select User Type
        </Typography>
        <Grid container spacing={4} className={classes.userTypeContainer}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="primary"
              className={classes.userTypeButton}
              component={RouterLink}
              to="/student/login"
            >
              <PersonIcon className={classes.icon} />
              <Typography variant="h6">Student</Typography>
              {/* <Typography variant="body2" color="textSecondary">
                Log in with your roll number
              </Typography> */}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="primary"
              className={classes.userTypeButton}
              component={RouterLink}
              to="/admin/login"
            >
              <SupervisorAccountIcon className={classes.icon} />
              <Typography variant="h6"> Admin</Typography>
              {/* <Typography variant="body2" color="textSecondary">
                Log in with your email address
              </Typography> */}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Login;