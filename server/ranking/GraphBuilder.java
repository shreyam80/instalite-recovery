package server.ranking;

import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaSparkContext;
import scala.Tuple2;

import java.util.ArrayList;
import java.util.List;

public class GraphBuilder {

    public static JavaPairRDD<String, Tuple2<String, Double>> buildGraphEdges(JavaSparkContext sc) {
        List<Tuple2<String, Tuple2<String, Double>>> edges = new ArrayList<>();

        // ----------------------------
        // Sample edges — REPLACE with DB reads
        // ----------------------------
        // u1 follows hashtags h1 and h2
        edges.add(new Tuple2<>("u1", new Tuple2<>("h1", 0.15)));
        edges.add(new Tuple2<>("u1", new Tuple2<>("h2", 0.15)));
        edges.add(new Tuple2<>("h1", new Tuple2<>("u1", 1.0)));
        edges.add(new Tuple2<>("h2", new Tuple2<>("u1", 1.0)));

        // u1 likes post p1
        edges.add(new Tuple2<>("u1", new Tuple2<>("p1", 0.4)));
        edges.add(new Tuple2<>("p1", new Tuple2<>("u1", 1.0)));

        // u1 friends with u2
        edges.add(new Tuple2<>("u1", new Tuple2<>("u2", 0.3)));
        edges.add(new Tuple2<>("u2", new Tuple2<>("u1", 0.3)));

        return sc.parallelizePairs(edges);
    }
}
