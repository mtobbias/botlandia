import React from 'react';
import { Typography, Box } from '@mui/material';
import { MessageBubble, OwnMessageBubble, sanitizerOptions } from "../app.styled";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { QRCodeCanvas } from 'qrcode.react';

export interface BaseProps {
    isOwnMessage: boolean;
    message: string;
    to: string;
    from:string;
    timestamp: string;
}

const BotlandiaChatRender: React.FC<BaseProps> = ({ isOwnMessage, message, to,from, timestamp }) => {
    const components = {
        a: ({ href, children }: any) => {
            const youtubeRegex = /(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&\s]+)/;
            const match = href.match(youtubeRegex);
            if (match) {
                const videoId = match[1];
                return (
                    <iframe
                        width="560"
                        height="315"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                );
            }
            return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            );
        },
        img: ({ src, alt, title }: any) => {
            return (
                <img
                    src={src}
                    alt={alt || ''}
                    title={title || ''}
                    style={{ maxWidth: '100%' }}
                />
            );
        },
    };

    // Verificação se a mensagem contém um QR code
    const qrCodePrefix = '<qrcode>';
    const qrCodeSufix = '</qrcode>';
    const shouldRenderQrCode = message.includes(qrCodePrefix);
    let toRender = ''
    if(shouldRenderQrCode){
        toRender = message.substring(message.indexOf('<')+qrCodeSufix.length-1 ,message.lastIndexOf('>')-qrCodeSufix.length+2);
        console.log('toRender ===[',toRender,'] ====')
    }

    const qrCodeValue = shouldRenderQrCode ?toRender.trimEnd() : '';

    return (
        <Box style={{ maxWidth: '80%' }}>
            {isOwnMessage ? (
                <OwnMessageBubble>
                    {shouldRenderQrCode ? (
                        <QRCodeCanvas level={'Q'} includeMargin={true} value={qrCodeValue} size={256} />
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                                rehypeRaw,
                                [rehypeSanitize, sanitizerOptions],
                            ]}
                            components={components}
                        >
                            {message}
                        </ReactMarkdown>
                    )}
                </OwnMessageBubble>
            ) : (
                <MessageBubble>
                    {shouldRenderQrCode ? (
                        <QRCodeCanvas value={qrCodeValue} size={256} />
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                                rehypeRaw,
                                [rehypeSanitize, sanitizerOptions],
                            ]}
                            components={components}
                        >
                            {message}
                        </ReactMarkdown>
                    )}
                </MessageBubble>
            )}
            <Typography
                variant="caption"
                color="white"
                style={{
                    marginTop: '0.2rem',
                    textAlign: isOwnMessage ? 'right' : 'left',
                }}
            >
                {isOwnMessage ? from : to + ' - '} {timestamp}
            </Typography>
        </Box>
    );
};

export default BotlandiaChatRender;
