import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/android-chrome-192x192.png"
            alt="Foresight Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
        </div>

        {/* Loading Content */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Foresight RCM
          </h1>
          
          {/* Animated Loading Spinner */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-muted rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>

          <p className="text-muted-foreground">
            Loading your dashboard...
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}