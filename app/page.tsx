'use client'
import { useState } from "react";
import { AIContent, Message } from "./type";
import ReactMarkdown from 'react-markdown';
import { AudioLines } from "lucide-react";
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useTriaAuth } from "@tria-sdk/authenticate-react";

export default function Home() {
    const url = "http://localhost:3000"; //"https://stackaibereal-n444.stackos.io";
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<(Message | AIContent)[]>([
        {
            type: "assistant",
            content: "Hello, my name is Skynet, I can get accounts you own, deploy app on stackos on a new project and I can also transfer the ownership of the project to you. How can I assist you today?",
        }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);

    const { getAccount } = useTriaAuth();

    const handleSend = async () => {
        try {
            if (!input) return;
            const account = getAccount()?.evm?.address;
            if (!account) {
                console.error("Account not found");
                return;
            }

            // Clear the input immediately after sending
            setInput("");
            setIsProcessing(true);
            // https://stackaibereal-n444.stackos.io/
            const response = await fetch(`${url}/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input,
                    address: account,
                }),
            });

            console.log("response", response);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader?.read()!;
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                if (chunkValue) {
                    try {
                        console.log("chunkValue", chunkValue);
                        // Split the chunk by newlines and process each JSON object separately
                        const chunks = chunkValue.split('\n').filter(chunk => chunk.trim());
                        for (const chunk of chunks) {
                            try {
                                const parsedChunk = JSON.parse(chunk);
                                console.log("parsed chunk", parsedChunk);

                                if(parsedChunk.type === 'assistant-hidden' || parsedChunk.type === 'user')
                                    continue;

                                if(parsedChunk.type === 'tool') {
                                    const parsedObj = JSON.parse(parsedChunk.content);
                                    console.log("parsedObj", parsedObj);

                                    if(parsedObj.toolName === "nft-search") {
                                        console.log("parsedObj.content", JSON.parse(parsedObj.content));
                                        const toolContent = JSON.parse(parsedObj.content);
                                        // console.log("toolContent", toolContent, toolContent.content);
                                        const list = JSON.parse(toolContent.content);
                                        list.forEach((item: any) => {   
                                            setMessages((prev) => [...prev, {type: "assistant", content: item}]);
                                        });
                                    }
                                    if(parsedObj.toolName === "nft-owned") {
                                        console.log("nft-owned parsedObj.content", JSON.parse(parsedObj.content));
                                        
                                        const list = JSON.parse(parsedObj.content);
                                        if(list.length > 0) {
                                            list.forEach((item: any) => {   
                                                setMessages((prev) => [...prev, {type: "assistant", content: item}]);
                                            });
                                        }
                                        else {
                                            setMessages((prev) => [...prev, {type: "assistant", content: "No NFTs found"}]);
                                        }
                                    }
                                    if(parsedObj.toolName === "nft-purchase") {
                                        console.log("nft-purchase parsedObj.content", parsedObj.content);
                                        setMessages((prev) => [...prev, {type: "assistant", content: JSON.stringify(parsedObj.content)}]);
                                    }
                                }
                                else {
                                    setMessages((prev) => [...prev, parsedChunk as Message]);
                                }

                                // if(parsedChunk.type === 'tool') {
                                //     const parsedObj = JSON.parse(parsedChunk.content);
                                //     // if(parsedObj.toolName === "nft-search") {
                                //     //     setMessages((prev) => [...prev, parsedObj as AIContent]);
                                //     // }
                                // }
                                // if (parsedChunk && typeof parsedChunk === 'object' && (parsedChunk.type === "assistant" || parsedChunk.type === "human") && parsedChunk.content.length > 0) {
                                //     setMessages((prev) => [...prev, parsedChunk as Message]);
                                // } else if (parsedChunk && typeof parsedChunk === 'object' && parsedChunk.type === "tool" && parsedChunk.toolCalls && parsedChunk.toolCalls.length > 0) {
                                //     const toolMessage = {
                                //         ...parsedChunk,
                                //         content: `Calling tool: ${parsedChunk.toolCalls && parsedChunk.toolCalls.length > 0 ? parsedChunk.toolCalls[0].name : ""}`,
                                //         backgroundColor: 'bg-yellow-600'
                                //     };
                                //     setMessages((prev) => [...prev, toolMessage as AIContent]);
                                // } else if (parsedChunk && typeof parsedChunk === 'object' && parsedChunk.type === "tool" && parsedChunk.toolCalls && parsedChunk.toolCalls.length === 0) {
                                //     const toolMessage = {
                                //         ...parsedChunk,
                                //         content: `Calling tool ${parsedChunk.toolCalls && parsedChunk.toolCalls.length > 0 ? parsedChunk.toolCalls[0].name : ""}`,
                                //         backgroundColor: 'bg-yellow-600'
                                //     };
                                //     setMessages((prev) => [...prev, toolMessage as AIContent]);
                                // }
                            } catch (error) {
                                console.error('Error parsing chunk:', error);
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing chunk:', error);
                    }
                }
            }
        } catch (error: any) {
            console.log("error", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col w-full h-screen items-center justify-center bg-gray-900 p-4">
            <div className="flex flex-row w-full justify-end items-end mb-2">
                <div className="flex bg-blue-500 px-4 py-2 rounded-lg shadow-md">
                    <button className="text-white" onClick={async () => {
                        const response = await fetch(`${url}/clearHistory`);
                        console.log("response", response);
                        if (response.ok) {
                            setMessages([
                                {
                                    type: "assistant",
                                    content: "Hello, my name is Skynet, I can get accounts you own, deploy app on stackos on a new project and I can also transfer the ownership of the project to you. How can I assist you today?",
                                }
                            ])
                        }
                    }}>Clear History</button>
                </div>
            </div>

            <div className="flex flex-col w-full h-full bg-gray-800 rounded-lg shadow-md">
                <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((message, index) => {
                        console.log("message", message);
                        const isHuman = message.type === 'human';
                        const isAI = message.type === 'assistant';
                        const isTool = message.type === 'tool';

                        const justifyClass = isHuman ? 'justify-end' : 'justify-start';

                        let bgColorClass = 'bg-[#f4f4f4]'; // Default color
                        if (isAI) {
                            bgColorClass = 'bg-transparent'; // Subtle blue for AI messages
                        } else if (isTool) {
                            if (message.content !== "" && message.content.includes("success") && JSON.parse(message.content).success) {
                                bgColorClass = 'bg-black'; // Subtle green for success
                            } else if (message.toolCalls && message.toolCalls.length > 0) {
                                bgColorClass = 'bg-black'; // Subtle yellow for tool calls
                            } else {
                                bgColorClass = 'bg-red-500'; // Subtle red for errors
                            }
                        }

                        const content = isTool && message.toolCalls && message.toolCalls.length > 0
                            ? message.toolCalls[0].name
                            : message.content;

                        return (
                            <div key={index} className={`mb-2 flex ${justifyClass}`}>
                                <div className={`p-2 max-w-1/2 rounded-lg ${isHuman ? "text-black" : "text-white"} ${bgColorClass}`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                        {content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        );
                    })}
                    {isProcessing && (
                        <div className="text-gray-400 text-center">Agent is processing...</div>
                    )}
                </div>
                <div className="flex p-4 mr-12">
                    <input
                        type="text"
                        className="flex-1 p-2 border border-gray-600 rounded-l-lg text-white bg-gray-700 mr-1"
                        disabled={isProcessing}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSend();
                            }
                        }}
                        placeholder="Type your message..."
                    />
                    {!isProcessing ? <button
                        disabled={isProcessing}
                        onClick={handleSend}
                        className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700"
                    >
                        Send
                    </button> : <div className="flex items-center justify-center ml-2">
                        <AudioLines className="animate-wave w-8 h-8 text-blue-500" /></div>}
                </div>
            </div>
        </div>
    );
}
