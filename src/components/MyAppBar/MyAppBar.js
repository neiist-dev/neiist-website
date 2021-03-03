import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import MyDrawer from '../MyDrawer/MyDrawer'

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
    },
    title: {
        flexGrow: 1,
    },
});

export default function MyAppBar() {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <MyDrawer />
                    <Typography variant="h6" className={classes.title}>
                        News
                    </Typography>
                </Toolbar>
            </AppBar>
        </div>
    );
}
