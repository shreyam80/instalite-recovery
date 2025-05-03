package server.ranking;

import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import scala.Tuple2;

import java.util.ArrayList;
import java.util.List;

public class GraphBuilder {

    public static JavaPairRDD<String, Tuple2<String, Double>> buildGraphEdges(JavaSparkContext sc) {
        List<Tuple2<String, Tuple2<String, Double>>> edges = new ArrayList<>();

        // Get real edges from DB
        List<Tuple2<Integer, Integer>> likes = DBUtils.getUserLikes(); // (user_id, post_id)
        System.out.println("DEBUG: Processing " + likes.size() + " user likes for graph building");
        
        for (Tuple2<Integer, Integer> like : likes) {
            int userId = like._1();
            int postId = like._2();
            
            // Create node IDs with prefixes for clarity
            String userNodeId = "u" + userId;
            String postNodeId = "p" + postId;
            
            // User likes post edge
            edges.add(new Tuple2<>(userNodeId, new Tuple2<>(postNodeId, 0.4)));
            // Post liked by user edge (reverse)
            edges.add(new Tuple2<>(postNodeId, new Tuple2<>(userNodeId, 1.0)));
        }

        // Add friendship edges
        List<Tuple2<Integer, Integer>> friends = DBUtils.getFriendEdges();
        System.out.println("DEBUG: Processing " + friends.size() + " friendship connections for graph building");
        
        for (Tuple2<Integer, Integer> f : friends) {
            int user1 = f._1();
            int user2 = f._2();
            
            // Create user node IDs with prefix
            String user1NodeId = "u" + user1;
            String user2NodeId = "u" + user2;
            
            // Friendship edges (bidirectional)
            edges.add(new Tuple2<>(user1NodeId, new Tuple2<>(user2NodeId, 0.3)));
            edges.add(new Tuple2<>(user2NodeId, new Tuple2<>(user1NodeId, 0.3)));
        }

        // You can add more edge types here: hashtag associations, follows, etc.

        System.out.println("DEBUG: Total edges created for graph: " + edges.size());
        if (edges.isEmpty()) {
            System.out.println("WARNING: No edges were created. Check if post_likes and friends tables have data.");
        }
        
        return sc.parallelizePairs(edges);
    }
}