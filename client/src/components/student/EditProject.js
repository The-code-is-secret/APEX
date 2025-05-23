import React, { useEffect, /*useState*/ } from 'react';
import { connect } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Grid,
  Box,
  makeStyles,
  FormHelperText,
  CircularProgress
} from '@material-ui/core';
import { getProject, updateProject } from '../../redux/actions/projectActions';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(3),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  submitButton: {
    marginTop: theme.spacing(2),
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  }
}));

// Technology stacks
const techStacks = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Go',
  'React',
  'Angular',
  'Vue.js',
  'Node.js',
  'Django',
  'Flask',
  'Spring Boot',
  'Laravel',
  'Express.js',
  'TensorFlow',
  'PyTorch',
  'Keras',
  'MongoDB',
  'MySQL',
  'PostgreSQL',
  'SQLite',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'Other'
];

// Validation schema
const ProjectSchema = Yup.object().shape({
  name: Yup.string()
    .required('Project name is required')
    .min(3, 'Project name should be at least 3 characters')
    .max(100, 'Project name should not exceed 100 characters'),
  description: Yup.string()
    .required('Project description is required')
    .min(10, 'Description should be at least 10 characters')
    .max(1000, 'Description should not exceed 1000 characters'),
  stack: Yup.array()
    .min(1, 'Please select at least one technology')
    .required('Technology stack is required')
});

const EditProject = ({ getProject, updateProject, project: { project, loading } }) => {
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();

  useEffect(() => {
    getProject(id);
  }, [getProject, id]);

  if (loading || !project) {
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
        Edit Project
      </Typography>
      <Paper className={classes.paper} elevation={3}>
        <Formik
          initialValues={{
            name: project.name || '',
            description: project.description || '',
            stack: project.stack || []
          }}
          validationSchema={ProjectSchema}
          onSubmit={(values, { setSubmitting }) => {
            updateProject(id, values, history);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, setFieldValue, errors, touched, values }) => (
            <Form className={classes.form}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    variant="outlined"
                    label="Project Name"
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    variant="outlined"
                    label="Project Description"
                    name="description"
                    multiline
                    rows={4}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl 
                    fullWidth 
                    variant="outlined"
                    error={touched.stack && Boolean(errors.stack)}
                  >
                    <InputLabel id="stack-label">Technology Stack</InputLabel>
                    <Field
                      as={Select}
                      labelId="stack-label"
                      name="stack"
                      multiple
                      value={values.stack}
                      onChange={(e) => setFieldValue('stack', e.target.value)}
                      label="Technology Stack"
                      renderValue={(selected) => (
                        <div className={classes.chipContainer}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={value}
                              className={classes.chip}
                              size="small"
                            />
                          ))}
                        </div>
                      )}
                    >
                      {techStacks.map((tech) => (
                        <MenuItem key={tech} value={tech}>
                          {tech}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.stack && errors.stack && (
                      <FormHelperText>{errors.stack}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <Box mt={3} display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={() => history.goBack()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  className={classes.submitButton}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? 'Updating...' : 'Update Project'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

EditProject.propTypes = {
  getProject: PropTypes.func.isRequired,
  updateProject: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  project: state.project
});

export default connect(
  mapStateToProps,
  { getProject, updateProject }
)(EditProject);