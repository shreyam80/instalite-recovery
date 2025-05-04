package server.ranking;

import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaSparkContext;

import java.util.Map;
import scala.Tuple2;

public class FeedRankingJob {
    public static void main(String[] args) {
        // 1. Spark configuration
        SparkConf conf = new SparkConf()
                .setAppName("InstaLite Feed Ranking")
                .setMaster("local[*]");  // Use all cores locally for testing
        JavaSparkContext sc = new JavaSparkContext(conf);

        try {
            System.out.println("Starting feed ranking job...");
            
            // 2. Build the graph: (source, (destination, weight))
            JavaPairRDD<String, Tuple2<String, Double>> graphEdges = GraphBuilder.buildGraphEdges(sc);
            long edgeCount = graphEdges.count();
            System.out.println("Total edges in graph: " + edgeCount);

            if (edgeCount > 0) {
                // 3. Run adsorption algorithm
                JavaPairRDD<String, Map<Integer, Double>> labelVectors = Adsorption.run(sc, graphEdges);
                long nodeCount = labelVectors.count();
                System.out.println("Total nodes with labels: " + nodeCount);

                // 4. Write top ranked posts to database
                DBUtils.writeRankedPostsToMySQL(labelVectors);
                
                System.out.println("Feed ranking job completed successfully!");
            } else {
                System.out.println("WARNING: No edges found in graph. Check if post_likes and friends tables have data.");
            }
        } catch (Exception e) {
            System.err.println("Error in feed ranking job: " + e.getMessage());
            e.printStackTrace();
        } finally {
            // 5. Stop Spark
            sc.stop();
        }
    }
}