import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import moment from 'moment';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Grid,
  TextField,
  MenuItem,
  TablePagination,
  CircularProgress,
  makeStyles
} from '@material-ui/core';
import { getAdminProjects } from '../../redux/actions/adminActions';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4)
  },
  paper: {
    padding: theme.spacing(3)
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3)
  },
  tableContainer: {
    marginTop: theme.spacing(3)
  },
  statusPending: {
    backgroundColor: theme.palette.warning.light
  },
  statusApproved: {
    backgroundColor: theme.palette.success.light
  },
  statusRejected: {
    backgroundColor: theme.palette.error.light
  },
  statusReviewed: {
    backgroundColor: theme.palette.info.light
  },
  filterBox: {
    marginBottom: theme.spacing(3)
  },
  searchField: {
    minWidth: 200
  },
  statusField: {
    minWidth: 150
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4)
  },
  statsBox: {
    marginBottom: theme.spacing(3)
  },
  statsPaper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    height: '100%'
  }
}));

const AdminProjectList = ({ getAdminProjects, admin: { projects, stats, pagination, loading } }) => {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminProjects(page + 1, rowsPerPage, status, search);
  }, [getAdminProjects, page, rowsPerPage, status, search]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
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
        <Typography variant="h4">Project Management</Typography>
      </div>

      {stats && (
        <Box className={classes.statsBox}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Paper className={classes.statsPaper} elevation={3}>
                <Typography variant="h5" color="primary">
                  {stats.total || 0}
                </Typography>
                <Typography variant="body1">Total Projects</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper className={classes.statsPaper} elevation={3}>
                <Typography variant="h5" style={{ color: '#f9a825' }}>
                  {stats.pending || 0}
                </Typography>
                <Typography variant="body1">Pending Review</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper className={classes.statsPaper} elevation={3}>
                <Typography variant="h5" color="secondary">
                  {stats.approved || 0}
                </Typography>
                <Typography variant="body1">Approved</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper className={classes.statsPaper} elevation={3}>
                <Typography variant="h5" color="error">
                  {stats.rejected || 0}
                </Typography>
                <Typography variant="body1">Rejected</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      <Paper className={classes.paper}>
        <Box className={classes.filterBox}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                className={classes.searchField}
                label="Search Projects"
                variant="outlined"
                size="small"
                value={search}
                onChange={handleSearchChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                className={classes.statusField}
                label="Filter by Status"
                variant="outlined"
                size="small"
                value={status}
                onChange={handleStatusChange}
                fullWidth
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <TableRow key={project._id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>
                      {project.student ? project.student.username : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {moment(project.createdAt).format('MMMM D, YYYY')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        className={
                          project.status === 'pending'
                            ? classes.statusPending
                            : project.status === 'approved'
                            ? classes.statusApproved
                            : project.status === 'rejected'
                            ? classes.statusRejected
                            : classes.statusReviewed
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        component={RouterLink}
                        to={`/admin/projects/${project._id}`}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pagination && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={pagination.total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </TableContainer>
      </Paper>
    </Container>
  );
};

AdminProjectList.propTypes = {
  getAdminProjects: PropTypes.func.isRequired,
  admin: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  admin: state.admin
});

export default connect(
  mapStateToProps,
  { getAdminProjects }
)(AdminProjectList);
