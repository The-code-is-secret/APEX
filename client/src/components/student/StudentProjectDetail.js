import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams, /*useHistory*/Link as RouterLink } from 'react-router-dom';
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
  makeStyles,
  CircularProgress
} from '@material-ui/core';
import { 
  EditOutlined as EditIcon,
  CloudDownloadOutlined as DownloadIcon,
  ArrowBackOutlined as BackIcon,
  DeleteOutlined as DeleteIcon
} from '@material-ui/icons';
import { getProject, deleteProject } from '../../redux/actions/projectActions';
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
  divider: {
    margin: theme.spacing(2, 0),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  actionButton: {
    marginRight: theme.spacing(1),
  },
  reviewSection: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
  }
}));

const StudentProjectDetail = ({
  getProject,
  deleteProject,
  project: { project, loading },
  history
}) => {
  const classes = useStyles();
  const { id } = useParams();

  useEffect(() => {
    getProject(id);
  }, [getProject, id]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This cannot be undone!')) {
      deleteProject(id);
      history.push('/student/dashboard');
    }
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
          onClick={() => history.push('/student/dashboard')}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4">
          Project Details
        </Typography>
      </div>

      <Paper className={classes.paper} elevation={3}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" gutterBottom>
              {project.name}
            </Typography>
            <Chip
              label={project.status.toUpperCase()}
              color={project.status === 'reviewed' ? 'secondary' : project.status === 'submitted' ? 'primary' : 'default'}
              className={classes.chip}
            />
          </Box>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              component={RouterLink}
              to={`/student/projects/${project._id}/edit`}
              className={classes.actionButton}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Divider className={classes.divider} />

        <Typography variant="subtitle1" gutterBottom>
          Project Details
        </Typography>
        <Grid container spacing={3}>
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

        <Divider className={classes.divider} />

        <Typography variant="subtitle1" gutterBottom>
          Project Files
        </Typography>
        <Box mt={2} display="flex" flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            component="a"
            href={`/api/files/download/zip/${project._id}`}
            className={classes.actionButton}
          >
            Download Project ZIP
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            component="a"
            href={`/api/files/download/latex/${project._id}`}
          >
            Download LaTeX File
          </Button>
        </Box>

        {project.status === 'reviewed' && (
          <Box className={classes.reviewSection}>
            <Typography variant="subtitle1" gutterBottom>
              Review Comments
            </Typography>
            <Typography variant="body1">
              {project.reviewComments || 'No review comments provided.'}
            </Typography>
            <Box mt={1}>
              <Typography variant="body2" color="textSecondary">
                Reviewed by: {project.reviewedBy ? project.reviewedBy.username : 'Administrator'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Review Date: {project.reviewedAt ? moment(project.reviewedAt).format('MMMM D, YYYY') : 'N/A'}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

StudentProjectDetail.propTypes = {
  getProject: PropTypes.func.isRequired,
  deleteProject: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  project: state.project
});

export default connect(
  mapStateToProps,
  { getProject, deleteProject }
)(StudentProjectDetail);