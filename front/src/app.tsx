import React, {useState, useEffect, useRef} from 'react';
import {
    Box,
} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import theme from './theme';
import {Message, Tool} from "./app.interface";
import BotlandiaAppBar from "./components/appbar";
import ModalTools from "./components/modaltools";
import Tabs from "./components/tabs";
import BotlandiaChat from "./components/boland-chat";
import BotlandiaChatInput from "./components/chat-input";


const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [username] = useState<string>('me');
    const [currentTab, setCurrentTab] = useState<string>('iara');
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [tabs, setTabs] = useState<string[]>(['iara']);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [tools, setTools] = useState<Tool[]>([]);
    const [isConnected, setIsConnected] = useState<any>(false);

    useEffect(() => {
        const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || `ws://${window.location.hostname}:3001`;
        ws.current = new WebSocket(wsUrl);
        ws.current.onopen = () => {
            setIsConnected(true)
        };
        ws.current.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_MESSAGE') {
                setMessages((prevMessages) => [...prevMessages, data]);
                if (data.toChat === true && data.to && !tabs.includes(data.from)) {
                    setTabs((prevSquads) => [...prevSquads, data.from]);
                }
            } else if (data.type === 'GIVE_ME_TOOLS_RESPONSE') {
                setTools(data.tools);
            }
        };

        ws.current.onclose = () => {
            setIsConnected(false)
        };

        ws.current.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
        };

        return () => {
            ws.current?.close();
        };
    }, [tabs]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const sendMessage = (type: string, message: string, avatarUrl: string, from: string) => {
        const messageData = {
            type: type,
            message: message,
            to: currentTab,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
            avatarUrl: avatarUrl,
            from: from,
            toChat: true
        };
        ws.current?.send(JSON.stringify(messageData));
        setMessages((prevMessages) => [...prevMessages, messageData]);
    }
    const onChangeTool = (value: boolean, idTool: string) => {
        ws.current?.send(JSON.stringify({
            type: 'TOOL_CHANGE',
            idTool: idTool,
            value: value
        }));
    }
    const handleSendMessage = () => {
        if (input.trim() !== '') {
            if (currentTab === 'iara') {
                const messageData = {
                    type: 'NEW_MESSAGE',
                    message: input.trim(),
                    to: currentTab,
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                    avatarUrl: '',
                    from: 'me',
                    toChat: true
                };
                ws.current?.send(JSON.stringify(messageData));
                setMessages((prevMessages) => [...prevMessages, messageData]);

            } else {
                const msg = messages.filter(msg => (currentTab === msg.from || currentTab === msg.to))
                const msgTo = msg.filter(msg => (currentTab === msg.to))
                const messageData = {
                    type: 'NEW_MESSAGE_HUMAN',
                    message: input.trim(),
                    to: currentTab,
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                    avatarUrl: msgTo[0].avatarUrl,
                    from: msgTo[0].from,
                    toChat: true
                };
                ws.current?.send(JSON.stringify(messageData));
                setMessages((prevMessages) => [...prevMessages, messageData]);
            }
            setInput('');
        }

    };
    const handleMessageIconClick = () => {
        console.log('Ícone de mensagem clicado');
    };
    const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setCurrentTab(newValue as string);
    };

    const handleOpenModal = () => {
        setOpenModal(true);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({type: 'GIVE_ME_TOOLS'}));
        } else {
            console.error('WebSocket not connected');
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.palette.background.default,
                }}
            >
                <BotlandiaAppBar
                    handleOpenModal={handleOpenModal}
                    avatarSrc={'me.png'}
                    username={username}

                />
                <ModalTools
                    onChange={onChangeTool}
                    tools={tools} openModal={openModal} onClose={() => setOpenModal(false)}/>
                <Tabs tabs={tabs} currentTab={currentTab} onChange={handleTabChange}/>

                <Box style={{flex: 1, overflow: 'hidden'}}>
                    <Box
                        style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #42223B, #85427D, #EB7944)',
                            }}
                        >
                            {messages
                                .filter(msg => (currentTab === msg.from || currentTab === msg.to))
                                .map((msg, index) => {
                                    const isOwnMessage = msg.to === currentTab;
                                    return (
                                        <BotlandiaChat
                                            index={index}
                                            isOwnMessage={isOwnMessage}
                                            currentTab={currentTab} msg={msg}
                                        />
                                    );
                                })}
                            <div ref={messagesEndRef}/>
                        </Box>
                        {
                            isConnected ? (
                                <BotlandiaChatInput input={input}
                                                    setInput={setInput}
                                                    handleKeyPress={handleKeyPress}
                                                    handleSendMessage={handleSendMessage}/>
                            ) : (<div className="not-connected">nao conectado</div>)
                        }
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default App;
