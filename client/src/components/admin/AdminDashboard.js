import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  makeStyles,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress
} from '@material-ui/core';
import {
  VisibilityOutlined as ViewIcon,
  GetAppOutlined as DownloadIcon,
  CodeOutlined as TerminalIcon,
  SearchOutlined as SearchIcon
} from '@material-ui/icons';
import { getAdminProjects } from '../../redux/actions/adminActions';
import moment from 'moment';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 14,
  },
  cardValue: {
    marginBottom: 12,
    fontSize: 24,
  },
  searchBar: {
    marginBottom: theme.spacing(3),
  },
  tableContainer: {
    marginTop: theme.spacing(3),
  },
  statusChip: {
    margin: theme.spacing(0.5),
  },
  actions: {
    whiteSpace: 'nowrap',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
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

const AdminDashboard = ({ 
  getAdminProjects, 
  admin: { projects, stats, loading, pagination } 
}) => {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, /*setLimit*/] = useState(10);

  useEffect(() => {
    getAdminProjects(page, limit, statusFilter, searchTerm);
  }, [getAdminProjects, page, limit,statusFilter, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    getAdminProjects(1, statusFilter, searchTerm);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page on filter change
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
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card} elevation={3}>
            <CardContent>
              <Typography className={classes.cardTitle} color="textSecondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h3" component="h2" className={classes.cardValue}>
                {stats?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card} elevation={3}>
            <CardContent>
              <Typography className={classes.cardTitle} color="textSecondary" gutterBottom>
                Submitted
              </Typography>
              <Typography variant="h3" component="h2" className={classes.cardValue} color="primary">
                {stats?.submitted || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card} elevation={3}>
            <CardContent>
              <Typography className={classes.cardTitle} color="textSecondary" gutterBottom>
                Reviewed
              </Typography>
              <Typography variant="h3" component="h2" className={classes.cardValue} color="secondary">
                {stats?.reviewed || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card} elevation={3}>
            <CardContent>
              <Typography className={classes.cardTitle} color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h3" component="h2" className={classes.cardValue}>
                {stats?.pending || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper className={classes.searchBar} elevation={2}>
        <Box p={2}>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Search Projects"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" size="small">
                        <SearchIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={statusFilter}
                    onChange={handleStatusChange}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="reviewed">Reviewed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Paper>

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Submission Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <TableRow key={project._id}>
                  <TableCell component="th" scope="row">
                    {project.name}
                  </TableCell>
                  <TableCell>
                    {project.student.username} ({project.student.rollNo})
                  </TableCell>
                  <TableCell>
                    {moment(project.createdAt).format('YYYY-MM-DD')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status.toUpperCase()}
                      color={getStatusColor(project.status)}
                      size="small"
                      className={classes.statusChip}
                    />
                  </TableCell>
                  <TableCell align="center" className={classes.actions}>
                    <IconButton
                      component={RouterLink}
                      to={`/admin/projects/${project._id}`}
                      title="View Details"
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      component="a"
                      href={`/api/files/download/zip/${project._id}`}
                      title="Download ZIP"
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      component={RouterLink}
                      to={`/admin/terminal/${project._id}`}
                      title="Launch Terminal"
                      size="small"
                      color="primary"
                    >
                      <TerminalIcon />
                    </IconButton>
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
      </TableContainer>

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

AdminDashboard.propTypes = {
  getAdminProjects: PropTypes.func.isRequired,
  admin: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  admin: state.admin
});

export default connect(mapStateToProps, { getAdminProjects })(AdminDashboard);