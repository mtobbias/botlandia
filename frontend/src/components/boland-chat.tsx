import React from 'react';
import {
    Avatar,
    Box, Grid,
} from '@mui/material';
import BotlandiaChatRender from "./chat-render";

export interface BaseProps {
    index: any;
    isOwnMessage: boolean;
    currentTab: string;
    msg: any;
}

const BotlandiaChat: React.FC<BaseProps> = ({
                                                index,
                                                isOwnMessage,
                                                currentTab,
                                                msg,
                                            }) => {
    return (
        <Box
            key={index}
            style={{
                display: 'flex',
                flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                marginBottom: '1rem',
            }}
        >

            {currentTab === 'iara' ? (

                <>
                    {
                        isOwnMessage ? (<></>) : (<Avatar
                            sx={{width: 128, height: 128}}
                            alt={msg?.to}
                            src={msg?.avatarUrl}
                            style={{margin: '0 8px'}}
                        >
                            {/*{!msg?.avatarUrl && msg?.username[0]}*/}
                        </Avatar>)
                    }

                </>
            ) : (<Avatar
                sx={{width: 128, height: 128}}
                alt={msg?.to}
                src={msg?.avatarUrl}
                style={{margin: '0 8px'}}
            >
            </Avatar>)}
            <BotlandiaChatRender isOwnMessage={isOwnMessage}
                                 message={msg.message}
                                 to={msg.to}
                                 timestamp={msg.timestamp}/>
        </Box>
    );
};

export default BotlandiaChat;
