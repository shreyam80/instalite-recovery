package server.ranking;

import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaSparkContext;
import scala.Tuple2;

import java.util.*;

public class Adsorption {

    // Each node has a label vector: Map<userId, probability>
    public static JavaPairRDD<String, Map<String, Double>> run(
            JavaSparkContext sc,
            JavaPairRDD<String, Tuple2<String, Double>> edges) {

        // Step 1: Initialize label vectors
        JavaPairRDD<String, Map<String, Double>> labels = initializeLabels(edges);

        // Step 2: Run up to 15 iterations or until convergence
        for (int i = 0; i < 15; i++) {
            JavaPairRDD<String, Map<String, Double>> newLabels = propagateLabels(edges, labels);
            labels = newLabels;
        }

        return labels;
    }

    private static JavaPairRDD<String, Map<String, Double>> initializeLabels(
            JavaPairRDD<String, Tuple2<String, Double>> edges) {

        // Users only: each user starts with label = {userId: 1.0}
        JavaPairRDD<String, Map<String, Double>> initialLabels = edges
                .keys()
                .distinct()
                .filter(id -> id.startsWith("u")) // Only user nodes get labels
                .mapToPair(id -> {
                    Map<String, Double> labelVec = new HashMap<>();
                    labelVec.put(id, 1.0);
                    return new Tuple2<>(id, labelVec);
                });

        return initialLabels;
    }

    private static JavaPairRDD<String, Map<String, Double>> propagateLabels(
            JavaPairRDD<String, Tuple2<String, Double>> edges,
            JavaPairRDD<String, Map<String, Double>> labels) {

        // Step 1: Join edges with source labels
        JavaPairRDD<String, Tuple2<Tuple2<String, Double>, Map<String, Double>>> joined =
                edges.join(labels);

        // Step 2: Send labels along each edge
        JavaPairRDD<String, Map<String, Double>> messages = joined.mapToPair(tuple -> {
            String src = tuple._1;
            Tuple2<String, Double> edge = tuple._2._1;
            Map<String, Double> labelVec = tuple._2._2;

            String dst = edge._1;
            double weight = edge._2;

            Map<String, Double> weightedLabels = new HashMap<>();
            for (Map.Entry<String, Double> entry : labelVec.entrySet()) {
                weightedLabels.put(entry.getKey(), entry.getValue() * weight);
            }

            return new Tuple2<>(dst, weightedLabels);
        });

        // Step 3: Aggregate incoming label vectors for each node
        JavaPairRDD<String, Map<String, Double>> updatedLabels = messages.reduceByKey((map1, map2) -> {
            Map<String, Double> merged = new HashMap<>(map1);
            for (Map.Entry<String, Double> entry : map2.entrySet()) {
                merged.merge(entry.getKey(), entry.getValue(), Double::sum);
            }
            return merged;
        });

        return updatedLabels;
    }
}
