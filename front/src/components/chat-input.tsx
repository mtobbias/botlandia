import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Avatar,
    IconButton, TextField, Button,
} from '@mui/material';
import AttachFileIcon from "@mui/icons-material/AttachFile";
import theme from "../theme";
import SendIcon from "@mui/icons-material/Send";
import {InputContainer} from "../app.styled";
import {MessageOutlined, MessageSharp} from "@mui/icons-material";
export interface BaseProps {
    input: string
    setInput: (value: string) => void;
    handleKeyPress: (value: any) => any;
    handleSendMessage: (value: any) => any;
}

const BotlandiaChatInput: React.FC<BaseProps> = ({
                                                input,
                                                setInput,
                                                handleKeyPress,
                                                handleSendMessage
                                            }) => {
    return (
        <InputContainer>
            <div style={{padding: '0.5rem'}}>
                <MessageSharp color={'secondary'}/>
            </div>
            <TextField
                label="Digite sua mensagem"
                variant="outlined"
                multiline
                maxRows={4}
                fullWidth
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                InputLabelProps={{style: {color: theme.palette.text.secondary}}}
                InputProps={{
                    style: {color: theme.palette.text.primary},
                }}
            />
            <Button
                variant="contained"
                color="secondary"
                onClick={handleSendMessage}
                style={{marginLeft: '0.5rem'}}
                endIcon={<SendIcon/>}
            >
                Enviar
            </Button>
        </InputContainer>
    );
};

export default BotlandiaChatInput;
