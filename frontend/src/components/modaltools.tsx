import React, {useEffect, useState} from 'react';
import {
    Typography,
    Box, Grid, Card, CardContent, CardActions, Switch, Modal,
} from '@mui/material';
import ConstructionIcon from "@mui/icons-material/Construction";

export interface BaseProps {
    openModal: boolean;
    onClose: (value: boolean) => void;
    onChange: (value: boolean, idTool: string) => void;
    tools: any[]
}

const ModalTools: React.FC<BaseProps> = (props: BaseProps) => {
    const [all, setAll] = useState(false)
    const totalActive = () => {
        return props.tools.filter((t) => t.enable === true).length
    }
    useEffect(() => {
        setAll(totalActive() === props?.tools.length)
    }, [props.tools]);
    return (
        <Modal
            open={props.openModal}
            onClose={() => props.onClose(false)}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <Box
                sx={{
                    position: 'absolute' as 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 600,
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                }}
            >
                <Typography id="modal-title" variant="h6" component="h2">
                    Ferramentas Disponíveis
                </Typography>
                <Grid container spacing={1} sx={{mt: 1}}>
                    <Grid item xs={12} sm={12} md={12}>
                        <Switch onClick={(e: any) => {
                            for (const t of props?.tools) {
                                props.onChange(!all, t.uuid)
                            }
                            props.onClose(true)
                        }}
                                checked={all}
                                color="secondary"/>
                    </Grid>
                    {props?.tools.length > 0 ? (
                        props?.tools.map((tool) => (
                            <Grid item xs={12} sm={12} md={12} key={tool.uuid}>
                                <Card>
                                    <CardContent>
                                        <Grid container>
                                            <Grid item>
                                                <ConstructionIcon color={'primary'}/>
                                            </Grid>
                                            <Grid item>
                                                <Typography color={'primary'} variant="h6">
                                                    {tool.name}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        <Box
                                            sx={{
                                                maxHeight: '100px',
                                                minHeight: '100px',
                                                height: '100px',
                                                overflowY: 'auto',
                                                padding: '0.5rem',
                                                border: '1px solid #ccc',
                                                borderRadius: '0.5rem',
                                                background: '#bdb5b5',
                                            }}
                                        >
                                            <Typography variant="body2">{tool.description}</Typography>
                                        </Box>
                                    </CardContent>
                                    <Switch onClick={() => {
                                        props.onChange(!tool.enable, tool.uuid)
                                        props.onClose(true)
                                    }} checked={tool.enable} color="secondary"/>
                                    <CardActions>

                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Typography variant="body1">Carregando ferramentas...</Typography>
                    )}
                </Grid>
            </Box>
        </Modal>
    );
};

export default ModalTools;
