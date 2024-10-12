import React from 'react';
import {
 Box,
} from '@mui/material';
import theme from "../theme";
import {StyledTab, StyledTabs} from "../app.styled";

export interface BaseProps {
    tabs: any[]
    currentTab: string;
    onChange: (event:any,newValue:any) => void;
}

const Tabs: React.FC<BaseProps> = (props: BaseProps) => {
    return (
        <Box
            sx={{
                borderBottom: 1,
                borderColor: 'divider',
                paddingLeft: 2,
                backgroundColor: theme.palette.background.default,

            }}
        >
            <StyledTabs
                value={props.currentTab}
                onChange={props.onChange}
                indicatorColor="secondary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Chat Tabs"
            >
                {props?.tabs.map((tabs) => (
                    <StyledTab key={tabs} label={tabs} value={tabs}/>
                ))}
            </StyledTabs>
        </Box>
    );
};

export default Tabs;
