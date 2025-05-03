package server.ranking;

import scala.Tuple2;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.apache.spark.api.java.JavaPairRDD;

public class DBUtils {

 public static Properties loadDBCredentialsFromEnv(String envPath) throws IOException {
    Properties props = new Properties();
    BufferedReader reader = new BufferedReader(new FileReader(envPath));
    String line;
    while ((line = reader.readLine()) != null) {
        if (line.contains("=")) {
            String[] parts = line.split("=", 2);
            String key = parts[0].trim();
            String value = parts[1].trim();
            if (key.equals("DATABASE_SERVER")) props.setProperty("host", value);
            else if (key.equals("DATABASE_NAME")) props.setProperty("db", value);
            else if (key.equals("DATABASE_USER")) props.setProperty("user", value);
            else if (key.equals("DATABASE_PASSWORD")) props.setProperty("password", value);
        }
    }
    reader.close();
    return props;
}


    // --- Existing method that writes label results to RDS ---
    public static void writeRankedPostsToMySQL(JavaPairRDD<String, Map<String, Double>> labels) {
        labels.foreachPartition(iterator -> {
            // LOAD CREDS FROM .env
            Properties dbProps = loadDBCredentialsFromEnv(".env");

            String host = dbProps.getProperty("host");
            String db = dbProps.getProperty("db");
            String user = dbProps.getProperty("user");
            String password = dbProps.getProperty("password");

        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://" + host + ":3306/" + db, user, password
        );

            String sql = "INSERT INTO ranked_feed (user_id, post_id, score, timestamp) VALUES (?, ?, ?, NOW())";
            PreparedStatement stmt = conn.prepareStatement(sql);

            while (iterator.hasNext()) {
                Tuple2<String, Map<String, Double>> record = iterator.next();
                String nodeId = record._1;
                Map<String, Double> scores = record._2;

                if (!nodeId.startsWith("p")) continue;

                for (Map.Entry<String, Double> entry : scores.entrySet()) {
                    stmt.setString(1, entry.getKey());     // user_id
                    stmt.setString(2, nodeId);             // post_id
                    stmt.setDouble(3, entry.getValue());   // score
                    stmt.executeUpdate();
                }
            }

            stmt.close();
            conn.close();
        });
    }
}
