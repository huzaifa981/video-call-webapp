import { useUsers } from "@/hooks/use-users";
import { UserCard } from "@/components/user-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: users, isLoading } = useUsers();
  const { data: currentUser } = useUser();
  const [search, setSearch] = useState("");

  const filteredUsers = users?.filter(u => 
    u.id !== currentUser?.id && 
    u.username.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">Team Members</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Select a colleague to start a secure video call.
          </p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name..." 
            className="pl-10 h-12 bg-card border-border/50 focus:border-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-card/50" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border">
          <p className="text-xl font-medium text-muted-foreground">No users found</p>
          <p className="text-sm text-muted-foreground/60 mt-2">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <UserCard user={user} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
