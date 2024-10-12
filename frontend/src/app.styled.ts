import {styled} from "@mui/material/styles";
import {Box, Paper, Tab, Tabs} from "@mui/material";


export const StyledTabs = styled(Tabs)(({theme}) => ({
    borderBottom: `1px solid ${theme.palette.divider}`,
    justifyContent: 'flex-start',
    backgroundColor: theme.palette.background.paper,
}));

export const StyledTab = styled(Tab)(({theme}) => ({
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: '1rem',
    marginRight: theme.spacing(4),
    color: theme.palette.text.primary,
    '&.Mui-selected': {
        color: theme.palette.primary.main,
        fontWeight: theme.typography.fontWeightBold,
    },
    '&:hover': {
        color: theme.palette.secondary.dark,
        opacity: 1,
    },
}));

export const MessageBubble = styled(Paper)(({theme}) => ({
    padding: '0.75rem 1rem',
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    borderRadius: '15px',
    boxShadow: theme.shadows[1],
    wordBreak: 'break-word',
}));

export const OwnMessageBubble = styled(MessageBubble)(({theme}) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
}));

export const InputContainer = styled(Box)(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
}));
export const sanitizerOptions = {
    allowedTags: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'img', 'iframe', 'video', 'source',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'br', 'pre', 'code',
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
        video: ['src', 'width', 'height', 'controls', 'autoplay', 'loop', 'muted', 'poster'],
        source: ['src', 'type'],
        '*': ['class', 'style'],
    },
    allowedDomains: ['localhost'],
    allowProtocolRelative: true,
    allowRelative: true,
    allowUnknownProtocols: true,
};