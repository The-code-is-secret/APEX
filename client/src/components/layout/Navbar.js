import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import HomeIcon from "@material-ui/icons/HomeRounded";
import MenuIcon from "@material-ui/icons/MenuRounded";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  makeStyles,
  Avatar,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { logout } from "../../redux/actions/authActions";


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    marginRight: theme.spacing(2),
  },
  avatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    marginRight: theme.spacing(1),
    
    backgroundColor: theme.palette.primary.main,
  },
  username: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
}));

const Navbar = ({ auth: { isAuthenticated, loading, user }, logout }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const authLinks = (
    <>
      <div className={classes.userInfo}>
        <Avatar className={classes.avatar}>
          {user && user.username ? user.username.charAt(0).toUpperCase() : "?"}
        </Avatar>
        <Typography variant="body1" className={classes.username}>
          {user && user.username}
        </Typography>
      </div>
      <Button
        display="flex"
        color="inherit"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
      >
        <MenuIcon style={{ color: "white" }} />
      </Button>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {user && user.role === "admin" ? (
          <MenuItem
            component={RouterLink}
            to="/admin/dashboard"
            onClick={handleClose}
          >
            Admin Dashboard
          </MenuItem>
        ) : (
          <MenuItem
            component={RouterLink}
            to="/student/dashboard"
            onClick={handleClose}
          >
            Student Dashboard
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </>
  );

  const guestLinks = (
    <>
     
      <Button
        variant="contained"
        color="secondary"
        size="large"
        className={classes.button}
        component={RouterLink}
        to="/login/"
      >
        Login
      </Button>
    </>
  );

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" marginLeft="10" className={classes.title}>
            {user && user.role === "admin" ? (
              <RouterLink
                to="/admin/dashboard"
                style={{ textDecoration: "none", color: "white", fontSize: 22 }}
              >
                <HomeIcon style={{ marginRight: 10 }} fontSize="24" />
                Admin Dashboard
              </RouterLink>
            ) : user && user.role === "student" ? (
              <RouterLink
                to="/student/dashboard"
                style={{ textDecoration: "none", color: "white", fontSize: 22 }}
              >
                <HomeIcon style={{ marginRight: 10 }} fontSize="24" />
                Student Dashboard
              </RouterLink>
            ) : (
              <RouterLink
                to="/"
                style={{ textDecoration: "none", color: "white", fontSize: 22 }}
              >
                <HomeIcon style={{ marginRight: 10 }} fontSize="24" />
                Project Management System
              </RouterLink>
            )}
          </Typography>
          {!loading && (isAuthenticated ? authLinks : guestLinks)}
        </Toolbar>
      </AppBar>
    </div>
  );
};

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps, { logout })(Navbar);
