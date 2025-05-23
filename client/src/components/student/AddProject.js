import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Formik, Form, Field, /*ErrorMessage */} from 'formik';
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
import { addProject } from '../../redux/actions/projectActions';

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
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px dashed ${theme.palette.grey[400]}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    textAlign: 'center',
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  fileName: {
    marginTop: theme.spacing(1),
    fontWeight: 'bold',
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(0.5),
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
    .required('Technology stack is required'),
  zipFile: Yup.mixed()
    .required('Project ZIP file is required'),
  latexFile: Yup.mixed()
    .required('LaTeX file is required')
});

const AddProject = ({ addProject }) => {
  const classes = useStyles();
  const history = useHistory();
  const [zipFileName, setZipFileName] = useState('');
  const [latexFileName, setLatexFileName] = useState('');

  return (
    <Container className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Add New Project
      </Typography>
      <Paper className={classes.paper} elevation={3}>
        <Formik
          initialValues={{
            name: '',
            description: '',
            stack: [],
            zipFile: null,
            latexFile: null
          }}
          validationSchema={ProjectSchema}
          onSubmit={(values, { setSubmitting }) => {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('description', values.description);
            formData.append('stack', JSON.stringify(values.stack));
            formData.append('zipFile', values.zipFile);
            formData.append('latexFile', values.latexFile);

            addProject(formData, history);
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
                <Grid item xs={12} md={6}>
                  <input
                    accept=".zip"
                    className={classes.fileInput}
                    id="zip-file-button"
                    type="file"
                    onChange={(event) => {
                      setFieldValue('zipFile', event.currentTarget.files[0]);
                      setZipFileName(event.currentTarget.files[0].name);
                    }}
                  />
                  <label htmlFor="zip-file-button" className={classes.fileInputLabel}>
                    <Typography variant="body2" color="textSecondary">
                      Click to upload Project ZIP file
                    </Typography>
                    {zipFileName && (
                      <Typography className={classes.fileName} variant="body2">
                        {zipFileName}
                      </Typography>
                    )}
                  </label>
                  {touched.zipFile && errors.zipFile && (
                    <FormHelperText error>{errors.zipFile}</FormHelperText>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <input
                    accept=".tex,.latex"
                    className={classes.fileInput}
                    id="latex-file-button"
                    type="file"
                    onChange={(event) => {
                      setFieldValue('latexFile', event.currentTarget.files[0]);
                      setLatexFileName(event.currentTarget.files[0].name);
                    }}
                  />
                  <label htmlFor="latex-file-button" className={classes.fileInputLabel}>
                    <Typography variant="body2" color="textSecondary">
                      Click to upload LaTeX file
                    </Typography>
                    {latexFileName && (
                      <Typography className={classes.fileName} variant="body2">
                        {latexFileName}
                      </Typography>
                    )}
                  </label>
                  {touched.latexFile && errors.latexFile && (
                    <FormHelperText error>{errors.latexFile}</FormHelperText>
                  )}
                </Grid>
              </Grid>

              <Box mt={3} display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={() => history.push('/student/dashboard')}
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
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

AddProject.propTypes = {
  addProject: PropTypes.func.isRequired
};

export default connect(null, { addProject })(AddProject);