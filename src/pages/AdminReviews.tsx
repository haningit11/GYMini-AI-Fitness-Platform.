import ReviewsManagement from "@/components/admin/ReviewsManagement";
import { motion } from "framer-motion";

const AdminReviews = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-display font-bold text-foreground mb-1">Site Reviews</h1>
      <p className="text-muted-foreground text-sm">Manage user reviews displayed on the landing page.</p>
    </motion.div>
    <ReviewsManagement />
  </div>
);

export default AdminReviews;
