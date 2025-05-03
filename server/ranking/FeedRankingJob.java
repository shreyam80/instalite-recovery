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

        // 2. Build the graph: (source, (destination, weight))
        JavaPairRDD<String, Tuple2<String, Double>> graphEdges = GraphBuilder.buildGraphEdges(sc);

        // 3. Run adsorption algorithm
        JavaPairRDD<String, Map<String, Double>> labelVectors = Adsorption.run(sc, graphEdges);

        // 4. Write top ranked posts to database
        DBUtils.writeRankedPostsToMySQL(labelVectors);

        // 5. Stop Spark
        sc.stop();
    }
}
