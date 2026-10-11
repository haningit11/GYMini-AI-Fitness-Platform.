import { useEffect, useState } from "react";
import { Trash2, Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { name: string } | null;
}

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    // Single join query
    const { data } = await supabase
      .from("site_reviews")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false });

    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("site_reviews").delete().eq("id", deleteId);
    if (error) {
      toast.error("Failed to delete review");
    } else {
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== deleteId));
    }
    setDeleteId(null);
  };

  const getName = (r: Review) => (r.profiles as any)?.name || "Unknown";

  if (loading) return <p className="text-muted-foreground text-sm">Loading reviews...</p>;

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium tracking-tight">
            <MessageSquare className="w-5 h-5 text-primary" /> Site Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">No reviews yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Rating</TableHead>
                  <TableHead className="text-xs">Comment</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id} className="h-10">
                    <TableCell className="py-1.5 font-medium text-foreground text-sm">{getName(r)}</TableCell>
                    <TableCell className="py-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-gold text-gold" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs max-w-[280px] truncate">{r.comment}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(r.id)}
                        className="text-destructive hover:bg-destructive/10 h-7 w-7"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the review from the landing page and the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReviewsManagement;
