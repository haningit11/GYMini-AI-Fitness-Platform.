import { useState } from "react";
import { MoreHorizontal, Trash2, Lock, LockOpen } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  userId: string;
  isSuspended: boolean;  // ← NEW: Know if user is suspended
  onDeleteUser: (userId: string) => Promise<void>;
  onSuspendUser: (userId: string, suspended: boolean) => Promise<void>;  // ← NEW
}

const UserActionMenu = ({ 
  userId,
  isSuspended,
  onDeleteUser,
  onSuspendUser
}: Props) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDeleteUser(userId);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendToggle = async () => {
    setIsLoading(true);
    try {
      await onSuspendUser(userId, !isSuspended);
      setIsSuspendDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Suspend/Unsuspend Button */}
          <DropdownMenuItem 
            onClick={() => setIsSuspendDialogOpen(true)}
            className={`gap-2 text-xs focus:bg-opacity-100 cursor-pointer ${
              isSuspended 
                ? "text-green-600 focus:text-green-600" 
                : "text-amber-600 focus:text-amber-600"
            }`}
          >
            {isSuspended ? (
              <>
                <LockOpen className="w-3.5 h-3.5" /> Unsuspend Account
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Suspend Account
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Delete Button */}
          {/* <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend/Unsuspend Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuspended ? "Unsuspend Account?" : "Suspend Account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isSuspended ? (
                "This user will be able to log in again."
              ) : (
                "This user will NOT be able to log in. They will see a message saying their account is suspended."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspendToggle}
              disabled={isLoading}
              className={isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              {isLoading ? "Loading..." : (isSuspended ? "Unsuspend" : "Suspend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove all their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserActionMenu;