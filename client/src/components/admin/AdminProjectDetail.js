import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams, useHistory, Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Box,
  Chip,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  makeStyles,
  CircularProgress
} from '@material-ui/core';
import { 
  DescriptionOutlined as DescriptionIcon,
  CodeOutlined as TerminalIcon,
  CloudDownloadOutlined as DownloadIcon,
  ArrowBackOutlined as BackIcon
} from '@material-ui/icons';
import { getProject, updateProject } from '../../redux/actions/projectActions';
import { setAlert } from '../../redux/actions/alertActions';
import moment from 'moment';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  headerAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  infoSection: {
    marginBottom: theme.spacing(3),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
  },
  reviewForm: {
    marginTop: theme.spacing(3),
  }
}));

const AdminProjectDetail = ({
  getProject,
  updateProject,
  setAlert,
  project: { project, loading }
}) => {
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();
  const [reviewData, setReviewData] = useState({
    status: '',
    reviewComments: ''
  });

  useEffect(() => {
    getProject(id);
  }, [getProject, id]);

  useEffect(() => {
    if (project) {
      setReviewData({
        status: project.status || '',
        reviewComments: project.reviewComments || ''
      });
    }
  }, [project]);

  const handleChange = (e) => {
    setReviewData({ ...reviewData, [e.target.name]: e.target.value });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    updateProject(id, reviewData);
    setAlert('Project review submitted', 'success');
  };

  if (loading || !project) {
    return (
      <Container className={classes.root}>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '50px 0' }}>
          <CircularProgress />
        </div>
      </Container>
    );
  }

  return (
    <Container className={classes.root}>
      <div className={classes.headerAction}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => history.goBack()}
        >
          Back to Projects
        </Button>
        <Typography variant="h4">
          Project Details
        </Typography>
      </div>

      <Paper className={classes.paper} elevation={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              {project.name}
            </Typography>
            <Chip
              label={project.status.toUpperCase()}
              color={project.status === 'reviewed' ? 'secondary' : project.status === 'submitted' ? 'primary' : 'default'}
              className={classes.chip}
            />
            
            <Divider className={classes.divider} />
            
            <Typography variant="subtitle1" className={classes.sectionTitle}>
              Student Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Name:
                </Typography>
                <Typography variant="body1">
                  {project.student.username}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Roll Number:
                </Typography>
                <Typography variant="body1">
                  {project.student.rollNo}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider className={classes.divider} />
            
            <Typography variant="subtitle1" className={classes.sectionTitle}>
              Project Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Description:
                </Typography>
                <Typography variant="body1" paragraph>
                  {project.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Submission Date:
                </Typography>
                <Typography variant="body1">
                  {moment(project.createdAt).format('MMMM D, YYYY')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Last Updated:
                </Typography>
                <Typography variant="body1">
                  {moment(project.updatedAt).format('MMMM D, YYYY')}
                </Typography>
              </Grid>
            </Grid>
            
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Technology Stack:
              </Typography>
              <Box display="flex" flexWrap="wrap" mt={1}>
                {project.stack.map((tech, index) => (
                  <Chip
                    key={index}
                    label={tech}
                    className={classes.chip}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} style={{ padding: '16px' }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Divider className={classes.divider} />
              <Box className={classes.actionButtons} flexDirection="column">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<TerminalIcon />}
                  component={RouterLink}
                  to={`/admin/terminal/${project._id}`}
                  fullWidth
                >
                  Launch Terminal
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  component="a"
                  href={`/api/files/download/zip/${project._id}`}
                  fullWidth
                  style={{ marginTop: '8px' }}
                >
                  Download ZIP
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  component="a"
                  href={`/api/files/download/latex/${project._id}`}
                  fullWidth
                  style={{ marginTop: '8px' }}
                >
                  Download LaTeX
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper} elevation={3}>
        <Typography variant="h6" className={classes.sectionTitle}>
          Review Project
        </Typography>
        <form onSubmit={handleSubmitReview}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={reviewData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Review Comments"
                name="reviewComments"
                value={reviewData.reviewComments}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Enter your feedback about the project here..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
              >
                Submit Review
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

AdminProjectDetail.propTypes = {
  getProject: PropTypes.func.isRequired,
  updateProject: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  project: state.project
});

export default connect(
  mapStateToProps,
  { getProject, updateProject, setAlert }
)(AdminProjectDetail);