import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  makeStyles,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { getProjects } from '../../redux/actions/projectActions';
import moment from 'moment';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flexGrow: 1,
  },
  status: {
    marginBottom: theme.spacing(2),
  },
  date: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  filterContainer: {
    marginBottom: theme.spacing(3),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  noProjects: {
    textAlign: 'center',
    padding: theme.spacing(4),
  }
}));

const getStatusColor = (status) => {
  switch (status) {
    case 'submitted':
      return 'primary';
    case 'reviewed':
      return 'secondary';
    case 'pending':
      return 'default';
    default:
      return 'default';
  }
};

const StudentDashboard = ({ 
  getProjects, 
  auth: { user }, 
  project: { projects, loading, pagination } 
}) => {
  const classes = useStyles();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getProjects(page, 10, statusFilter);
  }, [getProjects, page, statusFilter]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <Container className={classes.root}>
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      </Container>
    );
  }

  return (
    <Container className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h4" component="h1">
          My Projects
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/student/projects/add"
        >
          Add New Project
        </Button>
      </div>

      <Paper className={classes.filterContainer}>
        <Box p={2}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  onChange={handleStatusChange}
                  label="Filter by Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="textSecondary">
                Showing {projects.length} of {pagination?.total || 0} projects
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {projects.length === 0 ? (
        <Paper className={classes.noProjects}>
          <Typography variant="h6">
            No projects found
          </Typography>
          <Typography variant="body1">
            Start by adding a new project
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item key={project._id} xs={12} md={6} lg={4}>
              <Card className={classes.card} elevation={3}>
                <CardContent className={classes.cardContent}>
                  <Box className={classes.status}>
                    <Chip 
                      label={project.status.toUpperCase()} 
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" noWrap>
                    {project.description}
                  </Typography>
                  <Typography variant="caption" className={classes.date}>
                    Submitted: {moment(project.createdAt).format('MMMM D, YYYY')}
                  </Typography>
                  
                  <Divider className={classes.divider} />
                  
                  <Typography variant="body2" component="p">
                    Tech Stack:
                  </Typography>
                  <Box>
                    {project.stack.map((tech, index) => (
                      <Chip 
                        key={index} 
                        label={tech} 
                        size="small" 
                        className={classes.chip} 
                      />
                    ))}
                  </Box>
                  
                  {project.reviewComments && (
                    <>
                      <Divider className={classes.divider} />
                      <Typography variant="body2" component="p">
                        Review Comments:
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {project.reviewComments}
                      </Typography>
                    </>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    startIcon={<VisibilityIcon />}
                    component={RouterLink}
                    to={`/student/projects/${project._id}`}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {pagination && pagination.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Button 
            disabled={page === 1} 
            onClick={() => handleChangePage(page - 1)}
            variant="outlined"
            style={{ marginRight: 8 }}
          >
            Previous
          </Button>
          <Typography variant="body1" style={{ margin: '0 16px', lineHeight: '36px' }}>
            Page {page} of {pagination.pages}
          </Typography>
          <Button 
            disabled={page === pagination.pages} 
            onClick={() => handleChangePage(page + 1)}
            variant="outlined"
          >
            Next
          </Button>
        </Box>
      )}
    </Container>
  );
};

StudentDashboard.propTypes = {
  getProjects: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  project: state.project
});

export default connect(mapStateToProps, { getProjects })(StudentDashboard);