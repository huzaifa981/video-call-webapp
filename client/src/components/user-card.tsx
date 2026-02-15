import { type User } from "@shared/schema";
import { Video, Phone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full shadow-sm" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">{user.username}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user.isOnline ? "Online now" : "Offline"}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-6 flex gap-2 relative z-10">
        <Link href={`/call/${user.id}`} className="flex-1">
          <Button className="w-full bg-white/5 hover:bg-primary hover:text-white border border-white/10 transition-all duration-300">
            <Video className="w-4 h-4 mr-2" />
            Video Call
          </Button>
        </Link>
        {/* Placeholder for audio call */}
        <Button variant="outline" size="icon" className="border-white/10 bg-white/5">
          <Phone className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
