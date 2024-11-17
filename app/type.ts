type ToolCall = {
    name: string;
    args: {
        address: string;
    };
    type: string;
    id: string;
};

export type Message = {
    type: string;
    content: string;
    toolCalls?: any;
}


export type AIContent = {
    type: string;
    content: string;
    toolCalls: ToolCall[];
};
