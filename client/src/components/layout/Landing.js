import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Button,
  Container,
  Grid,
  Typography,
  makeStyles,
  Paper,
  Box
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  hero: {
    padding: theme.spacing(8, 0, 6),
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  heroContent: {
    padding: theme.spacing(6),
    textAlign: 'center',
  },
  featureSection: {
    padding: theme.spacing(8, 0),
  },
  featureCard: {
    padding: theme.spacing(4),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  buttons: {
    marginTop: theme.spacing(4),
  },
  button: {
    margin: theme.spacing(1),
  },
}));

const Landing = ({ isAuthenticated }) => {
  const classes = useStyles();

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <>
      <Box className={classes.hero}>
        <Container>
          <div className={classes.heroContent}>
            <Typography component="h1" variant="h2" gutterBottom>
              Student Project Management System
            </Typography>
            <Typography variant="h5" paragraph>
              A platform for students to submit projects and for administrators to review them with an interactive terminal
            </Typography>
            <div className={classes.buttons}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                className={classes.button}
                component={RouterLink}
                to="/student/login"
              >
                Student Login
              </Button>
              
              <Button
                variant="outlined"
                color="default"
                size="large"
                className={classes.button}
                component={RouterLink}
                to="/admin/login"
                style={{ color: 'white', borderColor: 'white' }}
              >
                Admin Login
              </Button>
            </div>
          </div>
        </Container>
      </Box>
      
      <Container className={classes.featureSection}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper className={classes.featureCard} elevation={3}>
              <Typography variant="h5" component="h2" gutterBottom>
                Project Submission
              </Typography>
              <Typography>
                Students can easily submit their projects including source code, LaTeX documentation, and project details.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classes.featureCard} elevation={3}>
              <Typography variant="h5" component="h2" gutterBottom>
                Interactive Terminal
              </Typography>
              <Typography>
                Administrators can run and test student projects through an interactive web terminal with full command-line access.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classes.featureCard} elevation={3}>
              <Typography variant="h5" component="h2" gutterBottom>
                Project Management
              </Typography>
              <Typography>
                Track project status, provide feedback, and download project files for offline review.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

Landing.propTypes = {
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps)(Landing);