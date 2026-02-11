import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, MoreVertical, Music2 } from 'lucide-react';

export default function Reels() {
    // Placeholder data
    const reels = [
        { id: 1, color: 'bg-red-500', likes: '12K', comments: '120' },
        { id: 2, color: 'bg-blue-500', likes: '45K', comments: '304' },
        { id: 3, color: 'bg-green-500', likes: '8K', comments: '85' },
    ];

    return (
        <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] w-full max-w-md mx-auto overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-xl">
            {reels.map(reel => (
                <div key={reel.id} className={`w-full h-full snap-start relative ${reel.color} flex items-center justify-center`}>
                    <div className="text-white font-bold text-2xl">Reel {reel.id}</div>

                    {/* Overlay UI */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 p-4 flex flex-col justify-end">
                        <div className="flex items-end justify-between">
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                    <span className="text-white font-semibold text-sm">User {reel.id}</span>
                                    <button className="text-white text-xs border border-white/50 px-2 py-1 rounded-lg backdrop-blur-sm">Follow</button>
                                </div>
                                <p className="text-white text-sm">Enjoying the vibes! ✨ #learnify #reels</p>
                                <div className="flex items-center gap-2 text-white/80 text-xs">
                                    <Music2 className="w-3 h-3" />
                                    <span>Original Audio - User {reel.id}</span>
                                </div>
                            </div>

                            <div className="space-y-4 flex flex-col items-center">
                                <div className="flex flex-col items-center gap-1">
                                    <Heart className="w-7 h-7 text-white" />
                                    <span className="text-white text-xs">{reel.likes}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <MessageCircle className="w-7 h-7 text-white -rotate-90" />
                                    <span className="text-white text-xs">{reel.comments}</span>
                                </div>
                                <Send className="w-7 h-7 text-white -rotate-45" />
                                <MoreVertical className="w-6 h-6 text-white" />
                                <div className="w-8 h-8 border-2 border-white rounded-lg bg-gray-800" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
