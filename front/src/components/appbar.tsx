import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Avatar, Grid, Button, IconButton,
} from '@mui/material';
import HardwareIcon from '@mui/icons-material/Hardware';
import SendIcon from "@mui/icons-material/Send";

export interface AppbarProps {
    handleOpenModal: any;
    avatarSrc: string;
}

const BotlandiaAppBar: React.FC<AppbarProps> = ({
                                                    handleOpenModal,
                                                    avatarSrc,
                                                }) => {
    return (
        <AppBar position="static" color="primary" elevation={4}>
            <Toolbar>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <img src={'logo.png'} width={'100rem'}/>
                    </Grid>
                </Grid>
                <IconButton onClick={handleOpenModal} color="secondary" aria-label="add an alarm">
                    <HardwareIcon/>
                </IconButton>

                <Avatar
                    alt={'em breve...'}
                    src={avatarSrc}
                    sx={{cursor: 'auto'}}
                >
                </Avatar>
            </Toolbar>
        </AppBar>
    );
};

export default BotlandiaAppBar;
