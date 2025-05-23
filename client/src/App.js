import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import  { Toaster } from "react-hot-toast";

// Redux Store
import store from './redux/store';
import { loadUser } from './redux/actions/authActions';
import setAuthToken from './utils/setAuthToken';

// Routes
// import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';
import StudentRoute from './components/routing/StudentRoute';

// Layouts
import Navbar from './components/layout/Navbar';
import Alert from './components/layout/Alert';
import Landing from './components/layout/Landing';

// Auth components
import Login from './components/auth/Login';
import StudentLogin from './components/auth/StudentLogin';
import AdminLogin from './components/auth/AdminLogin';

// Student components
import StudentDashboard from './components/student/StudentDashboard';
import AddProject from './components/student/AddProject';
import EditProject from './components/student/EditProject';
import StudentProjectDetail from './components/student/StudentProjectDetail';

// Admin components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProjectList from './components/admin/AdminProjectList';
import AdminProjectDetail from './components/admin/AdminProjectDetail';
import Terminal from './components/terminal/Terminal';

// Check for token on load
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navbar />
          <Alert />
          <Toaster position='top center' reverseOrder={false} />
          <Switch>
            <Route exact path="/" component={Landing} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/student/login" component={StudentLogin} />
            <Route exact path="/admin/login" component={AdminLogin} />
            
            {/* Student Routes */}
            <StudentRoute exact path="/student/dashboard" component={StudentDashboard} />
            <StudentRoute exact path="/student/projects/add" component={AddProject} />
            <StudentRoute exact path="/student/projects/:id/edit" component={EditProject} />
            <StudentRoute exact path="/student/projects/:id" component={StudentProjectDetail} />
            
            {/* Admin Routes */}
            <AdminRoute exact path="/admin/dashboard" component={AdminDashboard} />
            <AdminRoute exact path="/admin/projects" component={AdminProjectList} />
            <AdminRoute exact path="/admin/projects/:id" component={AdminProjectDetail} />
            <AdminRoute exact path="/admin/terminal/:projectId" component={Terminal} />
          </Switch>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;