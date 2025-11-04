import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2 } from "lucide-react";
import { aiAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
	id: string;
	text: string;
	sender: "user" | "ai";
	timestamp: Date;
}

interface PlayerFloatingChatProps {
	playerStats?: any;
	recentMatches?: any[];
	performanceGoals?: string[];
	currentChallenges?: string[];
}

const PlayerFloatingChat: React.FC<PlayerFloatingChatProps> = ({
	playerStats,
	recentMatches = [],
	performanceGoals = [],
	currentChallenges = []
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			text:
				"🏆 Hi! I'm your Ultimate Frisbee AI coach. Ask anything about skills, drills, fitness, or game awareness.",
			sender: "ai",
			timestamp: new Date()
		}
	]);
	const [inputText, setInputText] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const quickSuggestions = [
		"How can I improve my throws?",
		"I need help with defensive positioning",
		"What drills should I practice?",
		"Tips for handling pressure situations",
		"How to prepare for matches?",
		"Ways to improve my fitness"
	];

	const sendMessage = async (overrideText?: string) => {
		const textToSend = (overrideText ?? inputText).trim();
		if (!textToSend || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			text: textToSend,
			sender: "user",
			timestamp: new Date()
		};
		setMessages(prev => [...prev, userMessage]);
		setInputText("");
		setIsLoading(true);

		try {
			const context = {
				playerStats,
				recentMatches,
				performanceGoals,
				currentChallenges
			};
			const response = await aiAPI.playerAssistant({ question: textToSend, context });
			if (response.success && response.data?.answer) {
				const aiMessage: Message = {
					id: (Date.now() + 1).toString(),
					text: response.data.answer,
					sender: "ai",
					timestamp: new Date()
				};
				setMessages(prev => [...prev, aiMessage]);
			} else {
				throw new Error("No response from AI");
			}
		} catch (error: any) {
			let errorText = "Sorry, I'm having trouble right now. Please try again.";
			if (error?.response?.status === 401) errorText = "Please log in to use the AI assistant.";
			else if (error?.response?.status === 403) errorText = "You don't have permission to use this feature.";
			else if (error?.response?.status === 429) errorText = "Too many requests. Please wait and try again.";
			else if (error?.message) errorText = error.message;

			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				text: `⚠️ ${errorText}`,
				sender: "ai",
				timestamp: new Date()
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			sendMessage();
		}
	};

	if (!isOpen) {
		return (
			<Button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 group"
				size="lg"
			>
				<MessageCircle className="w-7 h-7" />
				<div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
					<div className="w-2 h-2 bg-white rounded-full"></div>
				</div>
				<span className="absolute -top-12 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
					AI Performance Coach
				</span>
			</Button>
		);
	}

	return (
		<div className="fixed bottom-6 right-6 z-50">
			<Card className={`w-96 ${isMinimized ? 'h-20' : 'h-[600px]'} transition-all duration-300 shadow-2xl bg-white border-0 overflow-hidden flex flex-col`}>
				<div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
							<Bot className="w-6 h-6" />
						</div>
						<div>
							<h3 className="font-semibold text-lg">AI Coach</h3>
							<p className="text-sm text-blue-100">Your Performance Assistant</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsMinimized(!isMinimized)}
							className="w-8 h-8 p-0 text-white hover:bg-white/20 rounded-full"
						>
							<Minimize2 className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsOpen(false)}
							className="w-8 h-8 p-0 text-white hover:bg-white/20 rounded-full"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</div>

				{!isMinimized && (
					<>
						<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex items-end gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
								>
									{message.sender === "ai" && (
										<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
											<Bot className="w-5 h-5 text-white" />
										</div>
									)}

									<div className={`max-w-[280px] ${message.sender === "user" ? "order-first" : ""}`}>
										<div
											className={`px-4 py-3 rounded-2xl shadow-sm ${
												message.sender === "user"
													? "bg-blue-500 text-white rounded-br-md"
												: "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
											}`}
										>
											<p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
										</div>
										<p className={`text-xs mt-1 px-1 ${message.sender === "user" ? "text-right text-gray-500" : "text-gray-400"}`}>
											{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</p>
									</div>

									{message.sender === "user" && (
										<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
											<User className="w-5 h-5 text-white" />
										</div>
									)}
								</div>
							))}

							{isLoading && (
								<div className="flex items-end gap-3">
									<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
										<Bot className="w-5 h-5 text-white" />
									</div>
									<div className="max-w-[280px]">
										<div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
											<div className="flex space-x-1">
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
											</div>
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{messages.length === 1 && (
							<div className="px-4 py-3 bg-white border-t border-gray-100">
								<p className="text-xs text-gray-500 mb-2 font-medium">Quick questions:</p>
								<div className="grid grid-cols-1 gap-2">
									{quickSuggestions.map((suggestion, index) => (
										<button
											key={index}
											onClick={() => sendMessage(suggestion)}
											className="text-left text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
										>
											{suggestion}
											</button>
									))}
								</div>
							</div>
						)}

						<div className="p-4 bg-white border-t border-gray-100">
							<div className="flex items-center gap-3">
								<div className="flex-1 relative">
									<Input
										type="text"
										value={inputText}
										onChange={(e) => setInputText(e.target.value)}
										onKeyPress={handleKeyPress}
										placeholder="Type your question here..."
										className="w-full pr-12 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-full"
										disabled={isLoading}
									/>
									<Button
										onClick={() => sendMessage()}
										disabled={!inputText.trim() || isLoading}
										size="sm"
										className="absolute right-1 top-1/2 transform -translate-y-1/2 w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600 rounded-full"
									>
										<Send className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</div>
					</>
				)}
			</Card>
		</div>
	);
};

export default PlayerFloatingChat;
