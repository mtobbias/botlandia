// client/src/theme.ts

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light', // Você pode mudar para 'dark' se preferir um tema escuro
        primary: {
            main: '#42223B', // Roxo personalizado
            dark: '#2E182F', // Tom mais escuro para hover, etc.
            contrastText: '#FFFFFF', // Texto contrastante para botões e elementos primários
        },
        secondary: {
            main: '#EB7944', // Laranja personalizado
            dark: '#C3652E', // Tom mais escuro para hover, etc.
            contrastText: '#FFFFFF', // Texto contrastante para botões e elementos secundários
        },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff',
        },
        text: {
            primary: '#000000',
            secondary: '#555555',
        },
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
    components: {
        MuiAppBar: {
            defaultProps: {
                elevation: 4,
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
    },
});

export default theme;
